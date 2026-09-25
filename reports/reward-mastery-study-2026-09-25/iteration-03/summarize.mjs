import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),batch=process.argv[2]??'xp600k';
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const rows=readdirSync(resolve(here,batch)).filter(f=>f.startsWith('candidate-')&&f.endsWith('.json')&&!f.endsWith('.progress.json')).map(f=>{
 const r=JSON.parse(readFileSync(resolve(here,batch,f)));return {id:r.job.id,seed:r.job.seed,node:r.job.nodeId,setup:r.job.cell.identityId??r.job.cell.id,budget:r.budget,masteryMinutes:r.mastery?r.mastery.elapsedMs/60000:null,deathMinutes:r.death?r.death.elapsedMs/60000:null,observedMinutes:r.final.elapsedMs/60000,runtimeCensored:r.runtimeCensored,wallSeconds:r.wallSeconds,essenceAtCap:r.mastery?sum(r.mastery.gross):null,cost3:sum(r.costs[3]),cost5:sum(r.costs[5]),fund3Minutes:r.fundingTimes[3]===null?null:r.fundingTimes[3]/60000,fund5Minutes:r.fundingTimes[5]===null?null:r.fundingTimes[5]/60000,path:batch+'/'+f};
});
writeFileSync(resolve(here,batch,'summary.json'),JSON.stringify(rows,null,2));for(const r of rows)console.log(JSON.stringify(r));
