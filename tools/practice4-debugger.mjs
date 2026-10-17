import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';

const temporaryRoot = resolve('.audit-tools/practice4-snapshot');
const output = resolve('docs/practices/evidence');
const origin = 'http://127.0.0.1:8144';
const currentOrigin = 'http://127.0.0.1:8145';
const sourceRef = 'lab-3/js-app';

await mkdir(output, { recursive: true });

const source = await readFile(resolve(temporaryRoot, 'main.js'), 'utf8');
const breakpointLine = source.split(/\r?\n/).findIndex(line => line.includes("if (!button || !view.main.contains(button)"));
assert.ok(breakpointLine >= 0, 'Delegated handler line was not found');

const server = spawn(process.execPath, ['tools/serve.mjs'], {
  cwd: temporaryRoot,
  env: { ...process.env, PORT: '8144' },
  windowsHide: true,
  stdio: 'ignore',
});
let browser;
let currentServer;
const evidence = {
  measuredAt: new Date().toISOString(),
  sourceRef,
  sourceCommit: process.env.PRACTICE4_COMMIT || 'not-provided',
  browser: '',
  breakpoint: { url: `${origin}/main.js`, line: breakpointLine + 1 },
  paused: false,
  scope: [],
  evaluation: null,
  behavior: null,
  currentRenderBooks: null,
};

async function waitServer(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(url)).ok) return; } catch { /* server is starting */ }
    await delay(100);
  }
  throw new Error('Historical practice 4 server did not start');
}

try {
  assert.notEqual(evidence.sourceCommit, 'not-provided', 'Set PRACTICE4_COMMIT to the exported commit hash');
  await waitServer(origin);
  browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
  });
  evidence.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Debugger.enable');
  await page.goto(origin);
  await cdp.send('Debugger.setBreakpointByUrl', {
    url: `${origin}/main.js`,
    lineNumber: breakpointLine,
  });

  const button = page.locator('[data-action="toggle"][data-id="b01"]');
  await button.evaluate(element => {
    const nested = document.createElement('span');
    nested.dataset.debugTarget = 'nested-label';
    nested.textContent = 'Solaris: вложенная цель события';
    element.replaceChildren(nested);
  });

  const paused = new Promise(resolvePaused => cdp.once('Debugger.paused', resolvePaused));
  const click = page.locator('[data-debug-target="nested-label"]').click();
  const event = await paused;
  evidence.paused = true;
  const frame = event.callFrames[0];
  evidence.scope = frame.scopeChain.map(item => ({
    type: item.type,
    name: item.name || null,
    description: item.object.description || null,
  }));
  const evaluated = await cdp.send('Debugger.evaluateOnCallFrame', {
    callFrameId: frame.callFrameId,
    returnByValue: true,
    expression: `({
      targetTag: event.target.tagName,
      targetText: event.target.textContent,
      targetMarker: event.target.dataset.debugTarget,
      currentTargetTag: event.currentTarget.tagName,
      closestAction: button.dataset.action,
      closestBookId: button.dataset.id,
      sameNode: event.target === button
    })`,
  });
  evidence.evaluation = evaluated.result.value;
  await cdp.send('Debugger.resume');
  await click;

  evidence.behavior = {
    ariaPressed: await button.getAttribute('aria-pressed'),
    wishlistCount: await page.locator('[data-wishlist-count]').textContent(),
  };
  assert.equal(evidence.evaluation.targetTag, 'SPAN');
  assert.equal(evidence.evaluation.currentTargetTag, 'MAIN');
  assert.equal(evidence.evaluation.closestAction, 'toggle');
  assert.equal(evidence.evaluation.sameNode, false);
  assert.equal(evidence.behavior.ariaPressed, 'true');
  assert.equal(evidence.behavior.wishlistCount, '1');
  await page.screenshot({ path: resolve(output, 'practice-4-delegation.png'), fullPage: true });
  await context.close();

  currentServer = spawn(process.execPath, ['tools/serve.mjs'], {
    cwd: resolve('.'),
    env: { ...process.env, PORT: '8145' },
    windowsHide: true,
    stdio: 'ignore',
  });
  await waitServer(currentOrigin);
  const currentContext = await browser.newContext();
  await currentContext.route('https://openlibrary.org/**', route => route.fulfill({ json: {
    numFound: 1,
    docs: [{ key: '/works/OL109524W', title: 'Solaris', author_name: ['Станислав Лем'], first_publish_year: 1961, subject: ['Science fiction'], ebook_access: 'public', ratings_average: 4.2 }],
  } }));
  const currentPage = await currentContext.newPage();
  await currentPage.goto(currentOrigin);
  const exported = await currentPage.evaluate(async () => typeof (await import('./ui/render.js')).renderBooks === 'function');
  await currentPage.locator('#search').fill('Solaris');
  await currentPage.locator('[data-book-id="OL109524W"]').waitFor();
  evidence.currentRenderBooks = {
    exported,
    cardCount: await currentPage.locator('[data-book-id]').count(),
    title: await currentPage.locator('[data-title]').textContent(),
  };
  assert.deepEqual(evidence.currentRenderBooks, { exported: true, cardCount: 1, title: 'Solaris' });
  await currentContext.close();
} finally {
  if (browser) await browser.close();
  server.kill();
  if (currentServer) currentServer.kill();
  await writeFile(resolve(output, 'practice-4-debugger.json'), JSON.stringify(evidence, null, 2));
}

console.log(JSON.stringify({ paused: evidence.paused, evaluation: evidence.evaluation, behavior: evidence.behavior, currentRenderBooks: evidence.currentRenderBooks }));
