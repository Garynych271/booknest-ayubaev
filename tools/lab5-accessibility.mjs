import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';
import puppeteer from '../.audit-tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { snapshot } from '../.audit-tools/node_modules/lighthouse/core/index.js';

const base = 'http://127.0.0.1:5176/';
const server = spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 5176 --strictPort'], { cwd: 'booknest-web', windowsHide: true, stdio: 'ignore' });
const darkOnly = process.argv.includes('--dark-only');
let results = [];
if (darkOnly) {
  try { results = JSON.parse(await readFile('docs/lab5/accessibility/summary.json', 'utf8')); }
  catch { /* no earlier partial run */ }
}
let browser;
let connected;
async function waitServer() {
  for (let index = 0; index < 30; index += 1) {
    try { if ((await fetch(base)).ok) return; } catch { /* server is starting */ }
    await delay(250);
  }
  throw new Error('Vite did not start');
}
try {
  await waitServer();
  await mkdir('docs/lab5/accessibility', { recursive: true });
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--remote-debugging-port=9246'] });
  connected = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9246' });
  for (const theme of darkOnly ? ['dark'] : ['light', 'dark']) {
    for (const view of ['catalog', 'book', 'loan']) {
      const page = await connected.newPage();
      await page.setViewport({ width: 375, height: 900 });
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
      await page.evaluateOnNewDocument(() => localStorage.clear());
      const path = view === 'book' ? '?view=book&id=OL109524W' : view === 'loan' ? '?view=loan' : '';
      await page.goto(base + path);
      if (view === 'catalog') {
        await page.type('#search', 'Solaris');
        await page.waitForFunction(() => document.querySelector('[data-state="success"]'));
      } else if (view === 'book') await page.waitForFunction(() => document.querySelector('[data-state="success"]'));
      const observed = await page.evaluate(() => ({ scheme: getComputedStyle(document.documentElement).colorScheme, overflow: document.documentElement.scrollWidth - innerWidth, states: [...document.querySelectorAll('[data-state]')].filter(node => getComputedStyle(node).display !== 'none').map(node => node.dataset.state) }));
      const run = await snapshot(page, { flags: { onlyCategories: ['accessibility'], output: ['json', 'html'], logLevel: 'error' } });
      const name = `${view}-${theme}`;
      results = results.filter(result => result.name !== name);
      await writeFile(`docs/lab5/accessibility/${name}.json`, run.report[0]);
      await writeFile(`docs/lab5/accessibility/${name}.html`, run.report[1].replace(/[ \t]+$/gm, ''));
      results.push({ name, mode: 'Lighthouse snapshot, real API for catalog/book', measuredAt: run.lhr.fetchTime, observed, accessibility: run.lhr.categories.accessibility.score * 100,
        failures: run.lhr.categories.accessibility.auditRefs.filter(ref => run.lhr.audits[ref.id].score === 0).map(ref => ref.id) });
      console.log(JSON.stringify(results.at(-1)));
      await page.close();
    }
  }
} finally {
  await writeFile('docs/lab5/accessibility/summary.json', JSON.stringify(results, null, 2));
  if (connected) await connected.disconnect();
  if (browser) await browser.close();
  server.kill();
}
if (results.length !== 6 || results.some(result => result.accessibility < 90 || result.observed.overflow !== 0 || result.observed.scheme !== result.name.split('-')[1])) process.exitCode = 1;
