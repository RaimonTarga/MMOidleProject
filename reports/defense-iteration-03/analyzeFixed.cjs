const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'fixed-threat'),r=fs.readFileSync(path.join(dir,'rows.jsonl'),'utf8').trim().split('\n').map(JSON.parse),done=JSON.parse(fs.readFileSync(path.join(dir,'complete.json')));
if(r.length!==360||done.completed!==360||done.expected!==360)throw Error('Incomplete fixed matrix');
const key=x=>[x.cls,x.tier,x.family,x.plus,x.profile].join('/');
const b=new Map(r.filter(x=>x.variant==='baseline').map(x=>[key(x),x]));
const summary=rs=>({rows:rs.length,deaths:rs.filter(x=>x.dead).length,meanSurvivalSeconds:rs.reduce((n,x)=>n+x.elapsedMs/1000,0)/rs.length,meanHpFraction:rs.reduce((n,x)=>n+x.hp/x.maxHp,0)/rs.length});
const result={};
for(const variant of ['desert-dr','jungle-frequency','jungle-strength']){
 const c=r.filter(x=>x.variant===variant),base=c.map(x=>b.get(key(x)));
 result[variant]={baseline:summary(base),candidate:summary(c),earlierDeaths:c.filter(x=>x.elapsedMs<b.get(key(x)).elapsedMs).map(x=>({key:key(x),before:b.get(key(x)).elapsedMs,after:x.elapsedMs})),byProfile:Object.fromEntries(['small','large'].map(p=>[p,{baseline:summary(base.filter(x=>x.profile===p)),candidate:summary(c.filter(x=>x.profile===p))}]))};
}
fs.writeFileSync(path.join(__dirname,'FIXED-RESULTS.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
