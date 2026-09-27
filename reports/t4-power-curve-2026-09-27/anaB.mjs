import { readFileSync } from 'node:fs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const rows = readFileSync(`${T}/resB.jsonl`, 'utf8').trim().split('\n').map(JSON.parse);
const errs = rows.filter((r) => r.error); console.log('errors', errs.length, errs.slice(0, 3).map((e) => e.id + ' ' + e.error));
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const arm = (r) => r.id.endsWith('-off') ? 'off' : 'bench';
console.log('\n| tier | arm | boss | win% | median kill s (wins) | p25–p75 | median boss HP | Conduit median |');
for (const tier of [1, 2, 3, 4]) for (const a of ['bench', 'off']) {
  const rs = rows.filter((r) => !r.error && r.tier === tier && arm(r) === a);
  if (!rs.length) continue;
  const nodes = [...new Set(rs.map((r) => r.node))];
  const all = rs.filter((r) => r.cls !== 'conduit');
  const wins = all.filter((r) => r.won);
  const cw = rs.filter((r) => r.cls === 'conduit' && r.won);
  for (const n of nodes) {
    const x = all.filter((r) => r.node === n), w = x.filter((r) => r.won);
    const c = cw.filter((r) => r.node === n);
    console.log(`| T${tier} | ${a} | ${n.replace(/node-t\d-|-dungeon/g, '')} | ${Math.round(100 * w.length / x.length)} | ${med(w.map((r) => r.t))} | ${w.length ? q(w.map((r) => r.t), .25) + '–' + q(w.map((r) => r.t), .75) : ''} | ${x[0].bossMaxHp} | ${med(c.map((r) => r.t)) ?? '—'} |`);
  }
  console.log(`| **T${tier}** | **${a}** | **all** | **${Math.round(100 * wins.length / all.length)}** | **${med(wins.map((r) => r.t))}** | ${q(wins.map((r) => r.t), .25)}–${q(wins.map((r) => r.t), .75)} | ${med(nodes.map((n) => all.find((r) => r.node === n).bossMaxHp))} | ${med(cw.map((r) => r.t))} |`);
}
console.log('\nOutcome mix per tier/arm (non-conduit):');
for (const tier of [1, 2, 3, 4]) for (const a of ['bench', 'off']) {
  const rs = rows.filter((r) => !r.error && r.tier === tier && arm(r) === a && r.cls !== 'conduit'); if (!rs.length) continue;
  const m = {}; for (const r of rs) m[r.outcome] = (m[r.outcome] ?? 0) + 1; console.log(tier, a, JSON.stringify(m));
}
console.log('\nPer class, T4 bench, median kill s / win%:');
for (const cls of ['squire', 'striker', 'apprentice', 'slinger', 'spirit', 'conduit']) {
  for (const tier of [3, 4]) { const rs = rows.filter((r) => !r.error && r.tier === tier && arm(r) === 'bench' && r.cls === cls); const w = rs.filter((r) => r.won); console.log(`T${tier} ${cls}: ${med(w.map((r) => r.t))}s, ${Math.round(100 * w.length / rs.length)}% (dps ${med(w.map((r) => r.dpsAll))})`); }
}
