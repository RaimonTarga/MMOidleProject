import * as S from '@mmo-idle/shared';
const { ITEM_DATABASE, RECIPE_DATABASE } = S as any;
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const rows: Record<number, { a0: number[]; a5: number[]; d0: number[]; d5: number[] }> = {};
for (const [id, r] of RECIPE_DATABASE as Map<string, any>) {
  if (r.slot !== 'weapon') continue; const it = ITEM_DATABASE.get(id); if (!it) continue;
  let a5 = it.statModifiers?.attack ?? 0, aps5 = it.attacksPerSecond;
  for (const u of it.upgrades ?? []) { a5 += u.stats?.attack ?? 0; aps5 += u.attacksPerSecond ?? 0; }
  const t = (rows[r.tier] ??= { a0: [], a5: [], d0: [], d5: [] });
  t.a0.push(it.statModifiers?.attack ?? 0); t.a5.push(a5); t.d0.push((it.statModifiers?.attack ?? 0) * it.attacksPerSecond); t.d5.push(a5 * aps5);
}
let prev = 0;
for (const t of [1, 2, 3, 4]) { const r = rows[t]!; const d5 = med(r.d5); console.log(`T${t} n=${r.d5.length} median raw weapon DPS +0 ${med(r.d0).toFixed(0)} +5 ${d5.toFixed(0)} (+5/+0 ${(d5 / med(r.d0)).toFixed(2)}) tier step +5/prev+5 ${prev ? (d5 / prev).toFixed(2) : '-'}`); prev = d5; }
