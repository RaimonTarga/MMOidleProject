import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY15_CELLS, DURABILITY15_SEEDS, installDurability15Treatment } from '../bench/balance/durability15Spec';

assert.equal(DURABILITY15_CELLS.length, 48);
assert.equal(new Set(DURABILITY15_CELLS.map(c => c.id)).size, 48);
assert.deepEqual(DURABILITY15_SEEDS, [3911,6151,8089]);
const snapshot = JSON.stringify([...MONSTER_DATABASE]);
for (const cell of DURABILITY15_CELLS) {
  assert.equal(cell.technique, 'sweep');
  const expected = new Map<string, any>(JSON.parse(snapshot));
  if (cell.treatment.startsWith('anchor150')) expected.get('magma-brute').stats.hp = 3000;
  if (cell.treatment.endsWith('pressure80')) {
    expected.get('magma-brute').stats.attack = 90;
    expected.get('ash-slinger').stats.attack = 50;
  }
  const overlay = installDurability15Treatment(cell);
  try { assert.deepEqual([...MONSTER_DATABASE], [...expected], 'only the declared stats may change'); }
  finally { overlay.restore(); }
  assert.equal(JSON.stringify([...MONSTER_DATABASE]), snapshot, 'all definitions restore between observations');
}
console.log('durability15: ok');
