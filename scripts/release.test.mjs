import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const releaseSource = readFileSync(new URL('./release.mjs', import.meta.url), 'utf8');
const packages = ['package.json', ...['client', 'admin', 'server', 'shared', 'bot'].map(p => `${p}/package.json`)];

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mmo-release-test-'));
  const repo = path.join(root, 'repo');
  const remote = path.join(root, 'remote.git');
  mkdirSync(repo);
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '--bare', remote);
  git('init', '-b', 'develop');
  git('config', 'user.name', 'Release Test');
  git('config', 'user.email', 'release-test@example.invalid');
  const write = (file, data) => {
    mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    writeFileSync(path.join(repo, file), data);
  };
  for (const file of packages) write(file, JSON.stringify({ name: `test-${file.replaceAll('/', '-')}`, version: '0.4', private: true, packageManager: 'pnpm@8.15.1', scripts: { typecheck: 'node -e "process.exit(0)"' } }));
  write('scripts/release.mjs', releaseSource);
  write('updates/releases.json', JSON.stringify({ releases: [{ version: '0.4', markdownPath: 'v0.4/changelog.md' }] }));
  write('updates/v0.4/changelog.md', '# Previous release\n');
  git('add', '.'); git('commit', '-m', 'baseline');
  git('branch', 'master'); git('remote', 'add', 'origin', remote);
  git('push', 'origin', 'develop', 'master');
  const run = (...args) => spawnSync(process.execPath, ['scripts/release.mjs', ...args], { cwd: repo, encoding: 'utf8' });
  const prepare = () => {
    const result = run('prepare', '0.5');
    assert.equal(result.status, 0, result.stderr);
    write('updates/v0.5/changelog.md', '# v0.5\n\nConduit is available.\n');
  };
  return { repo, remote, git, write, run, prepare };
}

test('prepare rejects a duplicate before rewriting packages or notes', () => {
  const f = fixture(); f.prepare();
  const before = readFileSync(path.join(f.repo, 'package.json'), 'utf8');
  const notes = readFileSync(path.join(f.repo, 'updates/v0.5/changelog.md'), 'utf8');
  assert.notEqual(f.run('prepare', '0.5').status, 0);
  assert.equal(readFileSync(path.join(f.repo, 'package.json'), 'utf8'), before);
  assert.equal(readFileSync(path.join(f.repo, 'updates/v0.5/changelog.md'), 'utf8'), notes);
});

test('cut rejects placeholders and mismatched package metadata', () => {
  const f = fixture();
  assert.equal(f.run('prepare', '0.5').status, 0);
  assert.match(f.run('cut', '0.5', '--skip-checks').stderr, /Finish the release notes/);
  f.write('updates/v0.5/changelog.md', '# v0.5\n');
  f.write('bot/package.json', JSON.stringify({ version: '0.4' }));
  assert.match(f.run('cut', '0.5', '--skip-checks').stderr, /bot\/package.json does not match/);
  assert.equal(f.git('ls-remote', 'origin', 'refs/heads/release-v0.5'), '');
});

test('normal cut runs typecheck and publishes three identical refs', () => {
  const f = fixture(); f.prepare();
  const result = f.run('cut', '0.5');
  assert.equal(result.status, 0, result.stderr);
  const head = f.git('rev-parse', 'HEAD');
  const refs = f.git('ls-remote', 'origin', 'refs/heads/develop', 'refs/heads/master', 'refs/heads/release-v0.5').split('\n');
  assert.equal(refs.length, 3);
  for (const ref of refs) assert.equal(ref.split(/\s/)[0], head);
  assert.equal(f.git('status', '--porcelain'), '');
});

test('atomic rejection leaves remote refs and local release branches unchanged', () => {
  const f = fixture(); f.prepare();
  const before = f.git('ls-remote', 'origin');
  const localMaster = f.git('rev-parse', 'master');
  writeFileSync(path.join(f.remote, 'hooks/update'), '#!/bin/sh\nif [ "$1" = "refs/heads/master" ]; then exit 1; fi\nexit 0\n', { mode: 0o755 });
  const result = f.run('cut', '0.5', '--skip-checks');
  assert.notEqual(result.status, 0);
  assert.equal(f.git('ls-remote', 'origin'), before);
  assert.equal(f.git('rev-parse', 'master'), localMaster);
  assert.equal(f.git('branch', '--list', 'release-v0.5'), '');
});

test('freshly fetched divergent production blocks a cut', () => {
  const f = fixture();
  f.git('checkout', 'master'); f.write('production.txt', 'production-only fix');
  f.git('add', '.'); f.git('commit', '-m', 'production moved'); f.git('push', 'origin', 'master');
  f.git('checkout', 'develop'); f.prepare();
  const before = f.git('ls-remote', 'origin');
  const result = f.run('cut', '0.5', '--skip-checks');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cannot fast-forward/);
  assert.equal(f.git('ls-remote', 'origin'), before);
});
