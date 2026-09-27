import { readFileSync } from 'node:fs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const rows = readFileSync(`${T}/resA2.jsonl`, 'utf8').trim().split('\n').map(JSON.parse).filter((r) => r.id.includes('-w-'));
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const cells = [...new Set(rows.map((r) => `${r.cls}-${r.frame}`))];
const best = {};
for (const c of cells) {
  const rs = rows.filter((r) => `${r.cls}-${r.frame}` === c).sort((a, b) => b.dps60 - a.dps60);
  best[c] = rs[0];
  console.log(c.padEnd(22), rs.slice(0, 3).map((r) => `${r.pkg.gear.weapon.replace(/^[a-z]+-/, '')}:${r.dps60}`).join('  '));
}
const W = [...new Set(rows.map((r) => r.pkg.gear.weapon))];
console.log('\nweapon median across all T3 cells (dps60 heavy):');
for (const w of W) console.log(w.padEnd(28), med(rows.filter((r) => r.pkg.gear.weapon === w && r.cls !== 'conduit').map((r) => r.dps60)));
console.log('\nbest-weapon T3 class median (no conduit):', med(Object.entries(best).filter(([k]) => !k.startsWith('conduit')).map(([, r]) => r.dps60)));
for (const cls of ['squire', 'striker', 'apprentice', 'slinger', 'spirit', 'conduit']) console.log(cls, med(Object.entries(best).filter(([k]) => k.startsWith(cls + '-')).map(([, r]) => r.dps60)));
