import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {night5ChildArgs} from './night5-child-args.mjs';
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
const [root,hitboxes]=process.argv.slice(2);assert(root&&hitboxes&&!existsSync(root),'NEW preflight root and hitbox artifact required');mkdirSync(root,{recursive:true});
const CELLS={'jungle-repair':4,'mountain-powershot':24,'jungle-breadth':12};
const SEEDS={'jungle-repair':[44017,46021,48017],'mountain-powershot':[51001,53017,55009],'jungle-breadth':[51001,53017,55009]};
for(const block of Object.keys(CELLS))for(const mode of ['qualify','pilot']){
 const count=CELLS[block];
 const out=join(root,`${block}-${mode}`);
 const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/ttkSurvey.ts',['--trial=durability32',`--block=${block}`,`--mode=${mode}`,`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:900000,windowsHide:true});
 writeFileSync(join(root,`${block}-${mode}.log`),result.stdout+'\n'+result.stderr);
 assert.equal(result.status,0,result.stderr);
 const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
 const manifest=read('manifest.json');
 assert.equal(manifest.cells.length,count,`${block}: cell count drift`);
 assert.deepEqual(manifest.seeds,SEEDS[block],`${block}: seed drift`);
 assert.equal(manifest.synthetic,true);assert.equal(manifest.economyEligible,false);
 assert.equal(manifest.dtMs,100);
 assert.equal(manifest.durationMs,mode==='pilot'?30000:(block==='jungle-repair'?120000:300000),`${block}: window drift`);
 assert.equal(manifest.navigationDiagnostics,false,'Durability32 is a gameplay screen, not a profiling packet');
 if(mode==='qualify'){assert.equal(read('complete.json').runs,count,`${block}: qualify must prepare every cell`);continue;}
 // Pilots exercise both arms and both preparation contexts, and prove the overlay
 // reaches READY. They are smoke checks and never part of the operator dataset.
 const index=read('index.json');
 assert(index.length>0,`${block}: pilot produced no observation`);
 for(const row of index){
  const ready=JSON.parse(readFileSync(join(out,row.cell+'-s'+row.seed,'ready.json'),'utf8'));
  assert(ready.initialRoster.length>0,`${block}: empty pilot roster`);
  assert(['window-ended','player-died','wall-ceiling'].includes(row.outcome),`${block}: unexpected outcome ${row.outcome}`);
  if(block!=='mountain-powershot'){assert.deepEqual(ready.hpTreatment,[],`${block}: Jungle blocks must carry no overlay`);continue;}
  assert(ready.initialRoster.some(m=>m.type==='ridge-archer'),'Mountain pilot needs archer exposure');
  const treatment=ready.hpTreatment.find(c=>c.type==='ridge-archer');
  assert(treatment,'Mountain pilot must record the Power Shot treatment');
  assert.equal(treatment.beforeAttack,2.2,'control multiplier drift');
  assert.equal(treatment.afterAttack,row.cell.endsWith('candidate')?1.8:2.2,'arm/treatment mismatch');
  assert.equal(treatment.before,treatment.after,'Block B must not move HP');
 }
 if(block==='mountain-powershot'){
  const contexts=new Set(index.map(r=>r.cell.includes('first-arrival')?'first-arrival':'prepared-farming'));
  assert.equal(contexts.size,2,'pilots must exercise both preparation contexts');
  const arms=new Set(index.map(r=>r.cell.endsWith('candidate')?'candidate':'control'));
  assert.equal(arms.size,2,'pilots must exercise both arms');
 }
 const audit=spawnSync(process.execPath,night5ChildArgs(source,'scripts/night5-audit.mjs',[out]),{cwd:source,encoding:'utf8',timeout:60000,windowsHide:true});
 assert.equal(audit.status,0,audit.stderr);
 const report=spawnSync(process.execPath,night5ChildArgs(source,'scripts/ttk-survey-report.mjs',[out]),{cwd:source,encoding:'utf8',timeout:60000,windowsHide:true});
 assert.equal(report.status,0,report.stderr);
 console.log(block,mode,'passed');
}
console.log('durability32 preflight passed');
