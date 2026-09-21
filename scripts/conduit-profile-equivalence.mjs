import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const i=a.indexOf('='); return [a.slice(2,i),a.slice(i+1)]; }));
assert(args.historical && args.out);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:args.historical,encoding:'utf8'}).trim(),'5024be692d8a1854b7f61e007d371f2ee9aab46b');
const current = await import('../shared/src/systems/summonerProfile.ts');
const old = await import(pathToFileURL(resolve(args.historical,'shared/src/systems/summonerProfile.ts')).href);
let profiles=0,rootUnchanged=0;
for(const frame of [null,'light','balanced','heavy']) for(const range of [null,'close','mid','far'])
for(const path of [null,'a','b','c']) for(const frequency of [-2,0,2,5]) for(const passive of [0.05,1,1.3]) {
  const input={selectedSubVariant:frame,selectedRange:range?`summoner-range-${range}`:null,
    unlockedSkills:path?[`summoner-${frame}-t3-${path}`]:[],
    passives:{'summoner.reconstruction-interval-mult':passive},relicRatings:{frequency,potency:2,buffEffect:0,debuffEffect:0}};
  assert.deepEqual(current.resolveSummonerProfile(input),old.resolveSummonerProfile({...input,reconstructionExperiment:'reconstruction-r1'}));
  profiles++;
  if(frame===null && range===null) {assert.deepEqual(current.resolveSummonerProfile(input),old.resolveSummonerProfile(input));rootUnchanged++;}
}
// Compare actual equipment/passive-derived profiles recorded by the sealed historical preparation.
const receipts=JSON.parse(readFileSync(new URL('../reports/player-fast-pass/breadth-01-preparation/packet/qualification/resolved-builds.json',import.meta.url),'utf8'));
const { BREADTH_CELLS }=await import('../server/bench/balance/playerBreadthSpec.ts');
const { createBalanceWorld }=await import('../server/bench/balance/worldFactory.ts');
const { prepareSurveyBot }=await import('../server/bench/balance/ttkSurveySpec.ts');
const { ConduitRecorder }=await import('../server/bench/balance/conduitRecorder.ts');
const { teardownArena }=await import('../server/bench/balance/arena.ts');
const applied=[];
for(const expected of receipts.filter(r=>r.playerTreatment==='reconstruction-r1')) {
  const cell=BREADTH_CELLS.find(c=>c.id===expected.caseId),world=createBalanceWorld();
  try {
    const {bot}=prepareSurveyBot(world,cell,{x:2400,y:2400});
    const recorder=new ConduitRecorder(world,bot,'untreated');
    const {treatment,...actual}=recorder.profileReceipt();
    const {treatment:historicalTreatment,...reference}=expected.conduitProfile;
    assert.deepEqual(actual,reference,cell.id);
    recorder.finish('zero-tick-equivalence');
    applied.push({caseId:cell.id,intervalMs:actual.profile.reconstructionIntervalMs,match:true});
  } finally {teardownArena(world);}
}
assert.equal(applied.length,18);
writeFileSync(args.out,JSON.stringify({profiles,rootUnchanged,applied,worldTicks:0,passed:true},null,2)+'\n');
console.log(`${profiles} pure profiles, ${rootUnchanged} Root checks, ${applied.length} applied historical R1 profiles match; zero World ticks.`);
