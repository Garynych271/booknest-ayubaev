import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { _electron as electron, chromium } from '../.audit-tools/node_modules/playwright/index.mjs';

const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const devtoolsElectron = resolve('.audit-tools/react-devtools/node_modules/electron/dist/electron.exe');
const devtoolsApp = resolve('.audit-tools/react-devtools/node_modules/react-devtools/app.js');
const appRoot = resolve('booknest-web');
const output = resolve('docs/practices/evidence');
const networkBase = 'http://127.0.0.1:5187';
const profilerBase = 'http://127.0.0.1:5188';
const input = ['So', 'Sol', 'Sola', 'Solar', 'Solari', 'Solaris'];
const evidenceFile = resolve(output, 'practice-7-evidence.json');
const stage = process.env.PRACTICE7_STAGE || 'all';
let report = {
  measuredAt: new Date().toISOString(),
  browser: '',
  baseline: null,
  debounced: null,
  profiler: { connected: false, recorded: false, browserHook: false, injectedScripts: [], controls: [], summary: [] },
};

await mkdir(output, { recursive: true });
if (stage === 'profiler') {
  try { report = JSON.parse(await readFile(evidenceFile, 'utf8')); } catch { /* no earlier Network evidence */ }
}
const networkServer = stage === 'all' ? spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 5187 --strictPort'], {
  cwd: appRoot,
  windowsHide: true,
  stdio: 'ignore',
}) : null;
const profilerServer = spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 5188 --strictPort'], {
  cwd: appRoot,
  env: { ...process.env, BOOKNEST_REACT_DEVTOOLS: '1' },
  windowsHide: true,
  stdio: 'ignore',
});
let app;
let profilerBrowser;

async function waitServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(url)).ok) return; } catch { /* Vite is starting */ }
    await delay(200);
  }
  throw new Error(`Vite did not start at ${url}`);
}

function remoteTarget(root, sessionId) {
  let nextId = 0;
  return (method, params = {}) => new Promise(async (resolveResult, reject) => {
    const id = ++nextId;
    const receive = event => {
      if (event.sessionId !== sessionId) return;
      const message = JSON.parse(event.message);
      if (message.id !== id) return;
      root.off('Target.receivedMessageFromTarget', receive);
      if (message.error) reject(new Error(message.error.message));
      else resolveResult(message.result);
    };
    root.on('Target.receivedMessageFromTarget', receive);
    await root.send('Target.sendMessageToTarget', {
      sessionId,
      message: JSON.stringify({ id, method, params }),
    });
  });
}

async function attachDevtools(browser, pageTitle) {
  const root = await browser.newBrowserCDPSession();
  let target;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const targets = await root.send('Target.getTargets');
    target = targets.targetInfos.find(item => item.url.startsWith('devtools:'));
    if (target) break;
    await delay(100);
  }
  assert.ok(target, `DevTools target for ${pageTitle} was not found`);
  const { sessionId } = await root.send('Target.attachToTarget', { targetId: target.targetId, flatten: false });
  const send = remoteTarget(root, sessionId);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'P', code: 'KeyP', windowsVirtualKeyCode: 80, modifiers: 10 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'P', code: 'KeyP', windowsVirtualKeyCode: 80, modifiers: 10 });
  await delay(250);
  await send('Input.insertText', { text: 'Show Network panel' });
  await delay(250);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await delay(700);
  return { root, send };
}

async function captureDevtools(send, file) {
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(resolve(output, file), Buffer.from(result.data, 'base64'));
}

async function networkScenario(kind) {
  const browser = await chromium.launch({
    executablePath: edge,
    headless: false,
    args: ['--auto-open-devtools-for-tabs', '--window-size=1600,1000'],
  });
  report.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await context.newPage();
  const title = kind === 'baseline' ? 'Network baseline' : 'Network debounce';
  await page.goto(`${networkBase}/books`);
  await page.evaluate(value => { document.title = value; localStorage.clear(); }, title);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  const requests = [];
  cdp.on('Network.requestWillBeSent', event => {
    if (event.request.url.includes('openlibrary.org/search.json')) requests.push({ url: event.request.url, at: event.timestamp });
  });
  const devtools = await attachDevtools(browser, title);

  if (kind === 'baseline') {
    await page.evaluate(async values => {
      for (const query of values) {
        const url = new URL('https://openlibrary.org/search.json');
        url.search = new URLSearchParams({ q: query, fields: 'key,title', limit: '1' }).toString();
        void fetch(url);
        await new Promise(resolveDelay => setTimeout(resolveDelay, 70));
      }
    }, input);
    await page.waitForTimeout(2500);
  } else {
    const search = page.locator('#search');
    await search.fill('');
    await search.pressSequentially('Solaris', { delay: 70 });
    await page.locator('[data-state="success"]').waitFor({ timeout: 30000 });
  }

  const file = kind === 'baseline' ? 'practice-7-network-before.png' : 'practice-7-network-after.png';
  await captureDevtools(devtools.send, file);
  const result = { input, requestCount: requests.length, requests, screenshot: file };
  await browser.close();
  return result;
}

async function profilerScenario() {
  const env = { ...process.env, REACT_DEVTOOLS_PORT: '8097' };
  delete env.ELECTRON_RUN_AS_NODE;
  app = await electron.launch({ executablePath: devtoolsElectron, args: [devtoolsApp, appRoot], env });
  const devtools = await app.firstWindow();
  profilerBrowser = await chromium.launch({ executablePath: edge, headless: true });
  const page = await profilerBrowser.newPage();
  await page.goto(`${profilerBase}/books`);
  report.profiler.browserHook = await page.evaluate(() => Boolean(window.__REACT_DEVTOOLS_GLOBAL_HOOK__));
  report.profiler.injectedScripts = await page.locator('script').evaluateAll(scripts => scripts.map(script => script.src).filter(Boolean));
  await page.locator('#search').fill('Solaris');
  await page.locator('[data-state="success"]').waitFor({ timeout: 30000 });
  await devtools.getByText('App', { exact: true }).first().waitFor({ timeout: 60000 });
  report.profiler.connected = true;
  await devtools.getByText('Profiler', { exact: true }).click();
  await delay(500);
  report.profiler.controls = await devtools.locator('button').evaluateAll(buttons => buttons.map(button => ({
    title: button.title,
    ariaLabel: button.getAttribute('aria-label'),
    text: button.textContent?.trim(),
  })).filter(item => item.title || item.ariaLabel || item.text));
  const startButton = devtools.getByRole('button', { name: 'Start recording' });
  await startButton.waitFor();
  await startButton.click();
  await page.locator('#search').fill('Dune');
  await page.waitForTimeout(400);
  await page.locator('[data-state="success"]').waitFor({ timeout: 30000 });
  await page.getByRole('switch', { name: 'Тёмная тема' }).check();
  await delay(400);
  const stopButton = devtools.getByRole('button', { name: 'Stop recording' });
  await stopButton.click();
  await delay(1200);
  report.profiler.recorded = true;
  report.profiler.summary = (await devtools.locator('body').innerText()).split('\n').map(value => value.trim()).filter(Boolean).slice(0, 160);
  await devtools.screenshot({ path: resolve(output, 'practice-7-profiler.png') });
}

try {
  await waitServer(profilerBase);
  if (stage === 'all') {
    await waitServer(networkBase);
    report.baseline = await networkScenario('baseline');
    report.debounced = await networkScenario('debounced');
    assert.equal(report.baseline.requestCount, input.length);
    assert.equal(report.debounced.requestCount, 1);
  }
  await profilerScenario();
} finally {
  if (profilerBrowser) await profilerBrowser.close();
  if (app) await app.close();
  if (networkServer) networkServer.kill();
  profilerServer.kill();
  await writeFile(evidenceFile, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify({ baseline: report.baseline?.requestCount, debounced: report.debounced?.requestCount, profiler: report.profiler }));
