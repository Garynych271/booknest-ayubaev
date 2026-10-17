import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { _electron as electron, chromium } from '../.audit-tools/node_modules/playwright/index.mjs';

const base = 'http://127.0.0.1:5177/';
const env = { ...process.env, BOOKNEST_REACT_DEVTOOLS: '1' };
const electronEnv = { ...process.env, REACT_DEVTOOLS_PORT: '8097' };
delete electronEnv.ELECTRON_RUN_AS_NODE;
const server = spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 5177 --strictPort'], { cwd: 'booknest-web', env, windowsHide: true, stdio: 'ignore' });
let app;
let browser;
const result = { measuredAt: new Date().toISOString(), connected: false, screenshot: null, treeLabels: [] };
async function waitServer() {
  for (let index = 0; index < 30; index += 1) {
    try { if ((await fetch(base)).ok) return; } catch { /* server is starting */ }
    await delay(250);
  }
  throw new Error('Vite did not start');
}
try {
  await mkdir('docs/lab5/screenshots', { recursive: true });
  app = await electron.launch({
    executablePath: 'C:/Users/User/Desktop/booknest/booknest-ayubaev/.audit-tools/react-devtools/node_modules/electron/dist/electron.exe',
    args: ['C:/Users/User/Desktop/booknest/booknest-ayubaev/.audit-tools/react-devtools/node_modules/react-devtools/app.js', 'C:/Users/User/Desktop/booknest/booknest-ayubaev/booknest-web'],
    env: electronEnv,
  });
  const devtools = await app.firstWindow();
  await waitServer();
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage();
  await page.goto(base);
  await page.locator('#search').fill('Solaris');
  await page.waitForSelector('[data-state="success"]');
  await devtools.getByText('App', { exact: true }).first().waitFor({ timeout: 30000 });
  result.connected = true;
  result.treeLabels = (await devtools.locator('body').innerText()).split('\n').map(value => value.trim()).filter(Boolean).slice(0, 120);
  result.screenshot = 'screenshots/react-devtools-components.png';
  await devtools.screenshot({ path: `docs/lab5/${result.screenshot}` });
  console.log(JSON.stringify({ connected: result.connected, treeItems: result.treeLabels.length }));
} catch (error) {
  result.error = error.stack;
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile('docs/lab5/react-devtools.json', JSON.stringify(result, null, 2));
  if (browser) await browser.close();
  if (app) await app.close();
  server.kill();
}
