import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(process.argv[2]??'');assert(process.argv[2]);
const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
const results=JSON.parse(readFileSync(join(root,'index.json'),'utf8'));
assert(manifest.mode!=='qualify','Qualification is not combat evidence');
const median=a=>{a=[...a].sort((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2:null;};
const fmt=x=>x===null?'n/a':(x/1000).toFixed(2);
const rows=[];const perType=[];
for(const cell of manifest.cells) {
 const runs=results.filter(r=>r.cell===cell.id);if(!runs.length)continue;
 const targets=runs.flatMap(r=>r.targets);
 const clean=targets.filter(t=>t.clean);
 const episodes=runs.flatMap(r=>r.episodes);
 const recovery=runs.flatMap(r=>r.recovery);
 const row={...cell,replicates:runs.length,deaths:runs.filter(r=>r.outcome==='player-died').length,
  kills:targets.filter(t=>t.killedAtMs!==null).length,censored:targets.filter(t=>t.killedAtMs===null).length,
  cleanN:clean.length,medianOfSeedMediansMs:median(runs.map(r=>r.cleanTtkMs.median).filter(x=>x!==null)),
  perSeed:runs.map(r=>({seed:r.seed,outcome:r.outcome,ttk:r.cleanTtkMs,counts:r.counts,minHp:r.minHpFraction,largestHit:r.largestHit,maxDamageIn1s:r.maxDamageIn1s})),
  observedGroups:Object.fromEntries([['solo',1,1],['small',2,3],['swarm',4,Infinity]].map(([name,lo,hi])=>{
    const es=episodes.filter(e=>e.members.length>=lo&&e.members.length<=hi);
    return [name,{n:es.length,cleared:es.filter(e=>e.outcome==='cleared').length,censored:es.filter(e=>e.outcome!=='cleared').length,medianClearMs:median(es.filter(e=>e.outcome==='cleared').map(e=>e.durationMs))}];})),
  medianRecoveryMs:median(recovery.filter(r=>r.recoveredAtMs!==null).map(r=>r.recoveredAtMs-r.afterClearMs)),
  recoveryInterrupted:recovery.filter(r=>r.interruptedByNextPull).length,
  quality:runs.length<3||clean.length<5?'sparse; no firm ranking':'descriptive three-seed screen'};
 rows.push(row);
 for(const type of new Set(targets.map(t=>t.type))) {
  const ts=targets.filter(t=>t.type===type);perType.push({cell:cell.id,type,name:ts[0].name,maxHp:[...new Set(ts.map(t=>t.maxHp))],damaged:ts.length,killed:ts.filter(t=>t.killedAtMs!==null).length,censored:ts.filter(t=>t.killedAtMs===null).length,medianCleanTtkMs:median(ts.filter(t=>t.clean).map(t=>t.ttkMs)),oneHitWindow:ts.filter(t=>t.ttkMs===0).length,castsStarted:ts.reduce((s,t)=>s+t.castsStarted,0),castsFired:ts.reduce((s,t)=>s+t.castsFired,0)});
 }
}
writeFileSync(join(root,'analysis.json'),JSON.stringify({mode:manifest.mode,complete:existsSync(join(root,'complete.json')),rows,perType},null,2));
const lines=['# TTK survey measurements','',`Mode: ${manifest.mode}. ${results.length} retained replicates; synthetic combat evidence only.`,
 '','Medians below are medians of available seed medians, exclude unfinished targets and observed HP-regain targets. Read censor/death counts beside them. Compare the per-type table before attributing a difference to class or tier.','',
 '| Cell | Seeds | Kills / censored | Clean N | Median TTK (s) | Deaths | Observed solo / small / swarm episodes |',
 '|---|---:|---:|---:|---:|---:|---|'];
for(const r of rows) lines.push(`| ${r.id} | ${r.replicates} | ${r.kills} / ${r.censored} | ${r.cleanN} | ${fmt(r.medianOfSeedMediansMs)} | ${r.deaths} | ${Object.values(r.observedGroups).map(g=>g.n).join(' / ')} |`);
lines.push('','## Enemy types','','| Cell | Enemy | Kills / censored | Median clean TTK (s) | Cast starts / fired |','|---|---|---:|---:|---:|');
for(const t of perType)lines.push(`| ${t.cell} | ${t.name} | ${t.killed} / ${t.censored} | ${fmt(t.medianCleanTtkMs)} | ${t.castsStarted} / ${t.castsFired} |`);
writeFileSync(join(root,'analysis.md'),lines.join('\n')+'\n');
console.log('Wrote analysis.json and analysis.md');
