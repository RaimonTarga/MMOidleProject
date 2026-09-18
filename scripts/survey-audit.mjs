/**
 * Read-only audit over a sealed ttkSurvey block. Never writes inside the input
 * directory: the raw operator artifacts stay exactly as the run left them.
 *
 * Emits, next to --out:
 *   <name>-observations.csv   one row per observation
 *   <name>-observations.json  the same rows plus per-row detail
 *   <name>-pairs.json         matched-arm transitions where the block has arms
 *   <name>-exposure.json      geometric hazard exposure, when --node-features is on
 *
 * Usage:
 *   node scripts/survey-audit.mjs --block=<dir> --out=<dir> [--name=x] [--pair-on=treatment]
 */
import {readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync} from 'node:fs';
import {join, basename} from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(s => {
  const i = s.indexOf('=');
  return i < 0 ? [s.replace(/^--/, ''), 'true'] : [s.slice(2, i), s.slice(i + 1)];
}));
if (!args.block || !args.out) throw new Error('--block=<sealed block dir> and --out=<dir> are required');
const block = args.block, out = args.out;
const name = args.name ?? basename(block);
if (!existsSync(join(block, 'index.json'))) throw new Error(`No index.json under ${block}`);
mkdirSync(out, {recursive: true});

const rd = p => JSON.parse(readFileSync(p, 'utf8'));
const index = rd(join(block, 'index.json'));
const manifest = rd(join(block, 'manifest.json'));

/** Last sample of a run: where the observation actually ended up. */
function tail(dir) {
  const p = join(dir, 'samples.jsonl');
  if (!existsSync(p)) return null;
  const lines = readFileSync(p, 'utf8').trim().split('\n');
  if (lines.length === 0) return null;
  return {last: JSON.parse(lines[lines.length - 1]), samples: lines.length};
}

/** Longest run of consecutive samples with no target, no motion and no goal. */
function idleTail(dir) {
  const p = join(dir, 'samples.jsonl');
  if (!existsSync(p)) return {idleTailMs: 0, idleFrom: null};
  const lines = readFileSync(p, 'utf8').trim().split('\n');
  let from = null, last = 0;
  for (const line of lines) {
    const s = JSON.parse(line);
    last = s.atMs;
    const idle = s.selectedTargetId === null && !s.motion && !s.movement;
    if (idle) { if (from === null) from = s.atMs; }
    else from = null;
  }
  return {idleTailMs: from === null ? 0 : last - from, idleFrom: from};
}

const rows = [];
for (const row of index) {
  const dir = join(block, `${row.cell}-s${row.seed}`);
  const t = tail(dir);
  const ready = existsSync(join(dir, 'ready.json')) ? rd(join(dir, 'ready.json')) : null;
  const idle = idleTail(dir);
  const targets = row.targets ?? [];
  rows.push({
    cell: row.cell,
    seed: row.seed,
    outcome: row.outcome,
    simMs: row.elapsedMs,
    wallMs: row.wallElapsedMs,
    minHpFraction: row.minHpFraction,
    largestHit: row.largestHit ?? null,
    maxDamageIn1s: row.maxDamageIn1s ?? null,
    kills: targets.filter(x => x.killedAtMs != null).length,
    engaged: targets.length,
    attackBeats: row.attackBeats,
    minionAttackBeats: row.minionAttackBeats,
    cleanTtkMs: row.cleanTtkMs ?? null,
    idleTailMs: idle.idleTailMs,
    idleFromMs: idle.idleFrom,
    endPos: t ? t.last.pos : null,
    endTarget: t ? t.last.selectedTargetId : null,
    endIntent: t?.last?.autoIntent?.reason ?? null,
    endLiveMonsters: t ? (t.last.monsters ?? []).length : null,
    samples: t ? t.samples : 0,
    treatment: ready?.hpTreatment ?? [],
    initialRosterHash: row.initialRosterHash,
    geometryRosterHash: ready?.geometryRosterHash ?? null,
  });
}

const csvCols = ['cell','seed','outcome','simMs','wallMs','minHpFraction','largestHit','maxDamageIn1s',
  'kills','engaged','attackBeats','minionAttackBeats','idleTailMs','endIntent','endLiveMonsters'];
writeFileSync(join(out, `${name}-observations.csv`),
  csvCols.join(',') + '\n' + rows.map(r => csvCols.map(c => {
    const v = r[c];
    return v === null || v === undefined ? '' : (typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v));
  }).join(',')).join('\n') + '\n');
writeFileSync(join(out, `${name}-observations.json`), JSON.stringify({manifest: {
  trial: manifest.trial, block: manifest.block, revision: manifest.revision, mode: manifest.mode,
  durationMs: manifest.durationMs, dtMs: manifest.dtMs, seeds: manifest.seeds,
  synthetic: manifest.synthetic, economyEligible: manifest.economyEligible,
}, rows}, null, 2));

// Outcome totals recomputed from the rows themselves, never copied from a summary.
const totals = {};
for (const r of rows) totals[r.outcome] = (totals[r.outcome] ?? 0) + 1;

// Matched-arm transitions, when the cell ids encode control/candidate.
let pairs = null;
const armOf = c => c.endsWith('-candidate') ? 'candidate' : c.endsWith('-control') ? 'control' : null;
if (rows.some(r => armOf(r.cell))) {
  const key = r => `${r.cell.replace(/-(control|candidate)$/, '')}|${r.seed}`;
  const byKey = new Map();
  for (const r of rows) {
    if (!armOf(r.cell)) continue;
    const k = key(r);
    if (!byKey.has(k)) byKey.set(k, {});
    byKey.get(k)[armOf(r.cell)] = r;
  }
  const transitions = {};
  const discordant = [];
  for (const [k, p] of byKey) {
    if (!p.control || !p.candidate) continue;
    const a = p.control.outcome === 'player-died' ? 'died' : 'survived';
    const b = p.candidate.outcome === 'player-died' ? 'died' : 'survived';
    const t = `${a}->${b}`;
    transitions[t] = (transitions[t] ?? 0) + 1;
    // Same-input pairing is only meaningful when the recorded start state matches.
    const paired = p.control.initialRosterHash === p.candidate.initialRosterHash;
    if (a !== b) discordant.push({key: k, transition: t, pairedStart: paired,
      controlSimMs: p.control.simMs, candidateSimMs: p.candidate.simMs});
    if (!paired) discordant.push({key: k, transition: t, pairedStart: false, warning: 'start-state mismatch'});
  }
  pairs = {transitions, discordant, pairedCells: byKey.size};
  writeFileSync(join(out, `${name}-pairs.json`), JSON.stringify(pairs, null, 2));
}

writeFileSync(join(out, `${name}-summary.json`), JSON.stringify({
  block: name, rows: rows.length, totals, pairs: pairs?.transitions ?? null,
}, null, 2));
console.log(JSON.stringify({block: name, rows: rows.length, totals, pairs: pairs?.transitions ?? null}, null, 1));
