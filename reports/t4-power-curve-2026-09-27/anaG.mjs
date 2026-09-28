import { readFileSync } from 'node:fs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const G = readFileSync(`${T}/resG.jsonl`, 'utf8').trim().split('\n').map(JSON.parse);
const B = readFileSync(`${T}/resB.jsonl`, 'utf8').trim().split('\n').map(JSON.parse).filter((r) => !r.id.endsWith('-off') && r.cls !== 'conduit' && r.tier >= 3);
console.log('rows', G.length, 'errors', G.filter((r) => r.error).length);
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r0 = (x) => x == null ? '—' : Math.round(x);
const arms = [['T3 ×1', B.filter((r) => r.tier === 3)], ['T3 ×1.5', G.filter((r) => r.treatment === 'hpx:1.5')], ['T4 ×1', B.filter((r) => r.tier === 4)], ['T4 ×3', G.filter((r) => r.treatment === 'hpx:3')], ['T4 ×5', G.filter((r) => r.treatment === 'hpx:5')]];
const nodes = [...new Set([...B, ...G].map((r) => r.node))];
console.log('| boss | ' + arms.map(([a]) => a).join(' | ') + ' |');
for (const n of nodes) {
  const cells = arms.map(([, rs]) => { const x = rs.filter((r) => r.node === n); if (!x.length) return null; const w = x.filter((r) => r.won); return `${r0(med(w.map((r) => r.t)))} s, ${Math.round(100 * w.length / x.length)}%`; });
  if (cells.every((c) => c === null)) continue;
  console.log(`| ${n.replace(/node-|-dungeon/g, '')} | ${cells.map((c) => c ?? '').join(' | ')} |`);
}
console.log('| **all** | ' + arms.map(([, rs]) => { const w = rs.filter((r) => r.won); return `**${r0(med(w.map((r) => r.t)))} s, ${Math.round(100 * w.length / rs.length)}%**`; }).join(' | ') + ' |');
console.log('\noutcomes:'); for (const [a, rs] of arms) { const m = {}; for (const r of rs) m[r.outcome ?? 'error'] = (m[r.outcome ?? 'error'] ?? 0) + 1; console.log(a, JSON.stringify(m)); }
console.log('\nT4 ×5 per class (median s, win%):'); for (const c of ['squire', 'striker', 'apprentice', 'slinger', 'spirit']) { const x = G.filter((r) => r.treatment === 'hpx:5' && r.cls === c); const w = x.filter((r) => r.won); console.log(c, r0(med(w.map((r) => r.t))), Math.round(100 * w.length / x.length)); }
console.log('\nT4 ×5 min HP% median (wins):', med(G.filter((r) => r.treatment === 'hpx:5' && r.won).map((r) => r.minHpPct)), ' ×1:', med(B.filter((r) => r.tier === 4 && r.won).map((r) => r.minHpPct)));
