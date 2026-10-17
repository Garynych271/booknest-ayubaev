import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('docs/lab3', { recursive: true });
const commands = [
  { name: 'unit-tests', args: ['--test', 'tests/books.test.js', 'tests/storage.test.js'] },
  { name: 'eslint', args: ['node_modules/eslint/bin/eslint.js', 'main.js', 'storage.js', 'data', 'lib', 'ui', 'tests', '--max-warnings=0', '--format=json'] },
];
const results = [];
for (const command of commands) {
  const measuredAt = new Date().toISOString();
  const processResult = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, command.args, { windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', exitCode => resolve({ exitCode, stdout, stderr }));
  });
  await writeFile(`docs/lab3/${command.name}.${command.name === 'eslint' ? 'json' : 'txt'}`, processResult.stdout);
  results.push({ command: `node ${command.args.join(' ')}`, measuredAt, exitCode: processResult.exitCode, stderr: processResult.stderr });
  console.log(`${command.name}: exit ${processResult.exitCode}`);
  if (processResult.exitCode !== 0) process.exitCode = 1;
}
await writeFile('docs/lab3/check-results.json', JSON.stringify(results, null, 2));
