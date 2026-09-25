import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url)),report=resolve(here,'..'),baseline=resolve(report,'../..'),candidate=resolve(baseline,'../mmo-reward-candidate');
const batch=process.argv[2]??'screen';const out=resolve(here,batch);if(existsSync(out))throw Error('Fresh output required');mkdirSync(resolve(out,'jobs'),{recursive:true});
const historical=JSON.parse(readFileSync(resolve(here,'historical-survivors.json')));
const ids=batch==='confirmation'?['op-t2-striker-heavy-desert-t2-desert-arrival-s101009','op-t2-squire-heavy-desert-t2-desert-arrival-s101009','closing-squire-heavy-b-D-s101009']:['op-t1-striker-plains-t1-developed-s101009','op-t2-squire-balanced-jungle-t2-jungle-arrival-s101009','op-t2-striker-heavy-desert-t2-desert-arrival-s101009','op-t3-squire-balanced-swamp-t3-developed-s101009','op-t3-squire-heavy-tundra-t3-tundra-arrival-s101009','closing-conduit-balanced-a-T-s101009','closing-striker-heavy-a-D-s101009','closing-striker-heavy-c-V-s101009'];
const chosen=ids.map(id=>{const found=historical.find(r=>r.cell.id===id);if(!found)throw Error(id);return found;});
writeFileSync(resolve(out,'selected-setups.json'),JSON.stringify(chosen,null,2));
copyFileSync(resolve(report,'run-bot-survivors.ts'),resolve(candidate,'reports/reward-mastery-study-2026-09-25/run-bot-survivors.ts'));
const inventory=JSON.parse(readFileSync(resolve(report,'economy-inventory.json')));
const jobs=[];
for(const selected of chosen)for(const seed of [101009,101033])for(const arm of ['baseline','candidate']) {
 const cell=structuredClone(selected.cell);cell.seed=seed;cell.id=cell.id.replace('101009',String(seed));
 const group=cell.nodeId.match(/-t\d-([a-z]+)-/)[1];
 const id=`${arm}-${cell.id}`;
 jobs.push({id,arm,mode:'historical-loadout',nodeId:cell.nodeId,classRoot:cell.build.classRoot,seed,cell,gearIds:inventory.groups.find(g=>g.tier===cell.tier&&g.biome===group).reference.ids,maxMs:(batch==='confirmation'?[0,15,30,60,90]:[0,15,45,90,150])[cell.tier]*60000,hitboxPath:resolve(baseline,'server/dist/hitbox/baked-hitboxes.json'),output:resolve(out,id+'.json')});
}
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),baseline,candidate,jobs},null,2));
for(const j of jobs)writeFileSync(resolve(out,'jobs',j.id+'.json'),JSON.stringify(j,null,2));
let next=0;const results=[];
async function worker(){while(next<jobs.length){const j=jobs[next++],root=j.arm==='baseline'?baseline:candidate;
 const result=await new Promise(done=>{const child=spawn(process.execPath,[resolve(root,'server/node_modules/tsx/dist/cli.mjs'),'--conditions=development',resolve(root,'reports/reward-mastery-study-2026-09-25/run-bot-survivors.ts'),resolve(out,'jobs',j.id+'.json')],{cwd:root,windowsHide:true});let log='';const timer=setTimeout(()=>child.kill(),20*60000);child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);child.on('error',x=>log+=String(x));child.on('close',code=>{clearTimeout(timer);writeFileSync(resolve(out,j.id+'.log'),log);done({id:j.id,code,outputExists:existsSync(j.output)});});});results.push(result);writeFileSync(resolve(out,'status.json'),JSON.stringify({done:results.length,total:jobs.length,results},null,2));console.log(results.length+'/'+jobs.length+' '+JSON.stringify(result));}}
await Promise.all(Array.from({length:4},worker));
writeFileSync(resolve(out,'complete.json'),JSON.stringify({completedAt:new Date().toISOString(),done:results.length,total:jobs.length,failures:results.filter(x=>x.code!==0||!x.outputExists)},null,2));
