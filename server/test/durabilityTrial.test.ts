import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY_CELLS, installDurabilityTreatment } from '../bench/balance/durabilityTrialSpec';
import { createFarmWorld } from '../bench/balance/worldFactory';
import { setupArena, teardownArena } from '../bench/balance/arena';

const cell = DURABILITY_CELLS.find(c=>c.id==='dur-t3-desert-squire-baseline-hp-high')!;
assert.equal(DURABILITY_CELLS.length,192);
const original = JSON.stringify([...MONSTER_DATABASE]);
const controllerHp = MONSTER_DATABASE.get('desert-basilisk')!.stats.hp;
const dealerHp = MONSTER_DATABASE.get('sandweaver')!.stats.hp;
const overlay = installDurabilityTreatment(cell);
const world = createFarmWorld();
try {
  assert.equal(MONSTER_DATABASE.get('desert-basilisk')!.stats.hp,Math.round(controllerHp*1.5));
  assert.equal(MONSTER_DATABASE.get('sandweaver')!.stats.hp,dealerHp);
  setupArena(world,{nodeId:cell.nodeId,biomeGroup:'desert',contentTier:3,isDungeon:false});
  const monsters=[...world.monsterEntitiesInNode(cell.nodeId)];
  assert(monsters.length>0);
  assert(monsters.some(m=>overlay.changes.some(c=>c.type===m.isMonster.monsterTypeId)),'Treatment must reach actual spawned controllers');
  for(const m of monsters) assert(m.hasHealth.maxHp>0);
} finally {teardownArena(world);overlay.restore();}
assert.equal(JSON.stringify([...MONSTER_DATABASE]),original,'No treatment may leak into another observation');
const control=installDurabilityTreatment({...cell,treatment:'control'});
assert.deepEqual(control.changes,[]);control.restore();
console.log('durabilityTrial: ok');
