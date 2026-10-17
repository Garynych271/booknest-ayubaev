import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { searchParams } from '../api/books.js';
import { BASE_URL } from '../api/client.js';

await mkdir('docs/lab4/network', { recursive: true });
const urls = [
  ['search', BASE_URL + '/search.json?' + new URLSearchParams(searchParams({ query: 'Solaris' }, 1))],
  ['work', BASE_URL + '/works/OL109524W.json'],
  ['missing', BASE_URL + '/works/OL999999999999999W.json'],
];
const results = [];
for (const [name, url] of urls) {
  const measuredAt = new Date().toISOString();
  const run = spawnSync('curl.exe', ['-i', '-sS', '--max-time', '35', url], { encoding: 'utf8', windowsHide: true });
  await writeFile('docs/lab4/network/' + name + '.http.txt', run.stdout);
  results.push({ name, url, measuredAt, exitCode: run.status, stderr: run.stderr, statusLine: run.stdout.split('\n')[0].trim() });
  console.log(results.at(-1));
}
await writeFile('docs/lab4/network/curl-summary.json', JSON.stringify(results, null, 2));
await writeFile('docs/lab4/api-collection.json', JSON.stringify({
  info: { name: 'BookNest Lab 4 - Open Library', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'Real public GET requests. No credentials. Imported GUI execution is a separate manual step; evidence here uses curl.exe.' },
  item: urls.map(([name, url]) => ({ name, request: { method: 'GET', header: [{ key: 'Accept', value: 'application/json' }], url } })),
}, null, 2));
