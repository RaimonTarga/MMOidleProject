import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(join(root,'server/package.json'));
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');assert(i>2,'Use --key=value');return [a.slice(2,i),a.slice(i+1)];}));
assert(['prepare','verify','smoke','run'].includes(args.mode),'--mode=prepare|verify|smoke|run');
assert(args.packet,'--packet required');
const packet=resolve(args.packet), sha=x=>createHash('sha256').update(x).digest('hex');
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}).trim();
function identity(hitboxes) {
  const paths=git('ls-files','-z','--cached','--others','--exclude-standard').split('\0').filter(p=>
    /^(server\/(src|bench|scripts|test)\/|shared\/src\/|bot\/src\/|scripts\/player-breadth\.mjs$)/.test(p)
    || /(^|\/)(package\.json|tsconfig[^/]*\.json)$/.test(p)
    || ['pnpm-lock.yaml','pnpm-workspace.yaml','client/public/assets/sprites.json','client/public/assets/sprites.png'].includes(p));
  const files=Object.fromEntries([...new Set(paths)].sort().map(p=>[p,existsSync(join(root,p))?sha(readFileSync(join(root,p))):'deleted']));
  return {sourceCommit:git('rev-parse','HEAD'),sourceSha256:sha(JSON.stringify(files)),files,node:process.version,
    hitboxes:resolve(hitboxes),hitboxesSha256:sha(readFileSync(hitboxes))};
}
function verifySource(frozen) {
  const actual=identity(frozen.hitboxes);
  for(const key of ['sourceSha256','node','hitboxesSha256']) assert.equal(actual[key],frozen[key],`${key} drift; STOP, do not reseal`);
  git('merge-base','--is-ancestor',frozen.sourceCommit,'HEAD'); // Publication-only descendants are allowed; all measured source bytes remain sealed.
}
function child(script,argv,out) {
  assert(!existsSync(out),`Fresh output required: ${out}`);
  const r=spawnSync(process.execPath,['--conditions=development',require.resolve('tsx/cli'),`scripts/${script}`,...argv,`--out=${out}`],
    {cwd:join(root,'server'),encoding:'utf8',timeout:15*60*1000,maxBuffer:16*1024*1024});
  mkdirSync(out,{recursive:true});
  writeFileSync(join(out,'process.log'),(r.stdout??'')+(r.stderr??''));
  write(join(out,'process.json'),{status:r.status,signal:r.signal,error:r.error?.message??null});
  assert.equal(r.status,0,`Child failed: ${out}/process.log`);
}
if(args.mode==='prepare') {
  assert(args.hitboxes);assert(!existsSync(packet),'Fresh preparation directory required');mkdirSync(packet,{recursive:true});
  const frozen=identity(args.hitboxes);write(join(packet,'identity.json'),frozen);
  child('playerBreadthCatalogue.ts',[`--hitboxes=${frozen.hitboxes}`],join(packet,'qualification'));
  const cases=json(join(packet,'qualification/cases.json')),legality=json(join(packet,'qualification/legality.json'));
  assert.equal(cases.length,204);assert.equal(legality.qualified,204);assert.equal(legality.worldTicks,0);
  const manifest={schema:1,status:'prepared-main-not-executed',trial:'player-breadth-01',seed:101003,dtMs:100,capMs:300000,
    sourceCommit:frozen.sourceCommit,sourceSha256:frozen.sourceSha256,hitboxesSha256:frozen.hitboxesSha256,
    definitionsHash:legality.definitionsHash,accounting:{main:180,rangeExtension:6,candidate:18,total:204,historicalReuse:0},
    treatmentAllowlist:['light-frame 2500/3500','balanced-frame 3000/3500','far interval x0.85','endless-swarm interval x0.80','light/balanced final floor 2000ms'],
    controlsReplayed:false,noRetries:true,noExtraSeeds:true,
    smokes:[{caseId:'breadth-t3-conduit-light-far-farm-reconstruction-r1',capMs:30000},
      {caseId:'breadth-t4-conduit-light-c-boss-reconstruction-r1',capMs:60000}],
    cases:cases.map(c=>({caseId:c.id,identityId:c.identityId,tier:c.tier,root:c.className,setting:c.role,
      fixture:c.nodeId,playerTreatment:c.playerTreatment,controlCaseId:c.controlCaseId}))};
  write(join(packet,'manifest.json'),manifest);verifySource(frozen);
  const paths=['identity.json','manifest.json',...['catalogue.json','catalogue.md','cases.json','resolved-builds.json','legality.json','effective-profiles.json'].map(p=>'qualification/'+p)];
  write(join(packet,'seal.json'),{status:'prepared',sha256:Object.fromEntries(paths.map(p=>[p,sha(readFileSync(join(packet,p)))]))});
  console.log('204 zero-tick preparations sealed. Main packet and both declared smokes remain unexecuted.');
  process.exit(0);
}
const frozen=json(join(packet,'identity.json')),manifest=json(join(packet,'manifest.json')),seal=json(join(packet,'seal.json'));
for(const [p,hash] of Object.entries(seal.sha256)) assert.equal(sha(readFileSync(join(packet,p))),hash,`Packet drift: ${p}`);
verifySource(frozen);
if(args.mode==='verify') {console.log('Source/runtime/hitbox, 204-case manifest and applied-build seals match.');process.exit(0);}
assert(args.out,'--out=<fresh directory> required');const out=resolve(args.out);
assert(!existsSync(out),'Fresh output required; no retries/overwrites');mkdirSync(out,{recursive:true});
const smoke=args.mode==='smoke';
// The marker prevents another smoke run under a fresh output path for this prepared packet.
const marker=join(packet,smoke?'smoke-launched.json':'main-launched.json');
assert(!existsSync(marker),'Already launched; no automatic retries');
if(!smoke) {
  const q=json(join(packet,'smoke-qualified.json'));
  assert.equal(q.manifestSha256,sha(readFileSync(join(packet,'manifest.json'))));
  assert.equal(q.completed,2);
}
write(marker,{out,startedAt:new Date().toISOString(),mode:args.mode});write(join(out,'identity.json'),frozen);
write(join(out,'manifest.json'),manifest);
const declarations=json(join(packet,'qualification/cases.json'));
const receipts=json(join(packet,'qualification/resolved-builds.json'));
const schedule=smoke?manifest.smokes.map(s=>manifest.cases.find(c=>c.caseId===s.caseId)):manifest.cases;
const rows=[],failures=[],blockedPairs=new Set();
function publish() {
  const pending=schedule.filter(c=>!rows.some(r=>r.caseId===c.caseId)).map(c=>({caseId:c.caseId,
    controlCaseId:c.controlCaseId,playerTreatment:c.playerTreatment,fixture:c.fixture,seed:101003,
    sourceCommit:frozen.sourceCommit,sourceSha256:frozen.sourceSha256,hitboxesSha256:frozen.hitboxesSha256,
    status:'not-run',outcome:null,unavailableReason:'Scheduled case has not produced a terminal receipt.'}));
  write(join(out,'results.json'),{schema:1,planned:schedule.length,smoke,rows:[...rows,...pending],failures});
}
publish();
for(const c of schedule) {
  verifySource(frozen);
  const blockOut=join(out,c.caseId),detail=`${c.caseId}/${c.caseId}-s101003`;
  const base={caseId:c.caseId,controlCaseId:c.controlCaseId,playerTreatment:c.playerTreatment,fixture:c.fixture,seed:101003,
    sourceCommit:frozen.sourceCommit,sourceSha256:frozen.sourceSha256,hitboxesSha256:frozen.hitboxesSha256};
  if(c.controlCaseId && blockedPairs.has(c.controlCaseId)) {rows.push({...base,status:'not-run-pair-readback-drift',outcome:null});publish();continue;}
  try {
    child(c.setting==='farm'?'ttkSurvey.ts':'bossScreen.ts',[`--trial=player-breadth`,`--block=${c.caseId}`,
      `--mode=${smoke?'pilot':'run'}`,`--hitboxes=${frozen.hitboxes}`,`--revision=${frozen.sourceCommit}`],blockOut);
    verifySource(frozen);
    assert(existsSync(join(blockOut,'complete.json')),'Missing terminal completion');
    const m=json(join(blockOut,'manifest.json')),r=json(join(out,detail,'ready.json'));
    const planned=receipts.find(x=>x.caseId===c.caseId);
    try {
      assert.deepEqual(m.cells,[declarations.find(x=>x.id===c.caseId)]);
      assert.equal(m.definitionsHash,manifest.definitionsHash);assert.equal(m.hitboxesSha256,frozen.hitboxesSha256);
      assert.equal(m.revision,frozen.sourceCommit);
      assert.deepEqual(r.packageReadback,planned.packageReadback);
      assert.equal(r.playerTreatment,c.playerTreatment);assert.equal(r.controlCaseId,c.controlCaseId);
      assert.deepEqual(r.conduitProfile,planned.conduitProfile);
      assert.equal(r.definitionsIdentity.live,manifest.definitionsHash);
      assert.equal(r.definitionsIdentity.treated,false);assert.deepEqual(r.hpTreatment,[]);assert.deepEqual(r.damageTreatment??[],[]);
    } catch(e) {blockedPairs.add(c.controlCaseId??c.caseId);throw Error(`Treatment/readback drift: ${e}`);}
    const s=json(join(out,detail,'summary.json'));
    assert(!['wall-ceiling','boss-vanished-no-kill','encounter-reset'].includes(s.outcome),`Operational terminal: ${s.outcome}`);
    if(s.bossKilled) assert(s.bossKillEvidence,'Missing authoritative kill proof');
    if(smoke) assert(s.counts.damaged>0,'Smoke delivered no target damage');
    const conduit=existsSync(join(out,detail,'conduit.json'))?json(join(out,detail,'conduit.json')):null;
    if(c.root==='conduit') assert(conduit && conduit.lives.length>0,'Recorder not exercised');
    rows.push({...base,status:'complete',outcome:s.outcome,elapsedMs:s.elapsedMs,windowMs:s.windowMs,
      bossKilled:s.bossKilled??null,bossHpFractionRemoved:s.bossHpFractionRemoved??null,
      completedKills:s.counts.killed,damagedTargets:s.counts.damaged,minHpFraction:s.minHpFraction,
      partialTargets:s.counts.censored,terminalOwner:s.terminalOwner,
      liveBodyFraction:conduit?.liveBodyFraction??null,liveAuthoredOffenseFraction:conduit?.liveAuthoredOffenseFraction??null,
      readyHpBlockedMs:conduit?.readyHpBlockedMs??null,hypothesisExercised:conduit?.hypothesisExercised??null,
      unavailableReason:conduit?null:'Not a Conduit case',details:detail});
  } catch(e) {
    verifySource(frozen);failures.push({caseId:c.caseId,error:String(e)});
    rows.push({...base,status:'local-failure',outcome:null,unavailableReason:String(e),details:c.caseId});
  }
  publish();
  console.log(`${rows.length}/${schedule.length} ${c.caseId}: ${rows.at(-1).status}`);
}
verifySource(frozen);
const complete={planned:schedule.length,completed:rows.filter(r=>r.status==='complete').length,failures,
  unrun:schedule.filter(c=>!rows.some(r=>r.caseId===c.caseId)).map(c=>c.caseId)};
write(join(out,complete.completed===schedule.length?'complete.json':'partial.json'),complete);
if(smoke && complete.completed===2) write(join(packet,'smoke-qualified.json'),{completed:2,out,manifestSha256:sha(readFileSync(join(packet,'manifest.json')))});
if(complete.completed!==schedule.length) process.exitCode=1;
