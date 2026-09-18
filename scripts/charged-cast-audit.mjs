/**
 * Read-only attribution of monster charged casts to the damage they actually
 * landed, over a sealed ttkSurvey block. Writes only under --out.
 *
 * Schema 2 (2026-09-18). Changes from schema 1, all made because schema 1
 * overclaimed:
 *  - Ordering uses the event `id`/`tick` fields, not array position.
 *  - A cast resolves to `landed` only when EXACTLY ONE candidate damage event
 *    from that monster falls in the window. Two or more is `ambiguous` and both
 *    are preserved; zero is `fired-unattributed`. Nothing is forced.
 *  - An unmatched final blow is `unmatched-to-any-cast`, never "basic": the
 *    damage schema carries no ability id, so "basic attack" is not derivable.
 *  - Reports `grossDamage` and `absorbed` beside `hpDamage`, with a warning:
 *    for a CHARGED attack `mitigation.grossDamage` records only the base
 *    component, so `hpDamage` can exceed it and a coefficient treatment does
 *    NOT show up there. Measured on Durability33: gross stayed 55 in both arms
 *    while hpDamage moved 72 -> 63.
 *  - Adds `pairedSameState`: matched control/candidate hits at the SAME cast
 *    ordinal and the SAME resolve time. Pooled medians across arms compare
 *    different numbers of hits from diverging sequences; this does not.
 *  - `hpBefore` carries the age of the sample it came from and is labelled
 *    approximate whenever that age is non-zero.
 *  - Median is the standard two-middle-value mean for even N, stated in output.
 *  - `recentDamageSources3s` counts DISTINCT RECENT SOURCES, not simultaneous
 *    attackers, and is named accordingly.
 *
 * Schema 3 (2026-09-18): arm and pairing metadata are read from the block
 * MANIFEST, never guessed from an id suffix. Schema 2 recognised only
 * `control`/`candidate`, so Durability34's `reference`/`substitution` arms all
 * collapsed into one apparently valid `n/a` group. An unknown arm now FAILS
 * LOUDLY. Pairing keys on (class, node, seed), so it does not depend on naming.
 *
 * Schema 4 (2026-09-18) fixes an ORIENTATION DEFECT introduced by schema 3. It
 * sorted arm names alphabetically and formed armB/armA, so for
 * ['candidate','control'] the ratio came out control/candidate and 1 - median
 * then reported the wrong sign AND the wrong denominator: a 65 -> 50 change
 * printed ratio 1.300 and "30% reduction" when the reduction from the baseline
 * is 1 - 50/65 = 23.08%. Baseline and comparison arms are now declared (or
 * resolved from a conventional-name list), never alphabetical, and the reduction
 * is computed PER HIT as (baseline - comparison)/baseline before being
 * summarised - a nonlinear transform of an even-sample median is not the median
 * of the transformed samples.
 *
 * Schema 4 also separates the counting units. matchedHits counts HITS,
 * matchedRunPairs counts RUN PAIRS, and one run pair can contribute several
 * hits, so those do not sum with pairsWithNoComparableHit. Matching on ordinal
 * and timestamp shows TIMING alignment only: it does not establish equal source
 * identity, HP-dependent mitigation, barrier or guard state, so the contrast is
 * labelled timing-matched rather than state-matched.
 *
 * Usage: node scripts/charged-cast-audit.mjs --block=<dir> --out=<dir> [--window=200] [--name=x]
 */
import {readFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {join, basename} from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(s => {
  const i = s.indexOf('=');
  return i < 0 ? [s.replace(/^--/, ''), 'true'] : [s.slice(2, i), s.slice(i + 1)];
}));
if (!args.block || !args.out) throw new Error('--block and --out are required');
const WINDOW = Number(args.window ?? 200);
/** Conventional baseline names, used only when --baseline is not given. */
const BASELINE_NAMES = ['control', 'reference', 'baseline'];
const block = args.block, out = args.out, name = args.name ?? basename(block);
mkdirSync(out, {recursive: true});
const rd = p => JSON.parse(readFileSync(p, 'utf8'));
const index = rd(join(block, 'index.json'));
const manifest = rd(join(block, 'manifest.json'));
const PLAYER = 'bench-bot-0';

/** Authoritative per-cell metadata. Arms are declared, not inferred. */
const cellMeta = new Map(manifest.cells.map(c => [c.id, c]));
const arms = [...new Set(manifest.cells.map(c => c.treatment))].filter(Boolean).sort();
if (arms.length === 0) throw new Error(`${name}: manifest declares no treatment on any cell`);
function metaOf(cellId) {
  const m = cellMeta.get(cellId);
  if (!m) throw new Error(`${name}: observation cell "${cellId}" is not declared in the manifest`);
  if (!m.treatment) throw new Error(`${name}: cell "${cellId}" declares no treatment; refusing to pool it`);
  return m;
}
/** Everything that must match for two observations to be a comparable pair. */
const pairKeyOf = (cellId, seed) => {
  const m = metaOf(cellId);
  return `${m.className}|${m.nodeId}|${seed}`;
};

/** Standard median: mean of the two middle values for even N. */
function median(values) {
  if (values.length === 0) return null;
  const v = [...values].sort((a, b) => a - b);
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

const rows = [];
for (const row of index) {
  const dir = join(block, `${row.cell}-s${row.seed}`);
  if (!existsSync(join(dir, 'events.jsonl'))) continue;
  const events = readFileSync(join(dir, 'events.jsonl'), 'utf8').trim().split('\n')
    .map(l => { const r = JSON.parse(l); return {atMs: r.atMs, e: r.event ?? r}; })
    // Deterministic order: simulated time, then the engine's own event id.
    .sort((a, b) => (a.atMs - b.atMs) || ((a.e.id ?? 0) - (b.e.id ?? 0)));

  const samples = existsSync(join(dir, 'samples.jsonl'))
    ? readFileSync(join(dir, 'samples.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l))
    : [];
  /** Latest sample at or before `ms`, with how stale it is. */
  const hpAt = ms => {
    let hp = null, at = null;
    for (const s of samples) { if (s.atMs > ms) break; hp = s.hp; at = s.atMs; }
    return at === null ? {hp: null, ageMs: null} : {hp, ageMs: ms - at};
  };

  const casts = [];
  const pending = new Map();
  for (const {atMs, e} of events) {
    if (e.kind === 'monster-cast-start') pending.set(e.monsterId, {label: e.label, castMs: e.castMs, startMs: atMs});
    else if (e.kind === 'monster-cast-end') {
      const p = pending.get(e.monsterId);
      pending.delete(e.monsterId);
      if (p) casts.push({...p, endMs: atMs, fired: e.fired === true, monsterId: e.monsterId});
    }
  }

  for (const c of casts) {
    const candidates = c.fired ? events.filter(({atMs, e}) =>
      e.kind === 'damage' && atMs >= c.endMs && atMs <= c.endMs + WINDOW &&
      e.source?.id === c.monsterId && e.target?.id === PLAYER) : [];
    c.candidateCount = candidates.length;
    if (!c.fired) c.resolution = 'interrupted-or-cancelled';
    else if (candidates.length === 1) c.resolution = 'landed';
    else if (candidates.length === 0) c.resolution = 'fired-unattributed';
    else c.resolution = 'ambiguous';

    if (c.resolution === 'landed' || c.resolution === 'ambiguous') {
      c.hits = candidates.map(({atMs, e}) => ({
        atMs, eventId: e.id ?? null,
        hpDamage: e.hpDamage ?? null,
        absorbed: e.absorbed ?? null,
        grossDamage: e.mitigation?.grossDamage ?? null,
        mitigatedTotal: e.mitigation?.mitigatedTotal ?? null,
        glancing: e.mitigation?.glancing ?? null,
      }));
    }
    const hp = hpAt(c.endMs);
    c.hpBefore = hp.hp;
    c.hpBeforeSampleAgeMs = hp.ageMs;
    c.hpBeforeApproximate = hp.ageMs === null || hp.ageMs > 0;
  }

  // Distinct sources that damaged the player in the 3 s before a landed hit.
  // NOT a count of simultaneously engaged attackers.
  for (const c of casts) {
    if (c.resolution !== 'landed') continue;
    const at = c.hits[0].atMs, from = at - 3000;
    const sources = new Set();
    let windowDamage = 0;
    for (const {atMs, e} of events) {
      if (e.kind !== 'damage' || atMs < from || atMs > at || e.target?.id !== PLAYER) continue;
      sources.add(e.source.id);
      windowDamage += e.hpDamage ?? 0;
    }
    c.recentDamageSources3s = sources.size;
    c.playerDamage3s = Math.round(windowDamage * 100) / 100;
  }

  // The last damage the player took, and whether any cast explains it.
  let finalBlow = null;
  if (row.outcome === 'player-died') {
    for (let i = events.length - 1; i >= 0; i--) {
      const {atMs, e} = events[i];
      if (e.kind !== 'damage' || e.target?.id !== PLAYER) continue;
      const owner = casts.find(x => (x.hits ?? []).some(h => h.eventId === (e.id ?? null) && h.atMs === atMs));
      finalBlow = {
        atMs, source: e.source.name, sourceId: e.source.id,
        hpDamage: e.hpDamage ?? null, grossDamage: e.mitigation?.grossDamage ?? null,
        // No ability id exists on a damage event, so an unmatched blow is
        // unattributed, NOT a confirmed basic attack.
        attribution: owner ? `charged:${owner.label}` : 'unmatched-to-any-cast',
      };
      break;
    }
  }

  rows.push({
    cell: row.cell, seed: row.seed, outcome: row.outcome, simMs: row.elapsedMs,
    casts: casts.map(({monsterId, ...c}) => c), finalBlow,
  });
}

const armOf = c => metaOf(c).treatment;
const rootOf = c => metaOf(c).className;

function summarize(pick) {
  const acc = {};
  for (const r of rows) for (const c of r.casts) {
    const k = pick(r, c);
    if (k === null) continue;
    acc[k] ??= {landed: 0, interrupted: 0, unattributed: 0, ambiguous: 0, hp: [], gross: [], absorbed: 0};
    if (c.resolution === 'landed') {
      acc[k].landed++;
      if (c.hits[0].hpDamage != null) acc[k].hp.push(c.hits[0].hpDamage);
      if (c.hits[0].grossDamage != null) acc[k].gross.push(c.hits[0].grossDamage);
      acc[k].absorbed += c.hits[0].absorbed ?? 0;
    } else if (c.resolution === 'interrupted-or-cancelled') acc[k].interrupted++;
    else if (c.resolution === 'ambiguous') acc[k].ambiguous++;
    else acc[k].unattributed++;
  }
  const outObj = {};
  for (const [k, v] of Object.entries(acc)) {
    outObj[k] = {
      landed: v.landed, interrupted: v.interrupted, unattributed: v.unattributed, ambiguous: v.ambiguous,
      hpDamage: {n: v.hp.length, median: median(v.hp), min: v.hp.length ? Math.min(...v.hp) : null, max: v.hp.length ? Math.max(...v.hp) : null},
      grossDamage: {n: v.gross.length, median: median(v.gross), min: v.gross.length ? Math.min(...v.gross) : null, max: v.gross.length ? Math.max(...v.gross) : null},
      totalAbsorbed: Math.round(v.absorbed * 100) / 100,
    };
  }
  return outObj;
}

const finalBlows = {};
for (const r of rows) if (r.finalBlow) {
  const k = `${r.finalBlow.source} / ${r.finalBlow.attribution}`;
  finalBlows[k] = (finalBlows[k] ?? 0) + 1;
}

/**
 * Matched hits: same cell, same seed, same cast ordinal, same resolve time.
 * Stops at the first ordinal whose resolve times differ, because after that the
 * runs have diverged and are no longer comparable states.
 */
/**
 * Which arm is the baseline (denominator) and which is the comparison.
 * Explicit flags win; otherwise a conventional baseline name is required.
 * Alphabetical order is never a baseline.
 */
function resolveArmRoles() {
  if (args.baseline || args.comparison) {
    const baseline = args.baseline ?? arms.find(a => a !== args.comparison);
    const comparison = args.comparison ?? arms.find(a => a !== baseline);
    if (!arms.includes(baseline) || !arms.includes(comparison) || baseline === comparison) {
      throw new Error(`${name}: --baseline/--comparison must name two distinct declared arms (${arms.join(', ')})`);
    }
    return {baseline, comparison};
  }
  const baseline = arms.find(a => BASELINE_NAMES.includes(a));
  if (!baseline) {
    throw new Error(`${name}: cannot tell which of [${arms.join(', ')}] is the baseline. Pass --baseline=<arm> --comparison=<arm>; alphabetical order is NOT a baseline.`);
  }
  return {baseline, comparison: arms.find(a => a !== baseline)};
}

function pairedSameState(label) {
  if (arms.length !== 2) {
    return {label, matchedHits: 0, arms, skipped: `a paired contrast needs exactly two declared arms, found ${arms.length}`};
  }
  const {baseline: armA, comparison: armB} = resolveArmRoles();
  const byKey = new Map();
  for (const r of rows) {
    const k = pairKeyOf(r.cell, r.seed);
    if (!byKey.has(k)) byKey.set(k, {});
    byKey.get(k)[armOf(r.cell)] = r;
  }
  const paired = [];
  const matchedPairKeys = new Set();
  let divergedBefore = 0;
  for (const [k, p] of byKey) {
    if (!p[armA] || !p[armB]) continue;
    const pick = r => r.casts.filter(c => c.label === label && c.resolution === 'landed');
    const a = pick(p[armA]), b = pick(p[armB]);
    if (Math.min(a.length, b.length) === 0) { divergedBefore++; continue; }
    let matched = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i].endMs !== b[i].endMs) break;
      const av = a[i].hits[0].hpDamage, bv = b[i].hits[0].hpDamage;
      if (av == null || bv == null || av === 0) continue;
      matched++;
      matchedPairKeys.add(k);
      paired.push({
        key: k, ordinal: i, endMs: a[i].endMs,
        baselineArm: armA, comparisonArm: armB, baseline: av, comparison: bv,
        comparisonOverBaseline: Number((bv / av).toFixed(5)),
        reductionPct: Number((((av - bv) / av) * 100).toFixed(4)),
        root: rootOf(p[armA].cell),
      });
    }
    if (matched === 0) divergedBefore++;
  }
  const ratios = paired.map(x => x.comparisonOverBaseline);
  const reductions = paired.map(x => x.reductionPct);
  const byRoot = {};
  for (const x of paired) (byRoot[x.root] ??= []).push(x.reductionPct);
  return {
    label,
    arms: {baseline: armA, comparison: armB},
    matchedHits: paired.length,
    matchedRunPairs: matchedPairKeys.size,
    pairsWithNoComparableHit: divergedBefore,
    comparisonOverBaseline: {
      median: median(ratios),
      min: ratios.length ? Math.min(...ratios) : null,
      max: ratios.length ? Math.max(...ratios) : null,
    },
    reductionFromBaselinePct: {
      median: reductions.length ? Number(median(reductions).toFixed(2)) : null,
      min: reductions.length ? Number(Math.min(...reductions).toFixed(2)) : null,
      max: reductions.length ? Number(Math.max(...reductions).toFixed(2)) : null,
    },
    byRootMedianReductionPct: Object.fromEntries(
      Object.entries(byRoot).map(([r, v]) => [r, Number(median(v).toFixed(2))]),
    ),
    hits: paired,
  };
}

const labels = [...new Set(rows.flatMap(r => r.casts.map(c => c.label)))];

const report = {
  schemaVersion: 4,
  window: WINDOW,
  declaredArms: arms,
  armRoles: arms.length === 2 ? resolveArmRoles() : null,
  conventions: {
    median: 'mean of the two middle values for even N',
    landed: 'exactly one candidate damage event from the casting monster within the window',
    ambiguous: 'two or more candidates; preserved, never forced to one',
    recentDamageSources3s: 'distinct sources that damaged the player in the previous 3 s, NOT simultaneous attackers',
    hpBefore: 'latest sample at or before the cast end; approximate whenever hpBeforeSampleAgeMs > 0',
    finalBlowAttribution: 'a damage event carries no ability id, so an unmatched final blow is unattributed rather than "basic"',
    grossDamage: 'base component only. For a charged attack the multiplier is applied OUTSIDE the mitigation record, so hpDamage may exceed grossDamage and a coefficient treatment is NOT readable here',
    pairedSameState: 'TIMING-matched hits: same cast ordinal and same resolve time. This shows timing alignment ONLY - it does not establish equal source identity, HP-dependent mitigation, barrier or guard state, so do not call it state-matched',
    armRoles: 'baseline is the denominator, comparison the numerator; declared via --baseline/--comparison or resolved from a conventional baseline name. NEVER alphabetical order',
    reductionFromBaselinePct: 'computed PER HIT as (baseline - comparison)/baseline, then summarised',
    countingUnits: 'matchedHits counts HITS; matchedRunPairs and pairsWithNoComparableHit count RUN PAIRS. One run pair can contribute several hits, so these do not sum',
    arms: 'read from the block manifest; an observation whose cell is undeclared or carries no treatment fails the audit rather than being pooled',
  },
  pairedSameState: Object.fromEntries(labels.map(l => [l, pairedSameState(l)])),
  byLabelArm: summarize((r, c) => `${c.label} | ${armOf(r.cell)}`),
  byLabelArmRoot: summarize((r, c) => `${c.label} | ${armOf(r.cell)} | ${rootOf(r.cell)}`),
  finalBlows,
  rows,
};
writeFileSync(join(out, `${name}-casts.json`), JSON.stringify(report, null, 2));
writeFileSync(join(out, `${name}-casts-summary.json`), JSON.stringify(
  {schemaVersion: 4, window: WINDOW, declaredArms: arms, armRoles: report.armRoles, conventions: report.conventions,
   pairedSameState: Object.fromEntries(Object.entries(report.pairedSameState).map(([k, v]) => [k, {...v, hits: undefined}])),
   byLabelArm: report.byLabelArm, byLabelArmRoot: report.byLabelArmRoot, finalBlows}, null, 2));
console.log(JSON.stringify({schemaVersion: 4, declaredArms: arms, armRoles: report.armRoles,
  pairedSameState: Object.fromEntries(Object.entries(report.pairedSameState).map(([k, v]) => [k, {
    matchedHits: v.matchedHits, matchedRunPairs: v.matchedRunPairs, pairsWithNoComparableHit: v.pairsWithNoComparableHit,
    comparisonOverBaseline: v.comparisonOverBaseline, reductionFromBaselinePct: v.reductionFromBaselinePct,
    byRootMedianReductionPct: v.byRootMedianReductionPct}])),
  finalBlows}, null, 1));
