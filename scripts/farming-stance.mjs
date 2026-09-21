// Packet-specific dispatcher around the existing ttkSurvey child; no combat engine here.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'server/package.json'));
const { FARMING_STANCE_CELLS: cells } = require('../server/bench/balance/farmingStanceSpec.ts');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const i = a.indexOf('='); assert(i > 2); return [a.slice(2,i), a.slice(i+1)]; }));
assert(['prepare','verify','qualify','run'].includes(args.mode));
assert(args.packet); const packet = resolve(args.packet);
const sha = x => createHash('sha256').update(x).digest('hex');
const json = p => JSON.parse(readFileSync(p, 'utf8'));
const write = (p,v) => writeFileSync(p, JSON.stringify(v,null,2)+'\n');
const git = (...a) => execFileSync('git',a,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}).trim();
function identity(hitboxes) {
  const paths = git('ls-files','-z','--cached','--others','--exclude-standard').split('\0').filter(p =>
    /^(server\/|shared\/|bot\/src\/|scripts\/)/.test(p) || /(^|\/)(package\.json|tsconfig[^/]*\.json)$/.test(p)
    || ['pnpm-lock.yaml','pnpm-workspace.yaml','client/public/assets/sprites.json','client/public/assets/sprites.png'].includes(p));
  const files = Object.fromEntries([...new Set(paths)].sort().map(p => [p,sha(readFileSync(join(root,p)))]));
  return {sourceCommit:git('rev-parse','HEAD'),sourceSha256:sha(JSON.stringify(files)),files,node:process.version,
    hitboxes:resolve(hitboxes),hitboxesSha256:sha(readFileSync(hitboxes))};
}
if (args.mode === 'prepare') {
  assert(args.hitboxes && !existsSync(packet));
  assert.equal(git('status','--porcelain','--untracked-files=no'),'','Prepare from clean fixed source');
  mkdirSync(packet,{recursive:true});
  write(join(packet,'manifest.json'),{experimentId:'farming-stance-01',status:'prepared-unrun',seed:101003,dtMs:100,capMs:300000,
    planned:24,historicalReuse:[],synthetic:true,economyEligible:false,stopOnFirstDeath:true,cases:cells});
  write(join(packet,'identity.json'),identity(args.hitboxes));
  write(join(packet,'seal.json'),Object.fromEntries(['manifest.json','identity.json'].map(p=>[p,sha(readFileSync(join(packet,p)))])));
  console.log('Sealed 24 observations; no combat.'); process.exit(0);
}
const manifest = json(join(packet,'manifest.json')), frozen = json(join(packet,'identity.json'));
function verify() {
  for (const [p,h] of Object.entries(json(join(packet,'seal.json')))) assert.equal(sha(readFileSync(join(packet,p))),h,`Packet drift: ${p}`);
  assert.deepEqual(identity(frozen.hitboxes),frozen,'Source/runtime drift; do not reseal');
  assert.deepEqual(manifest.cases,cells); assert.equal(cells.length,24);
}
verify();
if (args.mode === 'verify') { console.log('Fixed source, packet, runtime and hitboxes verified.'); process.exit(0); }
assert(args.out); const out = resolve(args.out); assert(!existsSync(out),'Fresh output only');
const marker = join(packet,`${args.mode}-launched.json`); assert(!existsSync(marker),'No retries');
const qualification = args.mode === 'run' ? json(join(packet,'qualified.json')) : null;
if (qualification) {
  assert.equal(qualification.completed,24);
  assert.equal(qualification.manifestSha256,sha(readFileSync(join(packet,'manifest.json'))));
  for (const [p,h] of Object.entries(qualification.files)) assert.equal(sha(readFileSync(join(qualification.out,p))),h,'Qualification drift');
}
mkdirSync(out,{recursive:true}); write(marker,{out,at:new Date().toISOString(),sourceCommit:frozen.sourceCommit});
write(join(out,'manifest.json'),manifest); write(join(out,'identity.json'),frozen);
const rows = [], receipts = [], rawInventory = [];
function row(c) {
  return {observationId:c.id,identityId:c.identityId,arm:c.arm,comparisonId:c.comparisonId,tier:c.tier,root:c.className,
    frame:c.frame,path:c.pathName,range:c.range,fixture:c.nodeId,reconstructionPolicy:c.reconstructionPolicy,
    status:'not-run',outcome:null,elapsedMs:null,completedKills:null,unfinishedDamagedTargets:null,minHpFraction:null,
    targetRegainCount:null,contactIndicators:null,liveAuthoredOffenseFraction:null,zeroBodyExposureMs:null,readyHpBlockedMs:null,
    effectiveReconstruction:null,paths:{ready:null,summary:null,terminal:null,rawInventory:null,conduit:null},
    unavailableReasons:{measurement:'Not run',contactIndicators:'No compact contact aggregate; use recorded samples, never episode membership'}};
}
function publish() {
  const all = cells.map(c=>rows.find(r=>r.observationId===c.id)??row(c));
  const counts = {planned:24,completed:all.filter(r=>r.status==='complete').length,failed:all.filter(r=>r.status==='failure').length,
    notRun:all.filter(r=>r.status==='not-run').length,qualified:all.filter(r=>r.status==='qualified').length};
  write(join(out,'results-summary.json'),{experimentId:manifest.experimentId,mode:args.mode,actualExecutionSource:frozen.sourceCommit,
    sourceSha256:frozen.sourceSha256,hitboxesSha256:frozen.hitboxesSha256,seed:101003,dtMs:100,capMs:300000,counts,
    publicationStatus:'local-unpublished',synthetic:true,economyEligible:false,rows:all});
  write(join(out,'raw-inventory.json'),rawInventory);
}
publish();
for (const c of cells) {
  verify(); const dest = join(out,c.id), r = row(c);
  const argv = [require.resolve('tsx/cli'),'--conditions=development','scripts/ttkSurvey.ts','--trial=farming-stance-01',
    `--block=${c.id}`,`--mode=${args.mode === 'qualify' ? 'qualify' : 'run'}`,`--revision=${frozen.sourceCommit}`,
    `--source-contract=${join(packet,'identity.json')}`,`--hitboxes=${frozen.hitboxes}`,`--out=${dest}`];
  const child = spawnSync(process.execPath,argv,{cwd:join(root,'server'),encoding:'utf8',timeout:15*60*1000,maxBuffer:16*1024*1024});
  mkdirSync(dest,{recursive:true});writeFileSync(join(dest,'process.log'),(child.stdout??'')+(child.stderr??''));
  write(join(dest,'process.json'),{status:child.status,signal:child.signal,error:child.error?.message??null,argv});
  try {
    assert.equal(child.status,0,`Child failed: ${dest}/process.log`); verify();
    const m = json(join(dest,'manifest.json')); assert.deepEqual(m.cells,[c]); assert.equal(m.revision,frozen.sourceCommit);
    assert.equal(m.hitboxesSha256,frozen.hitboxesSha256); assert.equal(m.dtMs,100); assert.equal(m.durationMs,300000); assert.deepEqual(m.seeds,[101003]);
    assert(existsSync(join(dest,'complete.json')) && !existsSync(join(dest,'failed.json')));
    const detail = `${c.id}/${c.id}-s101003`;
    const readyPath = args.mode === 'qualify' ? `${c.id}/index.json` : `${detail}/ready.json`;
    const ready = args.mode === 'qualify' ? json(join(out,readyPath))[0] : json(join(out,readyPath));
    assert.equal(ready.view.activeStance,c.stance); assert.deepEqual(ready.view.attunedStances,[c.stance]);
    assert.deepEqual(ready.packageReadback.declared.abilities,c.abilities);
    assert.deepEqual(ready.packageReadback.declared.runeRules,c.runeRules);
    assert.equal(ready.definitionsIdentity.treated,false); assert.deepEqual(ready.hpTreatment,[]);
    assert.equal(ready.definitionsIdentity.live,m.definitionsHash);
    const receipt = {observationId:c.id,packageReadback:ready.packageReadback,conduitProfile:ready.conduitProfile,
      initialRosterHash:ready.initialRosterHash,definitionsIdentity:ready.definitionsIdentity};
    if (qualification) assert.deepEqual(receipt,json(join(qualification.out,'resolved-builds.json')).find(x=>x.observationId===c.id),'Applied package drift');
    receipts.push(receipt);r.effectiveReconstruction = ready.conduitProfile ? {
      intervalMs:ready.conduitProfile.profile.reconstructionIntervalMs,tickQuantizedIntervalMs:ready.conduitProfile.tickQuantizedIntervalMs,
      factors:ready.conduitProfile.profile.reconstructionFactors} : null;
    r.paths = {ready:readyPath,summary:null,terminal:`${c.id}/complete.json`,rawInventory:'raw-inventory.json',conduit:null};
    if (args.mode === 'qualify') r.status = 'qualified';
    else {
      const s = json(join(out,`${detail}/summary.json`)); assert(['player-died','window-ended'].includes(s.outcome));
      const cp = `${detail}/conduit.json`, conduit = existsSync(join(out,cp)) ? json(join(out,cp)) : null;
      if(c.className === 'conduit') assert(conduit);
      Object.assign(r,{status:'complete',outcome:s.outcome,elapsedMs:s.elapsedMs,completedKills:s.counts.killed,
        unfinishedDamagedTargets:s.counts.censored,minHpFraction:s.minHpFraction,targetRegainCount:s.counts.hpRegain,
        liveAuthoredOffenseFraction:conduit?.liveAuthoredOffenseFraction??null,zeroBodyExposureMs:conduit?.zeroSummonsMs??null,
        readyHpBlockedMs:conduit?.readyHpBlockedMs??null});
      r.paths.summary = `${detail}/summary.json`; r.paths.conduit = conduit ? cp : null;
      delete r.unavailableReasons.measurement;
      if(!conduit) r.unavailableReasons.conduit = 'Not a Conduit package';
      for(const name of ['events.jsonl','samples.jsonl']) { const p = `${detail}/${name}`; const bytes = readFileSync(join(out,p)); rawInventory.push({observationId:c.id,path:p,bytes:bytes.length,sha256:sha(bytes)}); }
      const samples = readFileSync(join(out,`${detail}/samples.jsonl`),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
      r.contactIndicators = {sampleCount:samples.length,sampleEveryMs:m.sampleEveryMs,
        staticDamageContactSamples:samples.filter(s=>s.staticDamageContacts.length>0).length,
        staticDamageFeatureIds:[...new Set(samples.flatMap(s=>s.staticDamageContacts.map(f=>f.id)))]};
      r.unavailableReasons.contactIndicators = 'Only recorded static-feature sample contacts; no continuous contact-duration or incoming-target-contact aggregate';
    }
  } catch(e) {r.status='failure';r.unavailableReasons.measurement=String(e);}
  rows.push(r);publish(); console.log(`${rows.length}/24 ${c.id}: ${r.status}`);
  // All cases share the ordinary-farm child/source family. Preserve the first failure and stop it.
  if(r.status==='failure') break;
}
verify();
const completed = rows.filter(r=>['complete','qualified'].includes(r.status)).length;
if (completed === 24) for (const c of cells.filter(c=>c.arm==='offensive')) {
  const left=receipts.find(r=>r.observationId===c.id), right=receipts.find(r=>r.observationId===`${c.comparisonId}-defensive`);
  const normalize=r=>({...r.packageReadback,declared:{...r.packageReadback.declared,stance:''}});
  assert.deepEqual(normalize(left),normalize(right),'Pair changed more than stance');
  assert.deepEqual(left.conduitProfile,right.conduitProfile,'Pair reconstruction/HP budget drift');
  assert.equal(left.initialRosterHash,right.initialRosterHash,'Pair ecology drift');
}
write(join(out,'resolved-builds.json'),receipts);
write(join(out,completed===24?'complete.json':'partial.json'),{planned:24,completed,combatObservations:args.mode==='qualify'?0:completed});
if(args.mode==='qualify' && completed===24) write(join(packet,'qualified.json'),{out,completed,combatObservations:0,
  manifestSha256:sha(readFileSync(join(packet,'manifest.json'))),files:{'resolved-builds.json':sha(readFileSync(join(out,'resolved-builds.json')))}});
if(completed!==24) process.exitCode=1;
