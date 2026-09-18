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
const CELLS={'jungle-durability':24,'mountain-guard':12};
const SEEDS={'jungle-durability':[63011,65003,67001],'mountain-guard':[69001,71003,73009]};
for(const block of Object.keys(CELLS))for(const mode of ['qualify','pilot']){
 const count=CELLS[block];
 const out=join(root,`${block}-${mode}`);
 const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/ttkSurvey.ts',['--trial=durability34',`--block=${block}`,`--mode=${mode}`,`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:1800000,windowsHide:true});
 writeFileSync(join(root,`${block}-${mode}.log`),result.stdout+'\n'+result.stderr);
 assert.equal(result.status,0,result.stderr);
 const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
 const manifest=read('manifest.json');
 assert.equal(manifest.cells.length,count,`${block}: cell count drift`);
 assert.deepEqual(manifest.seeds,SEEDS[block],`${block}: seed drift`);
 assert.equal(manifest.synthetic,true);assert.equal(manifest.economyEligible,false);
 assert.equal(manifest.dtMs,100);
 assert.equal(manifest.durationMs,mode==='pilot'?30000:300000,`${block}: window drift`);
 assert.equal(manifest.navigationDiagnostics,false,'gameplay screen, not a profiling packet');
 if(mode==='qualify'){assert.equal(read('complete.json').runs,count,`${block}: qualify must prepare every cell`);continue;}
 const index=read('index.json');
 assert(index.length>0,`${block}: pilot produced no observation`);
 for(const row of index){
  const dir=join(out,row.cell+'-s'+row.seed);
  const ready=JSON.parse(readFileSync(join(dir,'ready.json'),'utf8'));
  assert(ready.initialRoster.length>0,`${block}: empty pilot roster`);
  assert(['window-ended','player-died','wall-ceiling'].includes(row.outcome),`${block}: unexpected outcome ${row.outcome}`);

  if(block==='jungle-durability'){
   // HP-only overlay on the two durable roles; the fast bodies must not move.
   const treated=ready.hpTreatment??[];
   if(row.cell.endsWith('-candidate')){
    const byType=Object.fromEntries(treated.map(c=>[c.type,c]));
    for(const [type,[before,after]] of [['apex-silverback',[1450,2900]],['emerald-constrictor',[1700,3400]]]){
     const c=byType[type];
     assert(c,`${block}: candidate must record ${type}`);
     assert.equal(c.before,before,`${type} baseline drift`);
     assert.equal(c.after,after,`${type} candidate drift`);
     assert.equal(c.beforeAttack,c.afterAttack,`${type}: Block J is HP-only, attack must not move`);
    }
    assert(!treated.some(c=>['hunting-panther','thornback-lizard'].includes(c.type)),
     `${block}: the fast bodies must stay untouched`);
   } else assert.deepEqual(treated,[],`${block}: the control arm carries no overlay`);
   continue;
  }

  // Block M carries NO monster overlay: its treatment is the guard loadout.
  assert.deepEqual(ready.hpTreatment??[],[],'mountain-guard must not overlay any monster stat');
  assert(ready.initialRoster.some(m=>m.type==='ridge-archer'),'Mountain pilot needs archer exposure');
 }

 if(block==='mountain-guard'){
  // The substitution must actually APPLY its defense. Comparing loadout labels
  // while one arm never fires its guard would be worthless.
  const fired={};
  for(const row of index){
   const dir=join(out,row.cell+'-s'+row.seed);
   const seen=new Set();
   for(const line of readFileSync(join(dir,'events.jsonl'),'utf8').trim().split(String.fromCharCode(10))){
    if(!line)continue;
    const e=(JSON.parse(line).event)??JSON.parse(line);
    if(e.kind==='ability-activation'&&e.abilityId)seen.add(e.abilityId);
   }
   fired[row.cell.endsWith('-substitution')?'substitution':'reference']=seen;
  }
  assert(fired.reference?.has('second-wind'),'the reference arm must actually activate Second Wind');
  assert(fired.substitution?.has('brace'),'the substitution arm must actually activate Brace');
  assert(!fired.substitution?.has('second-wind'),'the substitution arm must not still carry Second Wind');
  console.log('  guard activation verified: reference fired second-wind, substitution fired brace');
 }

 for(const script of ['scripts/night5-audit.mjs','scripts/ttk-survey-report.mjs']){
  const r=spawnSync(process.execPath,night5ChildArgs(source,script,[out]),{cwd:source,encoding:'utf8',timeout:60000,windowsHide:true});
  assert.equal(r.status,0,r.stderr);
 }
 if(block==='jungle-durability'){
  const gate=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/navigationGate.ts',[`--block=${out}`,`--out=${out}`,`--name=${block}`]),{cwd:source,encoding:'utf8',timeout:180000,windowsHide:true});
  assert.equal(gate.status,0,gate.stderr);
  const parsed=JSON.parse(readFileSync(join(out,`${block}-navigation-gate.json`),'utf8'));
  assert(['pass','fail','inconclusive','not-applicable'].includes(parsed.navigationGate.status),'gate must produce a verdict');
 }
 console.log(block,mode,'passed');
}
console.log('durability34 preflight passed');
