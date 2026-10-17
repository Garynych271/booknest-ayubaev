import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';

const base = 'http://127.0.0.1:5175/';
const out = 'docs/lab5';
await mkdir(`${out}/screenshots`, { recursive: true });
const server = spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 5175 --strictPort'], { cwd: 'booknest-web', windowsHide: true, stdio: 'ignore' });
const report = { measuredAt: new Date().toISOString(), real: [], mocked: [], matrix: [], pageErrors: [], normalConsoleErrors: [], expectedConsoleErrors: [] };
let browser;
async function waitServer() {
  for (let index = 0; index < 30; index += 1) {
    try { if ((await fetch(base)).ok) return; } catch { /* server is starting */ }
    await delay(250);
  }
  throw new Error('Vite did not start');
}
async function scenario(group, name, action) {
  try { report[group].push({ name, passed: true, evidence: await action() }); }
  catch (error) { report[group].push({ name, passed: false, error: error.stack }); }
  console.log(group, name, report[group].at(-1).passed);
}
async function states(page) {
  return page.locator('[data-state]').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').map(node => node.dataset.state));
}
async function settle(page, expected = 'success') {
  await page.waitForFunction(value => [...document.querySelectorAll('[data-state]')].some(node => getComputedStyle(node).display !== 'none' && node.dataset.state === value), expected);
}
try {
  await waitServer();
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  report.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => report.pageErrors.push({ phase: 'real', message: error.message }));
  let expectedNetworkError = false;
  page.on('console', message => { if (message.type() === 'error') (expectedNetworkError ? report.expectedConsoleErrors : report.normalConsoleErrors).push(message.text()); });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  const urls = new Map();
  const network = [];
  cdp.on('Network.requestWillBeSent', event => urls.set(event.requestId, event.request.url));
  cdp.on('Network.loadingFailed', event => { if (urls.get(event.requestId)?.includes('openlibrary.org/search.json')) network.push({ url: urls.get(event.requestId), errorText: event.errorText, canceled: event.canceled }); });
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await scenario('real', 'normal search, pagination and persisted wishlist', async () => {
    await page.locator('#search').fill('Solaris');
    await settle(page);
    assert.deepEqual(await states(page), ['success']);
    const cards = await page.locator('[data-book-id]').count();
    assert.ok(cards > 0 && cards <= 20);
    await page.locator('[data-action="toggle"]').first().click();
    assert.equal(await page.locator('[data-wishlist-count]').textContent(), '1');
    await page.reload();
    await settle(page);
    assert.equal(await page.locator('[data-wishlist-count]').textContent(), '1');
    await page.locator('[data-action="next"]').click();
    await settle(page);
    assert.match(await page.locator('[data-page]').textContent(), /Страница 2/);
    await page.screenshot({ path: `${out}/screenshots/real-catalog.png`, fullPage: true });
    return { cards, wishlistAfterReload: 1, page: await page.locator('[data-page]').textContent() };
  });
  await scenario('real', 'Slow 4G cancels obsolete search', async () => {
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 2000, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular4g' });
    await page.locator('#search').fill('Lem');
    await page.waitForRequest(request => request.url().includes('/search.json') && request.url().includes('Lem'));
    await page.locator('#search').fill('Tolkien');
    await settle(page);
    const canceled = network.filter(item => item.canceled);
    assert.ok(canceled.length > 0);
    await page.screenshot({ path: `${out}/screenshots/real-slow4g.png`, fullPage: true });
    return { profile: { latency: 2000, downloadThroughput: 200000, uploadThroughput: 93750 }, canceled };
  });
  await scenario('real', 'Offline error and Retry recovery', async () => {
    expectedNetworkError = true;
    await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await page.locator('#search').fill('Dune');
    await settle(page, 'error');
    const message = await page.locator('[data-error-message]').textContent();
    assert.match(message, /Нет подключения/);
    await page.screenshot({ path: `${out}/screenshots/real-offline.png`, fullPage: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await page.locator('[data-action="retry"]').click();
    await settle(page);
    expectedNetworkError = false;
    return { message, recovered: true };
  });
  await scenario('real', 'separate details request and real 404', async () => {
    await page.goto(`${base}?view=book&id=OL109524W`);
    await settle(page);
    assert.equal(await page.locator('h1').textContent(), 'Solaris');
    await page.screenshot({ path: `${out}/screenshots/real-detail.png`, fullPage: true });
    expectedNetworkError = true;
    await page.goto(`${base}?view=book&id=OL999999999999999W`);
    await settle(page, 'error');
    assert.match(await page.locator('[data-error-message]').textContent(), /404/);
    expectedNetworkError = false;
    return { title: 'Solaris', missing: 404 };
  });
  await writeFile(`${out}/network-real.json`, JSON.stringify(network, null, 2));
  await context.close();

  const mock = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const testPage = await mock.newPage();
  testPage.setDefaultTimeout(30000);
  testPage.on('pageerror', error => report.pageErrors.push({ phase: 'mock', message: error.message }));
  let mode = 'success';
  const requests = [];
  const fixture = value => ({ key: `/works/OL${1000 + value}W`, title: `Fixture book ${value}`, author_name: ['Test Author'], first_publish_year: 2000 + value, subject: ['Test genre'], ebook_access: 'public', ratings_average: 4, cover_i: null });
  await mock.route('https://openlibrary.org/**', async route => {
    const url = new URL(route.request().url());
    requests.push(url.href);
    if (mode === 'slow') await delay(1500);
    if (['429', '503'].includes(mode)) return route.fulfill({ status: Number(mode), contentType: 'application/json', body: '{}' });
    if (mode === 'malformed') return route.fulfill({ contentType: 'application/json', body: '{}' });
    if (url.pathname.startsWith('/works/')) return route.fulfill({ json: { title: 'Fixture book 0', description: { value: '<img src=x onerror=alert(1)> literal text' } } });
    const pageNumber = Number(url.searchParams.get('page') || 1);
    const docs = mode === 'empty' ? [] : Array.from({ length: pageNumber === 1 ? 20 : 1 }, (_, value) => fixture((pageNumber - 1) * 20 + value));
    return route.fulfill({ json: { numFound: mode === 'empty' ? 0 : 21, docs } });
  });
  await testPage.goto(base);
  await testPage.evaluate(() => localStorage.clear());
  await testPage.reload();
  await scenario('mocked', 'minimum query, 350ms debounce and filters', async () => {
    await testPage.locator('#search').fill('a');
    await testPage.waitForTimeout(450);
    assert.equal(requests.length, 0);
    await testPage.locator('#search').fill('ab');
    await testPage.waitForTimeout(100);
    await testPage.locator('#search').fill('abc');
    await testPage.waitForTimeout(250);
    assert.equal(requests.length, 0);
    await settle(testPage);
    assert.equal(requests.length, 1);
    await testPage.locator('#genre').selectOption('programming');
    await settle(testPage);
    await testPage.locator('#available').check();
    await settle(testPage);
    await testPage.locator('#sort').selectOption('rating-desc');
    await settle(testPage);
    const url = new URL(requests.at(-1));
    assert.match(url.searchParams.get('q'), /subject:"programming" AND ebook_access:public/);
    assert.equal(url.searchParams.get('sort'), 'rating');
    return { lastUrl: url.href };
  });
  await scenario('mocked', 'pagination, detail, safe text and wishlist', async () => {
    assert.equal(await testPage.locator('[data-action="previous"]').isDisabled(), true);
    await testPage.locator('[data-action="toggle"]').first().click();
    await testPage.locator('[data-action="next"]').click();
    await settle(testPage);
    assert.equal(await testPage.locator('[data-action="next"]').isDisabled(), true);
    await testPage.locator('[data-wishlist-list] a').click();
    await settle(testPage);
    assert.match(await testPage.locator('.book-detail__description').textContent(), /<img/);
    assert.equal(await testPage.locator('.book-detail__description img').count(), 0);
    await testPage.reload();
    await settle(testPage);
    assert.equal(await testPage.locator('[aria-pressed="true"]').count(), 1);
    return { lastPageDisabled: true, safeText: true, persisted: true };
  });
  for (const value of ['empty', '429', '503', 'malformed']) {
    await scenario('mocked', `${value} is exclusive and Retry recovers`, async () => {
      mode = value;
      await testPage.goto(base);
      await testPage.locator('#search').fill(`case ${value}`);
      await settle(testPage, value === 'empty' ? 'empty' : 'error');
      assert.deepEqual(await states(testPage), [value === 'empty' ? 'empty' : 'error']);
      const message = value === 'empty' ? await testPage.locator('[data-state="empty"]').textContent() : await testPage.locator('[data-error-message]').textContent();
      mode = 'success';
      if (value !== 'empty') { await testPage.locator('[data-action="retry"]').click(); await settle(testPage); }
      return { message };
    });
  }
  mode = 'success';
  for (const theme of ['light', 'dark']) {
    await testPage.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    for (const width of [375, 768, 1440]) {
      await testPage.setViewportSize({ width, height: 900 });
      for (const path of ['', '?view=book&id=OL1000W', '?view=loan']) {
        await testPage.goto(base + path);
        if (path !== '?view=loan') await settle(testPage);
        const metrics = await testPage.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth, scheme: getComputedStyle(document.documentElement).colorScheme }));
        const passed = metrics.viewport === metrics.scroll && metrics.scheme === theme;
        report.matrix.push({ theme, width, path: path || 'catalog', passed, metrics });
        if ((path === '' && [375, 768, 1440].includes(width)) || (path.includes('book') && width === 375)) await testPage.screenshot({ path: `${out}/screenshots/${path.includes('book') ? 'detail' : 'catalog'}-${theme}-${width}.png`, fullPage: true });
      }
    }
  }
  await mock.close();
} finally {
  await writeFile(`${out}/browser-results.json`, JSON.stringify(report, null, 2));
  if (browser) await browser.close();
  server.kill();
}
const failures = [...report.real, ...report.mocked, ...report.matrix].filter(item => !item.passed);
console.log(JSON.stringify({ real: report.real.length, mocked: report.mocked.length, matrix: report.matrix.length, failures: failures.length, pageErrors: report.pageErrors.length, normalConsoleErrors: report.normalConsoleErrors.length }));
if (failures.length || report.pageErrors.length || report.normalConsoleErrors.length) process.exitCode = 1;
