import { spawn, execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';

const origin = 'http://127.0.0.1:8122';
const output = 'docs/lab2';
const pages = ['index', 'book', 'loan'];
const executablePath = process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const server = spawn('python', ['-m', 'http.server', '8122', '--bind', '127.0.0.1'], { windowsHide: true, stdio: 'ignore' });
let browser;
try {
  // Refuse an occupied port instead of accidentally testing another server.
  await delay(1000);
  if (server.exitCode !== null) throw new Error('HTTP server could not start on port 8122');
  await mkdir(`${output}/screenshots`, { recursive: true });
  browser = await chromium.launch({ executablePath, headless: true });
  const results = { measuredAt: new Date().toISOString(), browser: browser.version(), executablePath, cases: [], failures };
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', error => consoleErrors.push(String(error)));

  for (const name of pages) {
    const baseline = execFileSync('git', ['show', `lab-1/markup:${name}.html`], { encoding: 'utf8' });
    const current = await readFile(`${name}.html`, 'utf8');
    const sourcesEqual = await page.evaluate(({ baseline, current }) => {
      function tree(source) {
        const doc = new DOMParser().parseFromString(source, 'text/html');
        doc.querySelectorAll('link[rel="stylesheet"]').forEach(node => node.remove());
        function visit(node) {
          if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim() || null;
          if (node.nodeType !== Node.ELEMENT_NODE) return null;
          return [node.tagName, [...node.attributes].filter(a => a.name !== 'class').map(a => [a.name, a.value]).sort(), [...node.childNodes].map(visit).filter(Boolean)];
        }
        return JSON.stringify(visit(doc.documentElement));
      }
      return tree(baseline) === tree(current);
    }, { baseline, current });
    check(sourcesEqual, `${name}: HTML structure/content/attributes changed beyond classes and stylesheet links`);

    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 375, height: 900 });
      const response = await page.goto(`${origin}/${name}.html`, { waitUntil: 'networkidle', timeout: 90000 });
      check(response.status() === 200, `${name}: HTTP status ${response.status()}`);
      for (const width of [320, 375, 768, 1440, 1600]) {
        await page.setViewportSize({ width, height: 900 });
        const metrics = await page.evaluate(() => {
          const rect = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
          const cards = [...document.querySelectorAll('.book-card')];
          return {
            viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            scheme: getComputedStyle(document.documentElement).colorScheme,
            background: getComputedStyle(document.documentElement).backgroundColor,
            images: [...document.images].map(i => ({ src: i.src, loaded: i.complete && i.naturalWidth > 0 })),
            columns: document.querySelector('.catalog') ? getComputedStyle(document.querySelector('.catalog')).gridTemplateColumns : null,
            cards: cards.map(c => ({ ...rect(c), button: rect(c.querySelector('.book-card__button')) })),
            nav: [...document.querySelectorAll('.site-nav a')].map(rect),
            sidebar: document.querySelector('.filters') ? rect(document.querySelector('.filters')) : null,
            catalog: document.querySelector('.catalog') ? rect(document.querySelector('.catalog')) : null,
            motion: [...document.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); return s.animationName !== 'none' || s.transitionDuration.split(',').some(d => parseFloat(d) !== 0); }).length,
          };
        });
        check(metrics.scrollWidth <= width, `${name}/${theme}/${width}: horizontal overflow ${metrics.scrollWidth}`);
        check(metrics.images.every(i => i.loaded), `${name}/${theme}/${width}: broken image`);
        check(metrics.scheme === theme, `${name}/${theme}/${width}: incorrect scheme`);
        check(metrics.motion === 0, `${name}/${theme}/${width}: reduced motion not respected`);
        if (name === 'index') {
          const columns = metrics.columns.split(' ').length;
          const expected = width < 768 ? 1 : width === 768 ? 2 : 3;
          check(columns === expected, `catalog/${width}: ${columns} columns, expected ${expected}`);
          if (width >= 768) check(new Set(metrics.nav.map(r => Math.round(r.y))).size === 1, `nav/${width}: not inline`);
          if (width >= 900) check(metrics.sidebar.x < metrics.catalog.x && metrics.sidebar.y === metrics.catalog.y, `catalog/${width}: sidebar position`);
          for (const card of metrics.cards) {
            const row = metrics.cards.filter(c => Math.abs(c.y - card.y) < 1);
            check(row.every(c => Math.abs(c.height - card.height) < 1 && Math.abs(c.button.bottom - card.button.bottom) < 1), `catalog/${width}: card/button alignment`);
          }
        }
        if ([375, 768, 1440].includes(width)) await page.screenshot({ path: `${output}/screenshots/${name}-${width}-${theme}.png`, fullPage: true });
        results.cases.push({ name, theme, width, sourcesEqual, ...metrics });
      }

      // Real Tab traversal, followed by checks of every control (including radio peers).
      await page.setViewportSize({ width: 375, height: 900 });
      await page.reload({ waitUntil: 'networkidle', timeout: 90000 });
      const focus = [];
      const controls = page.locator('a[href], input, select, textarea, button');
      const count = await controls.count();
      for (let i = 0; i < count + 2; i++) {
        await page.keyboard.press('Tab');
        focus.push(await page.evaluate(() => ({ tag: document.activeElement.tagName, id: document.activeElement.id, text: document.activeElement.textContent.trim().slice(0, 60), outline: getComputedStyle(document.activeElement).outlineStyle })));
      }
      for (let i = 0; i < count; i++) {
        await controls.nth(i).focus();
        const visible = await controls.nth(i).evaluate(e => e.matches(':focus-visible') && getComputedStyle(e).outlineStyle !== 'none' && parseFloat(getComputedStyle(e).outlineWidth) >= 3);
        check(visible, `${name}/${theme}: invisible focus control ${i}`);
      }
      const forms = await page.locator('form').evaluateAll(forms => forms.map(f => f.checkValidity()));
      check(forms[0] === (name === 'index'), `${name}: empty form validation regression`);
      results.cases.push({ name, theme, keyboard: focus, focusControlsChecked: count, emptyFormValidity: forms });

      if (name === 'index') {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.locator('.book-card h3 a').first().evaluate(a => { a.textContent = Array(15).fill('Длинное').join(' '); });
        const stress = await page.locator('.book-card').evaluateAll(cards => cards.slice(0, 3).map(c => ({ height: c.getBoundingClientRect().height, bottom: c.querySelector('.book-card__button').getBoundingClientRect().bottom })));
        check(stress.every(c => Math.abs(c.height - stress[0].height) < 1 && Math.abs(c.bottom - stress[0].bottom) < 1), `long title/${theme}: uneven cards`);
        await page.locator('main').evaluate(main => { main.replaceChildren(); });
        const footer = await page.locator('footer').evaluate(e => e.getBoundingClientRect().bottom);
        check(Math.abs(footer - 900) < 1, `short content/${theme}: footer bottom ${footer}`);
        results.cases.push({ name, theme, longTitle: stress, shortContentFooterBottom: footer });
      }
    }
    console.log(`Browser checks: ${name}, failures so far: ${failures.length}`);
  }
  results.consoleErrors = consoleErrors;
  check(consoleErrors.length === 0, 'Unhandled page errors');
  await writeFile(`${output}/browser-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ cases: results.cases.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill();
}
