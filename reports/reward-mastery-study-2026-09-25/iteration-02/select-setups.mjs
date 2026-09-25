import {readFileSync,writeFileSync} from 'node:fs';
const all=[];
for(const name of ['overnight-t1-t3-progression-01','t4-overnight-closing-pass-01']) {
 const root=`D:/mmo-idle/${name}/run-01`;
 const manifest=JSON.parse(readFileSync(`${root}/manifest.json`));
 const rows=JSON.parse(readFileSync(`${root}/results-summary.json`)).rows;
 for(const cell of manifest.cases) {
  const row=rows.find(r=>r.observationId===cell.id);
  if(!row||cell.role!=='farm'||row.outcome!=='window-ended'||!['primary','control'].includes(cell.arm))continue;
  const last=row.endpoints?.at(-1),prev=row.endpoints?.at(-2);
  if(!last||!prev)continue;
  const kpm=(last.work.kills-prev.work.kills)/((last.atMs-prev.atMs)/60000);
  if(kpm<2)continue; // Exclude surviving idle/stalled fixtures.
  all.push({source:root,cell,row:{id:row.observationId,elapsedMs:row.elapsedMs,outcome:row.outcome,kpm,minHpFraction:last.owner.minHpFraction}});
 }
}
const paired=all.filter(a=>a.cell.seed===101009&&all.some(b=>b.source===a.source&&b.cell.id===a.cell.id.replace('101009','101033')));
writeFileSync(new URL('historical-survivors.json',import.meta.url),JSON.stringify(paired,null,2));
for(const tier of [1,2,3,4]) {
 const list=paired.filter(x=>x.cell.tier===tier);
 console.log('T'+tier, list.length);
 console.log(list.map(x=>({id:x.cell.id,node:x.cell.nodeId,plus:x.cell.upgradeLevel,kpm:+x.row.kpm.toFixed(1),hp:+x.row.minHpFraction.toFixed(2)})).slice(0,32));
}
