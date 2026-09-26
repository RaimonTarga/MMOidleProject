// T2/T3 mastery-time sweep across every biome. Usage: node run.mjs <outDir> [filter]
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,execFile} from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url)),report=resolve(here,'..'),root=resolve(report,'../..');
const out=resolve(here,process.argv[2]??'run');mkdirSync(resolve(out,'jobs'),{recursive:true});
const filter=process.argv[3]?new RegExp(process.argv[3]):null;
const harness=process.env.VOLC_VARIANT?resolve(here,'patched-harness.ts'):resolve(report,'run-bot-t4-cross.ts');
const historical=JSON.parse(readFileSync(resolve(report,'iteration-02/historical-survivors.json')));
const inventory=JSON.parse(readFileSync(resolve(report,'economy-inventory.json')));
const hitboxPath=resolve(root,'../MMO idle/server/dist/hitbox/baked-hitboxes.json');
const cells={
 2:{striker:'op-t2-striker-balanced-desert-t2-desert-established-s101009',conduit:'op-t2-conduit-balanced-desert-t2-desert-established-s101009',squire:'op-t2-squire-heavy-desert-t2-desert-established-s101009',slinger:'op-t2-slinger-balanced-desert-t2-desert-established-s101009',spirit:'op-t2-spirit-balanced-desert-t2-desert-established-s101009',apprentice:'op-t2-apprentice-balanced-desert-t2-desert-established-s101009'},
 4:{striker:'closing-striker-balanced-c-V-s101009',conduit:'closing-conduit-balanced-a-T-s101009'},
 3:{striker:'op-t3-striker-balanced-mountain-t3-developed-s101009',conduit:'op-t3-conduit-balanced-mountain-t3-developed-s101009',squire:'op-t3-squire-heavy-mountain-t3-developed-s101009',slinger:'op-t3-slinger-heavy-mountain-t3-developed-s101009',spirit:'op-t3-spirit-balanced-mountain-t3-developed-s101009',apprentice:'op-t3-apprentice-balanced-mountain-t3-developed-s101009'},
};
const biomes={4:['mountain','tundra','jungle','desert','volcanic','graveyard','trench'],2:['plains','forest','swamp','mountain','cave','jungle','desert'],3:['swamp','mountain','cave','jungle','desert','tundra','volcanic']};
const nodeNum={4:'02',2:'02',3:'02'};
const targetMin={4:60,2:15,3:30};
const jobs=[];
for(const tier of (process.env.TIERS??"2,3").split(",").map(Number))for(const biome of biomes[tier])for(const [cls,id] of Object.entries(cells[tier])){
 const nodeId=`node-t${tier}-${biome}-${process.env.NODE??nodeNum[tier]}`;const seed=+(process.env.SEED??101051);
 const chosen=historical.find(x=>x.cell.id===id);if(!chosen)throw Error('missing '+id);
 const cell=structuredClone(chosen.cell);cell.seed=seed;cell.nodeId=nodeId;cell.id=`${cls}-t${tier}-${biome}`;
 if(process.env.VARIANT==='A'||process.env.VARIANT==='B')cell.runeRules=[{conditionId:'formation-broken',actionId:'flee'},...cell.runeRules];if(process.env.VARIANT==='B')cell.runeRules.push({conditionId:'always',actionId:'wait-for-summons'});const jobId=`t${tier}-${biome}-${cls}`;if(filter&&!filter.test(jobId))continue;
 jobs.push({id:jobId,arm:'candidate',mode:'historical-loadout',nodeId,classRoot:cell.build.classRoot,cell,seed,gearIds:inventory.groups.find(x=>x.tier===tier&&x.biome===biome).reference.ids,maxMs:Math.min(targetMin[tier]*3,150)*60000,stopAtMastery:true,wallLimitMs:+(process.env.WALL??540000),hitboxPath,output:resolve(out,jobId+'.json')});
}
for(const j of jobs)writeFileSync(resolve(out,'jobs',j.id+'.json'),JSON.stringify(j,null,2));
let next=0;const results=[];const W=+(process.env.WORKERS??8);
async function worker(){while(next<jobs.length){const j=jobs[next++];if(existsSync(j.output)){results.push({id:j.id,skipped:true});continue;}const result=await new Promise(done=>{
 const child=spawn(process.execPath,[resolve(root,'server/node_modules/tsx/dist/cli.mjs'),'--conditions=development',harness,resolve(out,'jobs',j.id+'.json')],{cwd:resolve(root,'server'),windowsHide:true});let log='';
 const timer=setTimeout(()=>{if(process.platform==='win32')execFile('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},()=>{});else child.kill();},+(process.env.WALL??540000)+60000);
 child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);child.on('close',code=>{clearTimeout(timer);writeFileSync(resolve(out,j.id+'.log'),log);done({id:j.id,code,tail:log.trim().split('\n').pop().slice(0,300)});});
 });results.push(result);console.log(results.length+'/'+jobs.length+' '+JSON.stringify(result));}}
await Promise.all(Array.from({length:W},worker));console.log('DONE');
