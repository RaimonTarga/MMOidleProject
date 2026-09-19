import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync,createWriteStream} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {night5ChildArgs} from './night5-child-args.mjs';
import {assertBossRecordsConsistent,assertDeclarationsApplied} from './boss-verify.mjs';
import {BOSS5_BLOCKS,BOSS5_CAVE_ARMS,BOSS5_CAVE_AUTHORED_ATTACK,BOSS5_GUARDS,
 armNeutralFingerprint,assertBoss5Arms,assertBoss5Receipt,bossNeutralProjection,
 rootOf} from './boss5-arms.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');return [s.slice(2,i),s.slice(i+1)];}));
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
assert(args.out&&args.revision&&args.tree&&args.definitions&&args.hitboxes&&args['hitbox-hash'],'All identity inputs required');
const root=resolve(args.out);assert(!existsSync(root),'NEW output root required; no retries');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),args.revision);
assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:source,encoding:'utf8'}).trim(),'','Dirty source');
assert.equal(createHash('sha256').update(readFileSync(args.hitboxes)).digest('hex'),args['hitbox-hash'].toLowerCase());
assert.equal(execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:source,encoding:'utf8'}).trim(),args.tree);
assertBoss5Arms();
mkdirSync(root,{recursive:true});
const started=Date.now();

// Boss5 is ROSTER BREADTH plus ONE bounded Cave refinement. 6 x N + 12 is the whole
// thing and the runner refuses to grow it.
//
// ONE BLOCK PER BOSS, and they are INDEPENDENT. A gameplay loss, or even a verification
// failure, on one boss must never consume another boss's allocation — that is the whole
// point of breadth, and it is why each block is driven in its own child process and
// verified on its own. The loop deliberately does NOT stop on a failed block.
//
// THE DEFINITIONS HASH PINS THE BASE SOURCE, NOT THE SIMULATED PAYLOAD. It is computed
// once when the child loads, before any arm is installed, so it proves the run started
// from the frozen source and nothing more. For a BREADTH block, which installs nothing,
// the live hash must still equal it at the end — that is what proves no treatment
// leaked in. For a CAVE arm the live hash must DIFFER, because both of its arms are
// treated: 104 is the Boss4 candidate, not authored source.
writeFileSync(join(root,'batch-manifest.json'),JSON.stringify({source,...args,
 trial:'boss5',
 blocks:BOSS5_BLOCKS.map(b=>b.name),bosses:BOSS5_BLOCKS.map(b=>b.bossId),
 blockDetail:BOSS5_BLOCKS.map(b=>({name:b.name,kind:b.kind,bossId:b.bossId,tier:b.tier,
  role:b.role,seed:b.seed,capMs:b.capMs,cells:b.cells})),
 caveArms:BOSS5_CAVE_ARMS,caveAuthoredAttack:BOSS5_CAVE_AUTHORED_ATTACK,
 plannedObservations:BOSS5_BLOCKS.reduce((n,b)=>n+b.cells,0),
 seedsReusedFrom:'breadth=fresh 99011; cave=boss2-via-boss3-boss4',
 started:new Date().toISOString(),ceilingHours:20},null,2));
const note=entry=>appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify(entry)+'\n');
const run=(script,argv,log,limitMs)=>new Promise((resolveRun,reject)=>{
 const stream=createWriteStream(log);const child=spawn(process.execPath,night5ChildArgs(source,script,argv),{cwd:source,stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.pipe(stream);child.stderr.pipe(stream);let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;child.kill();},limitMs);child.on('error',reject);
 child.on('close',code=>{clearTimeout(timer);stream.end(()=>resolveRun({code,timedOut}));});
});

const state={};
for(const BLOCK of BOSS5_BLOCKS){
 const out=join(root,BLOCK.name),start=new Date().toISOString();
 state[BLOCK.name]={artifactVerified:false,kind:BLOCK.kind};
 const result=await run('server/scripts/bossScreen.ts',['--trial=boss5',`--block=${BLOCK.name}`,'--mode=run',`--out=${out}`,`--revision=${args.revision}`,`--hitboxes=${args.hitboxes}`],join(root,`${BLOCK.name}.log`),BLOCK.limitMs);
 note({block:BLOCK.name,kind:BLOCK.kind,start,end:new Date().toISOString(),...result});

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
  assert.deepEqual(manifest.seeds,[BLOCK.seed],`${BLOCK.name}: seed drift`);
  assert.equal(manifest.durationMs,BLOCK.capMs,`${BLOCK.name}: cap drift`);
  assert.equal(manifest.cells.length,BLOCK.cells,'cell count drift');
  assert.equal(complete.observations,BLOCK.cells,'observation count drift');
  assert.equal(index.length,BLOCK.cells,'index count drift');

  const readies=[],byRootArm={};
  for(const r of index){
   const ready=JSON.parse(readFileSync(join(out,`${r.cell}-s${r.seed}/ready.json`),'utf8'));
   readies.push(ready);
   const arm=BLOCK.kind==='cave-refinement'
    ? BOSS5_CAVE_ARMS.find(a=>a.treatment===ready.declaredPackage.treatment)
    : {name:`reference-t${BLOCK.tier}`,treatment:`reference-t${BLOCK.tier}`};
   assert(arm,`${r.cell}: unknown treatment ${ready.declaredPackage.treatment}`);
   // ── THE TREATMENT, or its declared ABSENCE. Same function the preflight ran at
   //    zero fights spent.
   assertBoss5Receipt(ready,BLOCK,arm);
   assert.equal(ready.definitionsIdentity.base,args.definitions,
    `${r.cell}: the receipt's base definitions hash is not the frozen one`);
   // ── THE CARRIED PACKAGE, in ORDER. `verifyDeclaredApplied` compares ability SETS
   //    (it sorts before comparing), which cannot see a swapped guard order — asserted
   //    explicitly rather than assumed, at every tier.
   assert.deepEqual(ready.declaredPackage.abilities.guards,BOSS5_GUARDS,
    `${r.cell}: declared guards != ${JSON.stringify(BOSS5_GUARDS)}`);
   assert.deepEqual(ready.appliedPackage.attunedAbilities.guards,BOSS5_GUARDS,
    `${r.cell}: APPLIED guards ${JSON.stringify(ready.appliedPackage.attunedAbilities.guards)} != declared — order included`);
   const named=ready.declaredPackage.runeRules.filter(x=>BOSS5_GUARDS.includes(x.actionId));
   assert.equal(named.length,0,`${r.cell}: a Rune rule names a Guard — the reference uses default triggers`);
   assert(r.bossMaxHp>0,`${r.cell}: no boss was met`);
   (byRootArm[rootOf(r.cell)] ??= {})[arm.name]={ready,record:r};
  }
  assertDeclarationsApplied(readies);
  assert.equal(Object.keys(byRootArm).length,6,`${BLOCK.name}: six distinct roots`);
  assertBossRecordsConsistent(index,{bossSummonsNothing:true,expectedBossMaxHp:BLOCK.bossHp});

  const outcomeCounts=rows=>({observations:rows.length,
   wins:rows.filter(r=>r.bossKilled).length,
   deaths:rows.filter(r=>r.outcome==='bot-died').length,
   capped:rows.filter(r=>r.outcome==='capped').length,
   reset:rows.filter(r=>r.outcome==='encounter-reset').length,
   vanished:rows.filter(r=>r.outcome==='boss-vanished-no-kill').length,
   ambiguous:rows.filter(r=>r.outcome==='simultaneous-terminal').length,
   invalid:rows.filter(r=>r.outcome==='wall-ceiling').length});

  const summary={verified:true,block:BLOCK.name,kind:BLOCK.kind,boss:BLOCK.bossId,
   tier:BLOCK.tier,seed:BLOCK.seed,capMs:BLOCK.capMs,observations:index.length,
   ...outcomeCounts(index)};

  if(BLOCK.kind==='breadth'){
   // ── The per-root readout. Breadth produces a COVERAGE row, not a comparison:
   //    there is no second arm to pair against, so an outcome, a duration and the
   //    HP fraction actually removed are all that is reported. No ttk is
   //    extrapolated from a non-kill, and a CAP is kept distinct from a DEATH.
   summary.perRoot=Object.fromEntries(Object.entries(byRootArm).map(([root_,arms_])=>{
    const rec=Object.values(arms_)[0].record;
    return [root_,{outcome:rec.outcome,elapsedMs:rec.elapsedMs,
     bossHpRemaining:rec.bossHpRemaining,bossMaxHp:rec.bossMaxHp,
     fractionRemoved:rec.bossMaxHp>0?+(1-rec.bossHpRemaining/rec.bossMaxHp).toFixed(4):null,
     crossedHalfAtMs:rec.crossedHalfAtMs,minHpFraction:rec.minHpFraction,
     damageFromBoss:rec.damageFromBoss,hpLost:rec.hpLost,peakBurst1s:rec.peakBurst1s}];
   }));
  }else{
   // ── Block C's paired readout. BOTH arms are treated, so neither is a control and
   //    the categories are named for the arms rather than for "control/candidate".
   const won=o=>o==='boss-killed';
   const [A,B]=BOSS5_CAVE_ARMS;
   for(const [root_,arms_] of Object.entries(byRootArm)){
    const a=arms_[A.name],b=arms_[B.name];
    assert(a&&b,`${BLOCK.name}/${root_}: both arms must be present`);
    assert.equal(armNeutralFingerprint(a.ready),armNeutralFingerprint(b.ready),
     `${BLOCK.name}/${root_}: the arms differ in the PLAYER package`);
    assert.equal(bossNeutralProjection(a.ready),bossNeutralProjection(b.ready),
     `${BLOCK.name}/${root_}: the arms differ in a boss field other than the installed attack`);
    assert.equal(a.ready.runicPoints.cost,b.ready.runicPoints.cost,
     `${BLOCK.name}/${root_}: the arms cost different RP`);
   }
   summary.perArm=Object.fromEntries(BOSS5_CAVE_ARMS.map(arm=>{
    const rows=index.filter(r=>readies.find(x=>x.cell===r.cell).declaredPackage.treatment===arm.treatment);
    return [arm.name,{attack:arm.attack,treated:true,...outcomeCounts(rows)}];
   }));
   summary.pairs=Object.entries(byRootArm).map(([root_,arms_])=>{
    const a=arms_[A.name].record,b=arms_[B.name].record;
    return {root:root_,
     [`${A.name}`]:a.outcome,[`${B.name}`]:b.outcome,
     category: won(a.outcome)&&won(b.outcome)?'both-won'
       : !won(a.outcome)&&won(b.outcome)?'lower-only-won'
       : won(a.outcome)&&!won(b.outcome)?'upper-only-won'
       : 'both-lost',
     upperBossHpRemaining:a.bossHpRemaining,lowerBossHpRemaining:b.bossHpRemaining,
     upperElapsedMs:a.elapsedMs,lowerElapsedMs:b.elapsedMs,
     upperCrossedHalfAtMs:a.crossedHalfAtMs,lowerCrossedHalfAtMs:b.crossedHalfAtMs};
   });
   // The candidate's own evidence, read from raw events rather than inferred: the
   // largest single INCOMING hit and the Brace activations, so a change in burst is
   // visible as burst. Reported even when zero.
   summary.channelEvidence=Object.fromEntries(Object.entries(byRootArm).map(([root_,arms_])=>{
    const scan=side=>{
     const rec=arms_[side].record;
     const dir=join(out,`${rec.cell}-s${rec.seed}`);
     // INCOMING ONLY. Without the filter on the player as TARGET, the player's own
     // swings land in `largestHit` and the report names a player hit as the largest
     // incoming one — the Boss3/Boss4 raw-event trap.
     const playerId=arms_[side].ready.view.id;
     let largestHit=0,guardActivations=0,dotTicks=0,dotDamage=0;
     for(const line of readFileSync(join(dir,'events.jsonl'),'utf8').split('\n')){
      if(!line.trim()) continue;
      const e=JSON.parse(line).event;
      if(e.kind==='ability-activation'&&BOSS5_GUARDS.includes(e.abilityId)) guardActivations++;
      if(e.kind!=='damage'||e.target?.id!==playerId) continue;
      const amount=(e.hpDamage??0)+(e.absorbed??0);
      if(e.damageType==='dot'){dotTicks++;dotDamage+=amount;}
      else if(amount>largestHit) largestHit=amount;
     }
     return {largestHit,guardActivations,dotTicks,dotDamage,
      outcome:rec.outcome,elapsedMs:rec.elapsedMs,damageFromBoss:rec.damageFromBoss,
      hpLost:rec.hpLost,peakBurst1s:rec.peakBurst1s,minHpFraction:rec.minHpFraction};
    };
    return [root_,{[A.name]:scan(A.name),[B.name]:scan(B.name)}];
   }));
  }

  writeFileSync(join(out,'verification.json'),JSON.stringify(summary,null,2));
  state[BLOCK.name].artifactVerified=true;
  state[BLOCK.name].wins=summary.wins;
  console.log(BLOCK.name,JSON.stringify(BLOCK.kind==='breadth'
   ? {wins:summary.wins,deaths:summary.deaths,capped:summary.capped}
   : {perArm:summary.perArm,categories:summary.pairs.reduce((m,p)=>({...m,[p.category]:(m[p.category]??0)+1}),{})}));
 }catch(error){
  const detail=String(error?.message??error);
  writeFileSync(join(out,'verification.json'),JSON.stringify({verified:false,error:detail},null,2));
  note({block:BLOCK.name,status:'verification-failed',detail});
  console.log(BLOCK.name,'verification failed; preserved without retry');
 }
}
writeFileSync(join(root,'batch-ended.json'),JSON.stringify({ended:new Date().toISOString(),wallMs:Date.now()-started,state},null,2));
