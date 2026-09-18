import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync,createWriteStream} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {night5ChildArgs} from './night5-child-args.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');return [s.slice(2,i),s.slice(i+1)];}));
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
assert(args.out&&args.revision&&args.tree&&args.definitions&&args.hitboxes&&args['hitbox-hash'],'All identity inputs required');
const root=resolve(args.out);assert(!existsSync(root),'NEW output root required; no retries');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),args.revision);
assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:source,encoding:'utf8'}).trim(),'','Dirty source');
assert.equal(createHash('sha256').update(readFileSync(args.hitboxes)).digest('hex'),args['hitbox-hash'].toLowerCase());
assert.equal(execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:source,encoding:'utf8'}).trim(),args.tree);
mkdirSync(root,{recursive:true});
const started=Date.now();

// TWO fights. One boss, one skill path, one declared seed, 300 s cap. The two cases
// differ only in the COMPLETE package they run. This is not a screen and it does not
// grow: the runner refuses any other count.
const BLOCK={name:'reference',cells:2,seeds:[96011],limitMs:30*60000};
const BOSS_ID='apex-timberclaw';
const CASES=['bossref-timberclaw-a-historical','bossref-timberclaw-b-legacy'];

writeFileSync(join(root,'batch-manifest.json'),JSON.stringify({source,...args,block:BLOCK.name,bossId:BOSS_ID,cases:CASES,started:new Date().toISOString(),ceilingHours:1},null,2));
const note=entry=>appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify(entry)+'\n');
const run=(script,argv,log,limitMs)=>new Promise((resolveRun,reject)=>{
 const stream=createWriteStream(log);const child=spawn(process.execPath,night5ChildArgs(source,script,argv),{cwd:source,stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.pipe(stream);child.stderr.pipe(stream);let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;child.kill();},limitMs);child.on('error',reject);
 child.on('close',code=>{clearTimeout(timer);stream.end(()=>resolveRun({code,timedOut}));});
});

const out=join(root,BLOCK.name),start=new Date().toISOString();
const state={artifactVerified:false};
const result=await run('server/scripts/bossScreen.ts',['--trial=bossref',`--block=${BLOCK.name}`,'--mode=run',`--out=${out}`,`--revision=${args.revision}`,`--hitboxes=${args.hitboxes}`],join(root,`${BLOCK.name}.log`),BLOCK.limitMs);
note({block:BLOCK.name,start,end:new Date().toISOString(),...result});

if(result.timedOut) writeFileSync(join(root,'stopped.json'),JSON.stringify({reason:'watchdog',block:BLOCK.name}));
else if(result.code!==0) note({block:BLOCK.name,status:'runner-failed-no-retry'});
else if(existsSync(join(out,'index.json'))){
 try{
  const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
  const manifest=read('manifest.json'),index=read('index.json'),complete=read('complete.json');
  assert.equal(manifest.revision,args.revision,'revision drift');
  assert.equal(manifest.definitionsHash,args.definitions,'definitions drift');
  assert.equal(manifest.hitboxesSha256,args['hitbox-hash'].toLowerCase(),'hitbox drift');
  assert.equal(manifest.bossId,BOSS_ID,'boss identity drift');
  assert.deepEqual(manifest.seeds,BLOCK.seeds,'seed drift');
  assert.equal(complete.observations,2,'exactly two fights');
  assert.equal(index.length,2,'exactly two records');
  assert.deepEqual(index.map(r=>r.cell).sort(),[...CASES].sort(),'case drift');

  // Both fights must have met the SAME boss under the SAME setup, or the comparison
  // is not controlled and no package conclusion may be drawn from it.
  const readys=index.map(r=>JSON.parse(readFileSync(join(out,`${r.cell}-s${r.seed}/ready.json`),'utf8')));
  for(const ready of readys){
   assert.deepEqual(ready.hpTreatment,[],`${ready.cell}: installs nothing`);
   assert(ready.runicPoints.cost<=ready.runicPoints.budget,
    `${ready.cell}: package costs ${ready.runicPoints.cost} RP against ${ready.runicPoints.budget}`);
   assert.equal(ready.encounterSetup.capMs,300000,`${ready.cell}: cap drift`);
   assert.equal(ready.appliedPackage.activeStance,ready.declaredPackage.stance,
    `${ready.cell}: applied stance != declared`);
   assert.equal(ready.appliedPackage.runesEquipped.length,(ready.declaredPackage.runeRules??[]).length,
    `${ready.cell}: applied rule count != declared`);
  }
  assert.equal(readys[0].bossRuntime.maxHp,readys[1].bossRuntime.maxHp,'cases met different boss HP');
  assert.equal(readys[0].bossRuntime.attack,readys[1].bossRuntime.attack,'cases met different boss attack');
  assert.equal(readys[0].encounterSetup.nonBossBodiesAtStart,readys[1].encounterSetup.nonBossBodiesAtStart,
   'cases started against different node populations');
  assert.deepEqual(readys[0].declaredPackage.skillPath,readys[1].declaredPackage.skillPath,
   'cases ran different skill paths');

  const row=id=>index.find(r=>r.cell===id);
  const summary={verified:true,observations:index.length,
   a:{outcome:row(CASES[0]).outcome,killed:row(CASES[0]).bossKilled,
      elapsedMs:row(CASES[0]).elapsedMs,removed:row(CASES[0]).bossHpFractionRemoved,
      minHpFraction:row(CASES[0]).minHpFraction},
   b:{outcome:row(CASES[1]).outcome,killed:row(CASES[1]).bossKilled,
      elapsedMs:row(CASES[1]).elapsedMs,removed:row(CASES[1]).bossHpFractionRemoved,
      minHpFraction:row(CASES[1]).minHpFraction}};
  writeFileSync(join(out,'verification.json'),JSON.stringify(summary,null,2));
  state.artifactVerified=true;
  console.log(BLOCK.name,JSON.stringify(summary));
 }catch(error){
  const detail=String(error?.message??error);
  writeFileSync(join(out,'verification.json'),JSON.stringify({verified:false,error:detail},null,2));
  note({block:BLOCK.name,status:'verification-failed',detail});
  console.log(BLOCK.name,'verification failed; preserved without retry');
 }
}
writeFileSync(join(root,'batch-ended.json'),JSON.stringify({ended:new Date().toISOString(),wallMs:Date.now()-started,state},null,2));
