import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RESOLVED_NODE_FEATURES } from '@mmo-idle/shared';
import { shouldRunDependentBlock, isGlobalIdentityFailure } from '../../scripts/block-gate.mjs';

// The runner's cwd is the server package, so anchor on this file instead.
const REPO_ROOT = resolve(__dirname, '..', '..');

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-t4-jungle-03';
const bush = RESOLVED_NODE_FEATURES[NODE]!.find((f) => f.id === 'jungle_bush_2')!;
assert(bush.shape.kind === 'circle', 'fixture needs a circular bush');

// A measured Durability32 trap: centre outside the raw circle, footprint overlapping.
const TRAPPED = { x: 4120.507920801226, y: 2334.382102106796 };
// Far from every feature.
const CLEAR = { x: 2400, y: 2400 };

interface Row { cell: string; seed: number; outcome: string; elapsedMs: number }

function sample(atMs: number, pos: { x: number; y: number }, idle: boolean) {
  return JSON.stringify({
    atMs, pos,
    selectedTargetId: idle ? null : 'node-t4-jungle-03_monster-1',
    motion: idle ? null : { direction: { x: 1, y: 0 }, magnitude: 100 },
    movement: idle ? null : { goal: pos, waypoints: [], mover: 'player', avoidHazards: true },
  });
}

/** Build a sealed-block-shaped fixture on disk and run the real gate script over it. */
function runGate(label: string, obs: { cell: string; outcome: string; path: 'trapped' | 'clear' | 'visits-then-leaves' }[]) {
  const dir = mkdtempSync(join(tmpdir(), 'navgate-'));
  try {
    const rows: Row[] = [];
    for (const o of obs) {
      rows.push({ cell: o.cell, seed: 44017, outcome: o.outcome, elapsedMs: 120_000 });
      const runDir = join(dir, `${o.cell}-s44017`);
      mkdirSync(runDir, { recursive: true });
      const lines: string[] = [];
      if (o.path === 'trapped') {
        for (let t = 0; t <= 10; t++) lines.push(sample(t * 1000, CLEAR, false));
        // 30 s stationary inside the padded envelope: the diagnosed signature.
        for (let t = 11; t <= 41; t++) lines.push(sample(t * 1000, TRAPPED, true));
      } else if (o.path === 'visits-then-leaves') {
        for (let t = 0; t <= 5; t++) lines.push(sample(t * 1000, TRAPPED, false));
        for (let t = 6; t <= 41; t++) lines.push(sample(t * 1000, CLEAR, false));
      } else {
        for (let t = 0; t <= 41; t++) lines.push(sample(t * 1000, CLEAR, false));
      }
      writeFileSync(join(runDir, 'samples.jsonl'), lines.join('\n') + '\n');
    }
    writeFileSync(join(dir, 'index.json'), JSON.stringify(rows));
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({
      cells: [...new Set(obs.map((o) => o.cell))].map((id) => ({ id, nodeId: NODE })),
    }));
    const outDir = join(dir, 'out');
    execFileSync(process.execPath, [
      '--import', pathToFileURL(join(REPO_ROOT, 'server/node_modules/tsx/dist/loader.mjs')).href,
      '--conditions=development',
      'server/scripts/navigationGate.ts',
      `--block=${dir}`, `--out=${outDir}`, `--name=${label}`,
    ], { cwd: REPO_ROOT, stdio: 'pipe' });
    return JSON.parse(readFileSync(join(outDir, `${label}-navigation-gate.json`), 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// A valid, correctly recorded wall cutoff on a trapped row FAILS the behavior gate.
{
  const r = runGate('trapped', [{ cell: 'fix-trapped', outcome: 'wall-ceiling', path: 'trapped' }]);
  assert(r.navigationGate.status === 'fail', `a trapped cutoff must fail the gate, got ${r.navigationGate.status}`);
  assert(r.rows[0].verdict === 'trapped', 'the trapped row must be identified');
  assert(r.rows[0].exposure === 'exercised', 'a trapped row did reach the feature');
  assert(r.rows[0].centreOffset > 0, 'the fixture must sit OUTSIDE the raw circle');
  assert(r.rows[0].endObstructed === true, 'with its footprint obstructed');
  const gate = shouldRunDependentBlock({ artifactVerified: true, navigationGate: r.navigationGate });
  assert(!gate.run, 'a failed behavior gate must skip the dependent block');
  assert(gate.reason.startsWith('prerequisite-behavior-failed'), `unexpected reason ${gate.reason}`);
}

// Exposure is measured from geometry, so a row that visited and left passes.
{
  const r = runGate('exercised', [
    { cell: 'fix-visit', outcome: 'window-ended', path: 'visits-then-leaves' },
    { cell: 'fix-clear', outcome: 'window-ended', path: 'clear' },
  ]);
  assert(r.navigationGate.status === 'pass', `expected pass, got ${JSON.stringify(r.navigationGate)}`);
  assert(r.scenarioExposure.exercised === 1, 'one row entered the envelope');
  assert(r.scenarioExposure.notExercised === 1, 'the other never did');
  assert(shouldRunDependentBlock({ artifactVerified: true, navigationGate: r.navigationGate }).run,
    'a passed gate with real exposure authorizes the dependent block');
}

// Never-exercised alone is NOT repair success: inconclusive, and it still blocks.
{
  const r = runGate('unexercised', [{ cell: 'fix-clear', outcome: 'window-ended', path: 'clear' }]);
  assert(r.navigationGate.status === 'inconclusive', `expected inconclusive, got ${r.navigationGate.status}`);
  assert(r.scenarioExposure.exercised === 0, 'nothing was exercised');
  const gate = shouldRunDependentBlock({ artifactVerified: true, navigationGate: r.navigationGate });
  assert(!gate.run, 'an unexercised repair must not authorize dependent breadth');
}

// An unexplained cutoff cannot silently pass either.
{
  const r = runGate('unexplained', [{ cell: 'fix-clear', outcome: 'wall-ceiling', path: 'clear' }]);
  assert(r.navigationGate.status === 'fail', 'an unexplained cutoff fails the gate');
  assert(r.rows[0].verdict === 'unexplained-cutoff', 'and is labelled as such');
}

// Artifact validity alone never authorizes a dependent block.
{
  const gate = shouldRunDependentBlock({ artifactVerified: true });
  assert(!gate.run && gate.reason === 'prerequisite-behavior-gate-missing',
    'verifySurvey alone must not open the gate - this is the Durability32 defect');
  assert(!shouldRunDependentBlock({ artifactVerified: false, navigationGate: { status: 'pass' } }).run,
    'a behavior pass cannot rescue unverified artifacts');
}

// Ordinary gameplay death is not a navigation failure, and zero deaths is not the gate.
{
  const r = runGate('death', [{ cell: 'fix-clear', outcome: 'player-died', path: 'visits-then-leaves' }]);
  assert(r.navigationGate.status === 'pass', 'a death after real exposure is a gameplay result, not a nav failure');
  assert(r.balanceExposure.died === 1, 'the death is still recorded as an outcome');
  assert(r.balanceExposure.usable === 0, 'and it is not counted as usable window evidence');
}

// Identity failures are global; block-local failures are not.
{
  assert(isGlobalIdentityFailure('revision: expected "a", got "b"'), 'revision drift is global');
  assert(isGlobalIdentityFailure('hitboxesSha256 mismatch'), 'hitbox drift is global');
  assert(!isGlobalIdentityFailure('index length: expected 12, got 11'), 'a count mismatch is block-local');
}

console.log('navigationGate: ok');
