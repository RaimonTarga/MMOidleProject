import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ITEM_DATABASE,RECIPE_DATABASE,upgradeCostFor,defaultT1EconomyConfig} from '../../shared/src/index';
const here=dirname(fileURLToPath(import.meta.url));
const proposal=JSON.parse(readFileSync(resolve(here,'candidate-costs.json'),'utf8'));
const corrections=[];
for(const r of proposal.recipes) {
  const item=ITEM_DATABASE.get(r.id)!;if(item.tier!==1)continue;
  const recipe=RECIPE_DATABASE.get(r.id)!;
  const lifetime:Record<string,number>={...recipe.cost};
  for(let plus=1;plus<=5;plus++)for(const [c,v]of Object.entries(upgradeCostFor(item,plus,defaultT1EconomyConfig().t1Plus5EssenceCostMultiplier)!))lifetime[c]=(lifetime[c]??0)+v;
  const steps:Record<string,number>[]=Array.from({length:5},()=>({})),cost3:Record<string,number>={};
  for(const [c,v]of Object.entries(lifetime)) {
    cost3[c]=Math.round(v*2/3);const early=cost3[c]-(recipe.cost[c as keyof typeof recipe.cost]??0),tail=v-cost3[c];
    for(let i=0;i<3;i++)steps[i][c]=Math.round(early*(i+1)/3)-Math.round(early*i/3);
    for(let i=0;i<2;i++)steps[i+3][c]=Math.round(tail*(i+1)/2)-Math.round(tail*i/2);
  }
  corrections.push({id:r.id,oldAuthoredLifetime:r.cost5,liveBaselineLifetime:lifetime});
  r.steps=steps;r.cost3=cost3;r.cost5=lifetime;r.reconstruct3=cost3;r.reconstruct5=lifetime;
}
// Old aggregate projections are deliberately omitted; they used authored T1 +5.
delete proposal.groups;delete proposal.summary;
proposal.note='Revision 2: T1 preserves the actual default-F server lifetime cost; explicit factorial arms remain overrides. T2-T4 unchanged. Supersedes original authored-only T1 schedules.';
proposal.t1Corrections=corrections;
writeFileSync(resolve(here,'candidate-costs-live-t1.json'),JSON.stringify(proposal,null,2)+'\n');
console.log(`Corrected ${corrections.length} T1 lifetime schedules against actual baseline server prices.`);
