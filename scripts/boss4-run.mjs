import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync,createWriteStream} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {night5ChildArgs} from './night5-child-args.mjs';
import {assertBossRecordsConsistent,assertDeclarationsApplied} from './boss-verify.mjs';
import {BOSS4_BLOCKS,armNeutralFingerprint,assertBoss4Arms,assertTreatmentReceipt,
 bossNeutralProjection,rootOf} from './boss4-arms.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');return [s.slice(2,i),s.slice(i+1)];}));
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
assert(args.out&&args.revision&&args.tree&&args.definitions&&args.hitboxes&&args['hitbox-hash'],'All identity inputs required');
const root=resolve(args.out);assert(!existsSync(root),'NEW output root required; no retries');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),args.revision);
assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:source,encoding:'utf8'}).trim(),'','Dirty source');
assert.equal(createHash('sha256').update(readFileSync(args.hitboxes)).digest('hex'),args['hitbox-hash'].toLowerCase());
assert.equal(execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:source,encoding:'utf8'}).trim(),args.tree);
assertBoss4Arms();
mkdirSync(root,{recursive:true});
const started=Date.now();

// Boss4 is ONE bounded pressure comparison per boss, not a search: two bosses, two
// arms, six roots, one reused seed. Twenty-four fights is the whole thing and the
// runner refuses to grow it.
//
// A block holds BOTH ARMS of one boss, deliberately. Splitting the pair across two
// runs would let something other than the installed candidate differ between them.
// The two blocks remain independent of each other — and they run in separate child
// processes, so a candidate installed for one boss cannot reach the other even if a
// restore were somehow missed.
//
// THE DEFINITIONS HASH PINS THE BASE SOURCE, NOT THE SIMULATED PAYLOAD. It is
// computed once when the child loads, before any candidate is installed, so it proves
// the run started from the frozen source and nothing more. What proves a treated arm
// actually ran treated is its own `damageTreatment` record, its runtime readback, and
// its LIVE definitions hash differing from that base — all asserted per cell below.
writeFileSync(join(root,'batch-manifest.json'),JSON.stringify({source,...args,
 trial:'boss4',
 blocks:BOSS4_BLOCKS.map(b=>b.name),bosses:BOSS4_BLOCKS.map(b=>b.bossId),
 blockDetail:BOSS4_BLOCKS.map(b=>({name:b.name,bossId:b.bossId,originArm:b.originArm,
  guards:b.guards,candidate:b.candidate,arms:b.arms})),
 seedsReusedFrom:'boss2-via-boss3',
 started:new Date().toISOString(),ceilingHours:4},null,2));
const note=entry=>appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify(entry)+'\n');
const run=(script,argv,log,limitMs)=>new Promise((resolveRun,reject)=>{
 const stream=createWriteStream(log);const child=spawn(process.execPath,night5ChildArgs(source,script,argv),{cwd:source,stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.pipe(stream);child.stderr.pipe(stream);let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;child.kill();},limitMs);child.on('error',reject);
 child.on('close',code=>{clearTimeout(timer);stream.end(()=>resolveRun({code,timedOut}));});
});

const state={};
for(const BLOCK of BOSS4_BLOCKS){
 const out=join(root,BLOCK.name),start=new Date().toISOString();
 state[BLOCK.name]={artifactVerified:false};
 const result=await run('server/scripts/bossScreen.ts',['--trial=boss4',`--block=${BLOCK.name}`,'--mode=run',`--out=${out}`,`--revision=${args.revision}`,`--hitboxes=${args.hitboxes}`],join(root,`${BLOCK.name}.log`),BLOCK.limitMs);
 note({block:BLOCK.name,start,end:new Date().toISOString(),...result});

 if(result.timedOut){writeFileSync(join(root,`stopped-${BLOCK.name}.json`),JSON.stringify({reason:'watchdog',block:BLOCK.name}));continue;}
 if(result.code!==0){note({block:BLOCK.name,status:'runner-failed-no-retry'});continue;}
 if(!existsSync(join(out,'index.json'))) continue;

 try{
  const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
  const manifest=read('manifest.json'),index=read('index.json'),complete=read('complete.json');
  assert.equal(manifest.revision,args.revision,'revision drift');
  // The BASE definitions hash: computed at load, before any install. See above.
  assert.equal(manifest.definitionsHash,args.definitions,'base definitions drift');
  assert.equal(manifest.hitboxesSha256,args['hitbox-hash'].toLowerCase(),'hitbox drift');
  assert.equal(manifest.bossId,BLOCK.bossId,`${BLOCK.name}: boss identity drift`);
  assert.deepEqual(manifest.seeds,[BLOCK.seed],`${BLOCK.name}: seed drift — the control must replay its Boss3 arm`);
  assert.equal(manifest.cells.length,BLOCK.cells,'cell count drift');
  assert.equal(complete.observations,BLOCK.cells,'observation count drift');
  assert.equal(index.length,BLOCK.cells,'index count drift');

  const readies=[],byRootArm={};
  for(const r of index){
   const ready=JSON.parse(readFileSync(join(out,`${r.cell}-s${r.seed}/ready.json`),'utf8'));
   readies.push(ready);
   const arm=BLOCK.arms.find(a=>a.treatment===ready.declaredPackage.treatment);
   assert(arm,`${r.cell}: unknown treatment ${ready.declaredPackage.treatment}`);
   // ── THE TREATMENT: declared, installed, reached the runtime, and — on a control —
   //    proven restored. Same function the preflight ran at zero fights spent.
   assertTreatmentReceipt(ready,BLOCK,arm);
   assert.equal(ready.definitionsIdentity.base,args.definitions,
    `${r.cell}: the receipt's base definitions hash is not the frozen one`);
   // ── THE CARRIED PACKAGE, in ORDER, on both sides. `verifyDeclaredApplied`
   //    compares ability SETS (it sorts before comparing), which cannot see a swapped
   //    guard order — asserted explicitly rather than assumed.
   assert.deepEqual(ready.declaredPackage.abilities.guards,BLOCK.guards,
    `${r.cell}: declared guards != the Boss3 ${BLOCK.originArm} list ${JSON.stringify(BLOCK.guards)}`);
   assert.deepEqual(ready.appliedPackage.attunedAbilities.guards,BLOCK.guards,
    `${r.cell}: APPLIED guards ${JSON.stringify(ready.appliedPackage.attunedAbilities.guards)} != declared — order included`);
   const named=ready.declaredPackage.runeRules.filter(x=>BLOCK.guards.includes(x.actionId));
   assert.equal(named.length,0,`${r.cell}: a Rune rule names a Guard — the carried package uses default triggers`);
   assert(r.bossMaxHp>0,`${r.cell}: no boss was met`);
   (byRootArm[rootOf(r.cell)] ??= {})[arm.name]={ready,record:r};
  }
  assertDeclarationsApplied(readies);

  // ── PAIRING. Every root must have both arms; the player package must be identical
  //    and the boss must differ in the candidate field and nowhere else.
  assert.equal(Object.keys(byRootArm).length,6,`${BLOCK.name}: six distinct roots`);
  const [CONTROL,TREATED]=BLOCK.arms;
  for(const [root_,arms_] of Object.entries(byRootArm)){
   const a=arms_[CONTROL.name],c=arms_[TREATED.name];
   assert(a&&c,`${BLOCK.name}/${root_}: both arms must be present`);
   assert.equal(armNeutralFingerprint(a.ready),armNeutralFingerprint(c.ready),
    `${BLOCK.name}/${root_}: the arms differ in the PLAYER package`);
   assert.equal(bossNeutralProjection(a.ready,BLOCK),bossNeutralProjection(c.ready,BLOCK),
    `${BLOCK.name}/${root_}: the arms differ in a boss field other than the candidate`);
   assert.equal(a.ready.runicPoints.cost,c.ready.runicPoints.cost,
    `${BLOCK.name}/${root_}: the arms cost different RP`);
  }

  assertBossRecordsConsistent(index,{bossSummonsNothing:BLOCK.summonsNothing,expectedBossMaxHp:BLOCK.bossMaxHp});

  // ── The four PAIRED outcome categories, per root, derived from the records rather
  //    than composed by hand. A control is a CHECK against the corresponding Boss3
  //    arm — never a new independent replication, and never pooled with it.
  const won=o=>o==='boss-killed';
  const pairs=Object.entries(byRootArm).map(([root_,arms_])=>{
   const base=arms_[CONTROL.name].record.outcome,cand=arms_[TREATED.name].record.outcome;
   return {root:root_,control:base,candidate:cand,
    category: won(base)&&won(cand)?'both-won'
      : !won(base)&&won(cand)?'candidate-only-won'
      : won(base)&&!won(cand)?'control-only-won'
      : 'both-lost',
    controlBossHpRemaining:arms_[CONTROL.name].record.bossHpRemaining,
    candidateBossHpRemaining:arms_[TREATED.name].record.bossHpRemaining,
    controlElapsedMs:arms_[CONTROL.name].record.elapsedMs,
    candidateElapsedMs:arms_[TREATED.name].record.elapsedMs,
    controlCrossedHalfAtMs:arms_[CONTROL.name].record.crossedHalfAtMs,
    candidateCrossedHalfAtMs:arms_[TREATED.name].record.crossedHalfAtMs};
  });

  const perArm=Object.fromEntries(BLOCK.arms.map(arm=>{
   const rows=index.filter(r=>{
    const ready=readies.find(x=>x.cell===r.cell);
    return ready.declaredPackage.treatment===arm.treatment;
   });
   return [arm.name,{observations:rows.length,treated:arm.treated,
    wins:rows.filter(r=>r.bossKilled).length,
    deaths:rows.filter(r=>r.outcome==='bot-died').length,
    capped:rows.filter(r=>r.outcome==='capped').length,
    reset:rows.filter(r=>r.outcome==='encounter-reset').length,
    vanished:rows.filter(r=>r.outcome==='boss-vanished-no-kill').length,
    ambiguous:rows.filter(r=>r.outcome==='simultaneous-terminal').length,
    invalid:rows.filter(r=>r.outcome==='wall-ceiling').length}];
  }));

  // ── The candidate's own evidence, read from raw events rather than inferred.
  //
  //    Swamp: venom ticks and Cleanse removals, so a change in DoT throughput is
  //    visible as ticks rather than only as a survival time. Cave: the largest single
  //    landed hit and the Brace activations, so a change in burst is visible as burst.
  //    Reported even when zero — a candidate that changed nothing observable is a real
  //    result and must not be dressed up as one that did.
  const channelEvidence=Object.fromEntries(Object.entries(byRootArm).map(([root_,arms_])=>{
   const scan=side=>{
    const rec=arms_[side].record;
    const dir=join(out,`${rec.cell}-s${rec.seed}`);
    // INCOMING ONLY. Every damage event in the journal is scanned, so the filter on
    // the player as TARGET is load-bearing: without it the player's own hits on the
    // boss land in `largestHit`, and a Swamp fight whose real largest incoming hit is
    // a 12-point melee blow reports a 112-point player swing instead.
    const playerId=arms_[side].ready.view.id;
    let dotTicks=0,dotDamage=0,largestHit=0,guardActivations=0;
    const removed={};
    for(const line of readFileSync(join(dir,'events.jsonl'),'utf8').split('\n')){
     if(!line.trim()) continue;
     const e=JSON.parse(line).event;
     if(e.kind==='ability-activation'&&BLOCK.guards.includes(e.abilityId)){
      guardActivations++;
      for(const x of e.removedEffects??[]) removed[x.effectId]=(removed[x.effectId]??0)+x.stacks;
     }
     if(e.kind!=='damage'||e.target?.id!==playerId) continue;
     const amount=(e.hpDamage??0)+(e.absorbed??0);
     if(e.damageType==='dot'){dotTicks++;dotDamage+=amount;}
     else if(amount>largestHit) largestHit=amount;
    }
    return {dotTicks,dotDamage,largestHit,guardActivations,stacksRemoved:removed,
     outcome:rec.outcome,elapsedMs:rec.elapsedMs,damageFromBoss:rec.damageFromBoss,
     hpLost:rec.hpLost,peakBurst1s:rec.peakBurst1s,minHpFraction:rec.minHpFraction};
   };
   return [root_,{control:scan(CONTROL.name),candidate:scan(TREATED.name)}];
  }));

  const summary={verified:true,boss:BLOCK.bossId,seed:BLOCK.seed,
   candidate:BLOCK.candidate,originArm:BLOCK.originArm,carriedGuards:BLOCK.guards,
   observations:index.length,perArm,pairs,channelEvidence,
   wins:index.filter(r=>r.bossKilled).length,
   deaths:index.filter(r=>r.outcome==='bot-died').length,
   capped:index.filter(r=>r.outcome==='capped').length,
   reset:index.filter(r=>r.outcome==='encounter-reset').length,
   vanished:index.filter(r=>r.outcome==='boss-vanished-no-kill').length,
   ambiguous:index.filter(r=>r.outcome==='simultaneous-terminal').length,
   invalid:index.filter(r=>r.outcome==='wall-ceiling').length};
  writeFileSync(join(out,'verification.json'),JSON.stringify(summary,null,2));
  state[BLOCK.name].artifactVerified=true;
  console.log(BLOCK.name,JSON.stringify({perArm:summary.perArm,
   categories:pairs.reduce((m,p)=>({...m,[p.category]:(m[p.category]??0)+1}),{})}));
 }catch(error){
  const detail=String(error?.message??error);
  writeFileSync(join(out,'verification.json'),JSON.stringify({verified:false,error:detail},null,2));
  note({block:BLOCK.name,status:'verification-failed',detail});
  console.log(BLOCK.name,'verification failed; preserved without retry');
 }
}
writeFileSync(join(root,'batch-ended.json'),JSON.stringify({ended:new Date().toISOString(),wallMs:Date.now()-started,state},null,2));
