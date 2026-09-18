/**
 * Independent, geometry-derived navigation gate over a sealed survey block.
 *
 * Durability32 authorized its dependent breadth block purely on `verifySurvey`,
 * which only certifies that artifacts are well formed. Five correctly recorded
 * wall cutoffs therefore still opened the gate. Artifact validity and behavioral
 * success are separate questions, so this emits them as separate fields and the
 * launcher must require both.
 *
 * Exposure is measured from the sample stream against the frozen feature
 * geometry, never inferred from the absence of a `hazard-escape` event: a repair
 * that fails to fire produces no event either, so "no event" cannot be read as
 * "never exercised".
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

interface Sample { atMs: number; pos: Vec2; selectedTargetId: string | null; motion: unknown; movement: unknown }

type Exposure = 'exercised' | 'not-exercised' | 'unknown';
type Verdict = 'clean' | 'trapped' | 'unexplained-cutoff' | 'unknown';

const rows: Record<string, unknown>[] = [];
for (const row of index) {
  const dir = join(block, `${row.cell}-s${row.seed}`);
  const nodeId = nodeOf.get(row.cell) ?? '';
  const shapes = avoidedShapes(nodeId);
  const samplePath = join(dir, 'samples.jsonl');

  if (!existsSync(samplePath) || shapes.length === 0) {
    rows.push({ cell: row.cell, seed: row.seed, outcome: row.outcome, nodeId,
      exposure: 'unknown' satisfies Exposure, verdict: 'unknown' satisfies Verdict,
      reason: shapes.length === 0 ? 'node authors no player-avoided feature' : 'no sample stream' });
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

  const exposure: Exposure = everObstructed ? 'exercised' : 'not-exercised';
  const verdict: Verdict = endObstructed && idleTailMs >= IDLE_MS
    ? 'trapped'
    : row.outcome === 'wall-ceiling' ? 'unexplained-cutoff' : 'clean';

  rows.push({
    cell: row.cell, seed: row.seed, outcome: row.outcome, nodeId,
    endPos: last.pos, nearestFeature: nearest, centreOffset, endObstructed,
    everObstructed, everInside, idleTailMs, exposure, verdict,
  });
}

const count = (k: string, v: string) => rows.filter((r) => r[k] === v).length;
const affected = rows.filter((r) => r.verdict === 'trapped' || r.verdict === 'unexplained-cutoff')
  .map((r) => `${r.cell}-s${r.seed}:${r.verdict}`);

const reasons: string[] = [];
if (count('verdict', 'trapped') > 0) reasons.push(`${count('verdict', 'trapped')} observation(s) ended stationary inside the padded avoidance envelope`);
if (count('verdict', 'unexplained-cutoff') > 0) reasons.push(`${count('verdict', 'unexplained-cutoff')} runtime cutoff(s) without an identified cause`);
if (count('exposure', 'exercised') === 0) reasons.push('no observation ever entered an avoided feature, so the repair was never exercised');
if (count('exposure', 'unknown') > 0) reasons.push(`${count('exposure', 'unknown')} observation(s) have unknown exposure`);

const status = reasons.length === 0
  ? 'pass'
  : count('verdict', 'trapped') > 0 || count('verdict', 'unexplained-cutoff') > 0 ? 'fail' : 'inconclusive';

const report = {
  block: name, idleThresholdMs: IDLE_MS, pad,
  scenarioExposure: {
    exercised: count('exposure', 'exercised'),
    notExercised: count('exposure', 'not-exercised'),
    unknown: count('exposure', 'unknown'),
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
