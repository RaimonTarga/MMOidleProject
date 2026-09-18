import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {night5ChildArgs} from './night5-child-args.mjs';
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
const [root,hitboxes]=process.argv.slice(2);
assert(root&&hitboxes&&!existsSync(root),'NEW preflight root and hitbox artifact required');
mkdirSync(root,{recursive:true});
const BLOCKS={
 'mountain-armor':{cells:6,seeds:[75011,77003,79001],arms:['local-armor','reference']},
 'jungle-ladder':{cells:18,seeds:[81013,83003,85009],arms:['tier-2','tier-3','tier-4']},
};
for(const [block,spec] of Object.entries(BLOCKS))for(const mode of ['qualify','pilot']){
 const out=join(root,`${block}-${mode}`);
 const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/ttkSurvey.ts',['--trial=durability36',`--block=${block}`,`--mode=${mode}`,`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:1800000,windowsHide:true});
 writeFileSync(join(root,`${block}-${mode}.log`),result.stdout+'\n'+result.stderr);
 assert.equal(result.status,0,result.stderr);
 const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
 const manifest=read('manifest.json');
 assert.equal(manifest.cells.length,spec.cells,`${block}: cell count drift`);
 assert.deepEqual(manifest.seeds,spec.seeds,`${block}: seed drift`);
 assert.equal(manifest.synthetic,true);assert.equal(manifest.economyEligible,false);
 assert.equal(manifest.dtMs,100);
 assert.equal(manifest.durationMs,mode==='pilot'?30000:300000,`${block}: window drift`);
 const arms=[...new Set(manifest.cells.map(c=>c.treatment))].sort();
 assert.deepEqual(arms,spec.arms,`${block}: arms must be declared on every cell, got ${JSON.stringify(arms)}`);

 if(block==='mountain-armor'){
  // Exactly one item differs between the arms, and the enemy baseline is the
  // ADOPTED one in both. No monster contrast exists in this block.
  const byCtx=new Map();
  for(const c of manifest.cells){
   const k=`${c.className}|${c.nodeId}`;
   byCtx.set(k,{...(byCtx.get(k)??{}),[c.treatment]:c});
  }
  assert.equal(byCtx.size,3,'three residual contexts');
  for(const [k,p] of byCtx){
   assert(p.reference&&p['local-armor'],`${k}: both arms required`);
   assert.equal(p.reference.build.gearItemIds.armor,'swamp-vest-t1',`${k}: reference armor`);
   assert.equal(p['local-armor'].build.gearItemIds.armor,'mountain-vest-t1',`${k}: local armor`);
   for(const slot of ['weapon','recovery','mobility']){
    assert.equal(p.reference.build.gearItemIds[slot],p['local-armor'].build.gearItemIds[slot],
     `${k}: only the armor slot may differ, ${slot} moved`);
   }
   assert.equal(p.reference.upgradeLevel,p['local-armor'].upgradeLevel,`${k}: upgrades must match`);
   assert.deepEqual(p.reference.guards,p['local-armor'].guards,`${k}: guards must match`);
  }
 } else {
  // One configuration per tier, and comparable modifier roles across tiers.
  const byTier={};
  for(const c of manifest.cells)(byTier[c.tier]??=[]).push(c);
  for(const t of [2,3,4]) assert.equal((byTier[t]??[]).length,6,`tier ${t} needs six roots`);
  const nodes=[...new Set(manifest.cells.map(c=>c.nodeId))].sort();
  assert.deepEqual(nodes,['node-t2-jungle-03','node-t3-jungle-03','node-t4-jungle-03'],'ladder node drift');
 }

 if(mode==='qualify'){assert.equal(read('complete.json').runs,spec.cells,`${block}: qualify must prepare every cell`);console.log(block,mode,'passed');continue;}

 const index=read('index.json');
 assert(index.length>0,`${block}: pilot produced no observation`);
 const meta=new Map(manifest.cells.map(c=>[c.id,c]));
 for(const row of index){
  const ready=JSON.parse(readFileSync(join(out,row.cell+'-s'+row.seed,'ready.json'),'utf8'));
  assert(ready.initialRoster.length>0,`${block}: empty roster`);
  const treated=ready.hpTreatment??[];
  if(block==='mountain-armor'){
   assert.deepEqual(treated,[],'mountain-armor must not overlay any monster stat');
   assert(ready.initialRoster.some(m=>m.type==='ridge-archer'),'needs archer exposure');
   // Both arms must see the adopted enemy baseline, per node modifier.
   const archer=(ready.initialStats??[]).find(s=>s.type==='ridge-archer');
   assert(archer,'archer stats must be recorded');
   assert([40,44].includes(archer.attack),
    `archer runtime attack ${archer.attack} is not the adopted 40 (or 44 on the heavy node)`);
  } else if(meta.get(row.cell).tier===4){
   // The retained Durability34 Jungle package, either overlaid or already live.
   const byType=Object.fromEntries(treated.map(c=>[c.type,c]));
   for(const [type,after] of [['apex-silverback',2900],['emerald-constrictor',3400]]){
    const c=byType[type];
    assert(c,`tier-4 must record ${type}`);
    assert.equal(c.after,after,`${type}: retained value drift`);
    assert.equal(c.beforeAttack,c.afterAttack,`${type}: the Jungle package is HP-only`);
   }
  } else assert.deepEqual(treated,[],`tier ${meta.get(row.cell).tier} must carry no overlay`);
 }

 // Semantic checks on the derived reports, not merely a zero exit.
 const auditDir=join(root,`${block}-audits`);
 if(block==='mountain-armor'){
  const cast=spawnSync(process.execPath,['scripts/charged-cast-audit.mjs',`--block=${out}`,`--out=${auditDir}`,'--name=pilot'],{cwd:source,encoding:'utf8',timeout:180000,windowsHide:true});
  assert.equal(cast.status,0,cast.stderr);
  const casts=JSON.parse(readFileSync(join(auditDir,'pilot-casts-summary.json'),'utf8'));
  assert.equal(casts.schemaVersion,4,'the cast audit must be schema 4');
  // The orientation must be declared, never alphabetical: 'local-armor' sorts
  // before 'reference', so alphabetical order would invert the baseline.
  assert.deepEqual(casts.armRoles,{baseline:'reference',comparison:'local-armor'},
   `arm roles must resolve to reference/local-armor, got ${JSON.stringify(casts.armRoles)}`);
  const guard=spawnSync(process.execPath,['scripts/guard-window-audit.mjs',`--block=${out}`,`--out=${auditDir}`,'--name=pilot'],{cwd:source,encoding:'utf8',timeout:180000,windowsHide:true});
  assert.equal(guard.status,0,guard.stderr);
  const windows=JSON.parse(readFileSync(join(auditDir,'pilot-guard-windows.json'),'utf8'));
  assert(windows.paired&&Object.keys(windows.paired.joint).length===4,'all four joint outcome categories required');
 } else {
  const species=spawnSync(process.execPath,['scripts/species-timing-audit.mjs',`--block=${out}`,`--out=${auditDir}`,'--name=pilot'],{cwd:source,encoding:'utf8',timeout:180000,windowsHide:true});
  assert.equal(species.status,0,species.stderr);
  const timing=JSON.parse(readFileSync(join(auditDir,'pilot-species-timing.json'),'utf8'));
  assert.equal(timing.schemaVersion,2,'the species audit must be schema 2');
  // Tiers must stay separate: pooling them would destroy the ladder question.
  assert(Object.keys(timing.speciesByArm).length===new Set(index.map(r=>meta.get(r.cell).treatment)).size,
   'species timing must be split per tier, never pooled');
 }
 for(const script of ['scripts/night5-audit.mjs','scripts/ttk-survey-report.mjs']){
  const r=spawnSync(process.execPath,night5ChildArgs(source,script,[out]),{cwd:source,encoding:'utf8',timeout:60000,windowsHide:true});
  assert.equal(r.status,0,r.stderr);
 }
 console.log(block,mode,'passed');
}
console.log('durability36 preflight passed');
