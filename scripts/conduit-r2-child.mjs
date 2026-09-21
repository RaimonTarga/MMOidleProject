// Isolated measurement-process overlay. Never imported by production.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require=createRequire(new URL('../server/package.json',import.meta.url));
const { SUMMONER_FRAME_TUNING }=require('@mmo-idle/shared');
import { BREADTH_CELLS } from '../server/bench/balance/playerBreadthSpec.ts';
import { createBalanceWorld } from '../server/bench/balance/worldFactory.ts';
import { prepareSurveyBot } from '../server/bench/balance/ttkSurveySpec.ts';
import { ConduitRecorder } from '../server/bench/balance/conduitRecorder.ts';
import { teardownArena } from '../server/bench/balance/arena.ts';

const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');return [a.slice(2,i),a.slice(i+1)];}));
assert(['adopted-r1','candidate-r2'].includes(args.arm));
assert(['qualify','run'].includes(args.mode));
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),args.revision);
const identities=['breadth-t2-conduit-light','breadth-t2-conduit-balanced','breadth-t3-conduit-balanced',
  'breadth-t4-conduit-balanced-a','breadth-t4-conduit-light-b','breadth-t4-conduit-light-c'];
const cell=BREADTH_CELLS.find(c=>c.id===args.block && c.playerTreatment==='untreated');
assert(cell && identities.includes(cell.identityId),'Outside six-identity comparison');
const world=createBalanceWorld();
let receipt;
try {
  const {bot}=prepareSurveyBot(world,cell,{x:2400,y:2400});
  const recorder=new ConduitRecorder(world,bot,'untreated');
  const baseline=recorder.profileReceipt();
  assert.equal(SUMMONER_FRAME_TUNING.light.reconstructionIntervalMult,2500/3500);
  assert.equal(SUMMONER_FRAME_TUNING.balanced.reconstructionIntervalMult,3000/3500);
  assert.equal(SUMMONER_FRAME_TUNING.light.minimumReconstructionIntervalMs,2000);
  assert.equal(SUMMONER_FRAME_TUNING.balanced.minimumReconstructionIntervalMs,2000);
  if(args.arm==='candidate-r2') {
    SUMMONER_FRAME_TUNING.light.reconstructionIntervalMult=2000/3500;
    SUMMONER_FRAME_TUNING.balanced.reconstructionIntervalMult=2500/3500;
    SUMMONER_FRAME_TUNING.light.minimumReconstructionIntervalMs=1500;
    SUMMONER_FRAME_TUNING.balanced.minimumReconstructionIntervalMs=1500;
  }
  const applied=recorder.profileReceipt();
  if(args.arm==='candidate-r2') {
    assert(applied.profile.reconstructionIntervalMs < baseline.profile.reconstructionIntervalMs,'R2 must change the runtime profile');
    assert.equal(applied.profile.reconstructionFactors.floorMs,1500,'R2 floor must be visible');
  }
  const strip=({reconstructionFactors,reconstructionIntervalMs,...rest})=>rest;
  assert.deepEqual(strip(applied.profile),strip(baseline.profile),'Only timing may differ');
  assert.deepEqual(applied.slots,baseline.slots,'HP budgets/payment must remain fixed');
  receipt={arm:args.arm,revision:args.revision,caseId:cell.id,cell,worldTicks:0,baseline,applied,
    transportLabel:'untreated means no historical opt-in; arm is identified here, not by the legacy transport label'};
  recorder.finish('zero-tick-arm-readback');
} finally {teardownArena(world);}
if(args.mode==='qualify') mkdirSync(args.out,{recursive:true});
writeFileSync(args.mode==='run'?args.out+'.arm.json':join(args.out,'arm.json'),JSON.stringify(receipt,null,2)+'\n');
if(args.mode==='run') {
  // Existing exact-head guard, seed/window, package preparation and recording stay authoritative.
  process.argv=process.argv.filter(a=>!a.startsWith('--arm='));
  await import(cell.role==='farm'?'../server/scripts/ttkSurvey.ts':'../server/scripts/bossScreen.ts');
} else console.log(`${args.arm} ${cell.id}: zero-tick qualified, ${receipt.applied.profile.reconstructionIntervalMs} ms`);
