import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY16_CELLS, DURABILITY16_SEEDS, installDurability16Treatment } from '../bench/balance/durability16Spec';
assert.equal(DURABILITY16_CELLS.length,24);
assert.equal(new Set(DURABILITY16_CELLS.map(c=>c.id)).size,24);
assert.deepEqual(DURABILITY16_SEEDS,[3911,6151,8089]);
const snapshot=JSON.stringify([...MONSTER_DATABASE]);
for(const cell of DURABILITY16_CELLS) {
  assert.equal(cell.technique,'sweep');
  const expected=new Map<string,any>(JSON.parse(snapshot));
  expected.get('magma-brute').stats.hp=3000;
  if(cell.treatment==='tortoise80'||cell.treatment==='both80') expected.get('magma-brute').stats.attack=116;
  if(cell.treatment==='salamander80'||cell.treatment==='both80') expected.get('ash-slinger').stats.attack=70;
  const overlay=installDurability16Treatment(cell);
  try { assert.deepEqual([...MONSTER_DATABASE],[...expected]); }
  finally { overlay.restore(); }
  assert.equal(JSON.stringify([...MONSTER_DATABASE]),snapshot);
}
console.log('durability16: ok');
