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

// Durability37 installs NOTHING: both blocks fight authored source, so every
// `hpTreatment` must be EMPTY. That is the single most important preflight check
// here -- a non-empty treatment would mean a retired overlay came back to life.
const BLOCKS={
 'jungle-ladder':{cells:18,seeds:[81013,83003,85009],arms:['tier-2','tier-3','tier-4'],windowMs:300000},
 'mob-integration':{cells:20,seeds:[87011],arms:['integrated'],windowMs:300000},
};

// The adopted values every observation depends on. Read from the READY artifacts'
// runtime roster, not from source, so a node modifier that scales HP is visible
// rather than mistaken for drift.
const ADOPTED_JUNGLE={'jungle-ape':1200,'silverback':3200,'apex-silverback':10000};

// Block I's ten families, with the species each one exists to observe. Trench and
// Graveyard keep their longer windows; the rest run the common 300 s.
const FAMILIES={
 'forest:2':{window:300000,species:['ancient-wolf','ironwood-golem']},
 'volcanic:3':{window:300000,species:['magma-brute','ash-slinger']},
 'volcanic:4':{window:300000,species:['obsidian-tortoise','magma-salamander']},
 'graveyard:4':{window:900000,species:['gravewright','bone-crawler','plague-hound','carrion-vulture','plague-rat']},
 'desert:2':{window:300000,species:['sand-scorpion','stone-basilisk']},
 'desert:4':{window:300000,species:['sand-viper','dune-basilisk','dune-tyrant']},
 'mountain:2':{window:300000,species:['granite-titan','stone-eagle','peak-archer']},
 'mountain:4':{window:300000,species:['granite-mammoth','cragback-rhino','cliffside-roc','avalanche-tyrant']},
 'trench:4':{window:600000,species:['elder-leviathan','abyssal-serpent','hadal-stalker']},
 'tundra:4':{window:300000,species:['permafrost-behemoth','glacial-direbear','rime-tusk-mastodon','hoarfrost-yeti']},
};

for(const [block,spec] of Object.entries(BLOCKS))for(const mode of ['qualify','pilot']){
 const out=join(root,`${block}-${mode}`);
 const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/ttkSurvey.ts',['--trial=durability37',`--block=${block}`,`--mode=${mode}`,`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:1800000,windowsHide:true});
 writeFileSync(join(root,`${block}-${mode}.log`),result.stdout+'\n'+result.stderr);
 assert.equal(result.status,0,result.stderr);
 const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
 const manifest=read('manifest.json');
 assert.equal(manifest.cells.length,spec.cells,`${block}: cell count drift`);
 assert.deepEqual(manifest.seeds,spec.seeds,`${block}: seed drift`);
 assert.equal(manifest.synthetic,true);assert.equal(manifest.economyEligible,false);
 assert.equal(manifest.dtMs,100);
 assert.equal(manifest.durationMs,mode==='pilot'?30000:spec.windowMs,`${block}: block window drift`);
 const arms=[...new Set(manifest.cells.map(c=>c.treatment))].sort();
 assert.deepEqual(arms,spec.arms,`${block}: arms must be declared on every cell, got ${JSON.stringify(arms)}`);

 if(block==='jungle-ladder'){
  // The ladder is Durability36's, re-identified. Same nodes, same six roots per tier.
  const byTier={};
  for(const c of manifest.cells)(byTier[c.tier]??=[]).push(c);
  for(const t of [2,3,4]) assert.equal((byTier[t]??[]).length,6,`tier ${t} needs six roots`);
  const nodes=[...new Set(manifest.cells.map(c=>c.nodeId))].sort();
  assert.deepEqual(nodes,['node-t2-jungle-03','node-t3-jungle-03','node-t4-jungle-03'],'ladder node drift');
  assert(manifest.cells.every(c=>c.id.startsWith('dur37-ladder')),'the regression needs its own cell identity');
 } else {
  // Ten families, each once, on its own -03 node, with both arms present.
  const byFamily={};
  for(const c of manifest.cells)(byFamily[`${c.role}:${c.tier}`]??=[]).push(c);
  assert.deepEqual(Object.keys(byFamily).sort(),Object.keys(FAMILIES).sort(),
   `family coverage drift: ${JSON.stringify(Object.keys(byFamily).sort())}`);
  for(const [key,cells] of Object.entries(byFamily)){
   assert.equal(cells.length,2,`${key}: one sensitive root and one comparator`);
   assert.equal(new Set(cells.map(c=>c.className)).size,2,`${key}: the two arms must be different roots`);
   const [role,tier]=key.split(':');
   assert(cells.every(c=>c.nodeId===`node-t${tier}-${role}-03`),`${key}: node drift`);
  }
  const roots=new Set(manifest.cells.map(c=>c.className));
  assert.equal(roots.size,6,`all six roots must appear across Block I, found ${[...roots].sort().join(', ')}`);
 }

 if(mode==='qualify'){assert.equal(read('complete.json').runs,spec.cells,`${block}: qualify must prepare every cell`);console.log(block,mode,'passed');continue;}

 const index=read('index.json');
 assert(index.length>0,`${block}: pilot produced no observation`);
 const meta=new Map(manifest.cells.map(c=>[c.id,c]));
 for(const row of index){
  const ready=JSON.parse(readFileSync(join(out,row.cell+'-s'+row.seed,'ready.json'),'utf8'));
  assert(ready.initialRoster.length>0,`${block}: empty roster`);
  // THE load-bearing check: Durability37 overlays nothing, anywhere.
  assert.deepEqual(ready.hpTreatment??[],[],
   `${row.cell}: Durability37 must not overlay any monster stat -- a retired overlay came back`);

  const cell=meta.get(row.cell);
  if(block==='jungle-ladder'){
   // The adopted ladder must be what is actually fought, per tier, at runtime.
   const lineage={2:'jungle-ape',3:'silverback',4:'apex-silverback'}[cell.tier];
   const live=ready.initialRoster.filter(m=>m.type===lineage);
   assert(live.length>0,`${row.cell}: needs ${lineage} exposure`);
   // Node modifiers scale maxHp, so the runtime value is >= authored, never below.
   for(const m of live){
    assert(m.maxHp>=ADOPTED_JUNGLE[lineage],
     `${lineage}: runtime maxHp ${m.maxHp} is below the adopted ${ADOPTED_JUNGLE[lineage]}; the ladder was not applied`);
   }
   // The superseded Durability34 values must be nowhere near this run.
   if(cell.tier===4){
    for(const m of ready.initialRoster.filter(x=>x.type==='apex-silverback'||x.type==='emerald-constrictor')){
     assert(m.maxHp!==2900&&m.maxHp!==3400,
      `${m.type}: found the SUPERSEDED Durability34 value ${m.maxHp}`);
    }
   }
  } else {
   // Each family must actually meet at least one of the species it is here for.
   const family=FAMILIES[`${cell.role}:${cell.tier}`];
   assert(family,`${row.cell}: undeclared family`);
   assert(family.species.some(t=>ready.initialRoster.some(m=>m.type===t)),
    `${row.cell}: none of ${family.species.join('/')} spawned; this family cannot check its package`);
  }
 }

 // Semantic checks on the derived reports, not merely a zero exit.
 const auditDir=join(root,`${block}-audits`);
 const species=spawnSync(process.execPath,['scripts/species-timing-audit.mjs',`--block=${out}`,`--out=${auditDir}`,'--name=pilot'],{cwd:source,encoding:'utf8',timeout:180000,windowsHide:true});
 assert.equal(species.status,0,species.stderr);
 const timing=JSON.parse(readFileSync(join(auditDir,'pilot-species-timing.json'),'utf8'));
 assert.equal(timing.schemaVersion,2,'the species audit must be schema 2');
 if(block==='jungle-ladder'){
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
console.log('durability37 preflight passed');
