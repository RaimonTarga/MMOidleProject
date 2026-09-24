/** Static source export only: no World, bots, or combat ticks. */
import * as s from '../shared/src/index';
import { T1_BASELINE_ROUTES } from '../bot/src/routes/t1Baselines';
import { T2_PROGRESSION_ROUTES } from '../bot/src/routes/t2RouteBuilder';
import { ROUTES } from '../bot/src/routes';
import { TIER_ENTRY_PROFILES, t2EntryProfileId } from '../bot/src/tierEntry/profiles';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const output = process.argv[2];
if (!output) throw new Error('Usage: tsx --conditions=development tools/economySnapshot.ts OUTPUT.json');
const data: Record<string, any> = { source: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() };
for (const name of ['BIOME_DATABASE', 'NODE_BIOMES', 'NODE_MODIFIERS', 'RECIPE_DATABASE', 'ABILITY_RECIPE_DATABASE', 'RUNE_RECIPE_DATABASE', 'STANCE_RECIPE_DATABASE', 'RITE_RECIPE_DATABASE', 'GAME_CONFIG']) {
  const value = (s as any)[name]; data[name] = value instanceof Map ? Object.fromEntries(value) : value;
}
data.MONSTER_DATABASE = Object.fromEntries([...s.MONSTER_DATABASE].map(([id,m]) => [id, { id, name:m.name, stats:m.stats, rewards:m.rewards, pack:m.pack }]));
data.modifiers = Object.fromEntries([1,2,3,4].map(t=>[t,Object.fromEntries(s.NODE_MODIFIER_FAMILIES.map(f=>[f,{...s.modifierStatScalars(f,t),spawn:s.modifierSpawnFactor(f,t),reward:s.modifierRewardMult(f,t)}]))]));
data.upgrades = Object.fromEntries([...s.ITEM_DATABASE].map(([id,item])=>[id,Array.from({length:s.getMaxUpgrade(item)},(_,i)=>({plus:i+1,cost:s.upgradeCostFor(item,i+1),catalystCost:s.upgradeCatalystCostFor(item,i+1)}))]));
const purchaseTypes = new Set(['craft','upgrade','evolveItem','learnAbility','craftRune','craftStance','craftRite']);
function purchases(steps: readonly any[], conditional=false): any[] {
  return steps.flatMap(step=>[...(purchaseTypes.has(step.type)?[{...step, conditional}]:[]),...(step.steps?purchases(step.steps,conditional||step.type==='ifPossible'):[])]);
}
data.routes = Object.fromEntries([...T1_BASELINE_ROUTES,...T2_PROGRESSION_ROUTES].map(r=>[r.id,purchases(r.steps)]));
data.entryUpgrades = Object.fromEntries(T2_PROGRESSION_ROUTES.map(r=>[r.id,TIER_ENTRY_PROFILES.get(t2EntryProfileId(r.classRoot!,'clean'))!.itemUpgrades]));
data.fragments = Object.fromEntries(['spirit-volcano-preparation-t3-v1u','voidwalker-mountain-entry-t4-v1y','voidwalker-jungle-desert-t4-v1z'].map(id=>[id,purchases(ROUTES.get(id)!.steps)]));
data.caps=Object.fromEntries([...s.BIOME_DATABASE.keys()].map(b=>[b,[1,2,3,4].map(t=>s.biomeLevelCap(t,b))]));
writeFileSync(output,JSON.stringify(data,null,2)+'\n');
console.log(`Static snapshot written: ${output}`);
