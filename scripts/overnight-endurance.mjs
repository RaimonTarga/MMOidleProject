// Fixed dispatcher for the existing production-backed ttkSurvey child. No combat logic.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, statfsSync, readdirSync, createReadStream, openSync, closeSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { freemem } from 'node:os';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(join(root,'server/package.json'));
const enduranceSpec=require('../server/bench/balance/overnightEnduranceSpec.ts');
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');assert(i>2);return [a.slice(2,i),a.slice(i+1)];}));
assert(['prepare','verify','qualify','receipt-check','run'].includes(args.mode));assert(args.packet);
const tundraClassFrame=args.trial==='t3-tundra-class-frame-01';
const desert=args.trial==='desert-strategy-01';
const guardCoverage=args.trial==='guard-coverage-01';
const day2=args.trial==='day2-bounded-01';
const family=args.family;
if(day2)assert(['A-control','A-candidate','B'].includes(family));
const cells=tundraClassFrame?require('../server/bench/balance/tundraClassFrameSpec.ts').TUNDRA_CLASS_FRAME_CELLS:desert?require('../server/bench/balance/desertStrategySpec.ts').DESERT_CELLS:guardCoverage?require('../server/bench/balance/guardCoverageSpec.ts').GUARD_COVERAGE_CELLS:day2?require('../server/bench/balance/day2Spec.ts').DAY2_CELLS.filter(c=>family==='B'?c.block==='B':c.block==='A' && `A-${c.arm}`===family):enduranceSpec.ENDURANCE_CELLS;
const seeds=[...new Set(cells.map(c=>c.seed))];
const planned=cells.length, capMs=(tundraClassFrame||desert)?600000:day2 && family!=='B'?300000:1800000;
const experimentId=tundraClassFrame?'t3-tundra-class-frame-01':desert?'desert-strategy-01':guardCoverage?'guard-coverage-01':day2?'day2-bounded-01':'overnight-endurance-01';
const packet=resolve(args.packet), sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8',maxBuffer:32*1024**2}).trim();
const watchdogs={minimumDiskFreeBytes:5*1024**3,minimumHostFreeMemoryBytes:1024**3,maximumChildRssBytes:2*1024**3,
  heartbeatTimeoutMs:120000,pollMs:5000,absoluteWallCeilingMs:null,maximumChildren:1,retries:0};
function identity(hitboxes) {
  const paths=git('ls-files','-z','--cached','--others','--exclude-standard').split('\0').filter(p=>
    /^(server\/|shared\/|bot\/src\/|scripts\/)/.test(p)||/(^|\/)(package\.json|tsconfig[^/]*\.json)$/.test(p)||
    ['pnpm-lock.yaml','pnpm-workspace.yaml','client/public/assets/sprites.json','client/public/assets/sprites.png'].includes(p));
  const files=Object.fromEntries([...new Set(paths)].sort().map(p=>[p,sha(readFileSync(join(root,p)))]));
  return {sourceCommit:git('rev-parse','HEAD'),sourceSha256:sha(JSON.stringify(files)),files,node:process.version,
    hitboxes:resolve(hitboxes),hitboxesSha256:sha(readFileSync(hitboxes))};
}
if(args.mode==='prepare') {
  if(args.reuse)assert(day2 && family==='B','Reuse only in Block B');
  assert(args.hitboxes && !existsSync(packet));assert.equal(git('status','--porcelain','--untracked-files=no'),'');
  mkdirSync(packet,{recursive:true});
  write(join(packet,'manifest.json'),{experimentId,status:'prepared-unrun',planned,family:family??null,
    blocks:tundraClassFrame?{primary:36,alternatives:16,discardedSquireSlam:0}:desert?{targeting:24}:guardCoverage?{coverage:32}:day2?{A:cells.filter(c=>c.block==='A').length,B:cells.filter(c=>c.block==='B').length}:{A:288,B:48,C:0},...(tundraClassFrame?{candidateDisposition:'52-case T3 Tundra class/frame screen; Squire Slam discarded by designer; production R2, session correction and native owner targeting unchanged'}:desert?{candidateDisposition:'Native targeting only; production R2 and integrated session correction unchanged'}:guardCoverage?{candidateDisposition:'Normal R2 plus integrated measured session correction; fixed Endure packages'}:day2?{candidateDisposition:'Separate candidate checkout only; Block B retains control gameplay'}:{optionalC:{included:false,candidate:null,reason:'Existing diagnosis has no qualified candidate; see CONDUIT_DIAGNOSIS.md'}}),
    reused:args.reuse?json(resolve(args.reuse)):null,
    seeds,dtMs:100,capMs,endpointsMs:((tundraClassFrame||desert)?[300000,600000]:[300000,900000,1800000]).filter(x=>x<=capMs),synthetic:true,economyEligible:false,
    stopOnFirstDeath:true,watchdogs,sharedFailureFamily:tundraClassFrame?'T3 Tundra class/frame (52 cells, one common source)':desert?'Desert strategy (24 cells, one common source)':guardCoverage?'Guard coverage (32 cells, one common source)':day2?(family==='B'?'B':'A'):'all A/B ordinary-farm children',cases:cells});
  write(join(packet,'identity.json'),identity(args.hitboxes));
  write(join(packet,'seal.json'),Object.fromEntries(['manifest.json','identity.json'].map(p=>[p,sha(readFileSync(join(packet,p)))])));
  console.log(`Sealed ${planned} planned observations; no combat.`);process.exit(0);
}
const manifest=json(join(packet,'manifest.json')),frozen=json(join(packet,'identity.json'));
function verify() {
  for(const [p,h] of Object.entries(json(join(packet,'seal.json'))))assert.equal(sha(readFileSync(join(packet,p))),h,`Packet drift: ${p}`);
  assert.deepEqual(identity(frozen.hitboxes),frozen,'Source/runtime drift; stop, do not reseal');
  if(day2)assert.equal(manifest.family,family);assert.equal(manifest.experimentId,experimentId);assert.deepEqual(manifest.cases,cells);assert.deepEqual(manifest.watchdogs,watchdogs);
}
verify();
if(args.mode==='verify'){console.log(`Fixed checkout, source, runtime, hitboxes and ${planned}-case ledger verified.`);process.exit(0);}
if(args.mode==='receipt-check')assert(tundraClassFrame,'Receipt check is scoped to the T3 Tundra recovery packet');
assert(args.out);const out=resolve(args.out);assert(!existsSync(out),'Fresh output only');
const marker=join(packet,`${args.mode}-launched.json`);assert(!existsSync(marker),'No retries');
const qualification=['receipt-check','run'].includes(args.mode)?json(join(packet,'qualified.json')):null;
if(qualification){
  assert.equal(qualification.completed,planned);assert.equal(qualification.combatObservations,0);
  assert.equal(qualification.manifestSha256,sha(readFileSync(join(packet,'manifest.json'))));
  assert.equal(sha(readFileSync(join(qualification.out,'resolved-builds.json'))),qualification.receiptsSha256);
}
if(args.mode==='run' && tundraClassFrame){
  const checked=json(join(packet,'receipt-verified.json'));
  assert.equal(checked.sourceCommit,frozen.sourceCommit);
  assert.equal(checked.manifestSha256,sha(readFileSync(join(packet,'manifest.json'))));
  assert.equal(checked.qualificationReceiptsSha256,qualification.receiptsSha256);
  assert.equal(sha(readFileSync(join(checked.out,'resolved-builds.json'))),checked.verificationReceiptsSha256);
}
mkdirSync(out,{recursive:true});write(marker,{out,at:new Date().toISOString(),sourceCommit:frozen.sourceCommit});
write(join(out,'manifest.json'),manifest);write(join(out,'identity.json'),frozen);
const receipts=[],inventory=[],rows=cells.map(c=>({observationId:c.id,identityId:c.identityId,block:c.block,comparisonId:c.comparisonId,
  seed:c.seed,tier:c.tier,root:c.className,frame:c.frame,path:c.pathName,skillPath:c.build.skillPath,range:c.range,fixture:c.nodeId,arm:c.arm,
  measuredSourceCommit:frozen.sourceCommit,sourceObservationId:null,status:'not-run',outcome:null,elapsedMs:null,completedKills:null,endpoints:null,intervals:null,reason:'Not started'}));
function publish(){
  const counts={planned,completed:rows.filter(r=>['complete','reused'].includes(r.status)).length,newCompleted:rows.filter(r=>r.status==='complete').length,reused:rows.filter(r=>r.status==='reused').length,omitted:0,failed:rows.filter(r=>r.status==='failure').length,
    notRun:rows.filter(r=>r.status==='not-run').length,qualified:rows.filter(r=>r.status==='qualified').length};
  write(join(out,'results-summary.json'),{experimentId:manifest.experimentId,mode:args.mode,actualExecutionSource:frozen.sourceCommit,
    sourceSha256:frozen.sourceSha256,hitboxesSha256:frozen.hitboxesSha256,synthetic:true,economyEligible:false,counts,rows});
  write(join(out,'resolved-builds.json'),receipts);write(join(out,'raw-inventory.json'),inventory);
  writeFileSync(join(out,'PARTIAL.md'),`# ${experimentId} — ${args.mode}\n\n${JSON.stringify(counts)}\n\n`+
    '| Identity | Seed | Fixture | Arm | Status | Kills | Elapsed ms |\n|---|---|---|---|---|---|---|\n'+
    rows.filter(r=>r.status!=='not-run').map(r=>`| ${r.identityId} | ${r.seed} | ${r.fixture} | ${r.arm} | ${r.status} | ${r.completedKills??''} | ${r.elapsedMs??''} |`).join('\n')+'\n');
}
async function hashFile(p){const hash=createHash('sha256');for await(const chunk of createReadStream(p))hash.update(chunk);return hash.digest('hex');}
async function addInventory(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await addInventory(p);else inventory.push({path:p,bytes:statSync(p).size,sha256:await hashFile(p)});}}
async function child(block,mode,dest){
  mkdirSync(dest,{recursive:true});
  const childOut=join(dest,'artifacts');
  const argv=['--import',pathToFileURL(require.resolve('tsx')).href,'--conditions=development','scripts/ttkSurvey.ts',`--trial=${experimentId}`,
    `--block=${block}`,`--mode=${mode}`,`--revision=${frozen.sourceCommit}`,`--source-contract=${join(packet,'identity.json')}`,
    `--hitboxes=${frozen.hitboxes}`,`--out=${childOut}`];
  const fd=openSync(join(dest,'process.log'),'w');
  let reason=null,lastProgress=Date.now(),previous=-1;
  const cp=spawn(process.execPath,argv,{cwd:join(root,'server'),stdio:['ignore',fd,fd],windowsHide:true});
  write(join(dest,'process.json'),{pid:cp.pid,argv,status:'running'});
  const timer=setInterval(()=>{
    try {
      const h=join(childOut,'heartbeat.json');
      if(existsSync(h)){const beat=json(h);if(beat.elapsedMs>previous){previous=beat.elapsedMs;lastProgress=Date.now();}}
      // Zero-tick qualification advances its existing index between builds.
      if(mode==='qualify' && existsSync(join(childOut,'index.json'))){const n=statSync(join(childOut,'index.json')).mtimeMs;if(n>previous){previous=n;lastProgress=Date.now();}}
      const disk=statfsSync(out);
      if(disk.bavail*disk.bsize<watchdogs.minimumDiskFreeBytes)reason='Storage watchdog';
      if(freemem()<watchdogs.minimumHostFreeMemoryBytes)reason='Host memory watchdog';
      if(Date.now()-lastProgress>watchdogs.heartbeatTimeoutMs)reason='No advancing child heartbeat for 120 seconds';
      if(reason)cp.kill();
    }catch(e){if(e instanceof SyntaxError)return;reason=String(e);cp.kill();}
  },watchdogs.pollMs);
  const status=await new Promise(resolve=>{cp.on('error',e=>{reason=String(e);resolve(null);});cp.on('close',resolve);});
  clearInterval(timer);closeSync(fd);write(join(dest,'process.json'),{pid:cp.pid,argv,status,reason});
  assert.equal(status,0,reason??`Child failure; inspect ${dest}/process.log`);verify();
  const m=json(join(childOut,'manifest.json'));
  assert.equal(m.revision,frozen.sourceCommit);assert.equal(m.durationMs,capMs);assert.equal(m.dtMs,100);
  assert.equal(m.hitboxesSha256,frozen.hitboxesSha256);assert(existsSync(join(childOut,'complete.json')));
  assert(!existsSync(join(childOut,'failed.json')));
  return {childOut,m};
}
function validateReuse(c,qualified,reused) {
  assert(day2 && family==='B' && c.arm==='control');
  const old=reused.receipt,result=reused.result;
  assert.equal(result.observationId,c.sourceObservationId);assert.equal(old.observationId,c.sourceObservationId);
  assert.equal(result.status,'complete');assert.equal(result.seed,c.seed);assert.equal(result.fixture,c.nodeId);
  assert.equal(old.runtime.seed,c.seed);assert.equal(old.runtime.durationMs,capMs);assert.equal(old.runtime.dtMs,100);
  assert.equal(old.runtime.revision,manifest.reused.measuredSourceCommit);
  for(const k of ['packageReadback','conduitProfile','initialRosterHash','initialRoster','sustainReadback','definitionsIdentity']) assert.deepEqual(old[k],qualified[k],`Reuse ${k} mismatch`);
  const view=x=>({...x.initialView,name:''});assert.deepEqual(view(old),view(qualified),'Reuse applied view mismatch');
}
function receipt(c,r,m){
  assert.equal(r.cell,c.id);assert.equal(r.seed,c.seed);assert.equal(r.runtime.seed,c.seed);assert.equal(r.runtime.arm,c.arm);
  assert.equal(r.runtime.revision,frozen.sourceCommit);assert.equal(r.runtime.durationMs,capMs);assert.equal(r.runtime.dtMs,100);
  assert.equal(r.view.activeStance,c.stance);assert.deepEqual(r.view.attunedStances,[c.stance]);
  assert.deepEqual(r.packageReadback.declared.abilities,c.abilities);assert.deepEqual(r.packageReadback.declared.runeRules,c.runeRules);
  assert.deepEqual(r.packageReadback.skillPath,c.build.skillPath);assert.equal(r.definitionsIdentity.treated,false);
  assert.equal(r.definitionsIdentity.live,m.definitionsHash);assert.deepEqual(r.hpTreatment,[]);
  assert.equal(r.view.hp,r.view.maxHp);assert.equal(r.view.barrier,r.view.barrierMax);
  const rec={observationId:c.id,seed:c.seed,identityId:c.identityId,referenceCaseId:c.referenceCaseId,path:c.pathName,range:c.range,
    ...((guardCoverage||desert)?{guardReadback:r.guardReadback}:{}),...(desert?{targetingReadback:r.targetingReadback}:{}),packageReadback:r.packageReadback,conduitProfile:r.conduitProfile,initialRosterHash:r.initialRosterHash,
    initialRoster:r.initialRoster,definitionsIdentity:r.definitionsIdentity,initialView:r.view,sustainReadback:r.sustainReadback,runtime:r.runtime};
  const partner=!tundraClassFrame && !desert && !day2 && !guardCoverage && receipts.find(x=>cells.find(c=>c.id===x.observationId).comparisonId===c.comparisonId);
  if(partner){
    assert.equal(partner.initialRosterHash,rec.initialRosterHash,'Paired initial ecology mismatch');
    const mountain=c.charm==='mountain'?rec:partner,volcanic=c.charm==='volcanic'?rec:partner;
    assert(mountain.initialView.barrier>volcanic.initialView.barrier,'Charm swap retained Mountain barrier');
    assert(volcanic.sustainReadback.recovery>mountain.sustainReadback.recovery,'Recovery was not recomputed');
    assert.deepEqual(mountain.packageReadback.mastery,volcanic.packageReadback.mastery,'Pair mastery drift');
  }
  if(desert){
    const paired=receipts.find(x=>cells.find(y=>y.id===x.observationId).comparisonId===c.comparisonId);
    if(paired)assert.equal(paired.initialRosterHash,rec.initialRosterHash,'Paired initial ecology mismatch');
    const expected= ['apprentice','spirit'].includes(c.className)?43:40;
    assert.equal(rec.packageReadback.runicPoints.budget,47);
    assert.equal(rec.packageReadback.runicPoints.cost,expected+(c.arm==='lowhp-targeting'?3:0));
  }
  if(tundraClassFrame){
    assert.equal(rec.packageReadback.runicPoints.budget,38);
    assert(rec.packageReadback.runicPoints.cost<=38);
    assert(!rec.packageReadback.declared.abilities.techniques.includes('slam'));
    assert(!rec.packageReadback.declared.runeRules.some(r=>r.actionId==='flee'));
  }
  if(qualification)assert.deepEqual(rec,json(join(qualification.out,'resolved-builds.json')).find(x=>x.observationId===c.id),'Applied package drift');
  return rec;
}
publish();let failure=null;
try{
  if(args.mode==='qualify' || args.mode==='receipt-check'){
    const {childOut,m}=await child(day2?`qualification-${family}`:'qualification','qualify',join(out,'zero-tick'));
    assert.deepEqual(m.cells,cells);assert.deepEqual(m.seeds,seeds);
    const ready=json(join(childOut,'index.json'));assert.equal(ready.length,planned);
    for(let i=0;i<cells.length;i++){receipts.push(receipt(cells[i],ready[i],m));const reused=manifest.reused?.observations.find(x=>x.cellId===cells[i].id);if(reused)validateReuse(cells[i],receipts[i],reused);rows[i].status='qualified';rows[i].reason=null;}
    await addInventory(join(out,'zero-tick'));publish();
  }else for(let i=0;i<cells.length;i++){
    const c=cells[i],r=rows[i],dest=join(out,c.id);
    const reused=manifest.reused?.observations.find(x=>x.cellId===c.id);
    if(reused) {
      const qualified=json(join(qualification.out,'resolved-builds.json')).find(x=>x.observationId===c.id);
      validateReuse(c,qualified,reused);
      Object.assign(r,reused.result,{observationId:c.id,block:c.block,arm:c.arm,comparisonId:c.comparisonId,status:'reused',reason:null,
        sourceObservationId:reused.result.observationId,measuredSourceCommit:manifest.reused.measuredSourceCommit});
      receipts.push({...reused.receipt,observationId:c.id,sourceObservationId:reused.receipt.observationId,reused:true});publish();continue;
    }
    try{
      verify();const {childOut,m}=await child(c.id,'run',dest);
      assert.deepEqual(m.cells,[c]);assert.deepEqual(m.seeds,[c.seed]);
      const detail=join(childOut,`${c.id}-s${c.seed}`),ready=json(join(detail,'ready.json'));
      receipts.push(receipt(c,ready,m));
      const s=json(join(detail,'summary.json'));assert(['player-died','window-ended'].includes(s.outcome));
      const cp=join(detail,'conduit.json'),conduit=existsSync(cp)?json(cp):null;
      if(c.className==='conduit')assert(conduit);
      Object.assign(r,{status:'complete',reason:null,outcome:s.outcome,elapsedMs:s.elapsedMs,completedKills:s.counts.killed,
        ...((guardCoverage||desert)?{guards:s.guards}:{}),...(desert?{strategy:s.strategy}:{}),sessions:s.sessions??null,historicalReferenceObservationId:c.sourceObservationId??null,unfinishedTargets:s.counts.censored,targetRegainCount:s.counts.hpRegain,minHpFraction:s.minHpFraction,
        endpoints:s.endpoints,intervals:s.intervals,work:s.work,sustain:s.sustain,terminalOwner:s.terminalOwner,
        deathEvidence:s.playerDeathEvidence,incomingHpDamage:s.incomingDamage,runicPoints:ready.packageReadback.runicPoints,
        conduit:conduit ? Object.fromEntries(Object.entries(conduit).filter(([k])=>!['events','snapshots','lives','episodes','damageDelivery'].includes(k))) : null,
        evidenceDirectory:detail,initialRosterHash:ready.initialRosterHash});
    }catch(e){r.status='failure';r.reason=String(e);r.outcome='operationally-censored';failure=String(e);}
    if(existsSync(dest))await addInventory(dest);publish();console.log(`${i+1}/${planned} ${c.id}: ${r.status}`);
    if(failure)break;
  }
}catch(e){failure=String(e);if(args.mode==='qualify' || args.mode==='receipt-check'){rows[receipts.length].status='failure';rows[receipts.length].reason=failure;}}
publish();
const completed=rows.filter(r=>['complete','qualified','reused'].includes(r.status)).length;
write(join(out,completed===planned?'complete.json':'partial.json'),{planned,completed,combatObservations:['qualify','receipt-check'].includes(args.mode)?0:rows.filter(r=>r.status==='complete').length,reused:rows.filter(r=>r.status==='reused').length,failure});
if(args.mode==='qualify' && completed===planned)write(join(packet,'qualified.json'),{out,completed,combatObservations:0,
  manifestSha256:sha(readFileSync(join(packet,'manifest.json'))),receiptsSha256:sha(readFileSync(join(out,'resolved-builds.json')))});
if(args.mode==='receipt-check' && completed===planned)write(join(packet,'receipt-verified.json'),{out,completed,combatObservations:0,
  sourceCommit:frozen.sourceCommit,manifestSha256:sha(readFileSync(join(packet,'manifest.json'))),
  qualificationReceiptsSha256:qualification.receiptsSha256,verificationReceiptsSha256:sha(readFileSync(join(out,'resolved-builds.json')))});
if(completed!==planned)process.exitCode=1;
