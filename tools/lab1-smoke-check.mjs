import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const edgePath =
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = 9235;
const baseUrl = process.argv[2] ?? "http://127.0.0.1:8080";
const outputDir = process.argv[3] ?? "docs/lab1/screenshots";
const pages = ["index.html", "book.html", "loan.html"];

async function waitForJson(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {
      // Browser still starting.
    }
    await delay(250);
  }
  throw new Error(`No response from ${url}`);
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const events = [];
  let id = 1;

  ws.addEventListener("message", (message) => {
    const payload = JSON.parse(message.data);
    if (payload.id && pending.has(payload.id)) {
      pending.get(payload.id)(payload);
      pending.delete(payload.id);
      return;
    }
    if (payload.method) events.push(payload);
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve({
        events,
        call(method, params = {}) {
          const current = id;
          id += 1;
          ws.send(JSON.stringify({ id: current, method, params }));
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

async function runPage(page) {
  const url = `${baseUrl}/${page}`;
  const target = await createTarget("about:blank");
  const client = await connect(target.webSocketDebuggerUrl);

  await client.call("Page.enable");
  await client.call("Runtime.enable");
  await client.call("Page.navigate", { url });

  await new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (client.events.some((event) => event.method === "Page.loadEventFired") || Date.now() - started > 10000) {
        clearInterval(timer);
        resolve();
      }
    }, 100);
  });
  await delay(500);

  const evalResult = await client.call("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const links = Array.from(document.querySelectorAll('a[href]')).map((a) => ({
        text: a.textContent.trim(),
        href: a.getAttribute('href'),
        absolute: a.href
      }));
      const forms = Array.from(document.forms).map((form) => ({
        action: form.getAttribute('action'),
        method: form.getAttribute('method'),
        checkValidity: form.checkValidity(),
        controls: Array.from(form.elements).map((el) => ({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type') || el.tagName.toLowerCase(),
          name: el.getAttribute('name'),
          id: el.id,
          required: el.required === true,
          hasLabel: el.id ? Boolean(document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) : false
        }))
      }));
      const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => ({
        level: Number(h.tagName.slice(1)),
        text: h.textContent.trim()
      }));
      const images = Array.from(document.images).map((img) => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        width: img.getAttribute('width'),
        height: img.getAttribute('height')
      }));
      return {
        title: document.title,
        h1Count: document.querySelectorAll('h1').length,
        links,
        forms,
        headings,
        images
      };
    })()`,
  });

  const focusOrder = [];
  for (let i = 0; i < 12; i += 1) {
    await client.call("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await client.call("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    const active = await client.call("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName?.toLowerCase() ?? null,
          id: el?.id ?? '',
          text: el?.textContent?.trim().slice(0, 80) ?? '',
          name: el?.getAttribute?.('name') ?? '',
          href: el?.getAttribute?.('href') ?? ''
        };
      })()`,
    });
    focusOrder.push(active.result.result.value);
  }

  const screenshot = await client.call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  await writeFile(`${outputDir}/${page.replace(".html", "")}.png`, Buffer.from(screenshot.result.data, "base64"));
  await client.call("Page.close").catch(() => null);
  client.close();
  return {
    page,
    url,
    measuredAt: new Date().toISOString(),
    ...evalResult.result.result.value,
    focusOrder,
    screenshot: `${page.replace(".html", "")}.png`,
  };
}

await mkdir(outputDir, { recursive: true });

const browser = spawn(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--disable-default-apps",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.cwd()}\\.edge-lab1-smoke`,
  "about:blank",
], { stdio: "ignore", windowsHide: true });

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const results = [];
  for (const page of pages) {
    results.push(await runPage(page));
  }
  await writeFile(`${outputDir}/smoke-results.json`, JSON.stringify(results, null, 2), "utf8");
  console.log(JSON.stringify(results.map((result) => ({
    page: result.page,
    h1Count: result.h1Count,
    forms: result.forms.map((form) => form.checkValidity),
    links: result.links.length,
    images: result.images.length,
    firstFocusItems: result.focusOrder.slice(0, 5),
  })), null, 2));
} finally {
  browser.kill();
}
