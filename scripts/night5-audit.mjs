import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2];assert(dir);
const read=n=>JSON.parse(readFileSync(join(dir,n),'utf8'));
const manifest=read('manifest.json'),index=read('index.json');
const median=a=>{a=[...a].sort((x,y)=>x-y);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2:null;};
const rows=index.map(r=>{
 const samples=readFileSync(join(dir,`${r.cell}-s${r.seed}`,'samples.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
 let previous=-1000,quiet=0,peak=0,with3=0,blocked=0;
 for(const s of samples){assert.equal(s.atMs-previous,1000);previous=s.atMs;assert(Number.isFinite(s.lastOutgoingDamageMs)&&s.lastOutgoingDamageMs<=s.atMs);
 quiet=Math.max(quiet,s.atMs-s.lastOutgoingDamageMs);
 const count=s.monsters.filter(m=>m.hp>0&&m.aggro?.targetKind==='player'&&m.aggro.targetId==='bench-bot-0').length;
 peak=Math.max(peak,count);if(count>=3)with3++;if(s.blockedApproach)blocked++;
 }
 assert(r.elapsedMs-previous<=1000);
 quiet=Math.max(quiet,r.elapsedMs-Math.max(0,...r.targets.map(t=>t.lastDamageMs??0)));
 return {cell:r.cell,seed:r.seed,outcome:r.outcome,elapsedMs:r.elapsedMs,wallElapsedMs:r.wallElapsedMs,maxTickWallMs:r.maxTickWallMs,minHp:r.minHpFraction,maxQuietMs:quiet,longQuiet:quiet>=30000,peakPlayerPursuers:peak,sampledSecondsWith3PlusPursuers:with3,blockedSamples:blocked,lateJoiners:r.episodes.reduce((n,e)=>n+e.lateJoiners,0),recoveryInterruptions:r.recovery.filter(x=>x.interruptedByNextPull).length};
});
const species=[];
for(const cell of manifest.cells){
 const runs=index.filter(r=>r.cell===cell.id);if(!runs.length)continue;
 for(const type of new Set(runs.flatMap(r=>r.targets.map(t=>t.type)))){
 const perSeed=runs.map(r=>{const ts=r.targets.filter(t=>t.type===type),exposure=rows.find(e=>e.cell===r.cell&&e.seed===r.seed);return {seed:r.seed,outcome:r.outcome,longQuiet:exposure.longQuiet,killed:ts.filter(t=>t.killedAtMs!==null).length,unfinished:ts.filter(t=>t.killedAtMs===null).length,regained:ts.filter(t=>t.hpRegainObserved).length,cleanMedianMs:median(ts.filter(t=>t.clean).map(t=>t.ttkMs))};});
 const eligible=perSeed.filter(s=>s.outcome!=='wall-ceiling'&&!s.longQuiet&&s.cleanMedianMs!==null);
 species.push({cell:cell.id,type,perSeed,medianOfEligibleSeedMediansMs:median(eligible.map(s=>s.cleanMedianMs)),eligibleSeeds:eligible.length,inconclusive:eligible.length<2});
 }
}
writeFileSync(join(dir,'night5-audit.json'),JSON.stringify({rows,species,censoredRuns:rows.filter(r=>r.outcome==='wall-ceiling').length,longQuietRuns:rows.filter(r=>r.longQuiet).length},null,2));
console.log(JSON.stringify({rows:rows.length,censored:rows.filter(r=>r.outcome==='wall-ceiling').length,longQuiet:rows.filter(r=>r.longQuiet).length}));
