import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync,createWriteStream} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {night5ChildArgs} from './night5-child-args.mjs';
import {assertBossRecordsConsistent} from './boss-verify.mjs';
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

// Boss1 is a SCREEN, not a search: one block, one boss, six tier-legal roots, two
// declared seeds. It installs nothing, so there is no overlay to restore and no
// control arm. Twenty-four attempts would already be too many; twelve is the whole
// screen and the runner refuses to grow it.
const BLOCK={name:'sovereign',cells:6,seeds:[94011,94019],limitMs:60*60000};
const BOSS_ID='charnel-crown-sovereign';

writeFileSync(join(root,'batch-manifest.json'),JSON.stringify({source,...args,block:BLOCK.name,bossId:BOSS_ID,started:new Date().toISOString(),ceilingHours:2},null,2));
const note=entry=>appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify(entry)+'\n');
const run=(script,argv,log,limitMs)=>new Promise((resolveRun,reject)=>{
 const stream=createWriteStream(log);const child=spawn(process.execPath,night5ChildArgs(source,script,argv),{cwd:source,stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.pipe(stream);child.stderr.pipe(stream);let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;child.kill();},limitMs);child.on('error',reject);
 child.on('close',code=>{clearTimeout(timer);stream.end(()=>resolveRun({code,timedOut}));});
});

const out=join(root,BLOCK.name),start=new Date().toISOString();
const state={artifactVerified:false};
const result=await run('server/scripts/bossScreen.ts',['--trial=boss1',`--block=${BLOCK.name}`,'--mode=run',`--out=${out}`,`--revision=${args.revision}`,`--hitboxes=${args.hitboxes}`],join(root,`${BLOCK.name}.log`),BLOCK.limitMs);
note({block:BLOCK.name,start,end:new Date().toISOString(),...result});

if(result.timedOut) writeFileSync(join(root,'stopped.json'),JSON.stringify({reason:'watchdog',block:BLOCK.name}));
else if(result.code!==0) note({block:BLOCK.name,status:'runner-failed-no-retry'});
else if(existsSync(join(out,'index.json'))){
 // Verification is deliberately local rather than borrowed from `verifySurvey`:
 // that checker is built for the mob survey's schema, and quietly reinterpreting a
 // boss artifact through it is how a boss ends up read as an ordinary mob.
 try{
  const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
  const manifest=read('manifest.json'),index=read('index.json'),complete=read('complete.json');
  assert.equal(manifest.revision,args.revision,'revision drift');
  assert.equal(manifest.definitionsHash,args.definitions,'definitions drift');
  assert.equal(manifest.hitboxesSha256,args['hitbox-hash'].toLowerCase(),'hitbox drift');
  assert.equal(manifest.bossId,BOSS_ID,'boss identity drift');
  assert.deepEqual(manifest.seeds,BLOCK.seeds,'seed drift');
  assert.equal(manifest.cells.length,BLOCK.cells,'cell count drift');
  assert.equal(complete.observations,BLOCK.cells*BLOCK.seeds.length,'observation count drift');
  assert.equal(index.length,BLOCK.cells*BLOCK.seeds.length,'index count drift');
  for(const r of index){
   const ready=JSON.parse(readFileSync(join(out,`${r.cell}-s${r.seed}/ready.json`),'utf8'));
   assert.deepEqual(ready.hpTreatment,[],`${r.cell}: Boss1 installs nothing`);
   // The escort receipt rule: a disagreement INVALIDATES the run rather than being
   // reinterpreted, so it is asserted here and not left to the report writer.
   for(const [id,want] of Object.entries(ready.escortsDeclared)){
    assert.equal(ready.escortsAuthored[id].hp,want.hp,`${r.cell}: ${id} hp is not the declared adoption value`);
    assert.equal(ready.escortsAuthored[id].attack,want.attack,`${r.cell}: ${id} attack drift`);
   }
   assert(r.bossMaxHp>0,`${r.cell}: no boss was met`);
  }
  // Cross-field verification: outcome, kill evidence, terminal HP and add counts
  // must agree, or the batch fails rather than passing with a contradiction in it.
  assertBossRecordsConsistent(index,{bossSummonsNothing:false,expectedBossMaxHp:19499});

  const wins=index.filter(r=>r.bossKilled).length;
  const summary={verified:true,observations:index.length,
   wins,deaths:index.filter(r=>r.outcome==='bot-died').length,
   capped:index.filter(r=>r.outcome==='capped').length,
   reset:index.filter(r=>r.outcome==='encounter-reset').length,
   vanished:index.filter(r=>r.outcome==='boss-vanished-no-kill').length,
   ambiguous:index.filter(r=>r.outcome==='simultaneous-terminal').length,
   invalid:index.filter(r=>r.outcome==='wall-ceiling').length};
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
