import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RECIPE_DATABASE } from '../shared/src/recipeDatabase';
const entries = [...RECIPE_DATABASE.values()].filter(r => r.slot === 'armor');
const sum = (base: Record<string,number> = {}, upgrades: Record<string,number>[] = []) => {
  const result = {...base};
  for (const upgrade of upgrades) for (const [key,value] of Object.entries(upgrade)) result[key]=(result[key]??0)+value;
  return result;
};
const inventory = entries.map(r => ({id:r.id,name:r.name,tier:r.tier,base:r.stats,baseEffects:r.mechanicEffects??{},
  plus5:sum(r.stats,r.upgrades.slice(0,5).map(u=>u.stats??{})),
  plus5Effects:sum(r.mechanicEffects,r.upgrades.slice(0,5).map(u=>u.mechanicEffects??{}))}));
const pct = (n:number|undefined) => `${Math.round((n??0)*1000)/10}%`;
const out=resolve(__dirname,'../reports/defense-redesign-01');
writeFileSync(resolve(out,'ARMOR-INVENTORY.json'),JSON.stringify(inventory,null,2)+'\n');
const lines=['# Candidate armor inventory','','Authored item bonuses at +0 → +5, before class/core multipliers, diminishing returns, and temporary effects. All armor definitions are included; Bark Wrap is unchanged. Exact passive values are in ARMOR-INVENTORY.json.','','| Armor | Tier | HP | Plating | General DR | Raw evasion |','|---|---:|---:|---:|---:|---:|'];
for(const r of inventory)lines.push(`| ${r.name} (${r.id}) | ${r.tier} | ${r.base.maxHp??0} → ${r.plus5.maxHp??0} | ${r.base.plating??0} → ${r.plus5.plating??0} | ${pct(r.base.damageReduction)} → ${pct(r.plus5.damageReduction)} | ${pct(r.base.evasion)} → ${pct(r.plus5.evasion)} |`);
writeFileSync(resolve(out,'ARMOR-INVENTORY.md'),lines.join('\n')+'\n');
console.log(`Inventoried ${inventory.length} armors.`);
