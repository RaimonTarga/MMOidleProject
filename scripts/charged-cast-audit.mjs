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
const block = args.block, out = args.out, name = args.name ?? basename(block);
mkdirSync(out, {recursive: true});
const rd = p => JSON.parse(readFileSync(p, 'utf8'));
const index = rd(join(block, 'index.json'));
const PLAYER = 'bench-bot-0';

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

const armOf = c => c.endsWith('-candidate') ? 'candidate' : c.endsWith('-control') ? 'control' : 'n/a';
const rootOf = c => (/-(striker|squire|apprentice|slinger|conduit|spirit)-/.exec(c) ?? [, 'n/a'])[1];

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
function pairedSameState(label) {
  const byKey = new Map();
  for (const r of rows) {
    const a = armOf(r.cell);
    if (a === 'n/a') continue;
    const k = `${r.cell.replace(/-(control|candidate)$/, '')}|${r.seed}`;
    if (!byKey.has(k)) byKey.set(k, {});
    byKey.get(k)[a] = r;
  }
  const paired = [];
  for (const [k, p] of byKey) {
    if (!p.control || !p.candidate) continue;
    const pick = r => r.casts.filter(c => c.label === label && c.resolution === 'landed');
    const c = pick(p.control), d = pick(p.candidate);
    for (let i = 0; i < Math.min(c.length, d.length); i++) {
      if (c[i].endMs !== d[i].endMs) break;
      const cv = c[i].hits[0].hpDamage, dv = d[i].hits[0].hpDamage;
      if (cv == null || dv == null || cv === 0) continue;
      paired.push({key: k, ordinal: i, endMs: c[i].endMs, control: cv, candidate: dv,
        ratio: Number((dv / cv).toFixed(5)), root: rootOf(p.control.cell)});
    }
  }
  const ratios = paired.map(x => x.ratio);
  const byRoot = {};
  for (const x of paired) (byRoot[x.root] ??= []).push(x.ratio);
  return {
    label, n: paired.length,
    ratio: {median: median(ratios), min: ratios.length ? Math.min(...ratios) : null, max: ratios.length ? Math.max(...ratios) : null},
    medianHpReductionPct: ratios.length ? Number(((1 - median(ratios)) * 100).toFixed(2)) : null,
    byRootMedianRatio: Object.fromEntries(Object.entries(byRoot).map(([r, v]) => [r, median(v)])),
    hits: paired,
  };
}

const labels = [...new Set(rows.flatMap(r => r.casts.map(c => c.label)))];

const report = {
  schemaVersion: 2,
  window: WINDOW,
  conventions: {
    median: 'mean of the two middle values for even N',
    landed: 'exactly one candidate damage event from the casting monster within the window',
    ambiguous: 'two or more candidates; preserved, never forced to one',
    recentDamageSources3s: 'distinct sources that damaged the player in the previous 3 s, NOT simultaneous attackers',
    hpBefore: 'latest sample at or before the cast end; approximate whenever hpBeforeSampleAgeMs > 0',
    finalBlowAttribution: 'a damage event carries no ability id, so an unmatched final blow is unattributed rather than "basic"',
    grossDamage: 'base component only. For a charged attack the multiplier is applied OUTSIDE the mitigation record, so hpDamage may exceed grossDamage and a coefficient treatment is NOT readable here',
    pairedSameState: 'candidate/control hpDamage ratio for hits at the same cast ordinal AND the same resolve time, so both runs were still in the same state; the only comparison that isolates the treatment',
  },
  pairedSameState: Object.fromEntries(labels.map(l => [l, pairedSameState(l)])),
  byLabelArm: summarize((r, c) => `${c.label} | ${armOf(r.cell)}`),
  byLabelArmRoot: summarize((r, c) => `${c.label} | ${armOf(r.cell)} | ${rootOf(r.cell)}`),
  finalBlows,
  rows,
};
writeFileSync(join(out, `${name}-casts.json`), JSON.stringify(report, null, 2));
writeFileSync(join(out, `${name}-casts-summary.json`), JSON.stringify(
  {schemaVersion: 2, window: WINDOW, conventions: report.conventions,
   pairedSameState: Object.fromEntries(Object.entries(report.pairedSameState).map(([k, v]) => [k, {...v, hits: undefined}])),
   byLabelArm: report.byLabelArm, byLabelArmRoot: report.byLabelArmRoot, finalBlows}, null, 2));
console.log(JSON.stringify({schemaVersion: 2,
  pairedSameState: Object.fromEntries(Object.entries(report.pairedSameState).map(([k, v]) => [k, {n: v.n, ratio: v.ratio, medianHpReductionPct: v.medianHpReductionPct, byRootMedianRatio: v.byRootMedianRatio}])),
  finalBlows}, null, 1));
