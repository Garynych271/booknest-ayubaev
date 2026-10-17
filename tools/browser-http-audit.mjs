import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const edgePath =
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const targetUrl =
  process.argv[2] ??
  "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview";
const outputDir = process.argv[3] ?? "docs/practice1/evidence";
let port = 9223;

function send(ws, id, method, params = {}) {
  ws.send(JSON.stringify({ id, method, params }));
}

async function waitForJson(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {
      // Browser is still starting.
    }
    await delay(250);
  }
  throw new Error(`No response from ${url}`);
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const events = [];

  ws.addEventListener("message", (message) => {
    const payload = JSON.parse(message.data);
    if (payload.id && pending.has(payload.id)) {
      pending.get(payload.id)(payload);
      pending.delete(payload.id);
      return;
    }
    if (payload.method) events.push(payload);
  });

  let id = 1;
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve({
        events,
        call(method, params = {}) {
          const current = id;
          id += 1;
          send(ws, current, method, params);
          return new Promise((res) => pending.set(current, res));
        },
        close() {
          ws.close();
        },
      });
    });
    ws.addEventListener("error", reject);
  });
}

async function createTarget(url) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, {
    method: "PUT",
  });
  if (!response.ok) throw new Error(`Target creation failed: ${response.status}`);
  return await response.json();
}

async function runScenario(label, url, networkConditions = null) {
  const target = await createTarget("about:blank");
  const client = await connect(target.webSocketDebuggerUrl);
  const startedAt = Date.now();
  const requests = new Map();
  let documentRequestId = null;
  let loadTimeMs = null;
  let domContentTimeMs = null;
  let navigationError = null;

  await client.call("Network.enable");
  await client.call("Network.setCacheDisabled", { cacheDisabled: true });
  await client.call("Page.enable");

  if (networkConditions) {
    await client.call("Network.emulateNetworkConditions", networkConditions);
  }

  const waitForLoad = new Promise((resolve) => {
    const timer = setTimeout(resolve, 45000);
    const seen = setInterval(() => {
      for (const event of client.events) {
        if (event.method === "Page.domContentEventFired" && domContentTimeMs === null) {
          domContentTimeMs = Date.now() - startedAt;
        }
        if (event.method === "Page.loadEventFired") {
          loadTimeMs = Date.now() - startedAt;
          clearInterval(seen);
          clearTimeout(timer);
          resolve();
          return;
        }
        if (event.method === "Page.frameStoppedLoading") {
          clearInterval(seen);
          clearTimeout(timer);
          resolve();
          return;
        }
      }
    }, 100);
  });

  const navigate = await client.call("Page.navigate", { url });
  if (navigate.result?.errorText) navigationError = navigate.result.errorText;
  await waitForLoad;
  await delay(3000);

  for (const event of client.events) {
    if (event.method === "Network.requestWillBeSent") {
      const { requestId, request, type, timestamp } = event.params;
      requests.set(requestId, {
        requestId,
        url: request.url,
        method: request.method,
        type,
        requestHeaders: request.headers,
        startedAt: timestamp,
        status: null,
        mimeType: null,
        responseHeaders: null,
        encodedDataLength: 0,
        failed: null,
      });
      if (type === "Document" && !documentRequestId) documentRequestId = requestId;
    }
    if (event.method === "Network.responseReceived") {
      const item = requests.get(event.params.requestId);
      if (item) {
        item.status = event.params.response.status;
        item.mimeType = event.params.response.mimeType;
        item.responseHeaders = event.params.response.headers;
        item.responseUrl = event.params.response.url;
      }
    }
    if (event.method === "Network.loadingFinished") {
      const item = requests.get(event.params.requestId);
      if (item) item.encodedDataLength = event.params.encodedDataLength;
    }
    if (event.method === "Network.loadingFailed") {
      const item = requests.get(event.params.requestId);
      if (item) item.failed = event.params.errorText;
    }
  }

  const screenshot = await client.call("Page.captureScreenshot", { format: "png" }).catch(() => null);
  const rows = Array.from(requests.values());
  const byType = rows.reduce((acc, row) => {
    acc[row.type] = (acc[row.type] ?? 0) + 1;
    return acc;
  }, {});
  const transferredBytes = rows.reduce((sum, row) => sum + (row.encodedDataLength ?? 0), 0);

  await mkdir(outputDir, { recursive: true });
  if (screenshot?.result?.data) {
    await writeFile(`${outputDir}/${label}.png`, Buffer.from(screenshot.result.data, "base64"));
  }
  const result = {
    label,
    url,
    measuredAt: new Date().toISOString(),
    navigationError,
    requestCount: rows.length,
    transferredBytes,
    loadTimeMs,
    domContentTimeMs,
    byType,
    documentRequest: rows.find((row) => row.requestId === documentRequestId) ?? null,
    requests: rows,
    screenshot: screenshot?.result?.data ? `${label}.png` : null,
  };
  await writeFile(`${outputDir}/${label}.json`, JSON.stringify(result, null, 2), "utf8");
  await client.call("Page.close").catch(() => null);
  client.close();
  return result;
}

await mkdir(outputDir, { recursive: true });

async function withBrowser(profileName, callback) {
  port += 1;
  const browser = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--disable-default-apps",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${process.cwd()}\\.${profileName}`,
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });

  try {
    await waitForJson(`http://127.0.0.1:${port}/json/version`);
    return await callback();
  } finally {
    browser.kill();
    await delay(500);
  }
}

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
} catch {
  // No browser is expected on the initial port before we launch per scenario.
}

const normal = await withBrowser("edge-audit-normal", () => runScenario("normal", targetUrl));
const slow4g = await withBrowser("edge-audit-slow4g", () => runScenario("slow-4g", `${targetUrl}?audit=slow4g`, {
    offline: false,
    latency: 400,
    downloadThroughput: (400 * 1024) / 8,
    uploadThroughput: (400 * 1024) / 8,
    connectionType: "cellular4g",
  }));
const offline = await withBrowser("edge-audit-offline", () => runScenario("offline", `${targetUrl}?audit=offline`, {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
    connectionType: "none",
  }));

const summary = { normal, slow4g, offline };
await writeFile(`${outputDir}/summary.json`, JSON.stringify(summary, null, 2), "utf8");
console.log(JSON.stringify({
  normal: {
    requestCount: normal.requestCount,
    transferredBytes: normal.transferredBytes,
    loadTimeMs: normal.loadTimeMs,
    domContentTimeMs: normal.domContentTimeMs,
    byType: normal.byType,
    documentStatus: normal.documentRequest?.status,
  },
  slow4g: {
    requestCount: slow4g.requestCount,
    transferredBytes: slow4g.transferredBytes,
    loadTimeMs: slow4g.loadTimeMs,
    domContentTimeMs: slow4g.domContentTimeMs,
    byType: slow4g.byType,
    documentStatus: slow4g.documentRequest?.status,
  },
  offline: {
    requestCount: offline.requestCount,
    transferredBytes: offline.transferredBytes,
    loadTimeMs: offline.loadTimeMs,
    navigationError: offline.navigationError,
    documentFailure: offline.documentRequest?.failed,
  },
}, null, 2));
