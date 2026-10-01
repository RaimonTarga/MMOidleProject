import { RECIPE_DATABASE, ITEM_DATABASE, NODE_BIOMES, sealsRequiredForTier, sealsHeldAtTier, biomeLevelCap, globalMastery, upgradeCeilingFromGlobalMastery, requiredBiomeLevelForUpgrade, getMaxUpgrade, biomeXpForBiomeLevel, listBiomeGroupsAtTier } from '@mmo-idle/shared';
const ids = ['knight-steelsword','gale-needle','quake-hammer','ruinous-axe','swamp-mirebrand','mountain-vest-t2','swamp-charm-t2','plains-boots-t2'];
for (const id of ids) {
  const r: any = RECIPE_DATABASE.get(id); const it: any = ITEM_DATABASE.get(id);
  console.log(id.padEnd(20), `group=${r?.recipeGroup} reqLvl=${r?.requiredBiomeLevel} reqBoss=${r?.requiredBossClear ?? '-'} itemTier=${it?.tier} maxUp=${it?`${getMaxUpgrade(it)}`:'?'} up5needs=${it?requiredBiomeLevelForUpgrade(it,5):'?'}`);
}
console.log('\nsealsRequiredForTier(1,2,3):', sealsRequiredForTier(1), sealsRequiredForTier(2), sealsRequiredForTier(3));
const t2b = ['plains:2','forest:2','swamp:2','mountain:2','cave:2','jungle:2','desert:2'];
console.log('sealsHeldAtTier(t1 five,1):', sealsHeldAtTier(['plains:1','forest:1','swamp:1','mountain:1','cave:1'],1));
console.log('sealsHeldAtTier(t2 seven,2):', sealsHeldAtTier(t2b,2));
console.log('\nsanctuaries:', Object.entries(NODE_BIOMES).filter(([,i])=>i.kind==='sanctuary').map(([id,i])=>`${id}(T${i.biomeTier})`).join(' '));
const lv: Record<string,number> = { plains:12, forest:12, swamp:12, mountain:12, cave:12, jungle:6, desert:6, clearing:4 };
const gm = globalMastery(lv);
console.log('\nGM(T1@12 + T2@6):', gm, 'ceiling t2 items:', upgradeCeilingFromGlobalMastery(gm, 2), 'ceiling t1:', upgradeCeilingFromGlobalMastery(gm,1));
console.log('listBiomeGroupsAtTier(2):', listBiomeGroupsAtTier(2));
console.log('biomeXp plains 12:', biomeXpForBiomeLevel('plains',12), 'jungle 6:', biomeXpForBiomeLevel('jungle',6));
console.log('biomeLevelCap(2,...) jungle/desert:', biomeLevelCap(2,'jungle'), biomeLevelCap(2,'desert'));
