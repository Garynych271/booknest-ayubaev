import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('docs/lab5/checks', { recursive: true });
const commands = [
  ['typecheck', 'npm run typecheck'],
  ['eslint', 'npm run lint'],
  ['unit-tests', 'npm test'],
  ['build', 'npm run build'],
];
const summary = { measuredAt: new Date().toISOString(), node: process.version, commands: [] };
for (const [name, command] of commands) {
  const run = spawnSync('cmd.exe', ['/d', '/s', '/c', command], { cwd: 'booknest-web', encoding: 'utf8', windowsHide: true });
  const output = run.stdout + run.stderr;
  await writeFile(`docs/lab5/checks/${name}.txt`, output);
  summary.commands.push({ name, command, exitCode: run.status });
  console.log(`${name}: ${run.status}`);
}
const componentFiles = spawnSync('powershell.exe', ['-NoProfile', '-Command', "Get-ChildItem booknest-web/src/components -Filter *.tsx | ForEach-Object { [PSCustomObject]@{Name=$_.Name; Lines=(Get-Content $_.FullName).Count} } | ConvertTo-Json"], { encoding: 'utf8', windowsHide: true });
await writeFile('docs/lab5/checks/component-lines.json', componentFiles.stdout);
summary.componentLineCheckExitCode = componentFiles.status;
await writeFile('docs/lab5/checks/summary.json', JSON.stringify(summary, null, 2));
if (summary.commands.some(item => item.exitCode !== 0) || componentFiles.status !== 0) process.exitCode = 1;
