const fs=require('fs'),path=require('path');
const root=__dirname,key=r=>r.id+'/'+r.seed;
function read(dir){const base=path.join(root,dir),done=JSON.parse(fs.readFileSync(path.join(base,'complete.json')));const rows=fs.readFileSync(path.join(base,'rows.jsonl'),'utf8').trim().split('\n').map(JSON.parse);if(done.completed!==done.expected||rows.length!==done.expected||new Set(rows.map(key)).size!==rows.length)throw Error('Receipt mismatch '+dir);for(const r of rows)if(Math.abs(r.starting.hp+r.hpHealed-r.hpLost-r.hpEnd)>1e-6)throw Error('HP reconciliation '+key(r));return rows;}
function summary(rows){return {rows:rows.length,deaths:rows.filter(r=>r.outcome==='bot_died').length,kills:rows.reduce((s,r)=>s+r.kills,0),exposureSeconds:rows.reduce((s,r)=>s+r.elapsedMs/1000,0),lowHpSeconds:rows.reduce((s,r)=>s+r.lowHpMs/1000,0),hpLost:rows.reduce((s,r)=>s+r.hpLost,0),hpHealed:rows.reduce((s,r)=>s+r.hpHealed,0),directHits:rows.reduce((s,r)=>s+r.hitCount,0),evades:rows.reduce((s,r)=>s+r.evades,0),openingActiveSeconds:rows.reduce((s,r)=>s+r.dawnActiveMs/1000,0),layers:rows.reduce((a,r)=>{for(const [k,v]of Object.entries(r.layers))a[k]=(a[k]??0)+v;return a;},{})};}
const results={};
for(const prefix of ['', 'fresh-']){
 if(!fs.existsSync(path.join(root,prefix+'baseline','complete.json')))continue;
 const base=read(prefix+'baseline'),map=new Map(base.map(r=>[key(r),r]));
 for(const variant of ['desert-dr','jungle-frequency','jungle-strength']){
  const dir=prefix+variant;if(!fs.existsSync(path.join(root,dir,'complete.json')))continue;
  const c=read(dir),b=c.map(r=>{const original=map.get(key(r));if(!original)throw Error('Missing pair');return original;});
  const groups={};
  for(const [label,fn] of [['T3',r=>r.id.startsWith('3-')],['T4',r=>r.id.startsWith('4-')],['melee',r=>/-(squire|striker)-/.test(r.id)],['ranged',r=>!/-(squire|striker)-/.test(r.id)],['volcano',r=>r.id.includes('-volcanic-')],['home',r=>!r.id.includes('-volcanic-')]])groups[label]={baseline:summary(b.filter(fn)),candidate:summary(c.filter(fn))};
  results[dir]={baseline:summary(b),candidate:summary(c),groups,reversals:c.filter(r=>r.outcome!==map.get(key(r)).outcome).map(r=>({id:r.id,seed:r.seed,before:map.get(key(r)).outcome,after:r.outcome}))};
 }
}
fs.writeFileSync(path.join(root,'RESULTS.json'),JSON.stringify(results,null,2)+'\n');
for(const [name,r] of Object.entries(results))console.log(name,JSON.stringify({baseline:r.baseline,candidate:r.candidate,groups:Object.fromEntries(Object.entries(r.groups).map(([k,v])=>[k,[v.baseline.deaths,v.candidate.deaths,v.baseline.kills,v.candidate.kills]]))}));
