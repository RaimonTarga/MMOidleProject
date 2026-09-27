import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
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

// Historical packet validators stay addressable for exact-checkout forensic
// runs, but their frozen source identities were intentionally superseded by
// later balance adoptions. Keep them out of the current regression suite so a
// known-invalid packet does not masquerade as a live product regression.
const ARCHIVED_SERVER_TESTS = new Set([
  'boss2Matrix.test.ts',
  'boss3Cleanse.test.ts',
  'boss3Matrix.test.ts',
  'boss4Matrix.test.ts',
  'boss4Pressure.test.ts',
  'boss5Matrix.test.ts',
  'boss5Pressure.test.ts',
  'durability10.test.ts',
  'durability11.test.ts',
]);

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
    archivedFiles: ARCHIVED_SERVER_TESTS,
  },
  {
    pkg: '@mmo-idle/bot',
    cwd: botDir,
    files: fs.existsSync(botSrcDir) ? walk(botSrcDir) : [],
  },
];

// `pnpm test -- boss summoner` runs only files whose path contains a filter.
const filters = process.argv.slice(2).filter((arg) => arg !== '--');

const files = suites.flatMap((suite) =>
  suite.files
    .filter(isTestFile)
    .filter((file) => !suite.archivedFiles?.has(path.basename(file)))
    .sort()
    .map((file) => ({ suite, file })),
).filter(({ file }) => filters.length === 0
  || filters.some((f) => path.relative(root, file).split(path.sep).join('/').includes(f)));

if (files.length === 0) {
  console.error('No test files found.');
  process.exit(1);
}

// Per-file startup dominated the old serial `pnpm exec tsx` loop (~6 s a file,
// ~30 min in all): the tsx CLI spawns a second node. Load tsx in-process and
// run files in parallel instead; every test builds its own World and temp dirs.
const jobs = Math.max(1, Number(process.env.TEST_JOBS) || Math.floor(os.cpus().length / 2));

function runFile({ suite, file }) {
  const relFromPkg = path.relative(suite.cwd, file).split(path.sep).join('/');
  const label = path.relative(root, file).split(path.sep).join('/');
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['--conditions=development', '--import', 'tsx', relFromPkg],
      { cwd: suite.cwd },
    );
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('close', (code) => {
      const result = { file: label, passed: code === 0, ms: Date.now() - started };
      console.log(`${result.passed ? 'PASS' : 'FAIL'}  ${label}  (${(result.ms / 1000).toFixed(1)}s)`);
      if (!result.passed) console.log(output.trimEnd().split('\n').map((l) => `      ${l}`).join('\n'));
      resolve(result);
    });
  });
}

console.log(`Running ${files.length} test files, ${jobs} at a time (TEST_JOBS to change).\n`);
const suiteStarted = Date.now();
const queue = [...files];
const results = [];
await Promise.all(Array.from({ length: jobs }, async () => {
  while (queue.length > 0) results.push(await runFile(queue.shift()));
}));
results.sort((a, b) => a.file.localeCompare(b.file));

const failed = results.filter((r) => !r.passed);
console.log('\n=== Slowest files ===');
for (const r of [...results].sort((a, b) => b.ms - a.ms).slice(0, 8)) {
  console.log(`${(r.ms / 1000).toFixed(1).padStart(6)}s  ${r.file}`);
}
if (failed.length > 0) {
  console.log('\n=== Failed ===');
  for (const { file } of failed) console.log(`FAIL  ${file}`);
}
console.log(`\n${results.length - failed.length}/${results.length} passed in ${((Date.now() - suiteStarted) / 1000).toFixed(0)}s`);

if (failed.length > 0) {
  process.exit(1);
}
