import { mkdir } from 'node:fs/promises';
import { chromium } from '../.audit-tools/node_modules/playwright/index.mjs';
import { books, genres } from '../data/books.js';

// Original typographic study covers, not scans or reproductions of published editions.
const palette = {
  'science-fiction': ['#153e40', '#d1f0e8'], novel: ['#622d42', '#ffe7ed'],
  'non-fiction': ['#244b35', '#e3f1bf'], history: ['#433352', '#f1e5f7'],
  programming: ['#283e59', '#d8e8fa'],
};
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 540 }, deviceScaleFactor: 1 });
  await page.setContent('<!doctype html><html lang="ru"><meta charset="utf-8"><title>BookNest cover</title><style>*{box-sizing:border-box}body{margin:0;height:540px;padding:30px 28px;display:flex;flex-direction:column;gap:24px;border-left:12px solid #ffffff33;font-family:Georgia,serif}p,h1{margin:0;overflow-wrap:anywhere}header{font:14px system-ui;border-bottom:1px solid currentColor;padding-bottom:16px}h1{font-size:34px;line-height:1.15}section{flex:1;display:flex;flex-direction:column;justify-content:center;gap:24px}footer{font:13px system-ui;border-top:1px solid currentColor;padding-top:16px}</style><header>BOOKNEST</header><section><p></p><h1></h1></section><footer></footer></html>');
  await mkdir('assets/covers', { recursive: true });
  for (const book of books) {
    await page.evaluate(({ book, genre, colors }) => {
      document.body.style.background = colors[0];
      document.body.style.color = colors[1];
      document.querySelector('h1').textContent = book.title;
      document.querySelector('p').textContent = book.author;
      document.querySelector('footer').textContent = genre;
    }, { book, genre: genres[book.genre], colors: palette[book.genre] });
    if (await page.evaluate(() => document.documentElement.scrollHeight > 540)) throw new Error(`Cover overflow: ${book.id}`);
    await page.screenshot({ path: `assets/covers/${book.id}.png` });
  }
  console.log('Generated 40 original local PNG study covers.');
} finally { await browser.close(); }
