import assert from 'node:assert/strict';
import { resolveSummonerProfile } from '@mmo-idle/shared';
import { PACKAGE_FIT_CELLS } from '../bench/balance/playerPackageFitSpec';
import { supportedLegacyFormation } from '../bench/balance/conduitRecorder';
import { ConduitRecorder } from '../bench/balance/conduitRecorder';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { tickSummonReconstruction, enqueueSummonReconstruction } from '../src/systems/classes/archetypes/summoner/reconstruction';
import { computeMinionMaxHp, despawnMinion } from '../src/systems/classes/archetypes/summoner/spawn';
import { summonerProfileFor } from '../src/systems/classes/archetypes/summoner/profile';
import type { PlayerEntity } from '../src/ecs/entity';
// The Conduit root's reconstruction interval (the class-first tree has no frames, range nodes or paths).
function profile(frequency=0) {
  return resolveSummonerProfile({selectedSubVariant:null,selectedRange:null,unlockedSkills:[],
    relicRatings:{frequency,potency:0,buffEffect:0,debuffEffect:0}});
}
assert.equal(profile().reconstructionIntervalMs,3500);
assert.equal(profile(2).reconstructionIntervalMs,2500);
assert.equal(supportedLegacyFormation([{hp:10}]).livingBodyCounts,null);
assert.equal(supportedLegacyFormation([]).targetIds,null);
assert.deepEqual(supportedLegacyFormation([{minions:[]}]).livingBodyCounts,[0]);
// No encounter/combat: exercise the real FIFO payment boundary, job snapshots and observation independence.
{
  // A T3 Conduit farm package holding only its class root.
  const cell=structuredClone(PACKAGE_FIT_CELLS.find(c=>c.tier===3&&c.className==='conduit'&&c.role==='farm')!);
  cell.build.skillPath=[cell.build.classRoot];
  const world=createBalanceWorld(), otherWorld=createBalanceWorld();
  const {bot}=prepareSurveyBot(world,cell,{x:2400,y:2400});
  const other=prepareSurveyBot(otherWorld,cell,{x:2400,y:2400}).bot;
  const recorder=new ConduitRecorder(world,bot,'untreated');
  assert.equal(summonerProfileFor(bot).reconstructionIntervalMs,3500);
  assert.equal(summonerProfileFor(other).reconstructionIntervalMs,3500);
  updateSummonerArchetype(world,0,1800000000000);
  const owner=bot as PlayerEntity & {summonsMinions:NonNullable<PlayerEntity['summonsMinions']>};
  const summons=owner.summonsMinions;
  despawnMinion(world,world.getMinionEntity(summons.minionIds[0])!);
  enqueueSummonReconstruction(world,owner,summons.slotIds[0]);
  tickSummonReconstruction(world,owner,100,1800000000000);
  assert.equal(summons.activeReconstruction!.durationMs,3500);
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
  assert.equal(summonerProfileFor(bot).reconstructionIntervalMs,3500);
  assert.equal(summons.activeReconstruction!.durationMs,3500);
  world.detachPlayerEntity(bot.isPlayer.id);otherWorld.detachPlayerEntity(other.isPlayer.id);
}
console.log('playerBreadth: ok');
