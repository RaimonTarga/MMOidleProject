import { writeFileSync } from 'node:fs';
import { ITEM_DATABASE } from '../../shared/src/itemDatabase';
import { MONSTER_DATABASE } from '../../shared/src/monsterDatabase';
import { SKILL_TREE } from '../../shared/src/skillTree';
import { getMaxUpgrade, upgradeStatBonusTotal } from '../../shared/src/systems/itemUpgrades';
import { mergePassives } from '../../shared/src/passives';

// Static authoring census, not simulated combat or attainable ownership.
const armors = [...ITEM_DATABASE.values()].filter(x => x.slot === 'armor').map(x => {
  const maxPlus = getMaxUpgrade(x);
  const upgraded = { ...x.statModifiers };
  for (const [k,v] of Object.entries(upgradeStatBonusTotal(x,maxPlus))) upgraded[k] = (upgraded[k] ?? 0) + v;
  return { id:x.id, name:x.name, tier:x.tier, biome:x.biomeGroup, maxPlus, base:x.statModifiers, upgraded, mechanics:x.mechanicEffects };
});
const totals = [...new Set(armors.map(x=>x.tier))].sort().map(tier => {
  const rows=armors.filter(x=>x.tier===tier);
  return { tier, armors:rows.length, plating:rows.filter(x=>(x.base.plating??0)>0).length, dr:rows.filter(x=>(x.base.damageReduction??0)>0).length, evasion:rows.filter(x=>(x.base.evasion??0)>0).length, debt:rows.filter(x=>(x.mechanics?.['defense.hit-to-dot-pct']??0)>0).length };
});
const capStack: Record<string,number> = {};
mergePassives(capStack, {'defense.max-hit-pct':0.25,'defense.max-hit-mult':0.5});
mergePassives(capStack, {'defense.max-hit-pct':0.25,'defense.max-hit-mult':0.5});
const result={ scope:'Static data only; no unlock, affordability, spawn weighting, combat, or live-player inference.', totals, armors,
  roots:[...SKILL_TREE.values()].filter(x=>x.parent===null).map(x=>({id:x.id,name:x.name,stats:x.statEffects,mechanics:x.mechanicEffects})),
  monsters:[...MONSTER_DATABASE.values()].map(x=>({id:x.id,name:x.name,biome:x.biome,attack:x.stats.attack,attackCooldown:x.stats.attackCooldown})), capStack };
writeFileSync(new URL('./census.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({totals,capStack,armorCount:armors.length},null,2));
