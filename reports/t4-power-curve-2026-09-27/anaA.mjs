import { readFileSync } from 'node:fs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const rows = readFileSync(`${T}/resA2.jsonl`, 'utf8').trim().split('\n').map(JSON.parse);
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const CLS = ['squire', 'striker', 'apprentice', 'slinger', 'spirit', 'conduit'];
// reference hit per tier = median boss attack (tier tables): T1..T4
const HIT = { 1: 30, 2: 60, 3: 120, 4: 185 };
const ehp = (l, tier) => { const h = HIT[tier]; const f = Math.max(0, h - l.plating) / h * (1 - l.dr) * (1 - (l.evasion || 0)); return Math.round((l.maxHp + (l.barrier || 0)) / f); };
for (const trt of ['dummy-armored', 'dummy-heavy']) {
  console.log(`\n### ${trt}: median DPS (60 s window) across frames/specs, and T(n)/T(n-1)`);
  console.log('| class | T1 | T2 | T3 | T4 | T2/T1 | T3/T2 | T4/T3 | T4 min–max |');
  const allT = { 1: [], 2: [], 3: [], 4: [] };
  for (const cls of CLS) {
    const m = {}; let rng = '';
    for (const t of [1, 2, 3, 4]) {
      const rs = rows.filter((r) => r.cls === cls && r.tier === t && r.treatment === trt && r.id.endsWith("-norm"));
      m[t] = med(rs.map((r) => r.dps60)); allT[t].push(m[t]);
      if (t === 4) { const v = rs.map((r) => r.dps60).sort((a, b) => a - b); rng = `${v[0]}–${v.at(-1)}`; }
    }
    console.log(`| ${cls} | ${m[1]} | ${m[2]} | ${m[3]} | ${m[4]} | ${(m[2] / m[1]).toFixed(2)} | ${(m[3] / m[2]).toFixed(2)} | ${(m[4] / m[3]).toFixed(2)} | ${rng} |`);
  }
  const g = { 1: med(allT[1].slice(0, 5)), 2: med(allT[2].slice(0, 5)), 3: med(allT[3].slice(0, 5)), 4: med(allT[4].slice(0, 5)) };
  console.log(`| **median (no Conduit)** | ${g[1]} | ${g[2]} | ${g[3]} | ${g[4]} | ${(g[2] / g[1]).toFixed(2)} | ${(g[3] / g[2]).toFixed(2)} | ${(g[4] / g[3]).toFixed(2)} | |`);
}
console.log('\n### eHP (median across frames/specs; pool = maxHp+barrier, eHP vs tier median boss hit)');
console.log('| class | T1 pool/eHP | T2 | T3 | T4 | eHP T4/T3 |');
for (const cls of CLS) {
  const cells = {}; const e = {};
  for (const t of [1, 2, 3, 4]) {
    const rs = rows.filter((r) => r.cls === cls && r.tier === t && r.treatment === 'dummy-heavy');
    const pool = med(rs.map((r) => r.loadout.maxHp + (r.loadout.barrier || 0))); e[t] = med(rs.map((r) => ehp(r.loadout, t)));
    cells[t] = `${pool} / ${e[t]}`;
  }
  console.log(`| ${cls} | ${cells[1]} | ${cells[2]} | ${cells[3]} | ${cells[4]} | ${(e[4] / e[3]).toFixed(2)} |`);
}
console.log('\n### T4 per spec, dummy-heavy dps60 (sorted)');
const t4 = rows.filter((r) => r.tier === 4 && r.treatment === 'dummy-heavy').sort((a, b) => b.dps60 - a.dps60);
console.log(t4.map((r) => `${r.cls}-${r.frame}-${r.path}:${r.dps60} (${r.pkg.gear.weapon.replace(/^[a-z]+-/, '')}, ${r.pkg.gear.core}, ${r.pkg.gear.relic?.replace('relic-', '')})`).join('\n'));
console.log('\n### T3 per frame, dummy-heavy dps60');
console.log(rows.filter((r) => r.tier === 3 && r.treatment === 'dummy-heavy').map((r) => `${r.cls}-${r.frame}:${r.dps60} (${r.pkg.gear.weapon}, ${r.pkg.gear.core}, ${JSON.stringify(r.pkg.abilities)})`).join('\n'));
