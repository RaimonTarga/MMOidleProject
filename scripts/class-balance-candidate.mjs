// One-worker orchestration of the production-backed survey and boss runners.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,statSync,statfsSync,readdirSync,createReadStream,openSync,closeSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {freemem,totalmem} from 'node:os';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'), require=createRequire(join(root,'server/package.json'));
const {CLASS_BALANCE_CELLS:cells,CLASS_BALANCE_BLOCKS:blocks,CLASS_BALANCE_ID:experimentId}=require('../server/bench/balance/classBalanceCandidateSpec.ts');
const {PROGRESSION_SNAPSHOTS:snapshots}=require('../server/bench/balance/progressionSnapshot.ts');
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');assert(i>2);return[a.slice(2,i),a.slice(i+1)];}));
assert(['prepare','verify','qualify','run'].includes(args.mode));assert(args.packet);
const packet=resolve(args.packet),sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(p,'utf8')),write=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
let activeRoot=root;
const git=(...a)=>execFileSync('git',a,{cwd:activeRoot,encoding:'utf8',maxBuffer:32*1024**2}).trim();
const watchdogs={minimumDiskFreeBytes:5*1024**3,minimumHostFreeMemoryBytes:1024**3,maximumChildRssBytes:2*1024**3,heartbeatTimeoutMs:120000,pollMs:5000,maximumChildren:1,retries:0};
function identity(hitboxes){
 const paths=git('ls-files','-z','--cached','--others','--exclude-standard').split('\0').filter(p=>/^(server\/|shared\/|bot\/src\/|scripts\/)/.test(p)||/(^|\/)(package\.json|tsconfig[^/]*\.json)$/.test(p)||['pnpm-lock.yaml','pnpm-workspace.yaml','client/public/assets/sprites.json','client/public/assets/sprites.png'].includes(p));
 const files=Object.fromEntries([...new Set(paths)].sort().map(p=>[p,sha(readFileSync(join(activeRoot,p)))]));
 return{sourceCommit:git('rev-parse','HEAD'),sourceSha256:sha(JSON.stringify(files)),files,node:process.version,hitboxes:resolve(hitboxes),hitboxesSha256:sha(readFileSync(hitboxes))};
}
if(args.mode==='prepare'){
 assert(args.control && args.candidate && args.hitboxes&&!existsSync(packet));assert.equal(git('status','--porcelain','--untracked-files=no'),'');mkdirSync(packet,{recursive:true});
 const disk=statfsSync(packet);assert(disk.bavail*disk.bsize>=watchdogs.minimumDiskFreeBytes);assert(freemem()>=watchdogs.minimumHostFreeMemoryBytes);
 write(join(packet,'manifest.json'),{experimentId,status:'prepared-unrun',planned:56,synthetic:true,economyEligible:false,seeds:[101009,101033],dtMs:100,farmingCapMs:1200000,bossCapMs:300000,endpointsMs:[300000,600000,1200000],stopOnFirstDeath:true,watchdogs,snapshots,cases:cells,
 resourcesAtSeal:{freeDiskBytes:disk.bavail*disk.bsize,freeMemoryBytes:freemem(),totalMemoryBytes:totalmem()},
 progression:'Mastery/XP fixed by World.fixedBiomeMasteryPlayers; essence, catalysts, lifetime level, quest and boss records can accrue. No loadout/gear/skill purchases or recalculation from mastery.'});
 const identities={};for(const arm of ['control','candidate']){activeRoot=resolve(args[arm]);assert.equal(git('status','--porcelain','--untracked-files=no'),'');identities[arm]={root:activeRoot,...identity(args.hitboxes)};write(join(packet,arm+'-identity.json'),identity(args.hitboxes));}activeRoot=root;write(join(packet,'identity.json'),identities);write(join(packet,'seal.json'),Object.fromEntries(['manifest.json','identity.json','control-identity.json','candidate-identity.json'].map(p=>[p,sha(readFileSync(join(packet,p)))])));
 console.log('56 cases sealed; no combat.');process.exit(0);
}
const manifest=json(join(packet,'manifest.json')),identities=json(join(packet,'identity.json'));let frozen=identities.control;
function verify(){for(const[p,h]of Object.entries(json(join(packet,'seal.json'))))assert.equal(sha(readFileSync(join(packet,p))),h);for(const arm of ['control','candidate']){const {root:checkout,...contract}=identities[arm];activeRoot=checkout;assert.deepEqual(identity(contract.hitboxes),contract,'Source/runtime drift');assert.deepEqual(json(join(packet,arm+'-identity.json')),contract);}activeRoot=root;assert.deepEqual(manifest.cases,cells);assert.deepEqual(manifest.watchdogs,watchdogs);}
verify();if(args.mode==='verify'){console.log('56 cases, source, runtime and hitboxes verified.');process.exit(0);}
assert(args.out);const out=resolve(args.out);assert(!existsSync(out),'Fresh output only');
const marker=join(packet,`${args.mode}-launched.json`);assert(!existsSync(marker),'No retries');
const qualification=args.mode==='run'?json(join(packet,'qualified.json')):null;
let expected=[];
if(qualification){assert.equal(qualification.completed,56);assert.equal(qualification.combatObservations,0);assert.equal(qualification.manifestSha256,sha(readFileSync(join(packet,'manifest.json'))));assert.equal(qualification.receiptsSha256,sha(readFileSync(join(qualification.out,'resolved-builds.json'))));expected=json(join(qualification.out,'resolved-builds.json'));}
mkdirSync(out,{recursive:true});write(marker,{out,at:new Date().toISOString(),sourceCommit:frozen.sourceCommit});write(join(out,'manifest.json'),manifest);write(join(out,'identity.json'),frozen);
const rows=cells.map(c=>({observationId:c.id,block:c.block,identityId:c.identityId,snapshotId:c.snapshotId,referenceObservationId:c.referenceObservationId,fixture:c.nodeId,seed:c.seed,arm:c.arm,comparisonId:c.comparisonId,setting:c.role,sourceCommit:identities[c.arm].sourceCommit,status:'not-run',reason:null}));
const receipts=[],inventory=[];
function publish(){const counts={planned:56,completed:rows.filter(r=>r.status==='complete').length,newCompleted:rows.filter(r=>r.status==='complete').length,failed:rows.filter(r=>r.status==='failure').length,omitted:0,notRun:rows.filter(r=>r.status==='not-run').length,qualified:rows.filter(r=>r.status==='qualified').length};
 write(join(out,'results-summary.json'),{experimentId,mode:args.mode,sources:Object.fromEntries(Object.entries(identities).map(([a,v])=>[a,v.sourceCommit])),counts,rows});write(join(out,'resolved-builds.json'),receipts);write(join(out,'raw-inventory.json'),inventory);
 writeFileSync(join(out,'PARTIAL.md'),`# ${experimentId}\n\n${JSON.stringify(counts)}\n\n`+rows.filter(r=>r.status!=='not-run').map(r=>`${r.observationId}: ${r.status} ${r.reason??r.outcome??''}`).join('\n')+'\n');return counts;}
async function inventoryDir(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await inventoryDir(p);else{const h=createHash('sha256');for await(const b of createReadStream(p))h.update(b);inventory.push({path:p,bytes:statSync(p).size,sha256:h.digest('hex')});}}}
async function child(block,mode,dest){
 const b=blocks[block];frozen=identities[b.cells[0].arm];const childRoot=frozen.root,childRequire=createRequire(join(childRoot,'server/package.json'));const boss=b.cells[0].role==='boss';mkdirSync(dest,{recursive:true});const childOut=join(dest,'artifacts');
 const argv=['--import',pathToFileURL(childRequire.resolve('tsx')).href,'--conditions=development',`scripts/${boss?'bossScreen':'ttkSurvey'}.ts`,`--trial=${experimentId}`,`--block=${block}`,`--mode=${mode}`,`--revision=${frozen.sourceCommit}`,`--source-contract=${join(packet,b.cells[0].arm+'-identity.json')}`,`--hitboxes=${frozen.hitboxes}`,`--out=${childOut}`];
 const fd=openSync(join(dest,'process.log'),'w');const cp=spawn(process.execPath,argv,{cwd:join(childRoot,'server'),stdio:['ignore',fd,fd],windowsHide:true});let reason=null,lastProgress=Date.now(),previous=-1;
 write(join(dest,'process.json'),{pid:cp.pid,argv,status:'running'});
 const timer=setInterval(()=>{try{const h=join(childOut,mode==='qualify'?'index.json':'heartbeat.json');if(existsSync(h)){const n=mode==='qualify'?statSync(h).mtimeMs:json(h).elapsedMs;if(n>previous){previous=n;lastProgress=Date.now();}if(mode==='run'&&json(h).rss>watchdogs.maximumChildRssBytes)reason='Child RSS ceiling';}
 const d=statfsSync(out);if(d.bavail*d.bsize<watchdogs.minimumDiskFreeBytes)reason='Disk ceiling';if(freemem()<watchdogs.minimumHostFreeMemoryBytes)reason='Host RAM ceiling';if(Date.now()-lastProgress>watchdogs.heartbeatTimeoutMs)reason='Heartbeat stalled';if(reason)cp.kill();}catch(e){if(e instanceof SyntaxError)return;reason=String(e);cp.kill();}},watchdogs.pollMs);
 const status=await new Promise(done=>{cp.on('error',e=>{reason=String(e);done(null);});cp.on('close',done);});clearInterval(timer);closeSync(fd);write(join(dest,'process.json'),{pid:cp.pid,argv,status,reason});assert.equal(status,0,reason??`Child failed: ${dest}`);verify();
 const m=json(join(childOut,'manifest.json'));assert.equal(m.revision,frozen.sourceCommit);assert.equal(m.durationMs,b.durationMs);assert.equal(m.dtMs,100);assert.equal(m.hitboxesSha256,frozen.hitboxesSha256);assert(existsSync(join(childOut,'complete.json')));assert(!existsSync(join(childOut,'failed.json')));return childOut;
}
function receipt(c,r){assert.equal(r.cell,c.id);assert.equal(r.seed,c.seed);assert.equal(r.view.hp,r.view.maxHp);assert.equal(r.view.barrier,r.view.barrierMax);if(c.progressionSnapshot){assert.deepEqual(r.packageReadback.progression.snapshot,c.progressionSnapshot);assert.equal(r.packageReadback.runicPoints.budget,c.progressionSnapshot.rp);}else {assert.equal(r.view.globalMastery,72);assert.equal(r.packageReadback.runicPoints.budget,30);}assert.equal(r.packageReadback.declared.stance,c.stance);assert.deepEqual(r.packageReadback.declared.abilities,c.abilities);assert.deepEqual(r.packageReadback.declared.runeRules,c.runeRules);
 const rec={observationId:c.id,snapshotId:c.snapshotId??null,sourceCommit:identities[c.arm].sourceCommit,ready:r};
 const pair=receipts.find(x=>cells.find(y=>y.id===x.observationId).comparisonId===c.comparisonId);if(pair){assert.equal(pair.ready.initialRosterHash,r.initialRosterHash,'Paired ecology drift');for(const key of ['mastery','skillPath','declared','equipment','progression','runicPoints'])assert.deepEqual(pair.ready.packageReadback[key],r.packageReadback[key],`Paired ${key} drift`);}
 if(qualification)assert.deepEqual(rec,expected.find(x=>x.observationId===c.id),'Applied receipt drift');return rec;
}
publish();let failure=null;
try{if(args.mode==='qualify'){
 for(const block of Object.keys(blocks).filter(b=>b.startsWith('qualification-'))){const dest=join(out,block),childOut=await child(block,'qualify',dest),index=json(join(childOut,'index.json'));assert.equal(index.length,blocks[block].cells.length);
  for(const c of blocks[block].cells){const r=index.find(r=>r.cell===c.id&&r.seed===c.seed);assert(r);receipts.push(receipt(c,r));rows.find(r=>r.observationId===c.id).status='qualified';}await inventoryDir(dest);publish();}
 }else{
 const blocked=new Set();
 for(const c of cells){const row=rows.find(r=>r.observationId===c.id),family=c.role==='farm'?'farm':`boss-${c.boss}`;
  if(blocked.has(family)){row.reason='Not run after common family operational fault';continue;}
  const dest=join(out,c.id);try{const childOut=await child(c.id,'run',dest),dir=join(childOut,`${c.id}-s${c.seed}`),ready=json(join(dir,'ready.json')),result=json(join(dir,'summary.json'));
    receipts.push(receipt(c,ready));assert(!['wall-ceiling','boss-vanished-no-kill','encounter-reset'].includes(result.outcome));if(result.bossKilled)assert(result.bossKillEvidence);
    Object.assign(row,{status:'complete',outcome:result.outcome,elapsedMs:result.elapsedMs,completedKills:result.completedKills,firstKillMs:result.work?.firstKillMs??null,endpoints:result.endpoints?.map(e=>({atMs:e.atMs,work:e.work,owner:e.owner})),intervals:result.intervals,bossKilled:result.bossKilled,bossKillEvidence:result.bossKillEvidence,bossHpFractionRemoved:result.bossHpFractionRemoved,checkpoints:result.checkpoints,terminalCombat:result.terminalCombat,externalSummary:join(dir,'summary.json')});
   }catch(e){row.status='failure';row.reason=String(e);failure=String(e);blocked.add(family);try{verify();}catch(e){throw e;}}
   await inventoryDir(dest);publish();
 }
 }}catch(e){failure=String(e);}
const counts=publish();const complete=args.mode==='qualify'?counts.qualified===56:counts.completed===56;
write(join(out,complete?'complete.json':'partial.json'),{...counts,mode:args.mode,sourceCommit:frozen.sourceCommit,combatObservations:args.mode==='qualify'?0:counts.completed,failure});
if(complete&&args.mode==='qualify')write(join(packet,'qualified.json'),{out,completed:56,combatObservations:0,manifestSha256:sha(readFileSync(join(packet,'manifest.json'))),receiptsSha256:sha(readFileSync(join(out,'resolved-builds.json')))});
console.log(JSON.stringify({complete,counts,failure}));if(!complete)process.exitCode=1;
