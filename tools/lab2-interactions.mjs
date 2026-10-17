import { spawn } from 'node:child_process';
import { writeFile, readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';

const server = spawn('python', ['-m', 'http.server', '8124', '--bind', '127.0.0.1'], { windowsHide: true, stdio: 'ignore' });
const report = { measuredAt: new Date().toISOString(), sweeps: [], forms: [], navigation: [], console: [], failures: [] };
let browser;
try {
  await delay(1000);
  if (server.exitCode !== null) throw new Error('Port 8124 unavailable');
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage();
  page.on('console', message => { if (message.type() === 'error') report.console.push(message.text()); });
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'no-preference' });
    for (const name of ['index', 'book', 'loan']) {
      await page.goto(`http://127.0.0.1:8124/${name}.html`, { waitUntil: 'domcontentloaded' });
      const overflow = [];
      for (let width = 320; width <= 1600; width += 16) {
        await page.setViewportSize({ width, height: 900 });
        const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
        if (scroll > width) overflow.push({ width, scroll });
      }
      report.sweeps.push({ name, theme, from: 320, to: 1600, step: 16, samples: 81, overflow });
      if (overflow.length) report.failures.push(`${name}/${theme}: overflow in width sweep`);
    }
    await page.setViewportSize({ width: 375, height: 900 });
    await page.locator('#reader-email').fill('invalid-email');
    await page.locator('#reader-card').focus();
    const invalid = await page.locator('#reader-email').evaluate(e => ({ invalid: e.matches(':invalid'), userInvalid: e.matches(':user-invalid'), color: getComputedStyle(e).borderColor, token: getComputedStyle(document.documentElement).getPropertyValue('--color-invalid').trim() }));
    await page.locator('#reader-email').focus();
    const outline = await page.locator('#reader-email').evaluate(e => ({ visible: e.matches(':focus-visible'), width: getComputedStyle(e).outlineWidth }));
    await page.screenshot({ path: `docs/lab2/screenshots/loan-invalid-focus-${theme}.png` });
    await page.locator('#reader-email').fill('reader@example.com');
    const valid = await page.locator('#reader-email').evaluate(e => e.checkValidity());
    await page.locator('button[type="submit"]').evaluate(e => { e.disabled = true; });
    const disabled = await page.locator('button[type="submit"]').evaluate(e => ({ disabled: e.matches(':disabled'), cursor: getComputedStyle(e).cursor, background: getComputedStyle(e).backgroundColor }));
    report.forms.push({ theme, invalid, outline, valid, disabled });
    if (!invalid.invalid || !invalid.userInvalid || !valid || !outline.visible || outline.width !== '3px' || disabled.cursor !== 'not-allowed') report.failures.push(`form states/${theme}`);
    await page.locator('button[type="submit"]').evaluate(e => { e.disabled = false; });
  }
  for (const name of ['index', 'book', 'loan']) {
    await page.locator(`.site-nav a[href="${name}.html"]`).click({ noWaitAfter: true });
    await page.waitForURL(`**/${name}.html`, { waitUntil: 'domcontentloaded' });
    report.navigation.push(page.url());
  }
  // Check the inherited name pattern separately from the CSS acceptance checks.
  report.inheritedNamePattern = await page.locator('#reader-name').evaluate(e => {
    e.value = '123';
    let syntaxError = null;
    try { new RegExp(e.pattern, 'v'); } catch (error) { syntaxError = error.message; }
    return { pattern: e.pattern, syntaxError, digitsRejected: e.validity.patternMismatch };
  });
  report.stylesheets = await page.evaluate(() => [...document.styleSheets].map(sheet => ({ href: sheet.href, rules: sheet.cssRules.length })));
  const css = await Promise.all(['tokens', 'base', 'layout', 'components'].map(name => readFile(`styles/${name}.css`, 'utf8')));
  report.staticCSS = { mediaQueries: css.join('\n').match(/@media\b/g)?.length || 0, tokens: new Set([...css[0].matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1])).size, important: css.some(s => /!important/.test(s)) };
  if (report.staticCSS.mediaQueries > 2 || report.staticCSS.tokens < 14 || report.staticCSS.important) report.failures.push('CSS constraints');
  await writeFile('docs/lab2/interaction-results.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ sweeps: report.sweeps.length, forms: report.forms, staticCSS: report.staticCSS, inheritedNamePattern: report.inheritedNamePattern, failures: report.failures }, null, 2));
  if (report.failures.length) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill();
}
