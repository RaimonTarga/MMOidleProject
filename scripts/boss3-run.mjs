import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync,createWriteStream} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {night5ChildArgs} from './night5-child-args.mjs';
import {assertBossRecordsConsistent,assertDeclarationsApplied} from './boss-verify.mjs';
import {BOSS3_ARM_ORDER,BOSS3_BLOCKS,BOSS3_GUARD_IN,armNeutralFingerprint,assertBoss3Arms,rootOf} from './boss3-arms.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');return [s.slice(2,i),s.slice(i+1)];}));
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
assert(args.out&&args.revision&&args.tree&&args.definitions&&args.hitboxes&&args['hitbox-hash'],'All identity inputs required');
const root=resolve(args.out);assert(!existsSync(root),'NEW output root required; no retries');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),args.revision);
assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:source,encoding:'utf8'}).trim(),'','Dirty source');
assert.equal(createHash('sha256').update(readFileSync(args.hitboxes)).digest('hex'),args['hitbox-hash'].toLowerCase());
assert.equal(execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:source,encoding:'utf8'}).trim(),args.tree);
assertBoss3Arms();
mkdirSync(root,{recursive:true});
const started=Date.now();

// Boss3 is ONE bounded counterplay screen, not a search: two bosses, two arms, six
// roots, one reused seed. Twenty-four fights is the whole thing and the runner refuses
// to grow it.
//
// A block holds BOTH ARMS of one boss, deliberately. Splitting the pair across two
// runs would let something other than the substituted Guard differ between them --
// which is precisely the confound this screen exists to exclude. The two blocks remain
// independent of each other: a local problem on one boss never consumes the other's
// allocation, and each is verified on its own.
//
// Neither boss summons. On both, therefore, an add is the signal that post-terminal
// replacement guardians leaked into the count -- the defect that once reported twelve
// adds on a boss that summons nothing.
writeFileSync(join(root,'batch-manifest.json'),JSON.stringify({source,...args,
 trial:'boss3',
 blocks:BOSS3_BLOCKS.map(b=>b.name),bosses:BOSS3_BLOCKS.map(b=>b.bossId),
 arms:BOSS3_ARM_ORDER.map(a=>({name:a.name,treatment:a.treatment,guards:a.guards})),
 seedsReusedFrom:'boss2',
 started:new Date().toISOString(),ceilingHours:4},null,2));
const note=entry=>appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify(entry)+'\n');
const run=(script,argv,log,limitMs)=>new Promise((resolveRun,reject)=>{
 const stream=createWriteStream(log);const child=spawn(process.execPath,night5ChildArgs(source,script,argv),{cwd:source,stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.pipe(stream);child.stderr.pipe(stream);let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;child.kill();},limitMs);child.on('error',reject);
 child.on('close',code=>{clearTimeout(timer);stream.end(()=>resolveRun({code,timedOut}));});
});

const state={};
for(const BLOCK of BOSS3_BLOCKS){
 const out=join(root,BLOCK.name),start=new Date().toISOString();
 state[BLOCK.name]={artifactVerified:false};
 const result=await run('server/scripts/bossScreen.ts',['--trial=boss3',`--block=${BLOCK.name}`,'--mode=run',`--out=${out}`,`--revision=${args.revision}`,`--hitboxes=${args.hitboxes}`],join(root,`${BLOCK.name}.log`),BLOCK.limitMs);
 note({block:BLOCK.name,start,end:new Date().toISOString(),...result});

 if(result.timedOut){writeFileSync(join(root,`stopped-${BLOCK.name}.json`),JSON.stringify({reason:'watchdog',block:BLOCK.name}));continue;}
 if(result.code!==0){note({block:BLOCK.name,status:'runner-failed-no-retry'});continue;}
 if(!existsSync(join(out,'index.json'))) continue;

 // Verification is local rather than borrowed from `verifySurvey`: that checker is
 // built for the mob survey's schema, and quietly reinterpreting a boss artifact
 // through it is how a boss ends up read as an ordinary mob.
 try{
  const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
  const manifest=read('manifest.json'),index=read('index.json'),complete=read('complete.json');
  assert.equal(manifest.revision,args.revision,'revision drift');
  assert.equal(manifest.definitionsHash,args.definitions,'definitions drift');
  assert.equal(manifest.hitboxesSha256,args['hitbox-hash'].toLowerCase(),'hitbox drift');
  assert.equal(manifest.bossId,BLOCK.bossId,`${BLOCK.name}: boss identity drift`);
  // The ORIGINAL Boss2 seed. The baseline arm is a replay of a known failure, which is
  // what makes it a reproducibility control rather than a fresh sample.
  assert.deepEqual(manifest.seeds,[BLOCK.seed],`${BLOCK.name}: seed drift — the baseline must replay Boss2's seed`);
  assert.equal(manifest.cells.length,BLOCK.cells,'cell count drift');
  assert.equal(complete.observations,BLOCK.cells,'observation count drift');
  assert.equal(index.length,BLOCK.cells,'index count drift');

  const readies=[],byRootArm={};
  for(const r of index){
   const ready=JSON.parse(readFileSync(join(out,`${r.cell}-s${r.seed}/ready.json`),'utf8'));
   readies.push(ready);
   assert.deepEqual(ready.hpTreatment,[],`${r.cell}: Boss3 installs nothing`);
   assert.deepEqual(ready.escortsDeclared,{},`${r.cell}: neither Boss3 boss summons`);
   const arm=BOSS3_ARM_ORDER.find(a=>a.treatment===ready.declaredPackage.treatment);
   assert(arm,`${r.cell}: unknown treatment ${ready.declaredPackage.treatment}`);
   // ── THE ARM, in ORDER, on both sides. `verifyDeclaredApplied` compares ability
   //    SETS (it sorts before comparing), which is right for every earlier screen and
   //    insufficient here: guards are walked top-to-bottom and the first eligible one
   //    claims a one-activation-per-window gate, so the same two Guards in the other
   //    order are a different package. Asserted explicitly rather than assumed.
   assert.deepEqual(ready.declaredPackage.abilities.guards,arm.guards,
    `${r.cell}: declared guards != ${arm.name} ${JSON.stringify(arm.guards)}`);
   assert.deepEqual(ready.appliedPackage.attunedAbilities.guards,arm.guards,
    `${r.cell}: APPLIED guards ${JSON.stringify(ready.appliedPackage.attunedAbilities.guards)} != declared ${JSON.stringify(arm.guards)} — order included`);
   // No Rune rule may name a Guard: the substituted ability runs on its authored
   // default trigger, and such a rule would reorder the guard walk as well as change
   // what is measured.
   const named=ready.declaredPackage.runeRules.filter(x=>x.actionId===arm.guards[0]||x.actionId===arm.guards[1]);
   assert.equal(named.length,0,`${r.cell}: a Rune rule names a Guard — the default trigger must be used`);
   assert(r.bossMaxHp>0,`${r.cell}: no boss was met`);
   (byRootArm[rootOf(r.cell)] ??= {})[arm.name]={ready,record:r};
  }
  // Explicit legal reference packages: the applied package must BE the declared one,
  // in order, and must fit the budget. The SAME checker the preflight ran at zero
  // fights, so a divergence visible in a READY receipt already stopped the screen.
  assertDeclarationsApplied(readies);

  // ── PAIRING. Every root must have both arms, and the pair must differ in nothing
  //    but the substituted Guard. Without this the screen could report a contrast
  //    between two packages that also differed somewhere else.
  assert.equal(Object.keys(byRootArm).length,6,`${BLOCK.name}: six distinct roots`);
  const [BASE,SUB]=BOSS3_ARM_ORDER;
  for(const [root_,arms_] of Object.entries(byRootArm)){
   const a=arms_[BASE.name],c=arms_[SUB.name];
   assert(a&&c,`${BLOCK.name}/${root_}: both arms must be present`);
   assert.equal(armNeutralFingerprint(a.ready),armNeutralFingerprint(c.ready),
    `${BLOCK.name}/${root_}: the arms differ in something other than the substituted Guard`);
   assert(c.ready.runicPoints.cost<a.ready.runicPoints.cost,
    `${BLOCK.name}/${root_}: the substitution costs ${c.ready.runicPoints.cost} RP against ${a.ready.runicPoints.cost} — it may only free RP`);
  }

  // Cross-field verification: outcome, kill evidence, terminal HP and add counts must
  // agree, or the block fails rather than passing with a contradiction in it.
  assertBossRecordsConsistent(index,{bossSummonsNothing:BLOCK.summonsNothing,expectedBossMaxHp:BLOCK.bossMaxHp});

  // ── The four PAIRED outcome categories, per root. This is the screen's own
  //    readout, and it is derived from the records rather than composed by hand.
  //
  //    A pair is only interpretable because both halves ran the same everything else,
  //    on the same reused seed, on one revision. `baseline-reproduced` says the replay
  //    matched Boss2's recorded outcome for that cell -- a CONTROL observation, never a
  //    new independent replicate.
  const outcomeOf=r=>r.record.outcome;
  const pairs=Object.entries(byRootArm).map(([root_,arms_])=>{
   const base=outcomeOf(arms_[BASE.name]),sub=outcomeOf(arms_[SUB.name]);
   const won=o=>o==='boss-killed';
   return {root:root_,baseline:base,substitution:sub,
    category: won(base)&&won(sub)?'both-won'
      : !won(base)&&won(sub)?'substitution-only-won'
      : won(base)&&!won(sub)?'baseline-only-won'
      : 'both-lost',
    baselineBossHpRemaining:arms_[BASE.name].record.bossHpRemaining,
    substitutionBossHpRemaining:arms_[SUB.name].record.bossHpRemaining,
    baselineElapsedMs:arms_[BASE.name].record.elapsedMs,
    substitutionElapsedMs:arms_[SUB.name].record.elapsedMs};
  });

  const perArm=Object.fromEntries(BOSS3_ARM_ORDER.map(arm=>{
   const rows=index.filter(r=>{
    const ready=readies.find(x=>x.cell===r.cell);
    return ready.declaredPackage.treatment===arm.treatment;
   });
   return [arm.name,{observations:rows.length,
    wins:rows.filter(r=>r.bossKilled).length,
    deaths:rows.filter(r=>r.outcome==='bot-died').length,
    capped:rows.filter(r=>r.outcome==='capped').length,
    reset:rows.filter(r=>r.outcome==='encounter-reset').length,
    vanished:rows.filter(r=>r.outcome==='boss-vanished-no-kill').length,
    ambiguous:rows.filter(r=>r.outcome==='simultaneous-terminal').length,
    invalid:rows.filter(r=>r.outcome==='wall-ceiling').length}];
  }));

  const summary={verified:true,boss:BLOCK.bossId,seed:BLOCK.seed,
   observations:index.length,perArm,pairs,
   // The treatment's own evidence: whether the substituted Guard actually fired, and
   // what it removed. Read from the raw activation events rather than inferred, and
   // reported even when it is zero -- a treatment that never acted is a real result and
   // must not be presented as a failed tradeoff.
   substitutionActivity:Object.fromEntries(Object.entries(byRootArm).map(([root_,arms_])=>{
    const dir=join(out,`${arms_[SUB.name].record.cell}-s${arms_[SUB.name].record.seed}`);
    const removed={};let activations=0;
    for(const line of readFileSync(join(dir,'events.jsonl'),'utf8').split('\n')){
     if(!line.trim()) continue;
     const e=JSON.parse(line).event;
     if(e.kind!=='ability-activation'||e.abilityId!==BOSS3_GUARD_IN) continue;
     activations++;
     for(const x of e.removedEffects??[]) removed[x.effectId]=(removed[x.effectId]??0)+x.stacks;
    }
    // An activation with NO removal is legal: the `has-debuff` trigger reads
    // harmfulness, not cleanseability. Recorded, never treated as a defect.
    return [root_,{activations,stacksRemoved:removed}];
   })),
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
