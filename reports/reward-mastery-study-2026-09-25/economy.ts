import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECIPE_DATABASE, ITEM_DATABASE, MONSTER_DATABASE, GAME_CONFIG, upgradeCostFor, upgradeCatalystCostFor, globalMasteryRequiredForUpgrade, maxGlobalMasteryAtTier, biomeLevelCap, checkUpgrade, ESSENCE_TYPES, type EssenceType } from '../../shared/src/index';
import { ABILITY_RECIPE_DATABASE } from '../../shared/src/abilityRecipes';
import { STANCE_RECIPE_DATABASE } from '../../shared/src/stanceRecipes';
import { RITE_RECIPE_DATABASE } from '../../shared/src/riteRecipes';
import { RUNE_RECIPE_DATABASE } from '../../shared/src/runeRecipes';

const out = dirname(fileURLToPath(import.meta.url));
const inventory = JSON.parse(readFileSync(resolve(out, 'inventory.json'), 'utf8'));
type Wallet = Record<string, number>;
const add = (...wallets: (Wallet | undefined)[]): Wallet => {
  const result: Wallet = {};
  for (const w of wallets) for (const [k, v] of Object.entries(w ?? {})) result[k] = (result[k] ?? 0) + v;
  return result;
};
const total = (w: Wallet) => Object.values(w).reduce((a, b) => a + b, 0);
const slots = ['weapon', 'armor', 'recovery', 'mobility'];
const median = (v: number[]) => { const a = [...v].sort((x,y) => x-y); return (a[Math.floor((a.length-1)/2)] + a[Math.ceil((a.length-1)/2)]) / 2; };
const range = (v: number[]) => ({ min: Math.min(...v), median: median(v), max: Math.max(...v) });
const recipes = [...RECIPE_DATABASE.values()].filter(r => r.tier >= 1 && r.tier <= 4 && slots.includes(r.slot) && !r.requiredBossClear).map(r => {
  const item = ITEM_DATABASE.get(r.id)!;
  if (r.upgrades?.length !== 5) throw new Error(`Nonstandard upgrades ${r.id}`);
  const steps = Array.from({length:5}, (_,i) => upgradeCostFor(item, i+1) as Wallet);
  const cats = Array.from({length:5}, (_,i) => upgradeCatalystCostFor(item, i+1) as Wallet | undefined);
  const base = r.cost as Wallet;
  const reconstruct = (r.evolvesFrom ? r.reconstructCost : r.cost) as Wallet;
  if (!reconstruct) throw new Error(`No reconstruct path ${r.id}`);
  return { id:r.id, name:r.name, tier:r.tier, biome:r.recipeGroup, slot:r.slot, predecessor:r.evolvesFrom,
    base, reconstruct, steps, upgradeOnly3:add(...steps.slice(0,3)),
    cost3:add(base,...steps.slice(0,3)), cost5:add(base,...steps),
    reconstruct3:add(reconstruct,...steps.slice(0,3)), reconstruct5:add(reconstruct,...steps),
    catalyst3:add(r.catalystCost,...cats.slice(0,3)), catalyst5:add(r.catalystCost,...cats),
    reconstructCatalyst3:add(r.evolvesFrom ? r.reconstructCatalystCost : r.catalystCost,...cats.slice(0,3)),
    reconstructCatalyst5:add(r.evolvesFrom ? r.reconstructCatalystCost : r.catalystCost,...cats),
    requiredBiomeLevel:r.requiredBiomeLevel, upgradeLevels:r.upgrades.map(u=>u.requiredBiomeLevel) };
});
const groups:any[] = [];
const keys = [...new Set(inventory.rows.map((r:any) => `${r.tier}:${r.biome}`))] as string[];
for (const key of keys) {
  const [tierStr, biome] = key.split(':'); const tier = Number(tierStr);
  const bySlot = slots.map(slot => recipes.filter(r => r.tier === tier && r.biome === biome && r.slot === slot));
  if (bySlot.some(a=>!a.length)) throw new Error(`Incomplete native set ${key}`);
  let combos: (typeof recipes)[] = [[]];
  for (const options of bySlot) combos = combos.flatMap(c => options.map(r=>[...c,r]));
  const kits = combos.map(c => {
    const cost3=add(...c.map(r=>r.cost3)), cost5=add(...c.map(r=>r.cost5));
    const reconstruct3=add(...c.map(r=>r.reconstruct3)), reconstruct5=add(...c.map(r=>r.reconstruct5));
    return { ids:c.map(r=>r.id), cost3, cost5, total3:total(cost3), total5:total(cost5), ratio5to3:total(cost5)/total(cost3), reconstruct3,reconstruct5,
      reconstructTotal3:total(reconstruct3), reconstructRatio5to3:total(reconstruct5)/total(reconstruct3),
      upgradeOnly3:total(add(...c.map(r=>r.upgradeOnly3))),
      catalyst3:add(...c.map(r=>r.catalyst3)), catalyst5:add(...c.map(r=>r.catalyst5)),
      reconstructCatalyst3:add(...c.map(r=>r.reconstructCatalyst3)), reconstructCatalyst5:add(...c.map(r=>r.reconstructCatalyst5)) };
  });
  kits.sort((a,b)=>a.total3-b.total3);
  const nodes = inventory.rows.filter((r:any)=>r.tier===tier && r.biome===biome);
  const epX = median(nodes.map((n:any)=>n.expectedEssencePerBody/n.expectedXpPerBody));
  const reference = kits[Math.floor((kits.length-1)/2)];
  const baselineXp = nodes[0].budget;
  groups.push({tier,biome,kitCount:kits.length,baselineXp,essencePerXp:epX,essenceAtCurrentCap:range(nodes.map((n:any)=>n.expectedEssenceDuringSegment)),
    plus3:range(kits.map(k=>k.total3)),plus5:range(kits.map(k=>k.total5)),ratio5to3:range(kits.map(k=>k.ratio5to3)),
    reconstruct3:range(kits.map(k=>k.reconstructTotal3)),reconstructRatio5to3:range(kits.map(k=>k.reconstructRatio5to3)),
    xpToFundReference3AtCurrentDrops:reference.total3/epX,
    reference, kits });
}
const summary = [1,2,3,4].map(tier => {
  const g=groups.filter(g=>g.tier===tier);
  return {tier,biomes:g.length,recipes:recipes.filter(r=>r.tier===tier).length,
    cost3:range(g.map(g=>g.plus3.median)),cost5:range(g.map(g=>g.plus5.median)),ratio5to3:range(g.map(g=>g.ratio5to3.median)),
    reconstruct3:range(g.map(g=>g.reconstruct3.median)),
    essenceAtCap:range(g.map(g=>g.essenceAtCurrentCap.median)),
    xpFor3:range(g.map(g=>g.xpToFundReference3AtCurrentDrops)),
    gmFor3:globalMasteryRequiredForUpgrade(tier,3),gmFor5:globalMasteryRequiredForUpgrade(tier,5),gmAtEntry:maxGlobalMasteryAtTier(tier-1),
    firstBiomeCapGm:maxGlobalMasteryAtTier(tier-1)+6 };
});
writeFileSync(resolve(out,'economy-inventory.json'),JSON.stringify({generatedAt:new Date().toISOString(),note:'All four-slot native combinations; evolution costs assume a +3 predecessor is already owned and sunk. Color totals are not fungible wallets.',summary,recipes,groups},null,2)+'\n');
const lines=['# Native gear cost and supply comparison','','One weapon, armor, recovery and mobility item; core/relic and other unlocks excluded. Costs include acquisition/evolution and upgrades. Evolution assumes the predecessor already exists at +3. Ranges are across all native four-slot combinations; median is descriptive, not build popularity. Essence is summed across colors for comparison only.','','| Tier | Biome | +3 set | +5 set | +5/+3 | Essence at current cap | XP to fund reference +3 at current drops |','|---|---|---:|---:|---:|---:|---:|'];
for(const g of groups) lines.push(`| ${g.tier} | ${g.biome} | ${g.plus3.min}–${g.plus3.max} | ${g.plus5.min}–${g.plus5.max} | ${g.ratio5to3.min.toFixed(2)}–${g.ratio5to3.max.toFixed(2)} | ${Math.round(g.essenceAtCurrentCap.median)} | ${Math.round(g.xpToFundReference3AtCurrentDrops)} |`);
writeFileSync(resolve(out,'ECONOMY-INVENTORY.md'),lines.join('\n')+'\n');
const candidateXp = [0,6000,18000,42000,108000];
const candidateCatalystScalars:Record<number,number> = {1:.5,2:5000/18000,3:7000/42000,4:9000/108000};
// Candidate only: preserve each item's base and lifetime essence by color.
// Split the remaining early budget equally over +1..+3 and tail over +4..+5.
const proposedRecipes = recipes.map(r=>{
  const steps:Wallet[] = Array.from({length:5},()=>({}));
  for(const color of Object.keys(r.cost5)) {
    const lifetime=r.cost5[color], base=r.base[color]??0;
    const early=Math.round(lifetime*2/3)-base, tail=lifetime-base-early;
    if(early<0 || tail<0) throw new Error(`Invalid split ${r.id}/${color}`);
    for(let i=0;i<3;i++) steps[i][color]=Math.round(early*(i+1)/3)-Math.round(early*i/3);
    for(let i=0;i<2;i++) steps[i+3][color]=Math.round(tail*(i+1)/2)-Math.round(tail*i/2);
  }
  const cost3=add(r.base,...steps.slice(0,3)),cost5=add(r.base,...steps);
  for(const color of Object.keys(cost5)) if(cost5[color]!==r.cost5[color]) throw new Error(`Lifetime changed ${r.id}`);
  return {id:r.id,base:r.base,steps,cost3,cost5,reconstruct3:add(r.reconstruct,...steps.slice(0,3)),reconstruct5:add(r.reconstruct,...steps)};
});
let upgradeChecks=0;
for (const proposed of proposedRecipes) {
  const original=recipes.find(r=>r.id===proposed.id)!;
  const source=ITEM_DATABASE.get(proposed.id)!;
  const item={...source,upgrades:source.upgrades!.map((s,i)=>({...s,cost:proposed.steps[i]}))};
  const essences=Object.fromEntries(ESSENCE_TYPES.map(c=>[c,(proposed.cost5[c]??0)-(proposed.base[c]??0)])) as Record<EssenceType,number>;
  for(let plus=1;plus<=5;plus++) {
    const check=checkUpgrade({item,currentPlus:plus-1,biomeLevel:biomeLevelCap(original.tier,original.biome),essences,catalysts:original.catalyst5,globalMastery:maxGlobalMasteryAtTier(original.tier)});
    if(!check.ok) throw new Error(`Candidate upgrade rejected ${original.id} +${plus}: ${check.reason}`);
    for(const [color,cost] of Object.entries(proposed.steps[plus-1])) essences[color as EssenceType]-=cost;
    upgradeChecks++;
  }
  if(Object.values(essences).some(v=>v!==0)) throw new Error(`Residual upgrade wallet ${original.id}`);
}
writeFileSync(resolve(out,'economy-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),recipes:recipes.length,kits:groups.reduce((n,g)=>n+g.kitCount,0),upgradeChecks,lifetimeColorTotalsPreserved:true,allCandidateUpgradeEssenceWalletsExhaustExactly:true,note:'Shared checkUpgrade at full mastery and sufficient catalysts; no combat, ownership acquisition or elapsed-time simulation.'},null,2)+'\n');
const candidateGroups=groups.map(g=>{
  const nodes=inventory.rows.filter((n:any)=>n.tier===g.tier && n.biome===g.biome);
  const nodeSupplies=nodes.map((n:any)=>{
    const perBody=n.monsters.reduce((sum:number,m:any)=>sum+m.expectedBodyShare*Math.max(1,Math.round(MONSTER_DATABASE.get(m.id)!.rewards.essence*GAME_CONFIG.BIOME_ESSENCE_TIER_MULT[g.tier]*.9*n.rewardMult)),0);
    const catalystWeight=n.monsters.reduce((sum:number,m:any)=>{const def=MONSTER_DATABASE.get(m.id)!;return sum+m.expectedBodyShare*Math.round((def.rewards.catalystWeight??def.rewards.essence)*n.rewardMult)*(GAME_CONFIG.CATALYST_PROGRESS_REWARD_MULT_BY_TIER[g.tier]??1);},0);
    const units=candidateXp[g.tier]/n.expectedXpPerBody*catalystWeight/GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT;
    return {nodeId:n.nodeId,family:n.modifier,essence:candidateXp[g.tier]/n.expectedXpPerBody*perBody,catalystUnitsBeforeFloor:units,proposedCatalystUnitsBeforeFloor:units*candidateCatalystScalars[g.tier]/(GAME_CONFIG.CATALYST_PROGRESS_REWARD_MULT_BY_TIER[g.tier]??1)};
  });
  const supplies=nodeSupplies.map((n:any)=>n.essence);
  const kits=g.kits.map((k:any)=>{
    const items=k.ids.map((id:string)=>proposedRecipes.find(r=>r.id===id)!);
    const cost3=add(...items.map((r:any)=>r.cost3));
    return {ids:k.ids,cost3,total3:total(cost3),total5:k.total5,reconstructTotal3:total(add(...items.map((r:any)=>r.reconstruct3))),
      ratio5to3:k.total5/total(cost3),coverage:median(supplies)/total(cost3),essenceOnlyTime5OverTarget:k.total5/median(supplies)};
  });
  return {tier:g.tier,biome:g.biome,xp:candidateXp[g.tier],supply:range(supplies),cost3:range(kits.map((k:any)=>k.total3)),
    coverage:range(kits.map((k:any)=>k.coverage)),essenceOnlyTime5OverTarget:range(kits.map((k:any)=>k.essenceOnlyTime5OverTarget)),nodeSupplies,kits};
});
const candidateSummary=[1,2,3,4].map(tier=>{
  const gs=candidateGroups.filter(g=>g.tier===tier);
  const base=summary.find(s=>s.tier===tier)!;
  return {tier,xp:candidateXp[tier],essenceMultiplier:GAME_CONFIG.BIOME_ESSENCE_TIER_MULT[tier]*.9,
    targetMinutes:inventory.targetsMinutes[tier-1],requiredXpPerMinute:candidateXp[tier]/inventory.targetsMinutes[tier-1],
    supply:range(gs.map(g=>g.supply.median)),cost3:range(gs.map(g=>g.cost3.median)),cost5:base.cost5,
    coverage:range(gs.map(g=>g.coverage.median)),time5OverMastery:range(gs.map(g=>g.essenceOnlyTime5OverTarget.median))};
});
writeFileSync(resolve(out,'candidate-costs.json'),JSON.stringify({note:'Proposal only. Unchanged base acquisition/evolution and lifetime essence costs, +3 at two-thirds lifetime by color. No game values edited.',xp:candidateXp.slice(1),dropRelativeMultiplier:.9,catalystScalars:candidateCatalystScalars,summary:candidateSummary,groups:candidateGroups,recipes:proposedRecipes},null,2)+'\n');
const ancillary = [
  ...[...ABILITY_RECIPE_DATABASE.values()].map(r=>({...r,kind:'ability'})),
  ...[...STANCE_RECIPE_DATABASE.values()].map(r=>({...r,kind:'stance'})),
  ...[...RITE_RECIPE_DATABASE.values()].map(r=>({...r,kind:'rite'})),
  ...[...RUNE_RECIPE_DATABASE.values()].filter(r=>!r.deprecated).map(r=>({...r,kind:'rune'})),
].filter(r=>r.tier>=1&&r.tier<=4).map(r=>({id:r.id,kind:r.kind,tier:r.tier,biome:r.recipeGroup,cost:r.cost,total:total(r.cost as Wallet)}));
writeFileSync(resolve(out,'ancillary-costs.json'),JSON.stringify({note:'Catalogue, not a mandatory shopping list. Abilities/stances/rites/runes are excluded from primary four-slot gear budgets.',recipes:ancillary,summary:[1,2,3,4].map(tier=>({tier,byKind:['ability','stance','rite','rune'].map(kind=>{const values=ancillary.filter(r=>r.tier===tier&&r.kind===kind);return {kind,count:values.length,cost:values.length?range(values.map(r=>r.total)):null};})}))},null,2)+'\n');
console.log(JSON.stringify(candidateSummary,null,2));
