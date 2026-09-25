import assert from 'node:assert/strict';
import {setFlag, hazardAvoidanceShapesForMover, moverOverlapsBlockShapes} from '@mmo-idle/shared';
import {createFarmWorld} from '../bench/balance/worldFactory';
import {setupArena,teardownArena} from '../bench/balance/arena';
import {prepareSurveyBot} from '../bench/balance/ttkSurveySpec';
import {DURABILITY12_SWARM} from '../bench/balance/durability12Spec';
import {steerTowardTarget} from '../src/systems/combat/ai/autoTarget';
import {approachDeferred} from '../src/systems/combat/ai/blockedApproach';

// Volcanic stall (Striker s101033, node-t4-volcanic-01): the pool mob briefly
// fails the safe-pull check at some rim positions, so selection flips to a far
// mob for ONE tick roughly every 1.3 s. That tick used to wipe the pool mob's
// hazard-approach budget, so it was never deferred and the player circled the
// lava rim for minutes without contact. A brief switch must not reset the clock.
const world=createFarmWorld();
const cell=DURABILITY12_SWARM.find(c=>c.tier===3&&c.nodeId.endsWith('03')&&c.className==='spirit')!;
setupArena(world,{nodeId:cell.nodeId,biomeGroup:'volcanic',contentTier:3,isDungeon:false});
try {
  for(const m of [...world.monsterEntitiesInNode(cell.nodeId)]) world.removeMonsterEntity(m.entityId);
  const {bot}=prepareSurveyBot(world,cell,{x:426.17,y:1845.83});
  const pool=world.createMonster(cell.nodeId,'ash-slinger',{x:885.68,y:2140.11})!;
  const decoyPos={x:426,y:1400};
  assert(!moverOverlapsBlockShapes(decoyPos,hazardAvoidanceShapesForMover(cell.nodeId,'player'),{x:40,y:40}),'decoy stands clear of hazards');
  const decoy=world.createMonster(cell.nodeId,'ash-slinger',decoyPos)!;
  setFlag(bot.tracksCombat,'rune.avoidNodeHazards',true);

  let deferredAt:number|null=null;
  for(let tick=0,now=1000;now<=20000;tick++,now+=100) {
    steerTowardTarget(world,bot,tick%13===12?decoy:pool,now);
    if(deferredAt===null&&approachDeferred(bot,pool,now)) deferredAt=now;
  }
  assert(deferredAt!==null,'one-tick target flicker must not reset the lava mob\'s approach budget');
  assert(deferredAt<=16100,`pool mob deferred on budget, not late (at ${deferredAt})`);
  assert(!approachDeferred(bot,decoy,20000),'reachable decoy is never deferred');
} finally {teardownArena(world);}
console.log('hazardApproachTargetFlicker: ok');
