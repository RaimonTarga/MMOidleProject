import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url));
const baseline=resolve(here,'../..'),candidate=resolve(baseline,'../mmo-reward-candidate');
const out=resolve(here,'bot-t1-extended');mkdirSync(resolve(out,'jobs'),{recursive:true});
const inventory=JSON.parse(readFileSync(resolve(here,'economy-inventory.json'),'utf8'));
const cases=[[1,'plains'],[1,'cave']];
copyFileSync(resolve(here,'run-bot-supported.ts'),resolve(candidate,'reports/reward-mastery-study-2026-09-25/run-bot-supported.ts'));
const jobs=[];
for(const mode of ['fixed3','buy']) for(const [tier,biome] of cases) for(const classRoot of ['cadence-root','dot-root']) for(const arm of ['baseline','candidate']) {
  const id=`${arm}-${mode}-t${tier}-${biome}-${classRoot}-101009`;
  const kit=inventory.groups.find(g=>g.tier===tier&&g.biome===biome).reference;
  jobs.push({id,arm,mode,nodeId:`node-t${tier}-${biome}-01`,classRoot,seed:101009,gearIds:kit.ids,maxMs:[0,30,30,60,120][tier]*60000,
    hitboxPath:resolve(baseline,'server/dist/hitbox/baked-hitboxes.json'),output:resolve(out,id+'.json')});
}
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),baseline,candidate,workers:4,dtMs:100,rewardMultiplier:1,jobs},null,2));
for(const j of jobs) writeFileSync(resolve(out,'jobs',j.id+'.json'),JSON.stringify(j,null,2));
let next=0,done=0;const results=[];
async function worker() {
  while(next<jobs.length) {
    const job=jobs[next++],root=job.arm==='baseline'?baseline:candidate;
    if(existsSync(job.output)) {done++;continue;}
    const status=await new Promise(resolveRun=>{
      const child=spawn(process.execPath,[resolve(root,'server/node_modules/tsx/dist/cli.mjs'),'--conditions=development',resolve(root,'reports/reward-mastery-study-2026-09-25/run-bot-supported.ts'),resolve(out,'jobs',job.id+'.json')],{cwd:root,windowsHide:true,env:{...process.env,DEBUG_REWARD_MULT:'1'}});
      let stdout='',stderr='';const timer=setTimeout(()=>child.kill(),20*60*1000);
      child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);
      child.on('error',e=>stderr+=String(e));
      child.on('close',code=>{clearTimeout(timer);writeFileSync(resolve(out,job.id+'.log'),stdout+'\n'+stderr);resolveRun({id:job.id,code,outputExists:existsSync(job.output)});});
    });
    results.push(status);done++;writeFileSync(resolve(out,'status.json'),JSON.stringify({done,total:jobs.length,results},null,2));
    console.log(`${done}/${jobs.length} ${JSON.stringify(status)}`);
  }
}
await Promise.all(Array.from({length:4},worker));
writeFileSync(resolve(out,'complete.json'),JSON.stringify({finishedAt:new Date().toISOString(),done,total:jobs.length,failures:results.filter(r=>r.code!==0)},null,2));


