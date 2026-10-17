import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';
import lighthouse from '../.audit-tools/node_modules/lighthouse/core/index.js';
import puppeteer from '../.audit-tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const executablePath = process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const output = 'docs/lab2/lighthouse';
const server = spawn('python', ['-m', 'http.server', '8123', '--bind', '127.0.0.1'], { windowsHide: true, stdio: 'ignore' });
const themes = process.argv.slice(2).length ? process.argv.slice(2) : ['light', 'dark'];
const previous = await readFile(`${output}/summary.json`, 'utf8').then(JSON.parse).catch(() => []);
const results = previous.filter(row => !themes.includes(row.theme));
let browser;
try {
  await delay(1000);
  if (server.exitCode !== null) throw new Error('HTTP server could not start on port 8123');
  await mkdir(output, { recursive: true });
  for (const theme of themes) {
    browser = await chromium.launch({ executablePath, headless: true, args: ['--remote-debugging-port=9242'] });
    const auditBrowser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9242' });
    for (const name of ['index', 'book', 'loan']) {
      // Set the preference on the exact page Lighthouse will audit, not a probe tab.
      const auditPage = await auditBrowser.newPage();
      await auditPage.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
      const run = await lighthouse(`http://127.0.0.1:8123/${name}.html`, {
        port: 9242, onlyCategories: ['performance', 'accessibility'], output: ['json', 'html'], logLevel: 'error',
      }, undefined, auditPage);
      const themeVerification = await auditPage.evaluate(() => ({
        dark: matchMedia('(prefers-color-scheme: dark)').matches,
        scheme: getComputedStyle(document.documentElement).colorScheme,
        background: getComputedStyle(document.documentElement).backgroundColor,
      }));
      if (themeVerification.scheme !== theme || themeVerification.dark !== (theme === 'dark')) throw new Error(`Audited page has wrong theme: ${JSON.stringify(themeVerification)}`);
      await writeFile(`${output}/${name}-${theme}.json`, run.report[0]);
      await writeFile(`${output}/${name}-${theme}.html`, run.report[1]);
      const { lhr } = run;
      if (lhr.runtimeError) throw new Error(JSON.stringify(lhr.runtimeError));
      const row = { name, theme, themeVerification, measuredAt: lhr.fetchTime, browser: lhr.environment.hostUserAgent, lighthouseVersion: lhr.lighthouseVersion,
        performance: Math.round(lhr.categories.performance.score * 100), accessibility: Math.round(lhr.categories.accessibility.score * 100),
        warnings: lhr.runWarnings,
        failedAudits: Object.values(lhr.audits).filter(a => a.score !== null && a.score < 1).map(a => ({ id: a.id, title: a.title, score: a.score, displayValue: a.displayValue })),
      };
      results.push(row);
      console.log(JSON.stringify(row));
      await writeFile(`${output}/summary.json`, JSON.stringify(results, null, 2));
      await auditPage.close();
    }
    await auditBrowser.disconnect();
    await browser.close();
    browser = null;
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}
