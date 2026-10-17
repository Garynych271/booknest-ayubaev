import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';
import puppeteer from '../.audit-tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import lighthouse from '../.audit-tools/node_modules/lighthouse/core/index.js';

const server = spawn(process.execPath, ['tools/serve.mjs'], { env: { ...process.env, PORT: '8132' }, windowsHide: true, stdio: 'ignore' });
const results = [];
let browser;
try {
  await delay(700);
  if (server.exitCode !== null) throw new Error('Port 8132 occupied');
  await mkdir('docs/lab3/lighthouse', { recursive: true });
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--remote-debugging-port=9243'] });
  const auditBrowser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9243' });
  for (const theme of ['light', 'dark']) {
    const page = await auditBrowser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
    await page.goto('http://127.0.0.1:8132/index.html');
    await page.evaluate(() => localStorage.setItem('booknest.catalog.v1', JSON.stringify({ version: 1, filters: { query: '', genre: '', available: false, sort: 'title' }, wishlist: ['b01'] })));
    const run = await lighthouse('http://127.0.0.1:8132/index.html', { port: 9243, onlyCategories: ['performance', 'accessibility'], output: ['json', 'html'], logLevel: 'error' }, undefined, page);
    const observed = await page.evaluate(() => ({ scheme: getComputedStyle(document.documentElement).colorScheme, cards: document.querySelectorAll('[data-book-id]').length, wishlist: document.querySelector('[data-wishlist-count]').textContent }));
    if (observed.scheme !== theme || observed.cards !== 40 || observed.wishlist !== '1' || run.lhr.runtimeError) throw new Error(`Unexpected audit state: ${JSON.stringify(observed)}`);
    await writeFile(`docs/lab3/lighthouse/catalog-${theme}.json`, run.report[0]);
    await writeFile(`docs/lab3/lighthouse/catalog-${theme}.html`, run.report[1].replace(/[ \t]+$/gm, ''));
    results.push({ theme, observed, measuredAt: run.lhr.fetchTime, performance: run.lhr.categories.performance.score * 100, accessibility: run.lhr.categories.accessibility.score * 100, warnings: run.lhr.runWarnings,
      accessibilityFailures: run.lhr.categories.accessibility.auditRefs.filter(ref => run.lhr.audits[ref.id].score === 0).map(ref => ref.id) });
    console.log(JSON.stringify(results.at(-1)));
    await page.close();
  }
  await writeFile('docs/lab3/lighthouse/summary.json', JSON.stringify(results, null, 2));
  await auditBrowser.disconnect();
} finally { if (browser) await browser.close(); server.kill(); }
