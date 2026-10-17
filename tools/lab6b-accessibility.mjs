import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';
import puppeteer from '../.audit-tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { snapshot } from '../.audit-tools/node_modules/lighthouse/core/index.js';

const base = 'http://127.0.0.1:5182';
const out = 'docs/lab6b/accessibility';
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const server = spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 5182 --strictPort'], {
  cwd: 'booknest-web', windowsHide: true, stdio: 'ignore',
});
const results = [];
let browser;
let connected;

async function waitServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(base)).ok) return; } catch { /* Vite is starting. */ }
    await delay(250);
  }
  throw new Error('Vite did not start');
}

try {
  await waitServer();
  await mkdir(out, { recursive: true });
  browser = await chromium.launch({ executablePath: edge, headless: true, args: ['--remote-debugging-port=9251'] });
  connected = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9251' });
  const cases = [
    { name: 'form-mobile-light', theme: 'light', width: 375, height: 900 },
    { name: 'form-desktop-dark', theme: 'dark', width: 1440, height: 1000 },
  ];

  for (const item of cases) {
    const page = await connected.newPage();
    await page.setViewport({ width: item.width, height: item.height });
    await page.evaluateOnNewDocument(theme => localStorage.setItem('booknest.theme', theme), item.theme);
    await page.goto(`${base}/books/new`, { waitUntil: 'networkidle0' });
    const observed = await page.evaluate(() => ({
      path: location.pathname,
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      theme: document.querySelector('.page')?.getAttribute('data-theme'),
      fields: document.querySelectorAll('.book-record-form input, .book-record-form select, .book-record-form textarea').length,
    }));
    const run = await snapshot(page, { flags: { onlyCategories: ['accessibility'], output: ['json', 'html'], logLevel: 'error' } });
    await writeFile(`${out}/${item.name}.json`, run.report[0]);
    await writeFile(`${out}/${item.name}.html`, run.report[1].replace(/[ \t]+$/gm, ''));
    const result = {
      ...item, measuredAt: run.lhr.fetchTime, browser: run.lhr.userAgent, observed,
      accessibility: run.lhr.categories.accessibility.score * 100,
      failures: run.lhr.categories.accessibility.auditRefs
        .filter(ref => run.lhr.audits[ref.id].score === 0)
        .map(ref => ref.id),
    };
    results.push(result);
    console.log(JSON.stringify(result));
    await page.close();
  }
} finally {
  await writeFile(`${out}/summary.json`, JSON.stringify(results, null, 2));
  if (connected) await connected.disconnect();
  if (browser) await browser.close();
  server.kill();
}

if (results.length !== 2 || results.some(result => result.accessibility < 90
  || result.observed.viewport !== result.observed.scrollWidth || result.observed.theme !== result.theme || result.observed.fields < 8)) {
  process.exitCode = 1;
}
