import {readFileSync,writeFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(process.argv[2]), out=resolve('reports/volcano-area-study-2026-09-25');
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const manifest=read('manifest.json'), completion=read('complete.json'), results=read('results.json');
assert.equal(results.length,manifest.cases.length);assert.equal(completion.completed,manifest.cases.length);
const valid=results.filter(r=>!['execution-failed','wall-ceiling'].includes(r.outcome));
const sum=(xs,f)=>xs.reduce((s,x)=>s+f(x),0);
const groups=[];
for(const tier of [3,4])for(const biome of ['volcanic','tundra'])for(const arm of biome==='volcanic'?['baseline','heat','full']:['baseline']){
 const xs=valid.filter(r=>r.mode==='farm'&&r.tier===tier&&r.biome===biome&&r.arm===arm);
 groups.push({tier,biome,arm,n:xs.length,survivors:xs.filter(r=>r.outcome==='window-ended').length,deaths:xs.filter(r=>r.outcome==='player-died').length,
   kills:sum(xs,r=>r.work.kills),observedSeconds:sum(xs,r=>r.elapsedMs)/1000,
   progressSurvivors:xs.filter(r=>r.outcome==='window-ended'&&r.noProgressTailMs<60000).length,
   tailStalls:xs.filter(r=>r.noProgressTailMs>=60000).map(r=>({id:r.id,ms:r.noProgressTailMs})),
   longProgressGaps:xs.filter(r=>r.work.longestHpProgressGapMs>=60000).map(r=>({id:r.id,ms:r.work.longestHpProgressGapMs})),
   incomingHp:sum(xs,r=>sum(Object.values(r.incoming),x=>x.hp)),incomingAbsorbed:sum(xs,r=>sum(Object.values(r.incoming),x=>x.absorbed))});
}
const readEvents=r=>readFileSync(join(root,r.id,'events.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const pairs=[];
for(const base of valid.filter(r=>r.biome==='volcanic'&&r.arm==='baseline'))for(const arm of ['heat','full']){
 const c=valid.find(r=>r.tier===base.tier&&r.className===base.className&&r.seed===base.seed&&r.mode===base.mode&&r.arm===arm);if(!c)continue;
 const aReady=read(base.id+'/ready.json'),bReady=read(c.id+'/ready.json');
 assert.equal(aReady.geometryHash,bReady.geometryHash,'geometry differs '+base.id);
 assert.equal(aReady.playerHash,bReady.playerHash,'player differs '+base.id);
 const end=Math.min(base.elapsedMs,c.elapsedMs);
 const measure=r=>{const ev=readEvents(r).filter(e=>e.tickEndMs<=end).map(e=>e.event);const incoming=ev.filter(e=>e.kind==='damage'&&e.target.id==='bench-bot-0');
   return {kills:ev.filter(e=>e.kind==='kill'&&e.victim.actorType==='monster').length,hp:sum(incoming,e=>e.hpDamage),absorbed:sum(incoming,e=>e.absorbed),
   dotHp:sum(incoming.filter(e=>e.damageType==='dot'),e=>e.hpDamage),sources:Object.fromEntries([...new Set(incoming.map(e=>e.source.name))].map(name=>[name,sum(incoming.filter(e=>e.source.name===name),e=>e.hpDamage)]))};};
 pairs.push({tier:base.tier,className:base.className,seed:base.seed,mode:base.mode,arm,matchedPlayerAndGeometry:true,commonEndMs:end,
   baseline:{outcome:base.outcome,elapsedMs:base.elapsedMs,kills:base.work.kills,common:measure(base)},candidate:{outcome:c.outcome,elapsedMs:c.elapsedMs,kills:c.work.kills,common:measure(c)}});
}
const compact={manifest:{id:manifest.id,revision:manifest.revision,synthetic:true,economyEligible:false,rawRoot:root},completion,groups,pairs,
 cases:results.map(({terminalRoster,endpoints,incoming,...r})=>({...r,incoming,endpoints})),limitations:['Mature synthetic packages only; not acquisition or live player evidence.','Three balanced class packages per tier; T4 path b.','Ten-minute farming caps and one modifier fixture per biome; no isolated-pack experiment.','Boss boundary covers Striker only, one seed per tier; guardian setup bypassed.','Common-time damage compares evolving trajectories, not identical attack sequences.','Death clears Heat; terminalHeat zero on a dead player is not pre-death Heat.']};
writeFileSync(join(out,'experiment-results.json'),JSON.stringify(compact,null,2)+'\n');
const inventory=[];function walk(dir){for(const x of readdirSync(dir,{withFileTypes:true})){const p=join(dir,x.name);if(x.isDirectory())walk(p);else inventory.push({path:p,bytes:statSync(p).size,sha256:createHash('sha256').update(readFileSync(p)).digest('hex')});}}walk(root);
writeFileSync(join(out,'experiment-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
const lines=['# Volcano nerf experiment — local develop, 2026-09-25','','Current candidate applies all six study values. No commit, push or deployment was performed.','','## Design','','52 planned sequential fresh-process observations: 36 Volcano farming lives (12 matched baseline / Heat-only / full triples), 12 same-package Tundra contextual controls, and four Striker Volcano boss boundaries. Farming cap 600 seconds; boss cap 300 seconds; 100 ms ticks; seeds 101009 and 101021. Mature balanced Striker, Slinger, Conduit; T4 specialization b. Starting HP/barrier full, native fresh summons, no rites and no Manage Heat rule. Equipment, skills, behavior and starting geometry match within each treatment comparison. Mastery is fixed to prevent a progression feedback treatment. These are synthetic prepared packages, not measured arrival builds.','','Baseline restores only the six old values in memory before world construction; Heat-only restores the five monster values. Full uses the applied local source. Both farming arms retain native repopulation, movement, hazards and pack behavior. Boss setup wakes the native boss without fighting guardians. Source hashes, actual player/equipment/RP readbacks, hitboxes and initial geometry are retained in the external raw directory.','','## Farming outcomes','','Kills below are total observed work, including death-shortened lives; they are not equal-duration throughput. Progress survivor means the cap was reached and owner/summon HP damage occurred in the final minute.','','| Tier / biome | Arm | Valid | Survived 10 min | Progress survivors | Deaths | Kills | Observed seconds |','|---|---|---:|---:|---:|---:|---:|---:|'];
for(const g of groups)lines.push(`| T${g.tier} ${g.biome} | ${g.arm} | ${g.n} | ${g.survivors} | ${g.progressSurvivors} | ${g.deaths} | ${g.kills} | ${g.observedSeconds.toFixed(1)} |`);
lines.push('','## Individual Volcano comparisons','','| Case | Original seconds / kills | Heat-only seconds / kills | Full seconds / kills |','|---|---:|---:|---:|');
for(const b of valid.filter(r=>r.mode==='farm'&&r.biome==='volcanic'&&r.arm==='baseline')){const find=a=>valid.find(r=>r.mode===b.mode&&r.biome===b.biome&&r.tier===b.tier&&r.className===b.className&&r.seed===b.seed&&r.arm===a);const fmt=r=>r?`${(r.elapsedMs/1000).toFixed(1)} / ${r.work.kills}${r.outcome==='window-ended'?' (cap)':''}`:'unavailable';lines.push(`| T${b.tier} ${b.className} ${b.seed} | ${fmt(b)} | ${fmt(find('heat'))} | ${fmt(find('full'))} |`);}
lines.push('','## Equal observation windows','','Both arms truncated at the earlier terminal time. Trajectories can diverge, so damage totals reflect targeting, mitigation, recovery and survival changes, not just coefficient changes. HP and absorbed amounts are separate in JSON.','','| Pair | Window seconds | Original HP damage taken | Candidate HP damage taken | Original kills | Candidate kills |','|---|---:|---:|---:|---:|---:|');
for(const p of pairs.filter(p=>p.mode==='farm'&&p.arm==='full'))lines.push(`| T${p.tier} ${p.className} ${p.seed} | ${(p.commonEndMs/1000).toFixed(1)} | ${p.baseline.common.hp.toFixed(1)} | ${p.candidate.common.hp.toFixed(1)} | ${p.baseline.common.kills} | ${p.candidate.common.kills} |`);
lines.push('','## Progress gaps','','Full HP and survival do not establish continuous farming. The following lives have at least one 60-second span without owner/summon HP damage to monsters (including a possible final tail). Some recover and resume; these are not all terminal stalls.','','| Case | Longest HP-progress gap, seconds |','|---|---:|');
for(const r of valid.filter(r=>r.work.longestHpProgressGapMs>=60000))lines.push(`| ${r.id} | ${(r.work.longestHpProgressGapMs/1000).toFixed(1)} |`);
lines.push('','## Boss boundary','','| Tier | Arm | Outcome | Seconds | Kills including adds |','|---|---|---|---:|---:|');
for(const r of results.filter(r=>r.mode==='boss'))lines.push(`| ${r.tier} | ${r.arm} | ${r.outcome} | ${r.elapsedMs==null?'unavailable':(r.elapsedMs/1000).toFixed(1)} | ${r.work?.kills??'unavailable'} |`);
lines.push('','## Limits and evidence','','- '+compact.limitations.join('\n- '),`- Completion: ${completion.completed}/${completion.planned}; execution failures ${completion.failures}; wall-censored ${results.filter(r=>r.outcome==='wall-ceiling').length}.`,`- ${pairs.length} available paired geometry/player identities verified.`,`- Raw evidence: ${root}`,`- Source HEAD: ${manifest.revision}, plus the working changes recorded in working.diff.`,`- Hitboxes SHA-256: ${manifest.hitboxesSha256}`,'','See experiment-results.json for individual damage sources, endpoints, Heat exposure and no-progress tails. See experiment-inventory.json for raw-file paths, sizes and hashes.');
writeFileSync(join(out,'EXPERIMENT.md'),lines.join('\n')+'\n');
console.log(JSON.stringify({completion,groups,pairCount:pairs.length},null,2));
