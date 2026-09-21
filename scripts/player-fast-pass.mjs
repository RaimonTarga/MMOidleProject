import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'server/package.json'));
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const i = a.indexOf('='); assert(i > 2, 'Use --key=value'); return [a.slice(2, i), a.slice(i + 1)];
}));
assert(['prepare', 'verify', 'run'].includes(args.mode), '--mode=prepare|verify|run required');
assert(args.packet, '--packet=<directory> required');
const packet = resolve(args.packet), blocks = [2, 3, 4].flatMap(t => [`t${t}-farm`, `t${t}-boss`]);
const sha = data => createHash('sha256').update(data).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const write = (path, data) => writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim();
function identity(hitboxes) {
  // Content hashes include dirty and untracked source. HEAD alone is insufficient.
  const paths = git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0')
    .filter(p => /^(server\/(src|bench|scripts)\/|shared\/src\/|bot\/src\/)/.test(p)
      || /(^|\/)(package\.json|tsconfig[^/]*\.json)$/.test(p)
      || ['pnpm-lock.yaml', 'pnpm-workspace.yaml', 'scripts/player-fast-pass.mjs',
        'client/public/assets/sprites.json', 'client/public/assets/sprites.png'].includes(p));
  const files = Object.fromEntries([...new Set(paths)].sort().map(p => [p, existsSync(join(root, p)) ? sha(readFileSync(join(root, p))) : 'deleted']));
  return { head: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}'),
    sourceSha256: sha(JSON.stringify(files)), files, node: process.version,
    hitboxes: resolve(hitboxes), hitboxesSha256: sha(readFileSync(hitboxes)) };
}
function assertIdentity(expected) {
  const actual = identity(expected.hitboxes);
  assert.deepEqual(actual, expected, 'Source/runtime/hitbox drift: return to preparation; do not reseal during execution');
}
function child(block, mode, out, frozen) {
  assertIdentity(frozen);
  assert(!existsSync(out), `Output already exists: ${out}; retain evidence, no automatic retry`);
  const script = block.endsWith('-farm') ? 'ttkSurvey.ts' : 'bossScreen.ts';
  const result = spawnSync(process.execPath, ['--conditions=development', require.resolve('tsx/cli'),
    `scripts/${script}`, '--trial=player-fast-pass', `--block=${block}`, `--mode=${mode}`,
    `--hitboxes=${frozen.hitboxes}`, `--revision=${frozen.head}`, `--out=${out}`],
  { cwd: join(root, 'server'), encoding: 'utf8', timeout: 15 * 60 * 1000, maxBuffer: 8 * 1024 * 1024 });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'process.log'), (result.stdout ?? '') + (result.stderr ?? ''));
  write(join(out, 'process.json'), { status: result.status, signal: result.signal, error: result.error?.message });
  assertIdentity(frozen);
  assert.equal(result.status, 0, `${block}/${mode} failed; see ${out}/process.log`);
  assert(existsSync(join(out, 'complete.json')), `${block}: incomplete output`);
  const manifest = json(join(out, 'manifest.json')), rows = json(join(out, 'index.json'));
  assert.equal(rows.length, mode === 'pilot' ? 1 : 6);
  assert.equal(manifest.hitboxesSha256, frozen.hitboxesSha256);
  assert.equal(manifest.revision, frozen.head);
  for (const row of rows) {
    const ready = mode === 'qualify' ? row : json(join(out, `${row.cell}-s${row.seed}`, 'ready.json'));
    assert(ready.packageReadback, `${row.cell}: missing resolved package`);
    assert.equal(ready.definitionsIdentity.live, manifest.definitionsHash);
    assert.equal(ready.definitionsIdentity.treated, false);
    assert.equal(ready.hpTreatment.length, 0);
    assert.equal(ready.damageTreatment?.length ?? 0, 0);
    if (mode !== 'qualify') assert(!['wall-ceiling', 'boss-vanished-no-kill', 'encounter-reset'].includes(row.outcome), `${row.cell}: invalid ${row.outcome}`);
  }
  console.log(`${block}/${mode}: ${rows.length} complete`);
  return { manifest, rows };
}

if (args.mode === 'prepare') {
  assert(args.hitboxes, '--hitboxes required for preparation');
  assert(!existsSync(packet), 'Use a fresh packet directory; preparation evidence is retained');
  mkdirSync(packet, { recursive: true });
  const frozen = identity(resolve(args.hitboxes));
  write(join(packet, 'identity.json'), frozen);
  writeFileSync(join(packet, 'checkout-status.txt'), git('status', '--short') + '\n');
  const manifest = [], readbacks = [];
  try {
    for (const block of blocks) {
      const result = child(block, 'qualify', join(packet, 'qualification', block), frozen);
      manifest.push(result.manifest); readbacks.push(...result.rows);
    }
    write(join(packet, 'manifest.json'), manifest);
    write(join(packet, 'resolved-builds.json'), readbacks);
    // Two bounded execution smokes, separate from all 36 full-window observations.
    for (const block of ['t2-farm', 't2-boss']) {
      const result = child(block, 'pilot', join(packet, 'smoke', block), frozen);
      assert(result.rows[0].counts.damaged > 0, `${block}: smoke exercised no outgoing damage`);
    }
    assertIdentity(frozen);
    write(join(packet, 'ready.json'), { status: 'prepared-not-executed', planned: 36,
      qualification: '18 zero-tick ordinary; 18 boss preparations with one 100 ms wake tick',
      smoke: '1 Conduit ordinary <=30s, 1 Squire boss <=60s; not main observations',
      identitySha256: sha(readFileSync(join(packet, 'identity.json'))),
      manifestSha256: sha(readFileSync(join(packet, 'manifest.json'))),
      readbacksSha256: sha(readFileSync(join(packet, 'resolved-builds.json'))) });
  } catch (error) { write(join(packet, 'failed.json'), { error: String(error) }); throw error; }
} else {
  const ready = json(join(packet, 'ready.json')), frozen = json(join(packet, 'identity.json'));
  assert.equal(sha(readFileSync(join(packet, 'identity.json'))), ready.identitySha256);
  assert.equal(sha(readFileSync(join(packet, 'manifest.json'))), ready.manifestSha256);
  assert.equal(sha(readFileSync(join(packet, 'resolved-builds.json'))), ready.readbacksSha256);
  assertIdentity(frozen);
  if (args.mode === 'verify') console.log('Prepared packet and current source match; 36 observations remain unexecuted by preparation.');
  else {
    assert(args.out, '--out=<fresh directory> required');
    const out = resolve(args.out); assert(!existsSync(out), 'Fresh output required; no overwrite or automatic retry');
    mkdirSync(out, { recursive: true });
    write(join(out, 'identity.json'), frozen);
    const prepared = json(join(packet, 'manifest.json')), rows = [], failures = [];
    for (const block of blocks) {
      // Identity failures stop the whole batch. Other operational failures retain
      // their block and allow independent blocks to complete, without retries.
      assertIdentity(frozen);
      try {
        const result = child(block, 'run', join(out, block), frozen);
        const expected = prepared.find(m => m.block === block);
        assert.deepEqual(result.manifest.cells, expected.cells);
        assert.equal(result.manifest.definitionsHash, expected.definitionsHash);
        for (const row of result.rows) rows.push({ block, ...row });
      } catch (error) { assertIdentity(frozen); failures.push({ block, error: String(error) }); }
      write(join(out, 'report.json'), { planned: 36, completedValid: rows.length, failures,
        remainingOpeningAllocation: 36 - rows.length, rows });
    }
    assertIdentity(frozen);
    write(join(out, failures.length ? 'partial.json' : 'complete.json'), { planned: 36, completedValid: rows.length, failures });
    if(failures.length) process.exitCode = 1;
  }
}
