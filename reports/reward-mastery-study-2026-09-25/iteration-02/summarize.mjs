import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),batch=process.argv[2]??'screen';
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0),min=x=>x==null?null:+(x/60000).toFixed(3);
const rows=readdirSync(resolve(here,batch)).filter(x=>/^(baseline|candidate)-.*\.json$/.test(x)&&!x.endsWith('.progress.json')).map(file=>{
 const r=JSON.parse(readFileSync(resolve(here,batch,file)));return {runtimeCensored:r.runtimeCensored??false,id:r.job.id,tier:r.job.cell.tier,arm:r.job.arm,node:r.job.nodeId,seed:r.job.seed,setup:r.job.cell.identityId??r.job.cell.id,mastery:min(r.mastery?.elapsedMs),death:min(r.death?.elapsedMs),duration:min(r.final.elapsedMs),budget:r.budget,finalXP:r.final.xp,startXP:r.initial.xp,essenceAtCap:r.mastery?sum(r.mastery.gross):null,cost3:sum(r.costs[3]),cost5:sum(r.costs[5]),fund3:min(r.fundingTimes[3]),fund5:min(r.fundingTimes[5]),ratio:r.mastery&&r.fundingTimes[5]?+(r.fundingTimes[5]/r.mastery.elapsedMs).toFixed(3):null,path:batch+'/'+file};
});
writeFileSync(resolve(here,batch,'summary.json'),JSON.stringify(rows,null,2));
for(const r of rows)console.log(JSON.stringify(r));
