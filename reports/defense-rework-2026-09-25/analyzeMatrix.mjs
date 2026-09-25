// Paired analysis of the defense qualification matrix (defenseMatrix05). Read-only.
// Usage: node analyzeMatrix.mjs <rawDir>   (dirs <arm>-s<shard>/rows.jsonl, arms original|pipeline|candidate)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const raw = process.argv[2];
const arms = {};
for (const d of readdirSync(raw)) {
  const f = join(raw, d, 'rows.jsonl');
  if (!existsSync(f)) continue;
  const arm = d.split('-s')[0];
  const m = (arms[arm] ??= new Map());
  for (const line of readFileSync(f, 'utf8').trim().split('\n')) { const r = JSON.parse(line); m.set(`${r.id}|${r.seed}`, r); }
}
const died = r => r.outcome === 'bot_died' || r.hpEnd <= 0;
const bossWin = r => r.outcome === 'boss_killed';
const isBoss = r => r.kind === 'boss';

function tally(rows) {
  const farm = rows.filter(r => !isBoss(r)), boss = rows.filter(isBoss);
  return {
    farmN: farm.length, farmDeaths: farm.filter(died).length,
    farmKills: farm.reduce((s, r) => s + r.kills, 0),
    bossN: boss.length, bossWins: boss.filter(bossWin).length, bossDeaths: boss.filter(died).length,
    bigHits: rows.reduce((s, r) => s + r.fullHpLethalHits, 0),
  };
}
console.log('## Totals');
for (const [a, m] of Object.entries(arms)) console.log(a.padEnd(10), JSON.stringify(tally([...m.values()])));

function compare(a, b, keyFn) {
  const A = arms[a], B = arms[b]; if (!A || !B) return;
  const g = {};
  for (const [k, rb] of B) {
    const ra = A.get(k); if (!ra) continue;
    const key = keyFn(rb); const x = (g[key] ??= { farmN: 0, deathsA: 0, deathsB: 0, saved: 0, lost: 0, killsA: 0, killsB: 0, bossN: 0, winsA: 0, winsB: 0 });
    if (isBoss(rb)) { x.bossN++; if (bossWin(ra)) x.winsA++; if (bossWin(rb)) x.winsB++; continue; }
    x.farmN++; x.killsA += ra.kills; x.killsB += rb.kills;
    if (died(ra)) x.deathsA++; if (died(rb)) x.deathsB++;
    if (died(ra) && !died(rb)) x.saved++; if (!died(ra) && died(rb)) x.lost++;
  }
  console.log(`\n## ${a} -> ${b}`);
  for (const k of Object.keys(g).sort()) console.log(k.padEnd(34), JSON.stringify(g[k]));
  return g;
}
const MELEE = new Set(['squire', 'striker', 'conduit']);
for (const [a, b] of [['original', 'pipeline'], ['pipeline', 'candidate'], ['original', 'candidate']]) {
  compare(a, b, r => `t${r.tier}`);
  compare(a, b, r => r.className);
  compare(a, b, r => `t${r.tier} ${r.className}`);
  compare(a, b, r => `${r.kind} t${r.tier} ${r.armor}`);
  compare(a, b, r => (MELEE.has(r.className) ? 'melee+conduit' : 'ranged/caster') + ` t${r.tier}`);
}

// Death attribution in the candidate arm: which monsters/abilities land the killing blow.
for (const a of Object.keys(arms)) {
  const causes = {};
  for (const r of arms[a].values()) if (died(r)) { const last = r.lastHits.at(-1); const k = last ? `${last.attacker}${last.ability ? ':' + last.ability : ''}` : 'non-direct'; causes[k] = (causes[k] ?? 0) + 1; }
  console.log(`\n## ${a} killing blows (top 15)`);
  for (const [k, n] of Object.entries(causes).sort((x, y) => y[1] - x[1]).slice(0, 15)) console.log(String(n).padStart(4), k);
}
