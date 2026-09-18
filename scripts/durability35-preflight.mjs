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
const BLOCK='mountain-pressure', CELLS=24, SEEDS=[75011,77003,79001];
for(const mode of ['qualify','pilot']){
 const out=join(root,`${BLOCK}-${mode}`);
 const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/ttkSurvey.ts',['--trial=durability35',`--block=${BLOCK}`,`--mode=${mode}`,`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:1800000,windowsHide:true});
 writeFileSync(join(root,`${BLOCK}-${mode}.log`),result.stdout+'\n'+result.stderr);
 assert.equal(result.status,0,result.stderr);
 const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
 const manifest=read('manifest.json');
 assert.equal(manifest.cells.length,CELLS,'cell count drift');
 assert.deepEqual(manifest.seeds,SEEDS,'seed drift');
 assert.equal(manifest.synthetic,true);assert.equal(manifest.economyEligible,false);
 assert.equal(manifest.dtMs,100);
 assert.equal(manifest.durationMs,mode==='pilot'?30000:300000,'window drift');
 // Arms must be DECLARED on every cell: the audits read them from here, and an
 // undeclared arm silently pooled two treatments in Durability34.
 const arms=[...new Set(manifest.cells.map(c=>c.treatment))].sort();
 assert.deepEqual(arms,['candidate','control'],`arms must be declared on every cell, got ${JSON.stringify(arms)}`);
 assert.equal(manifest.cells.filter(c=>c.treatment==='control').length,CELLS/2,'unbalanced arms');
 const nodes=[...new Set(manifest.cells.map(c=>c.nodeId))].sort();
 assert.deepEqual(nodes,['node-t1-mountain-01','node-t1-mountain-02'],'node drift');
 if(mode==='qualify'){assert.equal(read('complete.json').runs,CELLS,'qualify must prepare every cell');console.log(BLOCK,mode,'passed');continue;}

 const index=read('index.json');
 assert(index.length>0,'pilot produced no observation');
 const meta=new Map(manifest.cells.map(c=>[c.id,c]));
 for(const row of index){
  const dir=join(out,row.cell+'-s'+row.seed);
  const ready=JSON.parse(readFileSync(join(dir,'ready.json'),'utf8'));
  assert(ready.initialRoster.some(m=>m.type==='ridge-archer'),'needs archer exposure');
  assert(ready.initialRoster.some(m=>m.type==='cliff-hopper'),'needs hopper exposure');
  const treated=ready.hpTreatment??[];
  if(meta.get(row.cell).treatment==='candidate'){
   const byType=Object.fromEntries(treated.map(c=>[c.type,c]));
   for(const type of ['ridge-archer','cliff-hopper']){
    const c=byType[type];
    assert(c,`candidate must record ${type}`);
    assert.equal(c.beforeAttack,50,`${type} control attack drift`);
    assert.equal(c.afterAttack,40,`${type} candidate attack drift`);
    assert.equal(c.before,c.after,`${type}: this package is attack-only, HP must not move`);
   }
  } else assert.deepEqual(treated,[],'the control arm carries no overlay');
 }

 // The whole point of the package: attack-derived SPECIAL damage must move too.
 // Verified through the real pipeline rather than assumed from the multiplier.
 const audit=join(root,`${BLOCK}-cast-audit`);
 const cast=spawnSync(process.execPath,['scripts/charged-cast-audit.mjs',`--block=${out}`,`--out=${audit}`,'--name=pilot'],{cwd:source,encoding:'utf8',timeout:180000,windowsHide:true});
 assert.equal(cast.status,0,cast.stderr);
 const casts=JSON.parse(readFileSync(join(audit,'pilot-casts-summary.json'),'utf8'));
 assert.deepEqual(casts.declaredArms.slice().sort(),['candidate','control'],'the cast audit must resolve both arms');
 const seen=[];
 for(const label of ['Strong Kick','Power Shot']){
  const c=casts.byLabelArm[`${label} | control`], k=casts.byLabelArm[`${label} | candidate`];
  if(!c?.landed||!k?.landed){seen.push(`${label}: not observed in the pilot`);continue;}
  assert(k.hpDamage.median<c.hpDamage.median,
   `${label}: attack-derived special damage must fall in the candidate (${c.hpDamage.median} -> ${k.hpDamage.median})`);
  assert(k.grossDamage.median<c.grossDamage.median,
   `${label}: pre-mitigation special damage must fall too (${c.grossDamage.median} -> ${k.grossDamage.median})`);
  seen.push(`${label}: hp ${c.hpDamage.median} -> ${k.hpDamage.median}, gross ${c.grossDamage.median} -> ${k.grossDamage.median}`);
 }
 // Report honestly rather than demanding an artificial nonzero count.
 console.log('  attack-derived special damage: ' + seen.join(' | '));

 for(const script of ['scripts/night5-audit.mjs','scripts/ttk-survey-report.mjs']){
  const r=spawnSync(process.execPath,night5ChildArgs(source,script,[out]),{cwd:source,encoding:'utf8',timeout:60000,windowsHide:true});
  assert.equal(r.status,0,r.stderr);
 }
 // Semantic check on the derived reports, not merely "the generator exited 0".
 const guard=join(root,`${BLOCK}-guard-audit`);
 const gw=spawnSync(process.execPath,['scripts/guard-window-audit.mjs',`--block=${out}`,`--out=${guard}`,'--name=pilot'],{cwd:source,encoding:'utf8',timeout:180000,windowsHide:true});
 assert.equal(gw.status,0,gw.stderr);
 const windows=JSON.parse(readFileSync(join(guard,'pilot-guard-windows.json'),'utf8'));
 assert.deepEqual(windows.declaredArms.slice().sort(),['candidate','control'],'the guard audit must resolve both arms');
 assert(windows.paired&&windows.paired.pairs>0,'paired joint outcomes must be computable');
 assert.equal(Object.keys(windows.paired.joint).length,4,'all four joint outcome categories must be present');
 console.log(BLOCK,mode,'passed');
}
console.log('durability35 preflight passed');
