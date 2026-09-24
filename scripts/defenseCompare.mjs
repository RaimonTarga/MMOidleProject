import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const control=resolve('../mmo-defense-control/reports/defense-redesign-01');
const candidate=resolve('reports/defense-redesign-01');
const names={baseline:resolve(control,'baseline-03'),cores:resolve(control,'core-02'),full:resolve(candidate,process.argv[2]??'full-02')};
const rows=Object.fromEntries(Object.entries(names).map(([name,path])=>[name,readFileSync(resolve(path,'rows.jsonl'),'utf8').trim().split('\n').map(JSON.parse).map(r=>({...r,outcome:r.hpEnd<=0?'bot_died':r.outcome,key:r.id+'/'+r.seed}))]));
const stats=rs=>({n:rs.length,deaths:rs.filter(r=>r.outcome==='bot_died').length,bossWins:rs.filter(r=>r.outcome==='boss_killed').length,kills:rs.reduce((s,r)=>s+r.kills,0),seconds:Math.round(rs.reduce((s,r)=>s+r.elapsedMs,0)/1000),fullHpLethalHits:rs.reduce((s,r)=>s+r.fullHpLethalHits,0)});
const result={complete:Object.fromEntries(Object.entries(names).map(([n,p])=>[n,existsSync(resolve(p,'complete.json'))])),arms:Object.fromEntries(Object.entries(rows).map(([n,rs])=>[n,stats(rs)])),pairs:{}};
for(const arm of ['cores','full']){
 const paired=rows[arm].flatMap(r=>{const b=rows.baseline.find(b=>b.key===r.key);return b?[{b,r}]:[];});
 const groups={};
 for(const pair of paired){const label=pair.r.id.split('-')[0]+'/'+pair.r.id.split('-')[1];(groups[label]??=[]).push(pair);}
 result.pairs[arm]={baseline:stats(paired.map(p=>p.b)),candidate:stats(paired.map(p=>p.r)),groups:Object.fromEntries(Object.entries(groups).map(([k,ps])=>[k,{baseline:stats(ps.map(p=>p.b)),candidate:stats(ps.map(p=>p.r))}]))};
}
writeFileSync(resolve(candidate,'comparison.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
