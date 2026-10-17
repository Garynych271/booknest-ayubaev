import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';

const base = 'http://127.0.0.1:5181';
const out = 'docs/lab6b';
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const server = spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 5181 --strictPort'], {
  cwd: 'booknest-web', windowsHide: true, stdio: 'ignore',
});
const report = {
  measuredAt: new Date().toISOString(), browser: '', scenarios: [], responsive: [],
  openLibraryRequests: [], pageErrors: [], unexpectedConsoleErrors: [], expectedOfflineErrors: [],
};
let browser;

async function waitServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(base)).ok) return; } catch { /* Vite is starting. */ }
    await delay(250);
  }
  throw new Error('Vite did not start');
}

async function scenario(name, action) {
  try {
    report.scenarios.push({ name, passed: true, evidence: await action() });
  } catch (error) {
    report.scenarios.push({ name, passed: false, error: error.stack });
  }
  console.log(name, report.scenarios.at(-1).passed);
}

async function waitCatalog(page, state = 'success') {
  await page.waitForFunction(expected => [...document.querySelectorAll('[data-state]')]
    .some(node => getComputedStyle(node).display !== 'none' && node.dataset.state === expected), state);
}

async function fillValidForm(page, overrides = {}) {
  const values = {
    title: 'BookNest browser record', author: 'Test Author', genre: 'science-fiction',
    isbn: '9780571311571', publishedYear: '1961', description: 'A browser-created record for the Lab 6B verification.',
    ...overrides,
  };
  await page.locator('#record-title').fill(values.title);
  await page.locator('#record-author').fill(values.author);
  await page.locator('#record-genre').selectOption(values.genre);
  await page.locator('#record-isbn').fill(values.isbn);
  await page.locator('#record-year').fill(values.publishedYear);
  await page.locator('#record-description').fill(values.description);
}

async function submitForm(page) {
  const button = page.locator('form.book-record-form button[type="submit"]');
  await button.click();
  return button;
}

try {
  await waitServer();
  await mkdir(`${out}/screenshots`, { recursive: true });
  browser = await chromium.launch({ executablePath: edge, headless: true });
  report.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  let offlineExpected = false;
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    (offlineExpected ? report.expectedOfflineErrors : report.unexpectedConsoleErrors).push(message.text());
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  cdp.on('Network.responseReceived', event => {
    if (event.response.url.includes('openlibrary.org')) report.openLibraryRequests.push({ url: event.response.url, status: event.response.status });
  });

  await page.goto(`${base}/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await scenario('nested routes, direct URLs and history', async () => {
    await page.waitForURL('**/books');
    await page.goto(`${base}/books?q=Solaris&genre=science-fiction&available=1&sort=rating-desc&page=2`);
    assert.equal(await page.locator('#search').inputValue(), 'Solaris');
    assert.equal(await page.locator('#genre').inputValue(), 'science-fiction');
    assert.equal(await page.locator('#available').isChecked(), true);
    assert.equal(await page.locator('#sort').inputValue(), 'rating-desc');
    await page.locator('#search').fill('Dune');
    await page.waitForURL(url => url.searchParams.get('q') === 'Dune' && url.searchParams.get('page') === null);
    await page.goBack();
    assert.equal(new URL(page.url()).searchParams.get('q'), 'Solaris');
    assert.equal(await page.locator('a[aria-current="page"]').first().getAttribute('href'), '/books');
    await page.screenshot({ path: `${out}/screenshots/routes-catalog-desktop.png`, fullPage: true });
    return { directQuery: 'Solaris', directPage: 2, backRestored: true, activeNav: '/books' };
  });

  await scenario('real Open Library catalog and detail requests', async () => {
    await page.goto(`${base}/books?q=Solaris`);
    await waitCatalog(page);
    const cards = await page.locator('[data-book-id]').count();
    assert.ok(cards > 0);
    await page.goto(`${base}/books/OL109524W`);
    await page.waitForSelector('.book-detail[data-state="success"]');
    assert.equal(await page.locator('h1').textContent(), 'Solaris');
    await page.goto(`${base}/books/not-a-work`);
    await page.waitForSelector('[data-state="error"]');
    assert.match(await page.locator('[data-error-message]').textContent(), /404/);
    return { cards, detailId: 'OL109524W', detailTitle: 'Solaris', invalidDetailStatus: 404 };
  });

  await scenario('wishlist survives navigation and reload', async () => {
    await page.goto(`${base}/books?q=Solaris`);
    await waitCatalog(page);
    await page.locator('[data-action="toggle"]').first().click();
    const countBeforeReload = await page.locator('[data-wishlist-count]').textContent();
    await page.goto(`${base}/wishlist`);
    assert.equal(await page.locator('[data-wishlist-list] li').count(), 1);
    await page.reload();
    assert.equal(await page.locator('[data-wishlist-list] li').count(), 1);
    assert.equal(await page.locator('[data-wishlist-count]').textContent(), countBeforeReload);
    return { countBeforeReload, itemsAfterReload: 1 };
  });

  await scenario('client and cross-field validation', async () => {
    await page.goto(`${base}/books/new`);
    await submitForm(page);
    await page.waitForSelector('#record-title[aria-invalid="true"]');
    const emptyErrors = await page.locator('.field-error').count();
    assert.ok(emptyErrors >= 4);
    await fillValidForm(page);
    await page.locator('#record-due').fill(await page.locator('#record-issued').inputValue());
    await submitForm(page);
    await page.waitForSelector('#record-due[aria-invalid="true"]');
    await page.setViewportSize({ width: 375, height: 900 });
    await page.screenshot({ path: `${out}/screenshots/form-client-errors-mobile.png`, fullPage: true });
    return { emptyFieldErrors: emptyErrors, crossFieldError: true };
  });

  await scenario('mock 422, 409 and 500 handling', async () => {
    const cases = [
      { title: 'Серверная проверка', target: '#record-title', status: 422 },
      { title: 'Conflict record', isbn: '9783161484100', target: '#record-isbn', status: 409 },
      { title: 'Сбой сервера', target: '.form-error', status: 500 },
    ];
    const observed = [];
    for (const item of cases) {
      await page.goto(`${base}/books/new`);
      await fillValidForm(page, item);
      const submit = page.locator('form.book-record-form button[type="submit"]');
      await submit.click();
      const submitDisabledDuringRequest = await submit.isDisabled();
      assert.equal(submitDisabledDuringRequest, true);
      if (item.status === 500) await page.waitForSelector('.form-error');
      else await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('aria-invalid') === 'true', item.target);
      observed.push({ status: item.status, submitDisabledDuringRequest, target: item.target });
    }
    await page.screenshot({ path: `${out}/screenshots/form-server-error-mobile.png`, fullPage: true });
    return observed;
  });

  await scenario('create, redirect, details, edit and stable ID', async () => {
    await page.goto(`${base}/books/new`);
    await fillValidForm(page, { isbn: '9780306406157' });
    const submit = page.locator('form.book-record-form button[type="submit"]');
    await submit.click();
    await page.waitForFunction(() => location.pathname.startsWith('/books/BN-'));
    const createdPath = new URL(page.url()).pathname;
    await page.waitForSelector('.book-detail[data-state="success"]');
    assert.equal(await page.locator('h1').textContent(), 'BookNest browser record');
    await page.goto(`${base}${createdPath}/edit`);
    assert.equal(await page.locator('#record-title').inputValue(), 'BookNest browser record');
    await page.locator('#record-title').fill('BookNest edited record');
    await submitForm(page);
    await page.waitForURL(`${base}${createdPath}`);
    await page.waitForSelector('.book-detail[data-state="success"]');
    assert.equal(await page.locator('h1').textContent(), 'BookNest edited record');
    const records = await page.evaluate(() => JSON.parse(localStorage.getItem('booknest.records.mock.v1') ?? '[]'));
    assert.equal(records.length, 1);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: `${out}/screenshots/crud-edited-detail-desktop.png`, fullPage: true });
    return { createdPath, redirectAfterCreate: true, prefilledEdit: true, sameIdAfterEdit: true, storedRecords: records.length };
  });

  await scenario('auth guard, login return and 404 route', async () => {
    await page.goto(`${base}/login`);
    if ((await page.locator('.site-header__user').textContent()) !== 'Гость') await page.locator('main button').click();
    await page.goto(`${base}/wishlist`);
    await page.waitForURL('**/login');
    await page.locator('main button').click();
    await page.waitForURL('**/wishlist');
    await page.goto(`${base}/missing-route`);
    assert.equal(await page.locator('main h1').textContent(), 'Страница не найдена');
    await page.screenshot({ path: `${out}/screenshots/not-found-mobile.png`, fullPage: true });
    return { guestRedirect: '/login', loginReturn: '/wishlist', unknownRoute: 404 };
  });

  await scenario('Offline state recovers through Retry', async () => {
    await page.goto(`${base}/books?q=Solaris`);
    await waitCatalog(page);
    offlineExpected = true;
    await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await page.locator('#search').fill('Dune');
    await waitCatalog(page, 'error');
    const message = await page.locator('[data-error-message]').textContent();
    await page.screenshot({ path: `${out}/screenshots/offline-error-mobile.png`, fullPage: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await page.locator('[data-action="retry"]').click();
    await waitCatalog(page);
    offlineExpected = false;
    return { message, recovered: true };
  });

  for (const theme of ['light', 'dark']) {
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/books/new`);
      await page.evaluate(value => localStorage.setItem('booknest.theme', value), theme);
      await page.reload();
      const observed = await page.evaluate(() => ({
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        theme: document.querySelector('.page')?.getAttribute('data-theme'),
      }));
      const passed = observed.viewport === observed.scrollWidth && observed.theme === theme;
      report.responsive.push({ theme, width, passed, observed, route: '/books/new' });
      await page.screenshot({ path: `${out}/screenshots/form-${theme}-${width}.png`, fullPage: true });
    }
  }
  await context.close();
} finally {
  await writeFile(`${out}/browser-results.json`, JSON.stringify(report, null, 2));
  if (browser) await browser.close();
  server.kill();
}

const failures = [...report.scenarios, ...report.responsive].filter(item => !item.passed);
console.log(JSON.stringify({ browser: report.browser, scenarios: report.scenarios.length, responsive: report.responsive.length,
  failures: failures.length, pageErrors: report.pageErrors.length, unexpectedConsoleErrors: report.unexpectedConsoleErrors.length,
  openLibraryResponses: report.openLibraryRequests.length }));
if (failures.length || report.pageErrors.length || report.unexpectedConsoleErrors.length) process.exitCode = 1;
