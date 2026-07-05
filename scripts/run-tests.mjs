import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = path.join(root, 'server');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function isTestFile(filePath) {
  const base = path.basename(filePath);
  return base.endsWith('.test.ts') && !base.startsWith('_');
}

const serverTestDir = path.join(root, 'server', 'test');
const sharedSrcDir = path.join(root, 'shared', 'src');

const files = [
  ...fs.readdirSync(serverTestDir).map((name) => path.join(serverTestDir, name)),
  ...walk(sharedSrcDir),
]
  .filter(isTestFile)
  .sort();

if (files.length === 0) {
  console.error('No test files found.');
  process.exit(1);
}

const results = [];

for (const file of files) {
  const relFromServer = path.relative(serverDir, file).split(path.sep).join('/');
  console.log(`\n=== ${relFromServer} ===`);
  const res = spawnSync(
    'pnpm',
    ['--filter', '@mmo-idle/server', 'exec', 'tsx', '--conditions=development', relFromServer],
    { cwd: root, stdio: 'inherit', shell: true },
  );
  const passed = res.status === 0;
  results.push({ file: relFromServer, passed });
}

console.log('\n=== Test Summary ===');
for (const { file, passed } of results) {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${file}`);
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} passed`);

if (failed.length > 0) {
  process.exit(1);
}
