import { LINEAGE_DATABASE, RECIPE_DATABASE, biomeLevelCap, globalMastery, lineageMasteryLevelForRow, lineageMasteryLevelForGate, rowBiomeLevel, gateBiomeLevel, biomeXpForBiomeLevel, GAME_CONFIG } from '@mmo-idle/shared';
import { LINEAGE_LANE_PROFILES, LINEAGE_LANE_REFERENCES } from '../../bot/src/tierEntry/profiles';
console.log('--- T1 lane reference equipment (one per lineage)');
for (const r of LINEAGE_LANE_REFERENCES.filter(r => r.lane === null)) {
  const p = LINEAGE_LANE_PROFILES.get(r.profileId)!;
  console.log(r.lineageId.padEnd(12), r.classRoot.padEnd(14), JSON.stringify(p.equipment));
  console.log('   upgrades', JSON.stringify(p.itemUpgrades), 'biomeLevels', JSON.stringify(p.biomeLevels));
}
console.log('\n--- T2 forms + capstone lane');
for (const l of LINEAGE_DATABASE.values()) {
  const t2 = l.forms.filter(f => f.tier === 2);
  if (!t2.length) continue;
  console.log(l.id.padEnd(16), l.slot.padEnd(9), t2.map(f=>`${f.recipeId}(biome=${f.biome}${f.capstone?`,cap=${f.capstone.lane}`:''})`).join('  '));
}
console.log('\n--- caps & mastery');
for (const t of [2,3,4]) console.log('playerTier', t, 'cap plains', biomeLevelCap(t,'plains'), 'jungle', biomeLevelCap(t,'jungle'), 'desert', biomeLevelCap(t,'desert'), 'clearing', biomeLevelCap(t,'clearing'));
console.log('rowBiomeLevel T2:', ['stat','payoff','amplifier'].map(r=>`${r}=${rowBiomeLevel(2,r as any)}`).join(' '), 'gate T1 =', gateBiomeLevel(1), 'gate T2 =', gateBiomeLevel(2));
console.log('masteryForRow T2:', ['stat','payoff','amplifier'].map(r=>`${r}=${lineageMasteryLevelForRow(2,r as any)}`).join(' '), 'gateMastery T1 =', lineageMasteryLevelForGate(1));
const t1at6: Record<string, number> = { plains:6, forest:6, swamp:6, mountain:6, cave:6, clearing:4 };
console.log('globalMastery(T1 all 6):', globalMastery(t1at6));
const t2full: Record<string, number> = { plains:12, forest:12, swamp:12, mountain:12, cave:12, jungle:12, desert:12, clearing:4 };
console.log('globalMastery(T1+T2 all 12):', globalMastery(t2full));
console.log('\n--- recipe existence check for T2 gear');
for (const id of ['plains-vest-t2','forest-vest-t2','mountain-vest-t2','cave-vest-t2','swamp-vest-t2','plains-charm-t2','forest-charm-t2','mountain-charm-t2','cave-charm-t2','swamp-charm-t2','plains-boots-t2','forest-boots-t2','mountain-boots-t2','cave-boots-t2','swamp-boots-t2','gale-needle','knight-steelsword','quake-hammer','ruinous-axe','swamp-mirebrand']) {
  const r = RECIPE_DATABASE.get(id);
  console.log(' ', id.padEnd(22), r ? `slot=${r.slot} tier=${(r as any).tier ?? '?'} biome=${(r as any).biomeGroup ?? (r as any).biome ?? '?'}` : 'MISSING');
}
