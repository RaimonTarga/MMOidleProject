import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
const require = createRequire(new URL('../server/package.json',import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');return [a.slice(2,i),a.slice(i+1)];}));
assert(args.historical && args.out);
const historical = resolve(args.historical), oldRequire = createRequire(join(historical,'server/package.json'));
const json = p=>JSON.parse(readFileSync(p,'utf8'));
const seal = json(new URL('../reports/player-fast-pass/conduit-recovery-preparation/r2-run-01/identity.json',import.meta.url));
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:historical,encoding:'utf8'}).trim(),seal.revision);
for(const [p,h] of Object.entries(seal.files)) assert.equal(createHash('sha256').update(readFileSync(join(historical,p))).digest('hex'),h,p);
const current = require('@mmo-idle/shared'), old = oldRequire('@mmo-idle/shared');
const tuning = old.SUMMONER_FRAME_TUNING;
assert.equal(tuning.light.reconstructionIntervalMult,2500/3500);
assert.equal(tuning.balanced.reconstructionIntervalMult,3000/3500);
assert.equal(tuning.light.minimumReconstructionIntervalMs,2000);
assert.equal(tuning.balanced.minimumReconstructionIntervalMs,2000);
const inputs = [];
for(const frame of [null,'light','balanced','heavy']) for(const range of [null,'close','mid','far'])
for(const path of [null,'a','b','c']) for(const frequency of [-2,0,2,5]) for(const passive of [0.05,1,1.3])
  inputs.push({selectedSubVariant:frame,selectedRange:range?`summoner-range-${range}`:null,
    unlockedSkills:path?[`summoner-${frame}-t3-${path}`]:[],passives:{'summoner.reconstruction-interval-mult':passive},
    relicRatings:{frequency,potency:2,buffEffect:0,debuffEffect:0}});
const before = inputs.map(x=>old.resolveSummonerProfile(x));
// These are exactly the four assignments in the measured historical R2 child.
tuning.light.reconstructionIntervalMult=2000/3500;
tuning.balanced.reconstructionIntervalMult=2500/3500;
tuning.light.minimumReconstructionIntervalMs=1500;
tuning.balanced.minimumReconstructionIntervalMs=1500;
let unchangedRootHeavy=0;
const strip=({reconstructionFactors,reconstructionIntervalMs,...rest})=>rest;
for(const [i,input] of inputs.entries()) {
  const actual=current.resolveSummonerProfile(input), expected=old.resolveSummonerProfile(input);
  assert.deepEqual(actual,expected,'Current production must equal actual historical R2 module');
  assert.deepEqual(strip(actual),strip(before[i]),'No non-timing change');
  if([null,'heavy'].includes(input.selectedSubVariant)) {assert.deepEqual(actual,before[i]);unchangedRootHeavy++;}
}
const { BREADTH_CELLS } = require('../server/bench/balance/playerBreadthSpec.ts');
const { createBalanceWorld } = require('../server/bench/balance/worldFactory.ts');
const { prepareSurveyBot } = require('../server/bench/balance/ttkSurveySpec.ts');
const { ConduitRecorder } = require('../server/bench/balance/conduitRecorder.ts');
const { teardownArena } = require('../server/bench/balance/arena.ts');
const { summonerProfileFor } = require('../server/src/systems/classes/archetypes/summoner/profile.ts');
const schedule=json(new URL('../reports/player-fast-pass/conduit-recovery-preparation/r2-run-01/manifest.json',import.meta.url));
const applied=[];
for(const c of schedule.cases.filter(c=>c.arm==='candidate-r2')) {
  const expected=json(new URL(`../reports/player-fast-pass/conduit-recovery-preparation/r2-run-01/${c.observationId}.arm.json`,import.meta.url));
  const cell=BREADTH_CELLS.find(x=>x.id===c.caseId), world=createBalanceWorld();
  try {
    const {bot}=prepareSurveyBot(world,cell,{x:2400,y:2400});
    const recorder=new ConduitRecorder(world,bot,'untreated'), receipt=recorder.profileReceipt();
    assert.deepEqual(cell,expected.cell,'Historical package unchanged');
    assert.deepEqual(receipt,expected.applied,'Measured R2 receipt including slots/HP costs');
    assert.deepEqual(summonerProfileFor(bot),receipt.profile,'Actual server module agrees');
    const saved=current.SUMMONER_FRAME_TUNING[cell.frame].minimumReconstructionIntervalMs;
    try {
      current.SUMMONER_FRAME_TUNING[cell.frame].minimumReconstructionIntervalMs=9876;
      assert.equal(summonerProfileFor(bot).reconstructionIntervalMs,9876,'Runtime must consume same shared tuning instance');
    } finally {current.SUMMONER_FRAME_TUNING[cell.frame].minimumReconstructionIntervalMs=saved;}
    assert.deepEqual(recorder.profileReceipt(),expected.applied);
    recorder.finish('zero-tick-r2-equivalence');
    applied.push({caseId:cell.id,intervalMs:receipt.profile.reconstructionIntervalMs,match:true});
  } finally {teardownArena(world);}
}
assert.equal(applied.length,12);
writeFileSync(args.out,JSON.stringify({passed:true,historicalSource:seal.revision,profiles:inputs.length,unchangedRootHeavy,
  applied,runtimeModuleIdentity:true,worldTicks:0},null,2)+'\n');
console.log(`${inputs.length} R2 profiles; ${unchangedRootHeavy} Root/Heavy exclusions; 12 measured runtime receipts match; zero ticks.`);
