import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY7_CELLS, DURABILITY7_SEEDS, installDurability7Treatment } from '../bench/balance/durability7Spec';

assert.equal(DURABILITY7_CELLS.length, 24);
assert.equal(new Set(DURABILITY7_CELLS.map(c => c.id)).size, 24);
assert.equal(DURABILITY7_SEEDS.length, 5);
const original = JSON.stringify([...MONSTER_DATABASE]);
for (let i = 0; i < DURABILITY7_CELLS.length; i += 3) {
  assert.deepEqual(DURABILITY7_CELLS[i].build, DURABILITY7_CELLS[i + 1].build);
  assert.deepEqual(DURABILITY7_CELLS[i].build, DURABILITY7_CELLS[i + 2].build);
}
for (const cell of DURABILITY7_CELLS) {
  const expected = new Map<string, any>(JSON.parse(original));
  expected.get('stone-eagle').stats.attack = cell.eagleAttack;
  expected.get('granite-titan').stats.attack = cell.titanAttack;
  const overlay = installDurability7Treatment(cell);
  try { assert.deepEqual([...MONSTER_DATABASE], [...expected], 'Only declared attack may change'); }
  finally { overlay.restore(); }
  assert.equal(JSON.stringify([...MONSTER_DATABASE]), original, 'Restore before next World');
}
console.log('durability7: ok');
