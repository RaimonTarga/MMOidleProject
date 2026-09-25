import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('reports/core-strength-01');
const load=name=>{const p=resolve(root,name,'rows.jsonl');return existsSync(p)?readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];};
const baseline=load('baseline-01'), candidate=load('candidate-01');
const key=r=>r.id+'/'+r.seed;
const stats=rs=>({n:rs.length,deaths:rs.filter(r=>r.hpEnd<=0||r.outcome==='bot_died').length,wins:rs.filter(r=>r.outcome==='boss_killed').length,kills:rs.reduce((s,r)=>s+r.kills,0),seconds:Math.round(rs.reduce((s,r)=>s+r.elapsedMs,0)/100)/10});
const byCore={};
for(const row of baseline){const name=row.starting.equipment.core;(byCore[name]??=[]).push(row);}
const paired={};
for(const row of candidate){const old=baseline.find(b=>key(b)===key(row));if(!old)continue;const name=row.starting.equipment.core;(paired[name]??=[]).push({old,row});}
const result={baseline:stats(baseline),candidate:stats(candidate),roster:Object.fromEntries(Object.entries(byCore).map(([k,v])=>[k,stats(v)])),changes:Object.fromEntries(Object.entries(paired).map(([k,v])=>[k,{before:stats(v.map(p=>p.old)),after:stats(v.map(p=>p.row)),matchedWins:v.filter(p=>p.old.outcome==='boss_killed'&&p.row.outcome==='boss_killed').map(p=>({id:p.row.id,seed:p.row.seed,beforeMs:p.old.elapsedMs,afterMs:p.row.elapsedMs}))}]))};
if(process.argv.includes('--final')){
 const scoutBase=load('scout-expanded-baseline'),scoutNew=load('scout-expanded-candidate');
 const specialist=load('specialist-candidate'),frost=load('frost-specialist'),frostNew=load('frost-controller-candidate');
 result.followups={scout:{before:stats(scoutBase),after:stats(scoutNew)},specialists:{}};
 for(const core of ['core-controller','core-catalyst']){const before=baseline.filter(r=>r.starting.equipment.core===core),after=specialist.filter(r=>r.starting.equipment.core===core);result.followups.specialists[core]={before:stats(before),after:stats(after)};}
 result.followups.frostController={before:stats(frost.filter(r=>r.starting.equipment.core==='core-controller')),after:stats(frostNew)};
 const retained=new Map([...candidate.filter(r=>r.starting.equipment.core!=='core-juggernaut'),...specialist.filter(r=>r.starting.equipment.core==='core-catalyst')].map(r=>[key(r),r]));
 result.finalComposite={...stats(baseline.map(r=>retained.get(key(r))??r)),reusedBaselineRows:baseline.length-retained.size,retestedRows:retained.size};
 result.frostRoster=Object.fromEntries(['core-tempered','core-controller','core-arcanist'].map(core=>[core,stats(frost.filter(r=>r.starting.equipment.core===core))]));
 result.juggernautBaselineLowestHp=Math.min(...baseline.filter(r=>r.starting.equipment.core==='core-juggernaut').map(r=>r.minHp));
 result.receipts={};
 for(const name of ['baseline-01','candidate-01','scout-expanded-baseline','scout-expanded-candidate','frost-specialist','specialist-candidate','frost-controller-candidate']){const path=resolve(root,name);const rows=load(name);const complete=JSON.parse(readFileSync(resolve(path,'complete.json')));const manifest=JSON.parse(readFileSync(resolve(path,'manifest.json')));if(manifest.cells.some(c=>c.nodeId.includes('volcanic')))throw Error('Excluded biome');if(complete.completed!==complete.expected||rows.length!==complete.expected||new Set(rows.map(key)).size!==rows.length)throw Error('Incomplete '+name);result.receipts[name]={...complete,path,sha256:createHash('sha256').update(readFileSync(resolve(path,'rows.jsonl'))).digest('hex'),manifestSha256:createHash('sha256').update(readFileSync(resolve(path,'manifest.json'))).digest('hex')};}
 if(candidate.some(r=>!baseline.some(b=>key(b)===key(r))))throw Error('Unpaired candidate');
 for(const [a,b] of [['baseline-01','candidate-01'],['baseline-01','specialist-candidate'],['scout-expanded-baseline','scout-expanded-candidate'],['frost-specialist','frost-controller-candidate']]){
  const before=JSON.parse(readFileSync(resolve(root,a,'manifest.json'))),after=JSON.parse(readFileSync(resolve(root,b,'manifest.json')));
  if(before.hitboxSha256!==after.hitboxSha256)throw Error('Hitbox drift');
  for(const cell of after.cells)if(JSON.stringify(before.cells.find(c=>c.id===cell.id))!==JSON.stringify(cell))throw Error('Paired loadout drift');
 }
 result.pairedDefinitionsAndHitboxesVerified=true;
 writeFileSync(resolve(root,'RESULTS.json'),JSON.stringify(result,null,2)+'\n');
}
console.log(JSON.stringify(result,null,2));
