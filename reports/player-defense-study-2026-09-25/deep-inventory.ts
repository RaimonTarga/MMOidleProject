import { writeFileSync } from 'node:fs';
import { ITEM_DATABASE } from '../../shared/src/itemDatabase';
import { RECIPE_DATABASE } from '../../shared/src/recipeDatabase';
import { SKILL_TREE } from '../../shared/src/skillTree';
import { getMaxUpgrade, upgradeStatBonusTotal, upgradeMechanicEffectsTotal } from '../../shared/src/systems/itemUpgrades';
import { mergePassives } from '../../shared/src/passives';
import { previewEquipmentStats } from '../../shared/src/systems/equipmentPreview';
import { emptyEquipment } from '../../shared/src/items';

const defenseKey = /defense\.|guard\.|heal|ward|barrier|absorb|resist|plating|recovery|damage-taken|dr-layer|tenacity|invuln|evade/;
const defensiveStats = new Set(['maxHp','maxHpPct','plating','platingPct','damageReduction','evasion','recovery']);
const compactStats = (stats:Record<string,number>) => Object.fromEntries(Object.entries(stats).filter(([k])=>defensiveStats.has(k)));
const items=[...ITEM_DATABASE.values()].map(item=>{
  const recipe=RECIPE_DATABASE.get(item.id)!;
  const plus=getMaxUpgrade(item);
  const stats={...item.statModifiers};
  for(const [k,v] of Object.entries(upgradeStatBonusTotal(item,plus))) stats[k]=(stats[k]??0)+v;
  const mechanics:Record<string,number>={};
  mergePassives(mechanics,item.mechanicEffects);
  mergePassives(mechanics,upgradeMechanicEffectsTotal(item,plus));
  return {id:item.id,name:item.name,tier:item.tier,slot:item.slot,coreEligibility:recipe.coreEligibility,biome:item.biomeGroup,evolvesFrom:recipe.evolvesFrom,requiredBiomeLevel:recipe.requiredBiomeLevel,baseStats:item.statModifiers,maxStats:stats,baseMechanics:item.mechanicEffects??{},maxMechanics:mechanics,maxPlus:plus};
});
const nodes=[...SKILL_TREE.values()].filter(n=>Object.keys(n.statEffects).some(k=>defensiveStats.has(k)) || Object.keys(n.mechanicEffects??{}).some(k=>defenseKey.test(k))).map(n=>({id:n.id,name:n.name,tier:n.tier,classId:n.classId,frame:n.subVariantId,defensiveStats:compactStats(n.statEffects),mechanics:n.mechanicEffects??{},description:n.description}));
const armors=items.filter(x=>x.slot==='armor');
const cores=items.filter(x=>x.slot==='core');
const rangedExamples=[0,3,5].flatMap(plus=>[null,'core-force','core-scout','core-sniper','core-tempered'].map(core=>{
  const result=previewEquipmentStats({usesSkills:{selectedClass:'reload-root',selectedSubVariant:'light',selectedRange:'reload-range-far',combatArchetype:'reload',unlockedSkills:['reload-root','reload-light','reload-range-far'],passives:{}},equipment:{...emptyEquipment(),armor:'jungle-vest-t3',core},itemUpgrades:{'jungle-vest-t3':plus},playerTier:3,activeStance:null});
  const {maxHp,plating,damageReduction,dodgeRate,evadeMitigation}=result.stats;
  return {plus,core,maxHp,plating,damageReduction,dodgeRate,evadeMitigation,ordinary179UnEvaded:Math.max(1,Math.round((179-plating)*(1-damageReduction))),eruption650UnEvaded:Math.max(1,Math.round((650-plating)*(1-damageReduction)))};
}));
const supportingItems=items.filter(x=>x.slot!=='armor'&&Object.keys(x.maxMechanics).some(k=>defenseKey.test(k)));
const specializations=[...SKILL_TREE.values()].filter(n=>n.tier===3).map(n=>({id:n.id,name:n.name,classId:n.classId,frame:n.subVariantId,stats:n.statEffects,mechanics:n.mechanicEffects??{},description:n.description}));
const frameTotals=[...SKILL_TREE.values()].filter(n=>n.tier===1).map(frame=>{
  const root=SKILL_TREE.get(frame.classId!)!;
  const total:Record<string,number>={};
  for(const node of [root,frame]) for(const [k,v] of Object.entries(node.statEffects)) if(defensiveStats.has(k)) total[k]=(total[k]??0)+v;
  return {root:root.name,frame:frame.name,frameId:frame.id,rootPlusFrame:total};
});
const armorPreview=(armor:string,stance:string|null,core:string|null)=>previewEquipmentStats({
  usesSkills:{selectedClass:'cooldown-root',selectedSubVariant:'heavy',selectedRange:'cooldown-range-close',combatArchetype:'cooldown',unlockedSkills:['cooldown-root','cooldown-heavy','cooldown-range-close'],passives:{}},
  equipment:{...emptyEquipment(),armor,core},itemUpgrades:{[armor]:5},playerTier:3,activeStance:stance,
});
const examples=['tundra-vest-t4','volcanic-vest-t4','trench-vest-t4'].map(armor=>{
  const basic=armorPreview(armor,null,null);
  const bunker=armorPreview(armor,'tanking-stance','core-juggernaut');
  return {armor,basic,bunker};
});
writeFileSync(new URL('./deep-inventory.json',import.meta.url),JSON.stringify({scope:'Static authored definitions and max upgrades, not acquisition validation or measured combat. Ranged examples omit weapon/charm/relic/specialization, Heat, guards, other buffs and actual damage execution; not a death reproduction.',armors,cores,rangedExamples,supportingItems,nodes,specializations,frameTotals,examples},null,2)+'\n');
const lines=['# Current armor and class defense inventory','', 'Generated from live local imports. Maximum upgrades are authored maxima, not affordability evidence.','', '## Armors',''];
for(const a of armors) lines.push(`### ${a.name} (${a.id})`,`Tier ${a.tier}; ${a.biome}; level ${a.requiredBiomeLevel}; predecessor ${a.evolvesFrom??'none'}.`,`- Base stats: ${JSON.stringify(a.baseStats)}`,`- Max stats: ${JSON.stringify(a.maxStats)}`,`- Base mechanics: ${JSON.stringify(a.baseMechanics)}`,`- Max mechanics: ${JSON.stringify(a.maxMechanics)}`,'');
lines.push('## All cores','');
for(const c of cores) lines.push(`### ${c.name} (${c.id})`,`Tier ${c.tier}; eligibility ${c.coreEligibility}; ${c.biome}; level ${c.requiredBiomeLevel}.`,`- Mechanics: ${JSON.stringify(c.baseMechanics)}`,'');
lines.push('## Constructed ranged sensitivity examples','', 'Slinger light/far, Jungle T3 only, no other gear/stance/specialization. Un-evaded damage arithmetic excludes Heat and other runtime multipliers. Not the reported player build or a combat reproduction.','');
for(const r of rangedExamples) lines.push(`- ${JSON.stringify(r)}`);
lines.push('## Defensive class nodes','');
for(const n of nodes) lines.push(`### ${n.name} (${n.id})`,`Tree tier ${n.tier}; class ${n.classId}; frame ${n.frame}.`,`- Stats: ${JSON.stringify(n.defensiveStats)}`,`- Mechanics: ${JSON.stringify(n.mechanics)}`,n.description,'');
lines.push('## All authored specializations (including indirect defense)','');
for(const n of specializations) lines.push(`### ${n.name} (${n.id})`,n.description,`- Stats: ${JSON.stringify(n.stats)}; mechanics: ${JSON.stringify(n.mechanics)}`,'');
lines.push('## Root plus frame totals (before range, gear, core and stance)','');
for(const n of frameTotals) lines.push(`- ${n.root} / ${n.frame}: ${JSON.stringify(n.rootPlusFrame)}`);
writeFileSync(new URL('./CURRENT-INVENTORY.md',import.meta.url),lines.join('\n')+'\n');
console.log(JSON.stringify({armors:armors.length,supportingItems:supportingItems.length,defensiveNodes:nodes.length,specializations:specializations.length,frameTotals,examples:examples.map(x=>({armor:x.armor,basic:x.basic.stats,bunker:x.bunker.stats}))},null,2));
