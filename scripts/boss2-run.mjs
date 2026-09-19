import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync,createWriteStream} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {night5ChildArgs} from './night5-child-args.mjs';
import {assertBossRecordsConsistent,assertDeclarationsApplied} from './boss-verify.mjs';
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

// Boss2 is a COVERAGE MAP, not a search: the six remaining T2 bosses, each against
// the same six explicit reference packages Boss1 carried onto Apex Timberclaw, one
// declared seed. Thirty-six fights is the whole screen and the runner refuses to
// grow it.
//
// The six blocks are INDEPENDENT: a local problem on one boss never consumes
// another's allocation, and each is verified on its own.
//
// `summonsNothing` is per BOSS. Only the Razortusk summons (plains-slime and boar,
// from spawns nested inside its Rallying Cry cast and its 10 s repeating cadence),
// so it is the only block where add pressure is legitimate. On the other five, an
// add is the signal that post-terminal replacement guardians leaked into the count
// -- the defect that once reported twelve adds on a boss that summons nothing.
const BLOCKS=[
 {name:'razortusk',cells:6,seeds:[98011],bossId:'gorging-razortusk',bossMaxHp:4000,summonsNothing:false,limitMs:40*60000},
 {name:'juggernaut',cells:6,seeds:[98011],bossId:'stoneplate-juggernaut',bossMaxHp:5000,summonsNothing:true,limitMs:40*60000},
 {name:'behemoth',cells:6,seeds:[98011],bossId:'mire-gorged-behemoth',bossMaxHp:3375,summonsNothing:true,limitMs:40*60000},
 {name:'dreadbore',cells:6,seeds:[98011],bossId:'chitinous-dreadbore',bossMaxHp:4375,summonsNothing:true,limitMs:40*60000},
 {name:'emperor',cells:6,seeds:[98011],bossId:'dune-stalker-emperor',bossMaxHp:3750,summonsNothing:true,limitMs:40*60000},
 {name:'gorger',cells:6,seeds:[98011],bossId:'jungle-dread-gorger',bossMaxHp:3625,summonsNothing:true,limitMs:40*60000},
];

writeFileSync(join(root,'batch-manifest.json'),JSON.stringify({source,...args,blocks:BLOCKS.map(b=>b.name),bosses:BLOCKS.map(b=>b.bossId),started:new Date().toISOString(),ceilingHours:4},null,2));
const note=entry=>appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify(entry)+'\n');
const run=(script,argv,log,limitMs)=>new Promise((resolveRun,reject)=>{
 const stream=createWriteStream(log);const child=spawn(process.execPath,night5ChildArgs(source,script,argv),{cwd:source,stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.pipe(stream);child.stderr.pipe(stream);let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;child.kill();},limitMs);child.on('error',reject);
 child.on('close',code=>{clearTimeout(timer);stream.end(()=>resolveRun({code,timedOut}));});
});

const state={};
for(const BLOCK of BLOCKS){
 const out=join(root,BLOCK.name),start=new Date().toISOString();
 state[BLOCK.name]={artifactVerified:false};
 const result=await run('server/scripts/bossScreen.ts',['--trial=boss2',`--block=${BLOCK.name}`,'--mode=run',`--out=${out}`,`--revision=${args.revision}`,`--hitboxes=${args.hitboxes}`],join(root,`${BLOCK.name}.log`),BLOCK.limitMs);
 note({block:BLOCK.name,start,end:new Date().toISOString(),...result});

 if(result.timedOut){writeFileSync(join(root,`stopped-${BLOCK.name}.json`),JSON.stringify({reason:'watchdog',block:BLOCK.name}));continue;}
 if(result.code!==0){note({block:BLOCK.name,status:'runner-failed-no-retry'});continue;}
 if(!existsSync(join(out,'index.json'))) continue;

 // Verification is deliberately local rather than borrowed from `verifySurvey`:
 // that checker is built for the mob survey's schema, and quietly reinterpreting a
 // boss artifact through it is how a boss ends up read as an ordinary mob.
 try{
  const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
  const manifest=read('manifest.json'),index=read('index.json'),complete=read('complete.json');
  assert.equal(manifest.revision,args.revision,'revision drift');
  assert.equal(manifest.definitionsHash,args.definitions,'definitions drift');
  assert.equal(manifest.hitboxesSha256,args['hitbox-hash'].toLowerCase(),'hitbox drift');
  assert.equal(manifest.bossId,BLOCK.bossId,`${BLOCK.name}: boss identity drift`);
  assert.deepEqual(manifest.seeds,BLOCK.seeds,'seed drift');
  assert.equal(manifest.cells.length,BLOCK.cells,'cell count drift');
  const expected=BLOCK.cells*BLOCK.seeds.length;
  assert.equal(complete.observations,expected,'observation count drift');
  assert.equal(index.length,expected,'index count drift');

  const readies=[];
  for(const r of index){
   const ready=JSON.parse(readFileSync(join(out,`${r.cell}-s${r.seed}/ready.json`),'utf8'));
   readies.push(ready);
   assert.deepEqual(ready.hpTreatment,[],`${r.cell}: Boss2 installs nothing`);
   assert.equal(ready.declaredPackage.treatment,'reference-portable',
    `${r.cell}: every Boss2 cell is a portable reference, never a corroborated one`);
   // The escort receipt rule: a disagreement INVALIDATES the block rather than
   // being reinterpreted, so it is asserted here and not left to the report writer.
   for(const [id,want] of Object.entries(ready.escortsDeclared)){
    assert.equal(ready.escortsAuthored[id].hp,want.hp,`${r.cell}: ${id} hp is not the declared value`);
    assert.equal(ready.escortsAuthored[id].attack,want.attack,`${r.cell}: ${id} attack drift`);
   }
   assert(r.bossMaxHp>0,`${r.cell}: no boss was met`);
  }
  // Explicit legal reference packages: the applied package must BE the declared one,
  // in order, and must fit the budget. This is the SAME checker the preflight runs at
  // zero-fight qualification, so a divergence visible in READY has already stopped
  // the screen before any combat was spent.
  assertDeclarationsApplied(readies);

  // Cross-field verification: outcome, kill evidence, terminal HP and add counts
  // must agree, or the block fails rather than passing with a contradiction in it.
  assertBossRecordsConsistent(index,{bossSummonsNothing:BLOCK.summonsNothing,expectedBossMaxHp:BLOCK.bossMaxHp});

  const summary={verified:true,boss:BLOCK.bossId,observations:index.length,
   wins:index.filter(r=>r.bossKilled).length,
   deaths:index.filter(r=>r.outcome==='bot-died').length,
   capped:index.filter(r=>r.outcome==='capped').length,
   reset:index.filter(r=>r.outcome==='encounter-reset').length,
   vanished:index.filter(r=>r.outcome==='boss-vanished-no-kill').length,
   ambiguous:index.filter(r=>r.outcome==='simultaneous-terminal').length,
   invalid:index.filter(r=>r.outcome==='wall-ceiling').length};
  writeFileSync(join(out,'verification.json'),JSON.stringify(summary,null,2));
  state[BLOCK.name].artifactVerified=true;
  console.log(BLOCK.name,JSON.stringify(summary));
 }catch(error){
  const detail=String(error?.message??error);
  writeFileSync(join(out,'verification.json'),JSON.stringify({verified:false,error:detail},null,2));
  note({block:BLOCK.name,status:'verification-failed',detail});
  console.log(BLOCK.name,'verification failed; preserved without retry');
 }
}
writeFileSync(join(root,'batch-ended.json'),JSON.stringify({ended:new Date().toISOString(),wallMs:Date.now()-started,state},null,2));
