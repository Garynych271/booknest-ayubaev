import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';

const root = 'docs/lab4';
await mkdir(root + '/screenshots', { recursive: true });
const server = spawn(process.execPath, ['tools/serve.mjs'], { env: { ...process.env, PORT: '8134' }, windowsHide: true, stdio: 'ignore' });
const report = { measuredAt: new Date().toISOString(), real: [], mocked: [], matrix: [], errors: [] };
let browser;
async function scenario(group, name, fn) {
  try { const evidence = await fn(); report[group].push({ name, passed: true, evidence }); }
  catch (error) { report[group].push({ name, passed: false, error: error.stack }); }
  console.log(group, name, report[group].at(-1).passed);
}
async function status(page) {
  return page.locator('[data-state]').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').map(node => node.dataset.state));
}
async function settled(page) {
  await page.waitForFunction(() => {
    if (location.pathname.endsWith('loan.html')) return true;
    const busy = document.querySelector('.catalog') || document.querySelector('main');
    return busy?.hasAttribute('aria-busy') && busy.getAttribute('aria-busy') === 'false';
  });
}
try {
  await delay(700);
  if (server.exitCode !== null) throw new Error('Port 8134 is occupied');
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  report.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const network = [];
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  const urls = new Map();
  cdp.on('Network.requestWillBeSent', event => { urls.set(event.requestId, event.request.url); if (event.request.url.startsWith('https://openlibrary.org/')) network.push({ event: 'request', id: event.requestId, url: event.request.url, time: event.timestamp }); });
  cdp.on('Network.responseReceived', event => { if (event.response.url.startsWith('https://openlibrary.org/')) network.push({ event: 'response', id: event.requestId, url: event.response.url, status: event.response.status, time: event.timestamp }); });
  cdp.on('Network.loadingFailed', event => network.push({ event: 'failed', url: urls.get(event.requestId), ...event }));
  page.on('pageerror', error => report.errors.push({ phase: 'real', message: error.message }));
  page.on('console', message => { if (message.type() === 'error') (report.realConsoleErrors ??= []).push(message.text()); });
  await page.goto('http://127.0.0.1:8134/index.html');
  await scenario('real', 'normal search and exclusive success', async () => {
    await page.locator('#search').fill('Solaris');
    await page.waitForTimeout(500);
    await settled(page);
    await page.screenshot({ path: root + '/screenshots/real-normal.png', fullPage: true });
    const states = await status(page);
    assert.deepEqual(states, ['success']);
    const cards = await page.locator('[data-book-id]').count();
    assert.ok(cards > 0 && cards <= 20);
    return { states, cards, count: await page.locator('[data-result-count]').textContent() };
  });
  await scenario('real', 'Slow 4G and canceled obsolete request', async () => {
    const profile = { offline: false, latency: 2000, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular4g' };
    await cdp.send('Network.emulateNetworkConditions', profile);
    const sent = page.waitForRequest(request => request.url().includes('/search.json'));
    await page.locator('#search').fill('Lem');
    await sent;
    await page.screenshot({ path: root + '/screenshots/real-slow4g-loading.png', fullPage: true });
    assert.deepEqual(await status(page), ['loading']);
    await page.locator('#search').fill('Tolkien');
    await page.waitForTimeout(500);
    await settled(page);
    await page.screenshot({ path: root + '/screenshots/real-slow4g-result.png', fullPage: true });
    const canceled = network.filter(event => event.canceled && event.url?.includes('/search.json'));
    assert.ok(canceled.length > 0);
    assert.deepEqual(await status(page), ['success']);
    return { profile, canceled, count: await page.locator('[data-result-count]').textContent() };
  });
  await scenario('real', 'page two from real API', async () => {
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    const first = await page.locator('[data-book-id]').first().getAttribute('data-book-id');
    await page.locator('[data-action="next"]').click();
    await settled(page);
    assert.deepEqual(await status(page), ['success']);
    assert.notEqual(await page.locator('[data-book-id]').first().getAttribute('data-book-id'), first);
    assert.match(await page.locator('[data-page]').textContent(), /Страница 2/);
    return { page: await page.locator('[data-page]').textContent() };
  });
  await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await scenario('real', 'Offline and recovery by Retry', async () => {
    await page.locator('#search').fill('Dune');
    await page.waitForTimeout(500);
    await settled(page);
    await page.screenshot({ path: root + '/screenshots/real-offline.png', fullPage: true });
    assert.deepEqual(await status(page), ['error']);
    const message = await page.locator('[data-error-message]').textContent();
    assert.match(message, /Нет подключения/);
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await page.locator('[data-action="retry"]').click();
    await settled(page);
    assert.deepEqual(await status(page), ['success']);
    return { message, recovered: true };
  });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await scenario('real', 'separate work details', async () => {
    await page.goto('http://127.0.0.1:8134/book.html?id=OL109524W');
    await settled(page);
    await page.waitForFunction(() => [...document.images].every(image => image.complete), null, { timeout: 8000 }).catch(() => {});
    await page.screenshot({ path: root + '/screenshots/real-detail.png', fullPage: true });
    assert.deepEqual(await status(page), ['success']);
    assert.equal(await page.locator('h1').textContent(), 'Solaris');
    return { title: await page.title(), images: await page.locator('img').evaluateAll(images => images.map(image => ({ src: image.src, complete: image.complete, naturalWidth: image.naturalWidth, hidden: image.hidden }))) };
  });
  await scenario('real', 'wrong work URL returns 404', async () => {
    await page.goto('http://127.0.0.1:8134/book.html?id=OL999999999999999W');
    await settled(page);
    await page.screenshot({ path: root + '/screenshots/real-wrong-url.png', fullPage: true });
    assert.deepEqual(await status(page), ['error']);
    assert.match(await page.locator('[data-error-message]').textContent(), /404/);
    return { message: await page.locator('[data-error-message]').textContent() };
  });
  await writeFile(root + '/network/browser-real.json', JSON.stringify(network, null, 2));
  await context.close();

  const mock = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const testPage = await mock.newPage();
  testPage.on('pageerror', error => report.errors.push({ phase: 'mock', message: error.message }));
  testPage.on('console', message => { if (message.type() === 'error') (report.consoleErrors ??= []).push(message.text()); });
  const cover = await readFile('assets/covers/b01.png');
  await mock.route('https://covers.openlibrary.org/**', route => route.fulfill({ contentType: 'image/png', body: cover }));
  let mode = 'success';
  const requests = [];
  const fixture = index => ({ key: '/works/OL' + (1000 + index) + 'W', title: 'Fixture book ' + index, author_name: ['Test Author'], first_publish_year: 2000 + index, subject: ['Test genre'], ebook_access: 'public', ratings_average: 4, cover_i: 12313764 });
  await mock.route('https://openlibrary.org/**', async route => {
    const url = new URL(route.request().url());
    requests.push(url.href);
    if (mode === 'timeout') return;
    if (mode === 'slow') await delay(1500);
    if (['404', '429', '503'].includes(mode)) return route.fulfill({ status: Number(mode), contentType: 'application/json', body: '{}' });
    if (mode === 'malformed') return route.fulfill({ contentType: 'application/json', body: '{}' });
    if (url.pathname.startsWith('/works/')) return route.fulfill({ json: { title: 'Fixture book 0', description: { value: '<img src=x onerror=alert(1)> literal text' } } });
    const pageNumber = Number(url.searchParams.get('page') || 1);
    const docs = mode === 'empty' ? [] : Array.from({ length: pageNumber === 1 ? 20 : 1 }, (_, index) => fixture((pageNumber - 1) * 20 + index));
    await route.fulfill({ json: { numFound: mode === 'empty' ? 0 : 21, docs } });
  });
  await testPage.goto('http://127.0.0.1:8134/index.html');
  await scenario('mocked', 'minimum query and debounce', async () => {
    await testPage.locator('#search').fill('a');
    await testPage.waitForTimeout(450);
    assert.equal(requests.length, 0);
    await testPage.locator('#search').fill('ab');
    await testPage.waitForTimeout(100);
    await testPage.locator('#search').fill('abc');
    await testPage.waitForTimeout(100);
    await testPage.locator('#search').fill('abcd');
    await testPage.waitForTimeout(200);
    assert.equal(requests.length, 0);
    await testPage.waitForTimeout(250);
    await settled(testPage);
    assert.equal(requests.length, 1);
    assert.deepEqual(await status(testPage), ['success']);
    return { requests: requests.slice() };
  });
  await scenario('mocked', 'pagination boundaries, persistent wishlist, detail link', async () => {
    assert.equal(await testPage.locator('[data-action="previous"]').isDisabled(), true);
    await testPage.locator('[data-action="toggle"]').first().click();
    await testPage.locator('[data-action="next"]').click();
    await settled(testPage);
    assert.equal(await testPage.locator('[data-book-id]').count(), 1);
    assert.equal(await testPage.locator('[data-action="next"]').isDisabled(), true);
    await testPage.reload();
    await settled(testPage);
    assert.equal(await testPage.locator('[data-wishlist-count]').textContent(), '1');
    assert.match(await testPage.locator('[data-page]').textContent(), /2 из 2/);
    await testPage.locator('[data-wishlist-list] a').click();
    await testPage.waitForURL('**/book.html?id=OL1000W');
    await settled(testPage);
    assert.deepEqual(await status(testPage), ['success']);
    assert.match(await testPage.locator('[data-description]').textContent(), /<img/);
    assert.equal(await testPage.locator('[data-description] img').count(), 0);
    return { persistent: true, safeText: true };
  });
  await testPage.goto('http://127.0.0.1:8134/index.html');
  await settled(testPage);
  await scenario('mocked', 'filters and sort use server query and reset page', async () => {
    await testPage.locator('#genre').selectOption('programming');
    await settled(testPage);
    await testPage.locator('#available').check();
    await settled(testPage);
    await testPage.locator('#sort').selectOption('rating-desc');
    await settled(testPage);
    const url = new URL(requests.at(-1));
    assert.match(url.searchParams.get('q'), /subject:"programming" AND ebook_access:public/);
    assert.equal(url.searchParams.get('sort'), 'rating');
    assert.equal(url.searchParams.get('page'), '1');
    return { url: url.href };
  });
  for (const value of ['empty', '429', '503', 'malformed']) {
    await scenario('mocked', value + ' settles and Retry recovers', async () => {
      mode = value;
      await testPage.locator('#search').fill('case ' + value);
      await testPage.waitForTimeout(500);
      await settled(testPage);
      assert.deepEqual(await status(testPage), [value === 'empty' ? 'empty' : 'error']);
      const message = await testPage.locator('[data-error-message]').textContent();
      await testPage.screenshot({ path: root + '/screenshots/mock-' + value + '.png', fullPage: true });
      mode = 'success';
      if (value !== 'empty') { await testPage.locator('[data-action="retry"]').click(); await settled(testPage); assert.deepEqual(await status(testPage), ['success']); }
      return { message };
    });
  }
  await scenario('mocked', 'timeout removes loading after 20 seconds and Retry recovers', async () => {
    mode = 'timeout';
    const started = Date.now();
    await testPage.locator('#search').fill('timeout');
    await testPage.waitForTimeout(500);
    assert.deepEqual(await status(testPage), ['loading']);
    await settled(testPage);
    assert.deepEqual(await status(testPage), ['error']);
    assert.match(await testPage.locator('[data-error-message]').textContent(), /20 секунд/);
    const elapsedMs = Date.now() - started;
    mode = 'success';
    await testPage.locator('[data-action="retry"]').click();
    await settled(testPage);
    assert.deepEqual(await status(testPage), ['success']);
    return { elapsedMs };
  });
  for (const theme of ['light', 'dark']) {
    await testPage.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    for (const width of [320, 375, 768, 1440]) {
      await testPage.setViewportSize({ width, height: 900 });
      for (const path of ['index.html', 'book.html?id=OL1000W', 'loan.html']) {
        await testPage.goto('http://127.0.0.1:8134/' + path);
        await settled(testPage);
        const metrics = await testPage.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, scheme: getComputedStyle(document.documentElement).colorScheme }));
        const passed = metrics.width === metrics.scroll && metrics.scheme === theme;
        report.matrix.push({ theme, width, path, passed, metrics });
        if ([375, 1440].includes(width)) await testPage.screenshot({ path: root + '/screenshots/mock-' + path.split('.')[0] + '-' + theme + '-' + width + '.png', fullPage: true });
      }
    }
  }
  await testPage.goto('http://127.0.0.1:8134/index.html');
  await settled(testPage);
  await scenario('mocked', 'keyboard focus, reset and removed wishlist', async () => {
    const toggle = testPage.locator('[data-action="toggle"]').first();
    await toggle.focus();
    await testPage.keyboard.press('Space');
    assert.equal(await testPage.evaluate(() => document.activeElement.dataset.action), 'toggle');
    await testPage.locator('button[type="reset"]').click();
    assert.equal(await testPage.locator('#search').inputValue(), '');
    assert.deepEqual(await status(testPage), ['empty']);
    return { focusPreserved: true };
  });
  await scenario('mocked', 'blocked storage keeps catalog and wishlist usable', async () => {
    await testPage.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }));
    await testPage.reload();
    await testPage.locator('#search').fill('blocked');
    await testPage.waitForTimeout(500);
    await settled(testPage);
    await testPage.locator('[data-action="toggle"]').first().click();
    assert.equal(await testPage.locator('[data-storage-notice]').isVisible(), true);
    assert.equal(await testPage.locator('[data-wishlist-count]').textContent(), '1');
    return { inMemory: true };
  });
  await scenario('mocked', 'restored page lifecycle restarts canceled search', async () => {
    mode = 'slow';
    await testPage.locator('#search').fill('restored');
    await testPage.waitForTimeout(450);
    await testPage.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await testPage.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await settled(testPage);
    assert.deepEqual(await status(testPage), ['success']);
    return { simulatedPageTransitionEvents: true };
  });
  await mock.close();
} finally {
  await writeFile(root + '/browser-results.json', JSON.stringify(report, null, 2));
  if (browser) await browser.close();
  server.kill();
}
const failures = [...report.real, ...report.mocked, ...report.matrix].filter(item => !item.passed);
console.log(JSON.stringify({ real: report.real.length, mocked: report.mocked.length, matrix: report.matrix.length, failures: failures.length, errors: report.errors }));
if (failures.length || report.errors.length) process.exitCode = 1;
