import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY18_CELLS, installDurability18Treatment } from '../bench/balance/durability18Spec';
assert.equal(DURABILITY18_CELLS.length,8);
assert.equal(new Set(DURABILITY18_CELLS.map(c=>c.id)).size,8);
const snapshot=JSON.stringify([...MONSTER_DATABASE]);
for(const cell of DURABILITY18_CELLS) {
  assert.equal(cell.stance,cell.treatment.endsWith('defensive')?'defensive-stance':'offensive-stance');
  const expected=new Map<string,any>(JSON.parse(snapshot));
  expected.get('ancient-wolf').stats.hp=1575;
  expected.get('ancient-wolf').stats.attack=cell.treatment.startsWith('wolf22')?22:27;
  expected.get('ironwood-golem').stats.hp=945;
  expected.get('ironwood-golem').stats.attack=25;
  const overlay=installDurability18Treatment(cell);
  try {assert.deepEqual([...MONSTER_DATABASE],[...expected]);assert.equal(overlay.changes[0].afterAttack,expected.get('ancient-wolf').stats.attack);} finally {overlay.restore();}
  assert.equal(JSON.stringify([...MONSTER_DATABASE]),snapshot);
}
console.log('durability18: ok');
