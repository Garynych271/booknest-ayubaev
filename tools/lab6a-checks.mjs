import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const out = 'docs/lab6a/checks';
await mkdir(out, { recursive: true });
const commands = [
  ['typecheck', 'npm run typecheck'],
  ['eslint', 'npm run lint'],
  ['unit-tests', 'npm test'],
  ['build', 'npm run build'],
];
const summary = { measuredAt: new Date().toISOString(), node: process.version, commands: [], staticChecks: {} };

for (const [name, command] of commands) {
  const run = spawnSync('cmd.exe', ['/d', '/s', '/c', command], { cwd: 'booknest-web', encoding: 'utf8', windowsHide: true });
  await writeFile(`${out}/${name}.txt`, `${run.stdout}${run.stderr}`.trimEnd());
  summary.commands.push({ name, command, exitCode: run.status });
  console.log(`${name}: ${run.status}`);
}

const catalog = await readFile('booknest-web/src/components/CatalogPage.tsx', 'utf8');
const details = await readFile('booknest-web/src/components/BookDetails.tsx', 'utf8');
const contexts = await Promise.all(['theme.ts', 'ThemeProvider.tsx', 'auth.ts', 'AuthProvider.tsx']
  .map(file => readFile(`booknest-web/src/contexts/${file}`, 'utf8')));
summary.staticChecks = {
  componentsHaveNoHttpCalls: !/fetch\(|searchBooks|getBook|AbortController/.test(`${catalog}\n${details}`),
  contextsHaveNoPageData: !/SearchResult|Filters|wishlist|CatalogPage|BookDetail/.test(contexts.join('\n')),
  lab6bDependenciesAbsent: !/react-router|react-hook-form|zod/.test(await readFile('booknest-web/package.json', 'utf8')),
};
await writeFile(`${out}/summary.json`, JSON.stringify(summary, null, 2));

if (summary.commands.some(item => item.exitCode !== 0) || Object.values(summary.staticChecks).includes(false)) process.exitCode = 1;
