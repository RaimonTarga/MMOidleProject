import assert from 'node:assert/strict';
import { ABILITY_RECIPE_DATABASE, STANCE_RECIPE_DATABASE, runeIdsForArchetype,
  RECIPE_DATABASE, ITEM_DATABASE, globalMastery, biomeLevelCap,
  getMaxUpgrade, requiredBiomeLevelForUpgrade, upgradeCeilingFromGlobalMastery,
  upgradeCostFor, isAbilityRecipeUnlocked, isStanceRecipeUnlocked,
  ABILITY_DATABASE, abilityRankNumber, bossSealSourcesAtTier, sealsRequiredForTier, sealsHeldAtTier, SKILL_TREE } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../src/ecs/entity';
import type { SurveyCell } from './ttkSurveySpec';

export interface ProgressionSnapshot { id:string; tier:number; mastery:Record<string,number>; gm:number; plus:number; priorBossClears?:string[] }
const early={plains:12,forest:12,swamp:12,mountain:12,cave:12};
const returning={plains:12,forest:12,swamp:18,mountain:18,cave:18,jungle:12,desert:12,volcanic:0,tundra:0};
export const PROGRESSION_SNAPSHOTS:Record<string,ProgressionSnapshot>=Object.fromEntries([
  ['t1-developed',1,{plains:4,forest:4,swamp:4,mountain:5,cave:5},22,3],
  ['t1-complete',1,{plains:6,forest:6,swamp:6,mountain:6,cave:6},30,5],
  ['t2-jungle-arrival',2,{...early,jungle:0,desert:0},60,3],
  ['t2-jungle-established',2,{...early,jungle:4,desert:0},64,4],
  ['t2-desert-arrival',2,{...early,jungle:6,desert:0},66,4],
  ['t2-desert-established',2,{...early,jungle:6,desert:4},70,4],
  ['t3-developed',3,returning,102,3],
  ['t3-tundra-arrival',3,{...returning,volcanic:6},108,4],
].map(([id,tier,mastery,gm,plus])=>[id,{id,tier,mastery,gm,plus}])) as Record<string,ProgressionSnapshot>;

// Synthetic prior paid ownership. Costs come from production definitions; the
// exact finite purse equals the declared purchases, leaving zero starting cash.
// No acquisition time or typical player readiness is inferred.
export function applyProgressionSnapshot(bot:PlayerEntity,cell:SurveyCell) {
  const s=cell.progressionSnapshot!;
  assert.equal(globalMastery(s.mastery),s.gm);
  for(const [g,n] of Object.entries(s.mastery)) assert(n>=0 && n<=biomeLevelCap(s.tier,g));
  const p=bot.tracksProgression;
  p.biomeLevel={...s.mastery}; p.biomeXP={}; p.level=0;
  if(s.priorBossClears){
    p.bossesCleared=[...s.priorBossClears];
    for(const key of p.bossesCleared){const [group,tier]=key.split(':');assert(bossSealSourcesAtTier(Number(tier)).includes(group),`Invalid prior seal ${key}`);}
    for(let tier=1;tier<s.tier;tier++)assert(sealsHeldAtTier(p.bossesCleared,tier)>=sealsRequiredForTier(tier),`Missing T${tier} prior seals`);
    assert(cell.build.skillPath.reduce((sum,id)=>sum+SKILL_TREE.get(id)!.cost,0)<=s.tier,'Class purchases exceed earned tier skill points');
  }
  p.knownAbilities=[];p.knownStances=[];p.knownRites=[];p.equippedRites=[];
  p.runesOwned=runeIdsForArchetype(bot.usesSkills.combatArchetype);
  const purchases:{id:string;kind:string;cost:Record<string,number>}[]=[];
  const pay=(id:string,kind:string,cost:object={})=>purchases.push({id,kind,cost:{...cost}});
  for(const id of [...cell.abilities!.techniques,...cell.abilities!.guards]) {
    const r=[...ABILITY_RECIPE_DATABASE.values()].find(r=>r.abilityId===id)!;
    assert(r && isAbilityRecipeUnlocked(r,p),`${cell.id}: unearned ability ${id}`);
    pay(r.id,'learn-ability',r.cost);p.knownAbilities.push(id);
  }
  if(cell.stance){const r=[...STANCE_RECIPE_DATABASE.values()].find(r=>r.stanceId===cell.stance)!;
    assert(r && isStanceRecipeUnlocked(r,p),`Unearned stance ${cell.stance}`);
    pay(r.id,'learn-stance',r.cost);p.knownStances.push(cell.stance);}
  for(const id of new Set(cell.runeRules!.flatMap(r=>[r.conditionId,r.actionId])))
    assert(p.runesOwned.includes(id),`${cell.id}: rune ${id} is not the class's`);
  p.unlockedRecipes=[...RECIPE_DATABASE.values()].filter(r=>(p.biomeLevel[r.recipeGroup]??0)>=r.requiredBiomeLevel && !r.requiredBossClear).map(r=>r.id);
  for(const id of Object.values(cell.build.gearItemIds)) {
    const r=RECIPE_DATABASE.get(id!)!,item=ITEM_DATABASE.get(id!)!;
    assert(r && p.unlockedRecipes.includes(id!),`${cell.id}: unearned item ${id}`);
    pay(id!,'craft',r.cost);
    let plus=Math.min(cell.upgradeLevel!,getMaxUpgrade(item),upgradeCeilingFromGlobalMastery(s.gm,r.tier));
    while(plus>0 && requiredBiomeLevelForUpgrade(item,plus)>(p.biomeLevel[r.recipeGroup]??0))plus--;
    if(s.id==='t4-established-gm148')assert.equal(plus,['core','relic'].includes(r.slot)?0:4,`${cell.id}: T4 upgrade must not silently clamp ${id}`);
    bot.holdsInventory.itemUpgrades[id!]=plus;
    for(let n=1;n<=plus;n++)pay(`${id}+${n}`,'upgrade',upgradeCostFor(item,n)!);
  }
  const totals={essences:{red:0,blue:0,green:0,yellow:0,purple:0} as Record<string,number>};
  for(const row of purchases)
    for(const [k,v]of Object.entries(row.cost))totals.essences[k]=(totals.essences[k]??0)+v;
  p.essences={red:0,blue:0,green:0,yellow:0,purple:0};
  return {snapshot:s,purchases,priorResources:totals,remainingResources:{essences:p.essences},
    ...(s.priorBossClears?{priorBossClears:[...p.bossesCleared],priorSealOwnership:'Synthetic earned prior clears assumed; no acquisition combat measured',classSkillPointBudget:s.tier,classSkillPointsSpent:cell.build.skillPath.reduce((sum,id)=>sum+SKILL_TREE.get(id)!.cost,0)}:{}),
    acquisition:'Synthetic prior paid ownership; plain craft at production price. No acquisition time measured.',
    abilityRanks:Object.fromEntries(p.knownAbilities.map(id=>[id,abilityRankNumber(ABILITY_DATABASE.get(id)!,s.tier)])),knownAbilities:[...p.knownAbilities],knownStances:[...p.knownStances],runesOwned:[...p.runesOwned]};
}
export const snapshotReceipts=new WeakMap<PlayerEntity,ReturnType<typeof applyProgressionSnapshot>>();
