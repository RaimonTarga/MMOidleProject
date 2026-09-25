import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const rows=[];
for(const batch of ['bot-run','bot-supported','bot-replicate','bot-t1-extended','bot-t1-final']) {
  const folder=resolve(here,batch);if(!existsSync(folder))continue;
  for(const file of readdirSync(folder).filter(f=>/^(baseline|candidate)-.*\.json$/.test(f))) {
    const r=JSON.parse(readFileSync(resolve(folder,file),'utf8'));const tier=Number(r.job.nodeId.match(/-t(\d)-/)[1]);
    const sum=w=>Object.values(w).reduce((a,b)=>a+b,0);
    rows.push({batch,id:r.job.id,arm:r.job.arm,mode:r.job.mode,tier,node:r.job.nodeId,class:r.job.classRoot,seed:r.job.seed,targetMinutes:[0,5,15,30,60][tier],
      masteryMinutes:r.mastery?r.mastery.elapsedMs/60000:null,deathMinutes:r.death?r.death.elapsedMs/60000:null,
      runMinutes:r.final.elapsedMs/60000,finalLevel:r.final.level,
      fund3Minutes:r.fundingTimes[3]===null?null:r.fundingTimes[3]/60000,fund5Minutes:r.fundingTimes[5]===null?null:r.fundingTimes[5]/60000,
      buy3Minutes:r.actualAll3Ms===null?null:r.actualAll3Ms/60000,buy5Minutes:r.actualAll5Ms===null?null:r.actualAll5Ms/60000,
      essenceAtCap:r.mastery?sum(r.mastery.gross):null,cost3:sum(r.costs[3]),cost5:sum(r.costs[5]),
      fundingRatio:r.mastery&&r.fundingTimes[5]!==null?r.fundingTimes[5]/r.mastery.elapsedMs:null,
      purchases:r.purchases.length,wallSeconds:r.wallSeconds,path:`${batch}/${file}`});
  }
}
const summaries=[];
for(const batch of [...new Set(rows.map(r=>r.batch))])for(const arm of ['baseline','candidate'])for(const mode of ['fixed3','buy']) {
  const r=rows.filter(r=>r.batch===batch&&r.arm===arm&&r.mode===mode);
  summaries.push({batch,arm,mode,runs:r.length,mastered:r.filter(r=>r.masteryMinutes!==null).length,deaths:r.filter(r=>r.deathMinutes!==null).length,all3Bought:r.filter(r=>r.buy3Minutes!==null).length,all5Bought:r.filter(r=>r.buy5Minutes!==null).length});
}
writeFileSync(resolve(here,'bot-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),rows,summaries},null,2)+'\n');
const fmt=n=>n===null?'—':n.toFixed(2);
const lines=['# Executed bot results','','T1 rows before bot-t1-final are superseded: they used the original candidate plus a historical server override, and funding metadata omitted that override. Only bot-t1-final uses corrected runtime lifetime prices and funding metadata. T2-T4 rows remain applicable. All times are simulated minutes. A dash means not observed before death or timeout, never zero. fixed3 grants +3 gear; buy starts with base gear on credit and calls the production upgrade function. These are synthetic single-node fixtures, not earned full progression routes. Separate batches retain their different rune policies and repeated prefixes.','','| Batch | Arm | Mode | Runs | Mastered | Died | Actually bought full +3 | Actually bought full +5 |','|---|---|---|---:|---:|---:|---:|---:|'];
for(const s of summaries)lines.push(`| ${s.batch} | ${s.arm} | ${s.mode} | ${s.runs} | ${s.mastered} | ${s.deaths} | ${s.all3Bought} | ${s.all5Bought} |`);
lines.push('','## Every completed observation','','| Batch | Arm / mode | Node | Class | Seed | Mastery | Death | +3 funding | +5 funding | Actual +3 | Actual +5 |','|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|');
for(const r of rows)lines.push(`| ${r.batch} | ${r.arm}/${r.mode} | ${r.node} | ${r.class} | ${r.seed} | ${fmt(r.masteryMinutes)} | ${fmt(r.deathMinutes)} | ${fmt(r.fund3Minutes)} | ${fmt(r.fund5Minutes)} | ${fmt(r.buy3Minutes)} | ${fmt(r.buy5Minutes)} |`);
writeFileSync(resolve(here,'BOT-TABLES.md'),lines.join('\n')+'\n');
console.log(JSON.stringify({observations:rows.length,summaries},null,2));

