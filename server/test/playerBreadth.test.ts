import assert from 'node:assert/strict';
import { resolveSummonerProfile, type SummonerProfileInput } from '@mmo-idle/shared';
import { assertBreadthDefinitions, BREADTH_CELLS } from '../bench/balance/playerBreadthSpec';
import { supportedLegacyFormation } from '../bench/balance/conduitRecorder';
import { ConduitRecorder } from '../bench/balance/conduitRecorder';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { tickSummonReconstruction, enqueueSummonReconstruction } from '../src/systems/classes/archetypes/summoner/reconstruction';
import { computeMinionMaxHp, despawnMinion } from '../src/systems/classes/archetypes/summoner/spawn';
import { summonerProfileFor } from '../src/systems/classes/archetypes/summoner/profile';
import type { PlayerEntity } from '../src/ecs/entity';
assertBreadthDefinitions();
function profile(frame:SummonerProfileInput['selectedSubVariant'],range:string|null,path:string|null,frequency=0) {
  return resolveSummonerProfile({selectedSubVariant:frame,selectedRange:range?`summoner-range-${range}`:null,
    unlockedSkills:path?[`summoner-${frame}-t3-${path}`]:[],relicRatings:{frequency,potency:0,buffEffect:0,debuffEffect:0}});
}
for(const [frame,range,path,ms] of [
  [null,null,null,3500],['light',null,null,2500],['balanced',null,null,3000],['heavy',null,null,3920],
  ['light','far',null,2125],['balanced','far',null,2550],['heavy','far',null,3332],
  ['light','mid','b',2000],['light','far','b',2000],['heavy','mid','c',5292],
] as const) assert.equal(profile(frame,range,path).reconstructionIntervalMs,ms);
assert.equal(profile('light','mid',null).reconstructionIntervalMs,2500);
assert.equal(profile('light','far',null,2).reconstructionIntervalMs,2000);
assert.equal(profile('heavy','far',null,2).reconstructionIntervalMs,2500);
assert.equal(profile(null,null,null,2).reconstructionIntervalMs,2500);
assert.equal(profile('light','far','b').reconstructionFactors.floorBinds,true);
assert.equal(supportedLegacyFormation([{hp:10}]).livingBodyCounts,null);
assert.equal(supportedLegacyFormation([]).targetIds,null);
assert.deepEqual(supportedLegacyFormation([{minions:[]}]).livingBodyCounts,[0]);
assert.equal(BREADTH_CELLS.filter(c=>c.controlCaseId).length,18);
// No encounter/combat: exercise the real FIFO payment boundary, job snapshots and observation independence.
{
  const cell=BREADTH_CELLS.find(c=>c.id==='breadth-t3-conduit-light-far-farm-reconstruction-r1')!;
  const world=createBalanceWorld(), otherWorld=createBalanceWorld();
  const {bot}=prepareSurveyBot(world,cell,{x:2400,y:2400});
  const other=prepareSurveyBot(otherWorld,cell,{x:2400,y:2400}).bot;
  const recorder=new ConduitRecorder(world,bot,'untreated');
  assert.equal(summonerProfileFor(bot).reconstructionIntervalMs,2125);
  assert.equal(summonerProfileFor(other).reconstructionIntervalMs,2125);
  updateSummonerArchetype(world,0,1800000000000);
  const owner=bot as PlayerEntity & {summonsMinions:NonNullable<PlayerEntity['summonsMinions']>};
  const summons=owner.summonsMinions;
  despawnMinion(world,world.getMinionEntity(summons.minionIds[0])!);
  enqueueSummonReconstruction(world,owner,summons.slotIds[0]);
  tickSummonReconstruction(world,owner,100,1800000000000);
  assert.equal(summons.activeReconstruction!.durationMs,2125);
  owner.hasHealth.recovery=0;
  const cost=Math.round(computeMinionMaxHp(owner,0)*0.3),floor=owner.hasHealth.maxHp*0.2;
  summons.activeReconstruction!.elapsedMs=summons.activeReconstruction!.durationMs;
  owner.hasHealth.hp=floor+cost-1;
  tickSummonReconstruction(world,owner,100,1800000000100);
  assert.equal(summons.minionIds[0],'');assert.equal(owner.hasHealth.hp,floor+cost-1);
  owner.hasHealth.hp=floor+cost;
  tickSummonReconstruction(world,owner,100,1800000000200);
  assert(summons.minionIds[0]);assert.equal(owner.hasHealth.hp,floor);
  // Observation disposal cannot change production reconstruction or an active job.
  despawnMinion(world,world.getMinionEntity(summons.minionIds[1])!);
  enqueueSummonReconstruction(world,owner,summons.slotIds[1]);
  tickSummonReconstruction(world,owner,100,1800000000300);
  const result=recorder.finish('unit-end');
  assert.equal(result.successfulReplacements,1);assert.equal(result.readyHpBlockedMs,100);
  assert.equal(summonerProfileFor(bot).reconstructionIntervalMs,2125);
  assert.equal(summons.activeReconstruction!.durationMs,2125);
  world.detachPlayerEntity(bot.isPlayer.id);otherWorld.detachPlayerEntity(other.isPlayer.id);
}
console.log('playerBreadth: ok');
