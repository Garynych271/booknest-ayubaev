import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';
import puppeteer from '../.audit-tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { snapshot } from '../.audit-tools/node_modules/lighthouse/core/index.js';

const base = 'http://127.0.0.1:5180/';
const out = 'docs/lab6a/accessibility';
const server = spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 5180 --strictPort'], { cwd: 'booknest-web', windowsHide: true, stdio: 'ignore' });
const darkOnly = process.argv.includes('--dark-only');
let results = [];
if (darkOnly) {
  try { results = JSON.parse(await readFile(`${out}/summary.json`, 'utf8')); }
  catch { /* No successful earlier snapshot to preserve. */ }
}
let browser;
let connected;

async function waitServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(base)).ok) return; } catch { /* Vite is starting. */ }
    await delay(250);
  }
  throw new Error('Vite did not start');
}

try {
  await waitServer();
  await mkdir(out, { recursive: true });
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--remote-debugging-port=9250'] });
  connected = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9250' });

  for (const theme of darkOnly ? ['dark'] : ['light', 'dark']) {
    const page = await connected.newPage();
    await page.setViewport({ width: 375, height: 900 });
    await page.evaluateOnNewDocument(value => {
      localStorage.clear();
      localStorage.setItem('booknest.theme', value);
    }, theme);
    await page.goto(base);
    await page.type('#search', 'Solaris');
    await page.waitForFunction(() => document.querySelector('[data-state="success"]'));
    const observed = await page.evaluate(() => ({
      theme: document.querySelector('.page')?.getAttribute('data-theme'),
      overflow: document.documentElement.scrollWidth - innerWidth,
      switchChecked: document.querySelector('[role="switch"]')?.checked,
    }));
    const run = await snapshot(page, { flags: { onlyCategories: ['accessibility'], output: ['json', 'html'], logLevel: 'error' } });
    await writeFile(`${out}/catalog-${theme}.json`, run.report[0]);
    await writeFile(`${out}/catalog-${theme}.html`, run.report[1].replace(/[ \t]+$/gm, ''));
    results = results.filter(result => result.name !== `catalog-${theme}`);
    results.push({ name: `catalog-${theme}`, measuredAt: run.lhr.fetchTime, mode: 'Lighthouse snapshot with real Open Library search', observed,
      accessibility: run.lhr.categories.accessibility.score * 100,
      failures: run.lhr.categories.accessibility.auditRefs.filter(ref => run.lhr.audits[ref.id].score === 0).map(ref => ref.id) });
    console.log(JSON.stringify(results.at(-1)));
    await page.close();
  }
} finally {
  await writeFile(`${out}/summary.json`, JSON.stringify(results, null, 2));
  if (connected) await connected.disconnect();
  if (browser) await browser.close();
  server.kill();
}

if (results.length !== 2 || results.some(result => result.accessibility < 90 || result.observed.overflow !== 0 || result.observed.theme !== result.name.split('-')[1])) process.exitCode = 1;
