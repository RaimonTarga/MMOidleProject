import assert from 'node:assert/strict';
import {setFlag, hazardAvoidanceShapesForMover, moverOverlapsBlockShapes, distanceSq} from '@mmo-idle/shared';
import {createFarmWorld} from '../bench/balance/worldFactory';
import {setupArena,teardownArena} from '../bench/balance/arena';
import {prepareSurveyBot} from '../bench/balance/ttkSurveySpec';
import {DURABILITY11_CELLS} from '../bench/balance/durability11Spec';
import {steerTowardTarget} from '../src/systems/combat/ai/autoTarget';
import {attachComponent} from '../src/ecs/markerHelpers';
import {updateMovement} from '../src/systems/world/movement';
import {updateMonsters} from '../src/systems/combat/ai/ai';
import {setAggroTarget} from '../src/systems/combat/ai/targeting';
import {approachDeferred, hazardApproachExpired} from '../src/systems/combat/ai/blockedApproach';
import {nearestEngageableMonster} from '../src/systems/combat/ai/targetPriority';
import {DURABILITY12_SWARM} from '../bench/balance/durability12Spec';

// Recorded geometry from the two no-contact observations. Combat is not being
// balanced here: a stationary caster must produce a stable, reachable pull leg.
for (const scenario of [
  {role:'swamp',cls:'striker',player:{x:1875.729,y:1294.267},target:{x:1780.263,y:1367.172},type:'mire-hex-spitter'},
  {role:'jungle',cls:'squire',player:{x:3664,y:3536},target:{x:3801.031,y:3409.014},type:'canopy-harrier'},
  {role:'jungle',cls:'squire',player:{x:3520.723,y:3520.723},target:{x:3613.311,y:3310.208},type:'canopy-harrier'},
]) {
  const world=createFarmWorld();
  const cell=DURABILITY11_CELLS.find(c=>c.tier===3&&c.role===scenario.role&&c.className===scenario.cls&&c.nodeId.endsWith('05'))!;
  setupArena(world,{nodeId:cell.nodeId,biomeGroup:scenario.role,contentTier:3,isDungeon:false});
  try {
    const {bot}=prepareSurveyBot(world,cell,scenario.player);
    const target=[...world.monsterEntitiesInNode(cell.nodeId)].find(m=>m.isMonster.monsterTypeId===scenario.type)!;
    target.hasPosition.current={...scenario.target};
    attachComponent(world,target,'hasAggroTarget',{targetId:bot.isPlayer.id,targetKind:'player',lastAggroAt:0,sinceMs:0});
    setFlag(bot.tracksCombat,'rune.avoidNodeHazards',true);
    steerTowardTarget(world,bot,target,1000);
    const goal=structuredClone(bot.hasMovePath?.goal);
    assert(goal, `${scenario.role}: status/damage hazard must not silently truncate approach`);
    assert(!moverOverlapsBlockShapes(goal,hazardAvoidanceShapesForMover(cell.nodeId,'player'),{x:40,y:40}), 'pull avoids ALL hazards including the second bush');
    assert(distanceSq(bot.hasMovePath!.waypoints.at(-1)!,goal)<16*16,'path actually reaches requested retreat');
    const start={...bot.hasPosition.current};
    for(let tick=0;tick<6;tick++) {
      updateMovement(world,100,1000+tick*100);
      steerTowardTarget(world,bot,target,1000+tick*100);
      assert.deepEqual(bot.hasMovePath?.goal,goal,'pull destination remains committed across ticks');
    }
    assert(Math.hypot(bot.hasPosition.current.x-start.x,bot.hasPosition.current.y-start.y)>40,'pull makes sustained progress');
    target.hasPosition.current={x:bot.hasPosition.current.x+10,y:bot.hasPosition.current.y};
    steerTowardTarget(world,bot,target,2000);
    assert(!bot.isMoving,'enemy reaching safe attack range releases pull movement');
    assert(!hazardApproachExpired(bot,target,10000));
    assert(hazardApproachExpired(bot,target,25000),'unsuccessful approach is bounded');
    assert(approachDeferred(bot,target,25000));
    assert(!approachDeferred(bot,target,55000),'moving target can be reconsidered later');
    setAggroTarget(world,target,null,60000);
    target.hasAwareness.state='returning';
    target.controlsMonster.spawn={x:bot.hasPosition.current.x+400,y:bot.hasPosition.current.y};
    updateMonsters(world,100,60000);
    assert(!target.hasAggroTarget,'returning monster does not reacquire nearby player');
    target.hasPosition.current={...target.controlsMonster.spawn};
    updateMonsters(world,100,60100);
    assert.equal(target.hasAwareness.state,'idle','return completes at home');
  } finally {teardownArena(world);}
}
{
  const world=createFarmWorld();
  const cell=DURABILITY12_SWARM.find(c=>c.tier===3&&c.nodeId.endsWith('03')&&c.className==='spirit')!;
  setupArena(world,{nodeId:cell.nodeId,biomeGroup:'volcanic',contentTier:3,isDungeon:false});
  try {
    for(const m of [...world.monsterEntitiesInNode(cell.nodeId)]) world.removeMonsterEntity(m.entityId);
    const {bot}=prepareSurveyBot(world,cell,{x:426.17,y:1845.83});
    const target=world.createMonster(cell.nodeId,'ash-slinger',{x:885.68,y:2140.11})!;
    setFlag(bot.tracksCombat,'rune.avoidNodeHazards',true);
    assert.equal(nearestEngageableMonster(world,bot,1000),null,'deep lava target cannot be approached or pulled safely');
    setFlag(bot.tracksCombat,'rune.avoidNodeHazards',false);
    assert.equal(nearestEngageableMonster(world,bot,1000),target,'without avoidance physical reachability is unchanged');
  } finally {teardownArena(world);}
}
console.log('hazardPullApproach: ok');
