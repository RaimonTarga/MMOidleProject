import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(join(root,'server/package.json'));
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');assert(i>2);return [a.slice(2,i),a.slice(i+1)];}));
assert(['prepare','verify','qualify','run'].includes(args.mode));
assert(args.packet);const packet=resolve(args.packet);
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}).trim();
function identity(hitboxes) {
  const paths=git('ls-files','-z').split('\0').filter(p=>/^(server\/|shared\/|scripts\/conduit-)/.test(p)
    || ['pnpm-lock.yaml','pnpm-workspace.yaml','package.json','tsconfig.base.json','client/public/assets/sprites.json','client/public/assets/sprites.png'].includes(p));
  return {revision:git('rev-parse','HEAD'),node:process.version,files:Object.fromEntries(paths.map(p=>[p,sha(readFileSync(join(root,p)))])),
    hitboxes:resolve(hitboxes),hitboxesSha256:sha(readFileSync(hitboxes))};
}
if(args.mode==='prepare') {
  assert(args.hitboxes);assert(!existsSync(packet));mkdirSync(packet,{recursive:true});
  const oldRoot=join(root,'reports/player-fast-pass/breadth-01-preparation/packet');
  const old=json(join(oldRoot,'manifest.json')),failed=json(join(root,'reports/player-fast-pass/breadth-run-01-review/launcher-results.json'));
  const farm=old.cases.filter(c=>c.setting==='farm');
  assert.equal(farm.length,102);assert.equal(farm.filter(c=>c.controlCaseId).length,9);
  for(const c of farm) assert.equal(failed.rows.find(r=>r.caseId===c.caseId)?.status,'local-failure');
  const tally=Object.fromEntries([2,3,4].map(t=>[t,farm.filter(c=>c.tier===t).length]));
  assert.deepEqual(tally,{2:20,3:25,4:57});
  write(join(packet,'farm-manifest.json'),{schema:1,status:'prepared-unrun',sourceCommit:old.sourceCommit,sourceSha256:old.sourceSha256,
    seed:101003,dtMs:100,capMs:300000,counts:{total:102,mainUntreated:90,farUntreated:3,candidates:9,byTier:tally},
    originalPublication:'5419ae6992ffae07fe19c8c8caac3564ba9bc252',
    cases:farm.map(c=>({...c,failedOriginal:`reports/player-fast-pass/breadth-run-01-review/launcher-results.json#${c.caseId}`}))});
  const ids=['breadth-t2-conduit-light','breadth-t2-conduit-balanced','breadth-t3-conduit-balanced',
    'breadth-t4-conduit-balanced-a','breadth-t4-conduit-light-b','breadth-t4-conduit-light-c'];
  const selected=old.cases.filter(c=>ids.includes(c.identityId)&&!c.controlCaseId);
  assert.equal(selected.length,12);
  const manifest={schema:1,status:'prepared-unrun',sourceRevision:git('rev-parse','HEAD'),seed:101003,dtMs:100,capMs:300000,
    historicalReuse:[],arms:['adopted-r1','candidate-r2'],maximumObservations:24,
    cases:selected.flatMap(c=>['adopted-r1','candidate-r2'].map(arm=>({...c,arm,observationId:`${c.caseId}-${arm}`})))};
  write(join(packet,'r2-manifest.json'),manifest);
  write(join(packet,'r2-identity.json'),identity(args.hitboxes));
  write(join(packet,'seal.json'),Object.fromEntries(['farm-manifest.json','r2-manifest.json','r2-identity.json'].map(p=>[p,sha(readFileSync(join(packet,p)))])));
  console.log('Prepared 102 historical farm completions and 24 optional R1/R2 observations; no combat.');process.exit(0);
}
const frozen=json(join(packet,'r2-identity.json')),manifest=json(join(packet,'r2-manifest.json'));
function verify() {
  for(const [p,h] of Object.entries(json(join(packet,'seal.json')))) assert.equal(sha(readFileSync(join(packet,p))),h,`Packet drift: ${p}`);
  const actual=identity(frozen.hitboxes);
  assert.equal(actual.revision,frozen.revision,'Fixed R1 production source revision required');
  assert.deepEqual(actual,frozen,'Source/runtime/hitbox drift');
}
verify();
if(args.mode==='verify') {console.log('R2 packet, fixed revision and source bytes verified.');process.exit(0);}
assert(args.out);const out=resolve(args.out);assert(!existsSync(out),'Fresh output required');mkdirSync(out,{recursive:true});
const marker=join(packet,`${args.mode}-launched.json`);assert(!existsSync(marker),'No automatic retries');
if(args.mode==='run') {
  const q=json(join(packet,'qualified.json'));assert.equal(q.completed,24);
  assert.equal(q.manifestSha256,sha(readFileSync(join(packet,'r2-manifest.json'))));
}
write(marker,{out,revision:frozen.revision,at:new Date().toISOString()});
write(join(out,'manifest.json'),manifest);write(join(out,'identity.json'),frozen);
const rows=[],blocked=new Set();
for(const c of manifest.cases) {
  if(blocked.has(c.setting)) {rows.push({...c,status:'not-run-family-blocked'});continue;}
  verify();const dest=join(out,c.observationId);
  const argv=[require.resolve('tsx/cli'),'--conditions=development',join(root,'scripts/conduit-r2-child.mjs'),
    '--trial=player-breadth',`--block=${c.caseId}`,`--arm=${c.arm}`,`--mode=${args.mode}`,`--revision=${frozen.revision}`,`--hitboxes=${frozen.hitboxes}`,`--out=${dest}`];
  const r=spawnSync(process.execPath,argv,{cwd:join(root,'server'),encoding:'utf8',timeout:15*60*1000,maxBuffer:16*1024*1024});
  mkdirSync(dest,{recursive:true});writeFileSync(join(dest,'process.log'),(r.stdout??'')+(r.stderr??''));
  write(join(dest,'process.json'),{status:r.status,signal:r.signal,error:r.error?.message??null,argv});
  try {
    assert.equal(r.status,0);verify();
    const arm=json(args.mode==='run'?dest+'.arm.json':join(dest,'arm.json'));assert.equal(arm.arm,c.arm);assert.equal(arm.revision,frozen.revision);
    if(args.mode==='run') {
      assert(existsSync(join(dest,'complete.json')));
      const m=json(join(dest,'manifest.json')),ready=json(join(dest,`${c.caseId}-s101003/ready.json`));
      assert.equal(m.revision,frozen.revision);assert.deepEqual(m.cells,[arm.cell]);
      assert.deepEqual(ready.conduitProfile,arm.applied,'Applied runtime profile drift');
      assert.equal(m.hitboxesSha256,frozen.hitboxesSha256);
      const qualified=json(join(json(join(packet,'qualified.json')).out,c.observationId,'arm.json'));
      assert.deepEqual(arm,qualified);
      const summary=json(join(dest,`${c.caseId}-s101003/summary.json`));
      assert(!['wall-ceiling','boss-vanished-no-kill','encounter-reset'].includes(summary.outcome));
      if(summary.bossKilled) assert(summary.bossKillEvidence);
      rows.push({...c,status:'complete',summary,conduit:json(join(dest,`${c.caseId}-s101003/conduit.json`))});
    } else rows.push({...c,status:'qualified',effectiveIntervalMs:arm.applied.profile.reconstructionIntervalMs,
      tickQuantizedIntervalMs:arm.applied.tickQuantizedIntervalMs,factors:arm.applied.profile.reconstructionFactors});
  } catch(e) {rows.push({...c,status:'failure',error:String(e)});blocked.add(c.setting);}
  write(join(out,'results.json'),{planned:24,mode:args.mode,rows});
  console.log(`${rows.length}/24 ${c.observationId}: ${rows.at(-1).status}`);
}
verify();write(join(out,'results.json'),{planned:24,mode:args.mode,rows});
const completed=rows.filter(r=>['qualified','complete'].includes(r.status)).length;
write(join(out,completed===24?'complete.json':'partial.json'),{completed,planned:24});
if(args.mode==='qualify'&&completed===24) write(join(packet,'qualified.json'),{completed,out,manifestSha256:sha(readFileSync(join(packet,'r2-manifest.json'))),combatObservations:0});
if(completed!==24) process.exitCode=1;
