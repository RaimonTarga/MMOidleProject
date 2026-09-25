const fs=require('node:fs');const path=require('node:path');
const read=(dir)=>fs.readFileSync(path.join(__dirname,dir,'rows.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const key=r=>`${r.id}/${r.seed}`;
const sum=rs=>({rows:rs.length,deaths:rs.filter(r=>r.outcome==='bot_died').length,kills:rs.reduce((n,r)=>n+r.kills,0)});
const result={};
for(const [label,bdir,cdir] of [['initial','baseline-verified','candidate-01'],['fresh','fresh-baseline','fresh-candidate']]){
 const b=read(bdir),c=read(cdir),map=new Map(b.map(r=>[key(r),r]));
 for(const dir of [bdir,cdir]){const done=JSON.parse(fs.readFileSync(path.join(__dirname,dir,'complete.json')));if(done.completed!==done.expected)throw Error(dir);}
 if(b.length!==c.length||new Set(c.map(key)).size!==c.length||c.some(r=>!map.has(key(r))))throw Error('Pair mismatch');
 const families={};for(const armor of [...new Set(b.map(r=>r.id.split('-balanced-')[1].split('-node-')[0]))]){
 const filter=r=>r.id.includes(`-balanced-${armor}-node-`);families[armor]={baseline:sum(b.filter(filter)),candidate:sum(c.filter(filter))};}
 const reversals=c.filter(r=>r.outcome!==map.get(key(r)).outcome).map(r=>({id:r.id,seed:r.seed,before:map.get(key(r)).outcome,after:r.outcome,beforeKills:map.get(key(r)).kills,afterKills:r.kills}));
 const environments={};for(const volcanic of [false,true]){const f=r=>r.id.includes('-volcanic-')===volcanic;environments[volcanic?'volcano':'other']={baseline:sum(b.filter(f)),candidate:sum(c.filter(f))};}
 result[label]={baseline:sum(b),candidate:sum(c),families,environments,reversals};
}
fs.writeFileSync(path.join(__dirname,'RESULTS.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
