import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';

const base = 'http://127.0.0.1:5179/';
const out = 'docs/lab6a';
await mkdir(`${out}/screenshots`, { recursive: true });
const server = spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 5179 --strictPort'], { cwd: 'booknest-web', windowsHide: true, stdio: 'ignore' });
const report = { measuredAt: new Date().toISOString(), browser: '', real: [], mockedMatrix: [], pageErrors: [], normalConsoleErrors: [], expectedConsoleErrors: [] };
let browser;

async function waitServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(base)).ok) return; } catch { /* Vite is starting. */ }
    await delay(250);
  }
  throw new Error('Vite did not start');
}

async function settle(page, expected = 'success') {
  await page.waitForFunction(value => [...document.querySelectorAll('[data-state]')]
    .some(node => getComputedStyle(node).display !== 'none' && node.dataset.state === value), expected);
}

async function scenario(name, action) {
  try { report.real.push({ name, passed: true, evidence: await action() }); }
  catch (error) { report.real.push({ name, passed: false, error: error.stack }); }
  console.log(name, report.real.at(-1).passed);
}

try {
  await waitServer();
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  report.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  const page = await context.newPage();
  page.setDefaultTimeout(35000);
  let expectedNetworkError = false;
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') (expectedNetworkError ? report.expectedConsoleErrors : report.normalConsoleErrors).push(message.text());
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  const requests = new Map();
  const searchNetwork = [];
  cdp.on('Network.requestWillBeSent', event => {
    if (event.request.url.includes('openlibrary.org/search.json')) {
      const item = { requestId: event.requestId, url: event.request.url, status: 'pending' };
      requests.set(event.requestId, item);
      searchNetwork.push(item);
    }
  });
  cdp.on('Network.loadingFinished', event => { if (requests.has(event.requestId)) requests.get(event.requestId).status = 'completed'; });
  cdp.on('Network.loadingFailed', event => {
    if (requests.has(event.requestId)) Object.assign(requests.get(event.requestId), { status: 'failed', errorText: event.errorText, canceled: event.canceled });
  });

  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await scenario('real API debounce, wishlist and persisted theme', async () => {
    const before = searchNetwork.length;
    await page.locator('#search').fill('So');
    await page.waitForTimeout(120);
    await page.locator('#search').fill('Solaris');
    await settle(page);
    const issued = searchNetwork.slice(before).filter(item => new URL(item.url).searchParams.get('q')?.includes('Solaris'));
    assert.equal(issued.length, 1);
    assert.ok(await page.locator('[data-book-id]').count() > 0);
    await page.locator('[data-action="toggle"]').first().click();
    await page.getByRole('switch', { name: 'Тёмная тема' }).check();
    await page.reload();
    await settle(page);
    assert.equal(await page.locator('[data-wishlist-count]').textContent(), '1');
    assert.equal(await page.locator('.page').getAttribute('data-theme'), 'dark');
    assert.equal(await page.locator('.site-header__user').textContent(), 'Учебный читатель');
    await page.screenshot({ path: `${out}/screenshots/real-catalog-dark.png`, fullPage: true });
    return { searchRequestsAfterRapidInput: issued.length, wishlistAfterReload: 1, persistedTheme: 'dark', currentUser: 'Учебный читатель' };
  });

  await scenario('Slow 4G aborts the obsolete request', async () => {
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 2000, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular4g' });
    await page.locator('#search').fill('Lem');
    await page.waitForRequest(request => request.url().includes('/search.json') && new URL(request.url()).searchParams.get('q')?.includes('Lem'));
    await page.locator('#search').fill('Tolkien');
    await settle(page);
    const canceled = searchNetwork.filter(item => item.canceled === true && new URL(item.url).searchParams.get('q')?.includes('Lem'));
    assert.ok(canceled.length >= 1);
    await page.screenshot({ path: `${out}/screenshots/real-slow4g.png`, fullPage: true });
    return { profile: { latency: 2000, downloadThroughput: 200000, uploadThroughput: 93750 }, canceled: canceled.length };
  });

  await scenario('Offline error recovers through Retry', async () => {
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

  await scenario('real detail request remains functional', async () => {
    await page.goto(`${base}?view=book&id=OL109524W`);
    await settle(page);
    assert.equal(await page.locator('h1').textContent(), 'Solaris');
    await page.screenshot({ path: `${out}/screenshots/real-detail.png`, fullPage: true });
    return { id: 'OL109524W', title: 'Solaris' };
  });

  await writeFile(`${out}/network-real.json`, JSON.stringify(searchNetwork, null, 2));
  await context.close();

  const mocked = await browser.newContext({ viewport: { width: 375, height: 900 } });
  await mocked.route('https://openlibrary.org/**', route => route.fulfill({ json: {
    numFound: 1,
    docs: [{ key: '/works/OL109524W', title: 'Solaris', author_name: ['Станислав Лем'], first_publish_year: 1961, subject: ['Science fiction'], ebook_access: 'public', ratings_average: 4.2 }],
  } }));
  const matrixPage = await mocked.newPage();
  matrixPage.on('pageerror', error => report.pageErrors.push(error.message));
  for (const theme of ['light', 'dark']) {
    for (const width of [375, 768, 1440]) {
      await matrixPage.setViewportSize({ width, height: 900 });
      await matrixPage.goto(base);
      await matrixPage.evaluate(value => { localStorage.setItem('booknest.theme', value); }, theme);
      await matrixPage.reload();
      if (await matrixPage.locator('#search').inputValue() === '') await matrixPage.locator('#search').fill('Solaris');
      await settle(matrixPage);
      const observed = await matrixPage.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, theme: document.querySelector('.page')?.getAttribute('data-theme') }));
      const passed = observed.viewport === observed.scrollWidth && observed.theme === theme;
      report.mockedMatrix.push({ theme, width, passed, observed, note: 'Open Library response intercepted with a deterministic fixture' });
      await matrixPage.screenshot({ path: `${out}/screenshots/catalog-${theme}-${width}.png`, fullPage: true });
    }
  }
  await mocked.close();
} finally {
  await writeFile(`${out}/browser-results.json`, JSON.stringify(report, null, 2));
  if (browser) await browser.close();
  server.kill();
}

const failures = [...report.real, ...report.mockedMatrix].filter(item => !item.passed);
console.log(JSON.stringify({ real: report.real.length, matrix: report.mockedMatrix.length, failures: failures.length, pageErrors: report.pageErrors.length, normalConsoleErrors: report.normalConsoleErrors.length }));
if (failures.length || report.pageErrors.length || report.normalConsoleErrors.length) process.exitCode = 1;
