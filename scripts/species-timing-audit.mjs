/**
 * Read-only species/role timing over a sealed ttkSurvey block. Writes only under --out.
 *
 * Answers the question mixed-species cell medians cannot: for each monster
 * species actually encountered, how long a clean body takes, how often its
 * mechanic fired, and how much of the node it represents. Aggregation is
 * seed -> root -> equally weighted roots, so a fast root cannot dominate by
 * contributing more kills.
 *
 * A target counts as CLEAN only when the harness marked it clean (uninterrupted
 * single engagement, no observed HP regain). Unresolved and regained targets are
 * counted and reported, never folded into a median.
 *
 * Schema 2 (2026-09-18): results are SPLIT BY EXPERIMENTAL ARM, read from the
 * block manifest. Schema 1 pooled every arm into one table, which silently mixed
 * a control and a candidate population - the exact mistake that made
 * Durability34's first species table unusable. An undeclared arm fails loudly.
 * Runtime `maxHp` is recorded per arm rather than overwritten by whichever
 * observation happened to be read last.
 *
 * Usage: node scripts/species-timing-audit.mjs --block=<dir> --out=<dir> [--name=x]
 */
import {readFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {join, basename} from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(s => {
  const i = s.indexOf('=');
  return i < 0 ? [s.replace(/^--/, ''), 'true'] : [s.slice(2, i), s.slice(i + 1)];
}));
if (!args.block || !args.out) throw new Error('--block and --out are required');
const block = args.block, out = args.out, name = args.name ?? basename(block);
mkdirSync(out, {recursive: true});
const rd = p => JSON.parse(readFileSync(p, 'utf8'));
const index = rd(join(block, 'index.json'));
const manifest = rd(join(block, 'manifest.json'));
const cellMeta = new Map(manifest.cells.map(c => [c.id, c]));
const declaredArms = [...new Set(manifest.cells.map(c => c.treatment))].filter(Boolean).sort();
function metaOf(id) {
  const m = cellMeta.get(id);
  if (!m) throw new Error(`${name}: cell "${id}" is not declared in the manifest`);
  return m;
}

function median(values) {
  if (values.length === 0) return null;
  const v = [...values].sort((a, b) => a - b);
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
const round = n => n === null ? null : Number(n.toFixed(2));
const rootOf = c => metaOf(c).className;
const nodeOf = c => metaOf(c).nodeId;
const armOf = c => {
  const t = metaOf(c).treatment;
  if (declaredArms.length > 0 && !t) throw new Error(`${name}: cell "${c}" declares no treatment; refusing to pool it`);
  return t ?? 'single-arm';
};

/** arm -> species -> root -> seed -> clean ttk samples, plus engagement bookkeeping. */
const speciesByArm = new Map();
const perObservation = [];

for (const row of index) {
  const root = rootOf(row.cell), node = nodeOf(row.cell), arm = armOf(row.cell);
  const species = speciesByArm.get(arm) ?? new Map();
  speciesByArm.set(arm, species);
  const targets = row.targets ?? [];
  const seen = new Map();
  for (const t of targets) {
    const s = species.get(t.type) ?? {
      type: t.type, name: t.name, maxHp: t.maxHp,
      engaged: 0, killed: 0, cleanKills: 0, unresolved: 0, regained: 0,
      castsStarted: 0, castsFired: 0, byRoot: {}, runtimeMaxHp: new Set(),
    };
    if (t.maxHp != null) s.runtimeMaxHp.add(t.maxHp);
    s.engaged++;
    if (t.killedAtMs != null) s.killed++;
    if (t.hpRegainObserved) s.regained++;
    s.castsStarted += t.castsStarted ?? 0;
    s.castsFired += t.castsFired ?? 0;
    if (t.clean && t.ttkMs != null && !t.hpRegainObserved) {
      s.cleanKills++;
      const r = (s.byRoot[root] ??= {});
      (r[row.seed] ??= []).push(t.ttkMs);
    } else if (t.killedAtMs == null) s.unresolved++;
    species.set(t.type, s);
    seen.set(t.type, (seen.get(t.type) ?? 0) + 1);
  }
  perObservation.push({
    cell: row.cell, seed: row.seed, arm, root, node, outcome: row.outcome,
    simMs: row.elapsedMs,
    engagedSpecies: Object.fromEntries(seen),
    kills: targets.filter(t => t.killedAtMs != null).length,
    // Alive time is the denominator for any per-minute rate.
    aliveMs: row.elapsedMs,
  });
}

function buildTable(species) {
  const table = [];
  for (const s of species.values()) {
    const rootMedians = {};
    for (const [root, seeds] of Object.entries(s.byRoot)) {
      rootMedians[root] = median(Object.values(seeds).map(v => median(v)));
    }
    const weighted = median(Object.values(rootMedians).filter(v => v !== null));
    table.push({
      type: s.type, name: s.name,
      // Every distinct runtime maxHp seen, so an overlay is visible instead of
      // being overwritten by whichever observation was read last.
      runtimeMaxHp: [...s.runtimeMaxHp].sort((a, b) => a - b),
      engaged: s.engaged, killed: s.killed, cleanKills: s.cleanKills,
      unresolved: s.unresolved, hpRegainObserved: s.regained,
      castsStarted: s.castsStarted, castsFired: s.castsFired,
      mechanicFiredPerEngagement: s.engaged ? Number((s.castsFired / s.engaged).toFixed(3)) : null,
      cleanTtkMsByRoot: Object.fromEntries(Object.entries(rootMedians).map(([k, v]) => [k, round(v)])),
      cleanTtkMsEqualWeightRoots: round(weighted),
      rootsWithCleanSample: Object.keys(rootMedians).length,
    });
  }
  table.sort((a, b) => (b.runtimeMaxHp[0] ?? 0) - (a.runtimeMaxHp[0] ?? 0));
  return table;
}
const byArm = Object.fromEntries([...speciesByArm.entries()].map(([arm, sp]) => [arm, buildTable(sp)]));

const report = {
  schemaVersion: 2,
  block: name,
  declaredArms,
  conventions: {
    arms: 'read from the block manifest; results are split by arm and never pooled across treatments',
    runtimeMaxHp: 'every distinct runtime maxHp observed for that species in that arm',
    aggregation: 'clean TTK: median within seed, then within root, then equally weighted across roots',
    clean: 'harness clean flag AND no observed HP regain AND a resolved kill time',
    unresolved: 'engaged but never killed within the window; never folded into a median',
    mechanicFiredPerEngagement: 'castsFired divided by engagements; a species with ~0 never showed its mechanic',
    caution: 'a species with few clean samples or few roots is a lead, not a measurement',
  },
  observations: perObservation.length,
  speciesByArm: byArm,
  perObservation,
};
writeFileSync(join(out, `${name}-species-timing.json`), JSON.stringify(report, null, 2));

console.log(`${name}: ${perObservation.length} observations, arms [${declaredArms.join(', ') || 'single-arm'}]`);
for (const [arm, table] of Object.entries(byArm)) {
  console.log(`
--- arm: ${arm}`);
  console.log('species'.padEnd(22) + 'runtimeHP'.padEnd(14) + 'eng'.padEnd(6) + 'clean'.padEnd(7) + 'unres'.padEnd(7) + 'fired/eng'.padEnd(11) + 'cleanTTK s  roots');
  for (const s of table) {
    console.log(
      s.type.padEnd(22) + s.runtimeMaxHp.join('/').padEnd(14) + String(s.engaged).padEnd(6) +
      String(s.cleanKills).padEnd(7) + String(s.unresolved).padEnd(7) +
      String(s.mechanicFiredPerEngagement ?? '-').padEnd(11) +
      String(s.cleanTtkMsEqualWeightRoots === null ? 'n/a' : (s.cleanTtkMsEqualWeightRoots / 1000).toFixed(2)).padEnd(12) +
      s.rootsWithCleanSample,
    );
  }
}
