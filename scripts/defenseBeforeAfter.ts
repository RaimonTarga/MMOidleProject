import { writeFileSync } from 'node:fs';
import { RECIPE_DATABASE as after } from '../shared/src/recipeDatabase';
import { RECIPE_DATABASE as before } from '../../mmo-defense-control/shared/src/recipeDatabase';
import { rootsAndFramesEntries as nodesAfter } from '../shared/src/data/skillTree/rootsAndFrames';
import { rootsAndFramesEntries as nodesBefore } from '../../mmo-defense-control/shared/src/data/skillTree/rootsAndFrames';
const lines=['# Complete numerical before/after appendix','','Baseline: ff98ba45 (verified clean control checkout). Candidate: 7657aee7. Unmerged experimental values, not current production. All 30 armor definitions and all cores are included. Numbers are authored bonuses, before class multiplication or diminishing returns. Each armor table includes every changed stat/effect at every upgrade level (+0 through +5). Missing effects are shown as absent; decimal fractions represent percentages (0.1 = 10%). Millisecond keys retain milliseconds.','',''];
const round=(v:unknown)=>typeof v==='number'?String(Math.round(v*1e6)/1e6):'absent';
function total(r:any,level:number,field:string){const result={...(r[field]??{})};for(const u of (r.upgrades??[]).slice(0,level))for(const [k,v] of Object.entries(u[field]??{}))result[k]=(result[k]??0)+Number(v);return result;}
let armorCount=0;
for(const r of after.values()){
 if(r.slot!=='armor'&&r.slot!=='core')continue;
 const b=before.get(r.id)!;if(!b)throw Error(r.id);
 if(r.slot==='armor')armorCount++;
 lines.push(`## ${r.name} (${r.id})`,'');let changed=false;
 for(const field of ['stats','mechanicEffects']){
  const keys=new Set([...Object.keys(total(b,5,field)),...Object.keys(total(r,5,field))]);
  const changedKeys=[...keys].filter(k=>Array.from({length:6},(_,i)=>i).some(i=>total(b,i,field)[k]!==total(r,i,field)[k]));
  if(!changedKeys.length)continue;changed=true;
  lines.push(`Authored ${field}:`,'','| Bonus | +0 before → after | +1 | +2 | +3 | +4 | +5 |','|---|---|---|---|---|---|---|');
  for(const k of changedKeys)lines.push(`| ${k} | ${Array.from({length:6},(_,i)=>`${round(total(b,i,field)[k])} → ${round(total(r,i,field)[k])}`).join(' | ')} |`);
  lines.push('');
 }
 if(!changed)lines.push('No numerical changes.','');
}
lines.push('## Class roots, frames and range nodes','','Only numerically changed nodes are listed. Zero and absent are equivalent for additive bonuses.','');
const oldNodes=new Map<string,any>(nodesBefore as any);
for(const [id,n] of nodesAfter){const b=oldNodes.get(id);if(!b)throw Error(id);const rows=[];for(const field of ['statEffects','mechanicEffects'] as const){const x=(n as any)[field]??{},y=b[field]??{};for(const k of new Set([...Object.keys(x),...Object.keys(y)]))if((x[k]??0)!==(y[k]??0))rows.push(`| ${k} | ${round(y[k])} | ${round(x[k])} |`);}if(rows.length)lines.push(`### ${n.name} (${id})`,'','| Bonus | Before | After |','|---|---|---|',...rows,'');}
if(armorCount!==30)throw Error(`Expected 30 armors, got ${armorCount}`);
writeFileSync('../reports/defense-iteration-02/BEFORE-AFTER-APPENDIX.md',lines.join('\n').trimEnd()+'\n');
console.log(`Compared ${armorCount} armors, all cores and class nodes.`);
