import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';
import puppeteer from '../.audit-tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { snapshot } from '../.audit-tools/node_modules/lighthouse/core/index.js';

const server = spawn(process.execPath, ['tools/serve.mjs'], { env: { ...process.env, PORT: '8135' }, windowsHide: true, stdio: 'ignore' });
const results = [];
let browser;
let connected;
try {
  await delay(700);
  if (server.exitCode !== null) throw new Error('Port 8135 occupied');
  await mkdir('docs/lab4/accessibility', { recursive: true });
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--remote-debugging-port=9245'] });
  connected = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9245' });
  for (const theme of ['light', 'dark']) {
    for (const path of ['index.html', 'book.html?id=OL109524W']) {
      const page = await connected.newPage();
      await page.setViewport({ width: 375, height: 900 });
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
      await page.goto('http://127.0.0.1:8135/' + path);
      if (path === 'index.html') {
        await page.focus('#search');
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await page.type('#search', 'Solaris');
        await delay(500);
      }
      await page.waitForFunction(() => {
        const node = document.querySelector('.catalog') || document.querySelector('main');
        return node.getAttribute('aria-busy') === 'false';
      });
      const observed = await page.evaluate(() => ({ theme: getComputedStyle(document.documentElement).colorScheme, states: [...document.querySelectorAll('[data-state]')].filter(node => getComputedStyle(node).display !== 'none').map(node => node.dataset.state), cards: document.querySelectorAll('[data-book-id]').length }));
      const run = await snapshot(page, { flags: { onlyCategories: ['accessibility'], output: ['json', 'html'], logLevel: 'error' } });
      const name = path.split('.')[0] + '-' + theme;
      await writeFile('docs/lab4/accessibility/' + name + '.json', run.report[0]);
      await writeFile('docs/lab4/accessibility/' + name + '.html', run.report[1].replace(/[ \t]+$/gm, ''));
      await page.screenshot({ path: 'docs/lab4/screenshots/live-' + name + '-viewport.png' });
      results.push({ name, mode: 'Lighthouse snapshot, real API, no mocks; not a Performance audit', measuredAt: run.lhr.fetchTime, observed, accessibility: run.lhr.categories.accessibility.score * 100, failures: run.lhr.categories.accessibility.auditRefs.filter(ref => run.lhr.audits[ref.id].score === 0).map(ref => ref.id) });
      console.log(JSON.stringify(results.at(-1)));
      await page.close();
    }
  }
} finally {
  await writeFile('docs/lab4/accessibility/summary.json', JSON.stringify(results, null, 2));
  if (connected) await connected.disconnect();
  if (browser) await browser.close();
  server.kill();
}
if (results.length !== 4 || results.some(result => result.accessibility < 90 || result.observed.theme !== result.name.split('-')[1] || result.observed.states.join(',') !== 'success')) process.exitCode = 1;
