import { readFileSync } from 'node:fs';
const load = (f) => readFileSync(f, 'utf8').trim().split('\n').map(JSON.parse);
const V = load('resV.jsonl'), B = load('resB.jsonl'), A2 = load('resA2.jsonl'), C = load('resC.jsonl');
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r0 = (x) => x == null ? '—' : Math.round(x);
console.log('V errors', V.filter((r) => r.error).length, V.filter((r) => r.error).slice(0, 2).map((r) => r.id + ' ' + r.error));
const live = (rows, pre) => rows.filter((r) => !r.error && r.treatment === 'live' && r.id.startsWith(pre));
const vb = live(V, 'V-'), bb = live(B, '');
const arm = (r) => r.id.endsWith('-off') ? 'off' : 'bench';
console.log('\n| tier | boss | HP before → after | bench s before → after (win%) | off s before → after (win%) | Conduit bench s / win% after |');
for (const tier of [1, 2, 3, 4]) {
  const nodes = [...new Set(vb.filter((r) => r.tier === tier).map((r) => r.node))];
  const cell = (rows, n, a) => { const x = rows.filter((r) => r.node === n && arm(r) === a && r.cls !== 'conduit'); if (!x.length) return null; const w = x.filter((r) => r.won); return [med(w.map((r) => r.t)), Math.round(100 * w.length / x.length)]; };
  const summary = { b: [], a: [] };
  for (const n of nodes) {
    const bB = cell(bb, n, 'bench'), aB = cell(vb, n, 'bench'), bO = cell(bb, n, 'off'), aO = cell(vb, n, 'off');
    const cx = vb.filter((r) => r.node === n && r.cls === 'conduit' && arm(r) === 'bench'); const cw = cx.filter((r) => r.won);
    const hpB = bb.find((r) => r.node === n)?.bossMaxHp, hpA = vb.find((r) => r.node === n)?.bossMaxHp;
    console.log(`| T${tier} | ${n.replace(/node-t\d-|-dungeon/g, '')} | ${hpB} → ${hpA} | ${r0(bB?.[0])} → ${r0(aB?.[0])} (${bB?.[1]} → ${aB?.[1]}%) | ${bO ? `${r0(bO[0])} → ${r0(aO?.[0])} (${bO[1]} → ${aO?.[1]}%)` : '—'} | ${r0(med(cw.map((r) => r.t)))} / ${Math.round(100 * cw.length / Math.max(1, cx.length))}% |`);
  }
  for (const [lbl, rows] of [['before', bb], ['after', vb]]) for (const a of ['bench', 'off']) {
    const x = rows.filter((r) => r.tier === tier && arm(r) === a && r.cls !== 'conduit'); if (!x.length) continue; const w = x.filter((r) => r.won);
    console.log(`  T${tier} ${lbl} ${a}: median ${r0(med(w.map((r) => r.t)))} s, wins ${Math.round(100 * w.length / x.length)}%`);
  }
}
console.log('\n### Normalized DPS medians (heavy dummy, non-Conduit), before → after');
for (const tier of [1, 2, 3, 4]) {
  const f = (rows, pre) => med(rows.filter((r) => !r.error && r.tier === tier && r.treatment === 'dummy-heavy' && r.cls !== 'conduit' && r.id.startsWith(pre) && r.id.endsWith('-norm')).map((r) => r.dps60));
  const g = (rows, pre) => { const v = rows.filter((r) => !r.error && r.tier === tier && r.treatment === 'dummy-heavy' && r.cls !== 'conduit' && r.id.startsWith(pre) && r.id.endsWith('-norm')).map((r) => r.dps60).sort((a, b) => a - b); return `${v[0]}–${v.at(-1)}`; };
  console.log(`T${tier}: ${f(A2, 't')} → ${f(V, 'V-')}   range ${g(A2, 't')} → ${g(V, 'V-')}`);
}
console.log('\n### Trench trash TTK (offensive, one mob), before → after');
for (const mob of ['abyssal-serpent', 'hadal-stalker', 'elder-leviathan']) {
  const f = (rows) => med(rows.filter((r) => !r.error && r.tier === 4 && r.cls !== 'conduit' && r.treatment === `trash:${mob}`).map((r) => r.fightS));
  console.log(mob, f(C), '→', f(V.filter((r) => r.id.startsWith('V-'))));
}
