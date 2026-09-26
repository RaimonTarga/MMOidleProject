import { RECIPE_DATABASE, ITEM_DATABASE } from '@mmo-idle/shared';
const slot = process.argv[2] ?? 'mobility';
const fmt = (o: Record<string, number>) => Object.entries(o).map(([k, v]) => `${k.replace(/^(mobility|defense|guard|technique)\./, '')}=${+(+v).toFixed(3)}`).join(' ');
for (const tier of [1, 2, 3, 4]) {
  for (const r of [...RECIPE_DATABASE.values()] as any[]) {
    if (r.slot !== slot || r.tier !== tier) continue;
    const i = ITEM_DATABASE.get(r.id) as any;
    const st: Record<string, number> = { ...(i.statModifiers ?? {}) }, me: Record<string, number> = { ...(i.mechanicEffects ?? {}) };
    const st5 = { ...st }, me5 = { ...me };
    for (const u of i.upgrades ?? []) { for (const [k, v] of Object.entries(u.stats ?? {})) st5[k] = (st5[k] ?? 0) + (v as number); for (const [k, v] of Object.entries(u.mechanicEffects ?? {})) me5[k] = (me5[k] ?? 0) + (v as number); }
    console.log(`T${tier} ${r.recipeGroup.padEnd(9)} ${r.id.padEnd(30)} +0[${fmt(st)} | ${fmt(me)}]  +5[${fmt(st5)} | ${fmt(me5)}]`);
  }
}
