import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = path.join(root, 'server');
const botDir = path.join(root, 'bot');

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
const botSrcDir = path.join(root, 'bot', 'src');

// Server and shared tests run from the server package; the bot harness is a
// separate workspace package that may not import server internals, so its tests
// run from its own package with its own resolver.
const suites = [
  {
    pkg: '@mmo-idle/server',
    cwd: serverDir,
    files: [
      ...fs.readdirSync(serverTestDir).map((name) => path.join(serverTestDir, name)),
      ...walk(sharedSrcDir),
    ],
  },
  {
    pkg: '@mmo-idle/bot',
    cwd: botDir,
    files: fs.existsSync(botSrcDir) ? walk(botSrcDir) : [],
  },
];

const files = suites.flatMap((suite) =>
  suite.files.filter(isTestFile).sort().map((file) => ({ suite, file })),
);

if (files.length === 0) {
  console.error('No test files found.');
  process.exit(1);
}

const results = [];

for (const { suite, file } of files) {
  const relFromPkg = path.relative(suite.cwd, file).split(path.sep).join('/');
  const label = path.relative(root, file).split(path.sep).join('/');
  console.log(`\n=== ${label} ===`);
  const res = spawnSync(
    'pnpm',
    ['--filter', suite.pkg, 'exec', 'tsx', '--conditions=development', relFromPkg],
    { cwd: root, stdio: 'inherit', shell: true },
  );
  const passed = res.status === 0;
  results.push({ file: label, passed });
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
