// Paired analysis of the iteration-04 finite-pack replay. Read-only.
// Usage: node analyzeFinitePack.mjs <rawDir>   (dirs <arm>-<variant>/rows.jsonl)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const raw = process.argv[2];
const load = (name) => {
  const f = join(raw, name, 'rows.jsonl');
  if (!existsSync(f)) return null;
  const rows = readFileSync(f, 'utf8').trim().split('\n').map(JSON.parse);
  return new Map(rows.map(r => [`${r.id}|${r.seed}`, r]));
};
const arms = Object.fromEntries(readdirSync(raw).filter(d => existsSync(join(raw, d, 'rows.jsonl'))).map(d => [d, load(d)]));
const died = r => r.outcome === 'bot_died' || r.hpEnd <= 0;
const cls = r => r.id.split('-')[1];
const tier = r => r.id.split('-')[0];
const prof = r => r.profile.id + '/' + r.profile.armor;

// Identity: the same cell+seed must face the same starting pack in every arm.
const base = arms['candidate-baseline'];
let mismatched = 0, compared = 0;
for (const [name, rows] of Object.entries(arms)) for (const [k, r] of rows) {
  const b = base.get(k); if (!b || name === 'candidate-baseline') continue;
  compared++; if (b.fixtureHash !== r.fixtureHash) mismatched++;
}
console.log(`fixture identity: ${compared - mismatched}/${compared} matched`);

function summary(rows) {
  const list = [...rows.values()];
  const d = list.filter(died).length;
  const mean = (f) => list.reduce((s, r) => s + f(r), 0) / list.length;
  return { n: list.length, deaths: d, cleared: list.filter(r => r.outcome === 'pack_cleared').length,
    meanMinHp: +mean(r => r.minHp).toFixed(3), meanClearS: +(mean(r => (r.clearAtMs ?? r.elapsedMs)) / 1000).toFixed(1) };
}
console.log('\n## Arm/variant totals');
for (const [name, rows] of Object.entries(arms)) console.log(name.padEnd(30), JSON.stringify(summary(rows)));

function paired(aName, bName, keyFn) {
  const a = arms[aName], b = arms[bName];
  const groups = {};
  for (const [k, rb] of b) {
    const ra = a.get(k); if (!ra) continue;
    const g = keyFn(rb); const x = (groups[g] ??= { n: 0, aDeaths: 0, bDeaths: 0, saved: 0, lost: 0, dMinHp: 0 });
    x.n++; const da = died(ra), db = died(rb);
    if (da) x.aDeaths++; if (db) x.bDeaths++;
    if (da && !db) x.saved++; if (!da && db) x.lost++;
    x.dMinHp += rb.minHp - ra.minHp;
  }
  for (const x of Object.values(groups)) x.dMinHp = +(x.dMinHp / x.n).toFixed(3);
  return groups;
}
const show = (title, a, b, keyFn) => {
  if (!arms[a] || !arms[b]) return;
  console.log(`\n## ${title}: ${a} -> ${b}`);
  const g = paired(a, b, keyFn);
  for (const k of Object.keys(g).sort()) console.log(k.padEnd(28), JSON.stringify(g[k]));
};
for (const [a, b] of [['original-baseline', 'pipeline-baseline'], ['pipeline-baseline', 'candidate-baseline'], ['original-baseline', 'candidate-baseline']]) {
  show('by tier', a, b, tier);
  show('by class', a, b, cls);
  show('by profile', a, b, r => tier(r) + ' ' + prof(r));
}
for (const v of ['desert-dr', 'jungle-frequency', 'jungle-strength', 'grave-no-plating']) {
  show('variant by tier', 'candidate-baseline', `candidate-${v}`, tier);
  show('variant by profile', 'candidate-baseline', `candidate-${v}`, r => tier(r) + ' ' + prof(r));
}
