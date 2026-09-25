import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync,execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
const here=dirname(fileURLToPath(import.meta.url)),report=resolve(here,'..'),main=resolve(report,'../..'),root=resolve(main,'../mmo-reward-xp-only');
const out=resolve(here,process.argv[2]??'holdout');if(existsSync(out))throw Error('Fresh output required');mkdirSync(resolve(out,'jobs'),{recursive:true});
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const files=execFileSync('git',['ls-files','shared/src','server/src','server/bench/balance','server/bench/harness.ts'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
const hashes=()=>Object.fromEntries(files.map(p=>[p,sha(resolve(root,p))]));const before=hashes();
const harness=resolve(root,'reports/reward-mastery-study-2026-09-25/run-bot-t4-cross.ts');
const historical=JSON.parse(readFileSync(resolve(report,'iteration-02/historical-survivors.json')));
const inventory=JSON.parse(readFileSync(resolve(report,'economy-inventory.json')));
const cases=[
 ['closing-striker-balanced-c-V-s101009','node-t4-tundra-03',null],['closing-striker-balanced-c-V-s101009','node-t4-desert-01',null],
 ['closing-squire-heavy-b-D-s101009','node-t4-tundra-03','offensive'],['closing-squire-heavy-b-D-s101009','node-t4-desert-01','offensive'],
 ['closing-conduit-balanced-a-T-s101009','node-t4-tundra-03','no-recover'],['closing-conduit-balanced-a-T-s101009','node-t4-desert-01','no-recover'],
 ['closing-slinger-balanced-a-T-s101009','node-t4-tundra-03',null],['closing-slinger-heavy-a-D-s101009','node-t4-desert-01',null],
 ['closing-spirit-light-a-T-s101009','node-t4-tundra-03',null],['closing-spirit-light-a-T-s101009','node-t4-desert-01',null],
 ['closing-striker-balanced-c-V-s101009','node-t4-volcanic-03',null],['closing-slinger-light-c-V-s101009','node-t4-volcanic-03',null]];
const jobs=[];
for(const [id,nodeId,policy] of cases)for(const seed of [101051,101063]) {
 const chosen=historical.find(x=>x.cell.id===id);const cell=structuredClone(chosen.cell);cell.seed=seed;cell.nodeId=nodeId;cell.id=id.replace('101009',String(seed))+'-at-'+nodeId;
 if(policy==='offensive')cell.stance='offensive-stance';if(policy==='no-recover')cell.runeRules=cell.runeRules.filter(r=>r.actionId!=='wait-for-regen');
 const group=nodeId.match(/-t4-([a-z]+)-/)[1],jobId='candidate-'+cell.id;
 jobs.push({id:jobId,arm:'candidate',mode:'historical-loadout',nodeId,classRoot:cell.build.classRoot,cell,seed,policy,gearIds:inventory.groups.find(x=>x.tier===4&&x.biome===group).reference.ids,maxMs:120*60000,stopAtMastery:true,wallLimitMs:180000,hitboxPath:resolve(main,'server/dist/hitbox/baked-hitboxes.json'),output:resolve(out,jobId+'.json')});
}
writeFileSync(resolve(out,'source-before.json'),JSON.stringify({root,head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:before,harnessSha256:sha(harness),hitboxSha256:sha(jobs[0].hitboxPath)},null,2));
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),root,workers:4,stopAtMastery:true,goal:'Final bounded holdout: roughly 50-90 minutes; retain deaths/plateaus and do not tune during this batch.',jobs},null,2));
for(const j of jobs)writeFileSync(resolve(out,'jobs',j.id+'.json'),JSON.stringify(j,null,2));
let next=0;const results=[];
async function worker(){while(next<jobs.length){const j=jobs[next++];let timedOut=false;const result=await new Promise(done=>{
 const child=spawn(process.execPath,[resolve(root,'server/node_modules/tsx/dist/cli.mjs'),'--conditions=development',harness,resolve(out,'jobs',j.id+'.json')],{cwd:root,windowsHide:true});let log='';
 const timer=setTimeout(()=>{timedOut=true;if(process.platform==='win32')execFile('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},()=>{});else child.kill();},210000);
 child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);child.on('error',x=>log+=String(x));child.on('close',code=>{clearTimeout(timer);writeFileSync(resolve(out,j.id+'.log'),log);done({id:j.id,code,timedOut,outputExists:existsSync(j.output)});});
 });results.push(result);writeFileSync(resolve(out,'status.json'),JSON.stringify({done:results.length,total:jobs.length,results},null,2));console.log(results.length+'/'+jobs.length+' '+JSON.stringify(result));}}
await Promise.all(Array.from({length:4},worker));const after=hashes();
writeFileSync(resolve(out,'complete.json'),JSON.stringify({finishedAt:new Date().toISOString(),done:results.length,total:jobs.length,failures:results.filter(r=>r.code!==0||!r.outputExists),sourceDrift:files.filter(p=>before[p]!==after[p]),harnessDrift:sha(harness)!==JSON.parse(readFileSync(resolve(out,'source-before.json'))).harnessSha256},null,2));
