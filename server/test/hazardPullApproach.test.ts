import assert from 'node:assert/strict';
import {setFlag} from '@mmo-idle/shared';
import {createFarmWorld} from '../bench/balance/worldFactory';
import {setupArena,teardownArena} from '../bench/balance/arena';
import {prepareSurveyBot} from '../bench/balance/ttkSurveySpec';
import {DURABILITY11_CELLS} from '../bench/balance/durability11Spec';
import {steerTowardTarget} from '../src/systems/combat/ai/autoTarget';
import {attachComponent} from '../src/ecs/markerHelpers';
import {updateMovement} from '../src/systems/world/movement';

// Recorded geometry from the two no-contact observations. Combat is not being
// balanced here: a stationary caster must produce a stable, reachable pull leg.
for (const scenario of [
  {role:'swamp',cls:'striker',player:{x:1875.729,y:1294.267},target:{x:1780.263,y:1367.172},type:'mire-hex-spitter'},
  {role:'jungle',cls:'squire',player:{x:3664,y:3536},target:{x:3801.031,y:3409.014},type:'canopy-harrier'},
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
  } finally {teardownArena(world);}
}
console.log('hazardPullApproach: ok');
