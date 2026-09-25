import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync,execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
const here=dirname(fileURLToPath(import.meta.url)),report=resolve(here,'..'),main=resolve(report,'../..'),root=resolve(main,'../mmo-reward-candidate');
const out=resolve(here,process.argv[2]??'xp600k');if(existsSync(out))throw Error('Fresh output required');mkdirSync(resolve(out,'jobs'),{recursive:true});
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const files=execFileSync('git',['ls-files','shared/src','server/src','server/bench/balance','server/bench/harness.ts'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
const hashes=()=>Object.fromEntries(files.map(p=>[p,sha(resolve(root,p))]));const before=hashes();
const harness=resolve(root,'reports/reward-mastery-study-2026-09-25/run-bot-t4-floor.ts');
const historical=JSON.parse(readFileSync(resolve(report,'iteration-02/historical-survivors.json')));
const inventory=JSON.parse(readFileSync(resolve(report,'economy-inventory.json')));
const ids=process.argv[3]==='holdout'?['closing-striker-balanced-c-V-s101009']:['closing-striker-balanced-c-V-s101009','closing-striker-heavy-c-V-s101009','closing-apprentice-light-c-V-s101009','closing-conduit-balanced-a-T-s101009','closing-squire-heavy-b-D-s101009'];
const jobs=[];
for(const id of ids)for(const seed of (process.argv[3]==='holdout'?[101051,101063]:[101009,101033])) {
 const chosen=historical.find(x=>x.cell.id===id);if(!chosen)throw Error(id);const cell=structuredClone(chosen.cell);cell.seed=seed;cell.id=cell.id.replace('101009',String(seed));
 const group=cell.nodeId.match(/-t4-([a-z]+)-/)[1],jobId='candidate-'+cell.id;
 jobs.push({id:jobId,arm:'candidate',mode:'historical-loadout',nodeId:cell.nodeId,classRoot:cell.build.classRoot,cell,seed,gearIds:inventory.groups.find(x=>x.tier===4&&x.biome===group).reference.ids,maxMs:360*60000,stopAtMastery:true,wallLimitMs:900000,hitboxPath:resolve(main,'server/dist/hitbox/baked-hitboxes.json'),output:resolve(out,jobId+'.json')});
}
writeFileSync(resolve(out,'source-before.json'),JSON.stringify({root,head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:before,harnessSha256:sha(harness),hitboxSha256:sha(jobs[0].hitboxPath)},null,2));
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),root,workers:4,stopAtMastery:true,goal:'Fast end around 50 minutes; observe slower-build cost, not force all builds to 60 minutes.',jobs},null,2));
for(const j of jobs)writeFileSync(resolve(out,'jobs',j.id+'.json'),JSON.stringify(j,null,2));
let next=0;const results=[];
async function worker(){while(next<jobs.length){const j=jobs[next++];let timedOut=false;const result=await new Promise(done=>{
 const child=spawn(process.execPath,[resolve(root,'server/node_modules/tsx/dist/cli.mjs'),'--conditions=development',harness,resolve(out,'jobs',j.id+'.json')],{cwd:root,windowsHide:true});let log='';
 const timer=setTimeout(()=>{timedOut=true;if(process.platform==='win32')execFile('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},()=>{});else child.kill();},960000);
 child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);child.on('error',x=>log+=String(x));child.on('close',code=>{clearTimeout(timer);writeFileSync(resolve(out,j.id+'.log'),log);done({id:j.id,code,timedOut,outputExists:existsSync(j.output)});});
 });results.push(result);writeFileSync(resolve(out,'status.json'),JSON.stringify({done:results.length,total:jobs.length,results},null,2));console.log(results.length+'/'+jobs.length+' '+JSON.stringify(result));}}
await Promise.all(Array.from({length:4},worker));const after=hashes();
writeFileSync(resolve(out,'complete.json'),JSON.stringify({finishedAt:new Date().toISOString(),done:results.length,total:jobs.length,failures:results.filter(r=>r.code!==0||!r.outputExists),sourceDrift:files.filter(p=>before[p]!==after[p]),harnessDrift:sha(harness)!==JSON.parse(readFileSync(resolve(out,'source-before.json'))).harnessSha256},null,2));
