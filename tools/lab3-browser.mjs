import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';
import { books } from '../data/books.js';

const out = 'docs/lab3';
const origin = 'http://127.0.0.1:8131';
const key = 'booknest.catalog.v1';
const report = { date: new Date().toISOString(), steps: [], matrix: [], console: [], errors: [], externalRequests: [], failedRequests: [] };
const server = spawn(process.execPath, ['tools/serve.mjs'], { env: { ...process.env, PORT: '8131' }, windowsHide: true, stdio: 'ignore' });
let browser;
async function step(name, action) {
  await action();
  report.steps.push({ name, passed: true });
  console.log(`PASS ${name}`);
}
try {
  await mkdir(`${out}/screenshots`, { recursive: true });
  await delay(700);
  if (server.exitCode !== null) throw new Error('Port 8131 is occupied');
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  report.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  context.on('page', tab => {
    tab.on('pageerror', error => report.errors.push(String(error)));
    tab.on('console', msg => { if (['warning', 'error'].includes(msg.type())) report.console.push({ type: msg.type(), text: msg.text() }); });
    tab.on('request', r => { if (!r.url().startsWith(origin)) report.externalRequests.push(r.url()); });
    tab.on('requestfailed', r => report.failedRequests.push({ url: r.url(), error: r.failure() }));
  });
  const page = await context.newPage();
  const ids = () => page.locator('[data-book-id]').evaluateAll(nodes => nodes.map(n => n.dataset.bookId));
  const reset = () => page.getByRole('button', { name: 'Сбросить фильтры' }).click();
  await page.goto(origin);
  await step('three pure selection examples execute in the browser runtime', async () => {
    report.consoleSelections = await page.evaluate(async () => {
      const { books } = await import('./data/books.js');
      const { selectBooks } = await import('./lib/books.js');
      return [
        selectBooks(books, { query: 'SOLARIS' }).map(b => b.id),
        selectBooks(books, { query: 'мартин', genre: 'programming', available: true, sort: 'rating-desc' }).map(b => b.id),
        selectBooks(books, { query: 'нет такой книги' }).map(b => b.id),
      ];
    });
    assert.deepEqual(report.consoleSelections, [['b01'], ['b40', 'b33'], []]);
  });
  await step('initial 40 books, default sort, count and empty wishlist', async () => {
    assert.equal((await ids()).length, 40);
    assert.match(await page.locator('[data-result-count]').textContent(), /40 из 40/);
    assert.equal(await page.locator('[data-wishlist-count]').textContent(), '0');
    assert.equal(await page.locator('[data-storage-notice]').isVisible(), false);
    const titles = await page.locator('[data-title]').allTextContents();
    assert.deepEqual(titles, [...titles].sort((a, b) => a.localeCompare(b, 'ru')));
  });
  await step('case-insensitive title and author search updates immediately', async () => {
    await page.locator('#search').fill(' sOLaRis ');
    assert.deepEqual(await ids(), ['b01']);
    await page.locator('#search').fill('РОБЕРТ МАРТИН');
    assert.deepEqual((await ids()).sort(), ['b33', 'b38']);
  });
  await step('all five genres and availability intersect', async () => {
    await reset();
    for (const genre of ['science-fiction', 'novel', 'non-fiction', 'history', 'programming']) {
      await page.locator('#genre').selectOption(genre);
      assert.equal((await ids()).length, 8);
      await page.locator('#available').check();
      assert.deepEqual(new Set(await ids()), new Set(books.filter(b => b.genre === genre && b.available).map(b => b.id)));
      await page.locator('#available').uncheck();
    }
  });
  await step('all sort modes and combined query/genre/availability/year', async () => {
    await reset();
    for (const [sort, field] of [['year-desc', 'year'], ['rating-desc', 'rating']]) {
      await page.locator('#sort').selectOption(sort);
      const values = (await ids()).map(id => books.find(b => b.id === id)[field]);
      assert.deepEqual(values, [...values].sort((a, b) => b - a));
    }
    await page.locator('#search').fill('мартин');
    await page.locator('#genre').selectOption('programming');
    await page.locator('#available').check();
    await page.locator('#sort').selectOption('year-desc');
    assert.deepEqual(await ids(), ['b40', 'b33']);
    await page.screenshot({ path: `${out}/screenshots/combined-filters.png`, fullPage: true });
  });
  await step('wishlist toggles, aria-pressed and keyboard focus survive rendering', async () => {
    const button = page.locator('[data-action="toggle"][data-id="b40"]');
    await button.focus();
    await page.keyboard.press('Space');
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    assert.ok((await button.getAttribute('aria-label')).includes(await button.textContent()));
    assert.equal(await button.evaluate(b => b === document.activeElement), true);
    assert.equal(await page.locator('[data-wishlist-count]').textContent(), '1');
  });
  await step('reload restores every filter and saved books', async () => {
    await page.reload();
    assert.deepEqual(await ids(), ['b40', 'b33']);
    assert.equal(await page.locator('#search').inputValue(), 'мартин');
    assert.equal(await page.locator('#genre').inputValue(), 'programming');
    assert.equal(await page.locator('#sort').inputValue(), 'year-desc');
    assert.equal(await page.locator('#available').isChecked(), true);
    assert.equal(await page.locator('[data-action="toggle"][data-id="b40"]').getAttribute('aria-pressed'), 'true');
  });
  await step('new tab restores saved state and reset preserves wishlist', async () => {
    const tab = await context.newPage();
    await tab.goto(origin);
    assert.equal(await tab.locator('#search').inputValue(), 'мартин');
    assert.equal(await tab.locator('[data-wishlist-count]').textContent(), '1');
    await tab.close();
    await reset();
    assert.equal((await ids()).length, 40);
    assert.equal(await page.locator('#available').isChecked(), false);
    assert.equal(await page.locator('#sort').inputValue(), 'title');
    assert.equal(await page.locator('[data-wishlist-count]').textContent(), '1');
  });
  await step('delegated nested target and removal while book is filtered out', async () => {
    const button = page.locator('[data-action="toggle"][data-id="b01"]');
    await button.evaluate(b => { const span = document.createElement('span'); span.textContent = 'Добавить'; b.append(span); });
    await button.locator('span').click();
    assert.equal(await page.locator('[data-wishlist-count]').textContent(), '2');
    await page.locator('#search').fill('Solaris');
    await page.locator('[data-action="remove"][data-id="b40"]').click();
    assert.equal(await page.locator('[data-wishlist-count]').textContent(), '1');
    await page.locator('#wishlist').screenshot({ path: `${out}/screenshots/wishlist.png` });
    await page.locator('[data-action="remove"][data-id="b01"]').click();
    assert.equal(await page.locator('#wishlist-title').evaluate(e => e === document.activeElement), true);
    assert.equal(await page.locator('[data-wishlist-empty]').isVisible(), true);
    assert.equal(await page.locator('[data-action="toggle"][data-id="b01"]').getAttribute('aria-pressed'), 'false');
  });
  await step('safe empty state for HTML-like input, Enter does not navigate', async () => {
    await page.locator('#search').fill('<img src=x onerror=alert(1)>');
    assert.deepEqual(await ids(), []);
    assert.equal(await page.locator('[data-empty]').isVisible(), true);
    assert.equal(await page.locator('img[src="x"]').count(), 0);
    const oldURL = page.url();
    await page.keyboard.press('Enter');
    assert.equal(page.url(), oldURL);
    await page.screenshot({ path: `${out}/screenshots/empty.png` });
    await reset();
    assert.equal(await page.locator('[data-empty]').isVisible(), false);
  });
  await step('corrupt JSON, wrong schema, duplicates and unknown IDs recover', async () => {
    for (const raw of ['{broken', 'null', '[]', '{"version":99}']) {
      await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key, raw });
      await page.reload();
      assert.equal((await ids()).length, 40);
      assert.equal(await page.locator('[data-wishlist-count]').textContent(), '0');
    }
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ version: 1, filters: { query: 123, genre: 'bad', sort: 'bad', available: 'true' }, wishlist: ['b01', 'b01', 'unknown'] })), key);
    await page.reload();
    assert.equal((await ids()).length, 40);
    assert.equal(await page.locator('[data-wishlist-count]').textContent(), '1');
  });
  await step('blocked localStorage and quota errors retain interactive in-memory state', async () => {
    for (const mode of ['blocked', 'quota']) {
      const limited = await browser.newContext();
      await limited.addInitScript(mode => {
        if (mode === 'blocked') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } });
        else Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
      }, mode);
      const tab = await limited.newPage();
      tab.on('pageerror', e => report.errors.push(String(e)));
      tab.on('console', msg => { if (['warning', 'error'].includes(msg.type())) report.console.push({ type: msg.type(), text: msg.text() }); });
      await tab.goto(origin);
      await tab.locator('#search').fill('Solaris');
      await tab.locator('[data-action="toggle"]').click();
      assert.equal(await tab.locator('[data-wishlist-count]').textContent(), '1');
      assert.equal(await tab.locator('[data-storage-notice]').isVisible(), true);
      await tab.screenshot({ path: `${out}/screenshots/storage-${mode}.png` });
      await limited.close();
    }
  });
  await step('responsive layouts, themes and local images on all three pages', async () => {
    await reset();
    for (const name of ['index', 'book', 'loan']) {
      await page.goto(`${origin}/${name}.html`);
      for (const theme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        for (const width of [320, 375, 768, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          const metrics = await page.evaluate(async () => {
            await Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode(); }));
            const rects = [...document.querySelectorAll('[data-book-id]')].map(e => ({ top: e.offsetTop, height: e.getBoundingClientRect().height }));
            return { scrollWidth: document.documentElement.scrollWidth, scheme: getComputedStyle(document.documentElement).colorScheme,
              images: [...document.images].map(i => ({ src: i.getAttribute('src'), loaded: i.naturalWidth > 0 })),
              columns: document.querySelector('.book-grid') ? getComputedStyle(document.querySelector('.book-grid')).gridTemplateColumns.split(' ').length : null, rects };
          });
          assert.ok(metrics.scrollWidth <= width);
          assert.equal(metrics.scheme, theme);
          assert.ok(metrics.images.every(i => i.loaded));
          if (name === 'index') {
            assert.equal(metrics.columns, width < 768 ? 1 : width === 768 ? 2 : 3);
            for (const card of metrics.rects) assert.ok(metrics.rects.filter(c => c.top === card.top).every(c => Math.abs(c.height - card.height) < 1));
          }
          report.matrix.push({ name, theme, width, ...metrics });
          if (name === 'index' && width !== 320) {
            await page.evaluate(() => scrollTo(0, 0));
            await page.screenshot({ path: `${out}/screenshots/catalog-${width}-${theme}.png` });
          }
        }
      }
    }
  });
  await step('inherited reader-name pattern now rejects digits and accepts a hyphen', async () => {
    await page.locator('#reader-name').fill('123');
    assert.equal(await page.locator('#reader-name').evaluate(e => e.validity.patternMismatch), true);
    await page.locator('#reader-name').fill('Анна-Мария Иванова');
    assert.equal(await page.locator('#reader-name').evaluate(e => e.checkValidity()), true);
  });
  await step('console is clean and application makes no external requests', async () => {
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.console, []);
    assert.deepEqual(report.externalRequests, []);
    // Navigation can cancel lazy image loads, which are not application errors.
    assert.ok(report.failedRequests.every(r => r.error.errorText === 'net::ERR_ABORTED'));
  });
} catch (error) {
  report.failure = String(error.stack || error);
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill();
  await writeFile(`${out}/browser-results.json`, JSON.stringify(report, null, 2));
}
