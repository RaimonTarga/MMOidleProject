import * as S from '@mmo-idle/shared';
const { ITEM_DATABASE, RECIPE_DATABASE, SKILL_TREE, ABILITY_DATABASE } = S as any;
const out: string[] = [];
for (const tier of [3, 4]) {
  for (const slot of ['weapon','armor','recovery','mobility','core','relic']) {
    out.push(`\n## T${tier} ${slot}`);
    for (const [id, r] of RECIPE_DATABASE as Map<string, any>) {
      if (r.tier !== tier || r.slot !== slot) continue;
      const it = ITEM_DATABASE.get(id); if (!it) continue;
      let atk = it.statModifiers?.attack ?? 0, aps = it.attacksPerSecond ?? 0; const st5: Record<string, number> = { ...(it.statModifiers ?? {}) };
      const me5: Record<string, number> = { ...(it.mechanicEffects ?? {}) };
      for (const u of it.upgrades ?? []) { for (const [k, v] of Object.entries(u.stats ?? {})) st5[k] = (st5[k] ?? 0) + (v as number); aps += u.attacksPerSecond ?? 0; for (const [k, v] of Object.entries(u.mechanicEffects ?? {})) me5[k] = +((me5[k] ?? 0) + (v as number)).toFixed(3); }
      const extra = slot === 'weapon' ? `atk ${atk}->${st5.attack} aps ${it.attacksPerSecond}->${+aps.toFixed(2)} dps0 ${(atk*it.attacksPerSecond).toFixed(0)} dps5 ${(st5.attack*aps).toFixed(0)}` : `stats5 ${JSON.stringify(st5)}`;
      out.push(`${id} | ${r.name} | ${r.recipeGroup} L${r.requiredBiomeLevel} ${r.coreEligibility ?? ''} | ${extra} | me5 ${JSON.stringify(me5)}`);
    }
  }
}
out.push('\n## T4 specs');
for (const [id, n] of SKILL_TREE as Map<string, any>) if (/-t3-[abc]$/.test(id)) out.push(`${id} | ${n.name}`);
out.push('\n## frames/ranges');
for (const [id, n] of SKILL_TREE as Map<string, any>) if (/-(light|balanced|heavy)$|-range-/.test(id)) out.push(`${id} | ${n.name}`);
out.push('\n## abilities');
for (const [id, a] of ABILITY_DATABASE as Map<string, any>) out.push(`${id} | ${a.name} | ${a.kind ?? a.category ?? ''} | cost ${a.attunementCost} | tier ${a.tier ?? ''}`);
out.push('\n## stances');
for (const st of (S as any).STANCE_DEFINITIONS ?? (S as any).STANCES ?? []) out.push(`${st.id} | ${st.name} | rp ${st.runeCost} | tier ${st.tier}`);
out.push('\n## rune budget by mastery');
for (const m of [10, 20, 40, 60, 80, 100, 120, 140]) out.push(`${m}: ${(S as any).runeBudgetForGlobalMastery(m)}`);
console.log(out.join('\n'));
console.log('\nexports with STANCE/RITE:', Object.keys(S).filter(k => /STANCE|RITE/i.test(k)).join(', '));
