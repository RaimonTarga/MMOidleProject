/**
 * Independent, geometry-derived navigation gate over a sealed survey block.
 *
 * Durability32 authorized its dependent breadth block purely on `verifySurvey`,
 * which only certifies that artifacts are well formed. Five correctly recorded
 * wall cutoffs therefore still opened the gate. Artifact validity and behavioral
 * success are separate questions, so this emits them as separate fields and the
 * launcher must require both.
 *
 * Exposure uses TWO signals, because either alone is misleading:
 *  - `hazard-escape` events, which prove the owner actually engaged; and
 *  - sampled positions inside the padded avoidance envelope.
 * Absence of events alone never means "never exercised" (a repair that fails to
 * fire emits nothing either), and sampled geometry alone undercounts: at a 1 Hz
 * cadence a contact entered and resolved between samples is invisible.
 * Measured on Durability33 jungle-breadth: 82 escape events across 15 of 36
 * observations, while sampled obstruction alone found only 4.
 *
 * Read-only with respect to the sealed block; writes one file under --out.
 *
 *   tsx server/scripts/navigationGate.ts --block=<dir> --out=<dir> [--idle-ms=10000]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import {
  NODE_BIOMES,
  RESOLVED_NODE_FEATURES,
  moverOverlapsBlockShapes,
  navigationBodyHalfExtents,
  pointInNodeFeatureShape,
  type NodeFeatureShape,
  type Vec2,
} from '@mmo-idle/shared';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return i < 0 ? [s.replace(/^--/, ''), 'true'] : [s.slice(2, i), s.slice(i + 1)];
}));
const block = args.block, out = args.out;
if (!block || !out) throw new Error('--block=<sealed block dir> and --out=<dir> are required');
/** How long a stationary, target-less, path-less tail counts as a stall. */
const IDLE_MS = Number(args['idle-ms'] ?? 10_000);
const name = args.name ?? basename(block);
mkdirSync(out, { recursive: true });

const rd = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const index = rd(join(block, 'index.json')) as { cell: string; seed: number; outcome: string; elapsedMs: number }[];
const manifest = rd(join(block, 'manifest.json')) as { cells: { id: string; nodeId: string }[] };
const nodeOf = new Map(manifest.cells.map((c) => [c.id, c.nodeId]));

const pad = navigationBodyHalfExtents('player');

/** The shapes a player-side hazard-aware plan refuses to start inside. */
function avoidedShapes(nodeId: string): NodeFeatureShape[] {
  return (RESOLVED_NODE_FEATURES[nodeId] ?? [])
    .filter((f) => f.damage?.targets.includes('player') || f.statusWhileInside?.targets.includes('player'))
    .map((f) => f.shape);
}

const SPLIT_NEWLINE = String.fromCharCode(10);

interface Sample { atMs: number; pos: Vec2; selectedTargetId: string | null; motion: unknown; movement: unknown }

/** Escape activity recorded by the owner itself. */
function escapeActivity(dir: string): { attempts: number; successes: number; failures: number } {
  const path = join(dir, 'events.jsonl');
  if (!existsSync(path)) return { attempts: 0, successes: 0, failures: 0 };
  let attempts = 0, successes = 0, failures = 0;
  for (const line of readFileSync(path, 'utf8').trim().split(SPLIT_NEWLINE)) {
    if (!line) continue;
    const row = JSON.parse(line) as { event?: { kind?: string; phase?: string; outcome?: string } };
    const e = row.event ?? (row as unknown as { kind?: string; phase?: string; outcome?: string });
    if (e.kind !== 'hazard-escape') continue;
    if (e.phase === 'attempt') attempts++;
    else if (e.phase === 'result') { if (e.outcome === 'success') successes++; else failures++; }
  }
  return { attempts, successes, failures };
}

type Exposure = 'exercised' | 'not-exercised' | 'not-applicable' | 'unknown';
type Verdict = 'clean' | 'trapped' | 'unexplained-cutoff' | 'unknown';

const rows: Record<string, unknown>[] = [];
for (const row of index) {
  const dir = join(block, `${row.cell}-s${row.seed}`);
  const nodeId = nodeOf.get(row.cell) ?? '';
  const shapes = avoidedShapes(nodeId);
  const samplePath = join(dir, 'samples.jsonl');

  if (shapes.length === 0) {
    // Nothing on this node can trap a player, so there is no navigation question
    // to answer here. That is not the same as missing evidence.
    rows.push({ cell: row.cell, seed: row.seed, outcome: row.outcome, nodeId,
      exposure: 'not-applicable' satisfies Exposure, verdict: 'clean' satisfies Verdict,
      reason: 'node authors no player-avoided feature' });
    continue;
  }
  if (!existsSync(samplePath)) {
    rows.push({ cell: row.cell, seed: row.seed, outcome: row.outcome, nodeId,
      exposure: 'unknown' satisfies Exposure, verdict: 'unknown' satisfies Verdict,
      reason: 'no sample stream' });
    continue;
  }

  const samples = readFileSync(samplePath, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Sample);
  let everObstructed = false, everInside = false, idleFrom: number | null = null, lastAt = 0;
  for (const s of samples) {
    lastAt = s.atMs;
    if (moverOverlapsBlockShapes(s.pos, shapes, pad)) everObstructed = true;
    if (shapes.some((shape) => pointInNodeFeatureShape(s.pos, shape))) everInside = true;
    const idle = s.selectedTargetId === null && !s.motion && !s.movement;
    if (idle) { if (idleFrom === null) idleFrom = s.atMs; } else idleFrom = null;
  }
  const last = samples[samples.length - 1];
  const idleTailMs = idleFrom === null ? 0 : lastAt - idleFrom;
  const endObstructed = moverOverlapsBlockShapes(last.pos, shapes, pad);

  // Centre offset to the nearest avoided circle: the band the old centre-point
  // admission was blind to.
  let centreOffset: number | null = null, nearest: string | null = null;
  for (const f of RESOLVED_NODE_FEATURES[nodeId] ?? []) {
    if (f.shape.kind !== 'circle') continue;
    const d = Math.hypot(last.pos.x - f.shape.x, last.pos.y - f.shape.y) - f.shape.radius;
    if (centreOffset === null || Math.abs(d) < Math.abs(centreOffset)) { centreOffset = d; nearest = f.id; }
  }

  const escape = escapeActivity(dir);
  const exposure: Exposure = (everObstructed || escape.attempts > 0) ? 'exercised' : 'not-exercised';
  const verdict: Verdict = endObstructed && idleTailMs >= IDLE_MS
    ? 'trapped'
    : row.outcome === 'wall-ceiling' ? 'unexplained-cutoff' : 'clean';

  rows.push({
    cell: row.cell, seed: row.seed, outcome: row.outcome, nodeId,
    endPos: last.pos, nearestFeature: nearest, centreOffset, endObstructed,
    everObstructed, everInside, idleTailMs, exposure, verdict,
    escapeAttempts: escape.attempts, escapeSuccesses: escape.successes, escapeFailures: escape.failures,
  });
}

const count = (k: string, v: string) => rows.filter((r) => r[k] === v).length;
const affected = rows.filter((r) => r.verdict === 'trapped' || r.verdict === 'unexplained-cutoff')
  .map((r) => `${r.cell}-s${r.seed}:${r.verdict}`);

const reasons: string[] = [];
if (count('verdict', 'trapped') > 0) reasons.push(`${count('verdict', 'trapped')} observation(s) ended stationary inside the padded avoidance envelope`);
if (count('verdict', 'unexplained-cutoff') > 0) reasons.push(`${count('verdict', 'unexplained-cutoff')} runtime cutoff(s) without an identified cause`);
const applicable = rows.filter((r) => r.exposure !== 'not-applicable').length;
if (applicable > 0 && count('exposure', 'exercised') === 0) reasons.push('no observation ever entered an avoided feature, so the repair was never exercised');
if (count('exposure', 'unknown') > 0) reasons.push(`${count('exposure', 'unknown')} observation(s) have unknown exposure`);
const failedEscapes = rows.reduce((n, r) => n + ((r.escapeFailures as number) ?? 0), 0);
if (failedEscapes > 0) reasons.push(`${failedEscapes} escape attempt(s) did not reach an authoritative safe exit`);

const status = applicable === 0
  // No node in this block authors an avoided feature: the gate does not apply and
  // must not be reported as a pass or a failure.
  ? 'not-applicable'
  : reasons.length === 0
    ? 'pass'
    : count('verdict', 'trapped') > 0 || count('verdict', 'unexplained-cutoff') > 0 || failedEscapes > 0
      ? 'fail'
      : 'inconclusive';

const report = {
  block: name, idleThresholdMs: IDLE_MS, pad,
  scenarioExposure: {
    exercised: count('exposure', 'exercised'),
    notExercised: count('exposure', 'not-exercised'),
    notApplicable: count('exposure', 'not-applicable'),
    unknown: count('exposure', 'unknown'),
    escapeAttempts: rows.reduce((n, r) => n + ((r.escapeAttempts as number) ?? 0), 0),
    escapeSuccesses: rows.reduce((n, r) => n + ((r.escapeSuccesses as number) ?? 0), 0),
    escapeFailures: failedEscapes,
  },
  navigationGate: { status, reasons, affectedRows: affected },
  balanceExposure: {
    usable: rows.filter((r) => r.outcome === 'window-ended' && r.verdict === 'clean').length,
    censored: rows.filter((r) => r.outcome === 'wall-ceiling').length,
    died: rows.filter((r) => r.outcome === 'player-died').length,
    unknown: count('exposure', 'unknown'),
  },
  rows,
};
writeFileSync(join(out, `${name}-navigation-gate.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ block: name, ...report.scenarioExposure, gate: status, reasons }, null, 1));
