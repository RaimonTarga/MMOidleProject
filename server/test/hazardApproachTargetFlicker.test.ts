import assert from 'node:assert/strict';
import {setFlag, hazardAvoidanceShapesForMover, moverOverlapsBlockShapes} from '@mmo-idle/shared';
import {createFarmWorld} from '../bench/balance/worldFactory';
import {setupArena,teardownArena} from '../bench/balance/arena';
import {prepareSurveyBot} from '../bench/balance/ttkSurveySpec';
import {DURABILITY12_SWARM} from '../bench/balance/durability12Spec';
import {steerTowardTarget} from '../src/systems/combat/ai/autoTarget';
import {approachDeferred} from '../src/systems/combat/ai/blockedApproach';
import {selectAutoCombatAction} from '../src/systems/combat/ai/targetPriority';

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
{
  // Source of the flicker: the committed target's safe-path check failed for a
  // tick at a rim position. Since Avoid Hazards stopped acquiring un-aggroed
  // enemies sheltered in a hazard, every failing position on this rim sits
  // inside the shelter envelope, so the committed target is dropped at once
  // (and stays sheltered) instead of riding PATH_LOSS_GRACE_MS. The grace
  // window still covers non-hazard path failures; a probe of this node found
  // no rim position outside the envelope that fails the check.
  const world=createFarmWorld();
  const cell=DURABILITY12_SWARM.find(c=>c.tier===3&&c.nodeId.endsWith('03')&&c.className==='spirit')!;
  setupArena(world,{nodeId:cell.nodeId,biomeGroup:'volcanic',contentTier:3,isDungeon:false});
  try {
    for(const m of [...world.monsterEntitiesInNode(cell.nodeId)]) world.removeMonsterEntity(m.entityId);
    const {bot}=prepareSurveyBot(world,cell,{x:426.17,y:1845.83});
    const hazards=hazardAvoidanceShapesForMover(cell.nodeId,'player');
    const safePos={x:426,y:1600};
    assert(!moverOverlapsBlockShapes(safePos,hazards,{x:40,y:40}),'committed target starts clear of hazards');
    const target=world.createMonster(cell.nodeId,'ash-slinger',safePos)!;
    setFlag(bot.tracksCombat,'rune.avoidNodeHazards',true);
    const pick=(now:number)=>{const a=selectAutoCombatAction(world,bot,bot.usesAutocombat,now);return a.kind==='attack'?a.target:null;};
    assert.equal(pick(1000),target,'reachable target is selected');
    // Deep lava: no safe contact or pull. Move its home too so only the path check changes.
    target.hasPosition.current={x:885.68,y:2140.11};
    target.controlsMonster.spawn={...target.hasPosition.current};
    assert.notEqual(pick(1100),target,'Avoid Hazards drops an un-aggroed committed target that moves into lava');
    assert.notEqual(pick(2200),target,'and does not flip back to it while it stays there');
  } finally {teardownArena(world);}
}
console.log('hazardApproachTargetFlicker: ok');
