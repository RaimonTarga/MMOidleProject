import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY6_CELLS, installDurability6Treatment } from '../bench/balance/durability6Spec';

assert.equal(DURABILITY6_CELLS.length, 64);
assert.equal(new Set(DURABILITY6_CELLS.map(c => c.id)).size, 64);
const baseline = JSON.stringify([...MONSTER_DATABASE]);
for (let i = 0; i < DURABILITY6_CELLS.length; i += 2) {
  assert.deepEqual(DURABILITY6_CELLS[i].build, DURABILITY6_CELLS[i + 1].build,
    'HP comparison must retain exactly the same build');
}
for (const cell of DURABILITY6_CELLS) {
  const expected = new Map<string, any>(JSON.parse(baseline));
  expected.get(cell.eliteType).stats.hp = cell.hp;
  const overlay = installDurability6Treatment(cell);
  try { assert.deepEqual([...MONSTER_DATABASE], [...expected], 'Only named HP may change'); }
  finally { overlay.restore(); }
  assert.equal(JSON.stringify([...MONSTER_DATABASE]), baseline, 'Restore between cells');
}
console.log('durability6: ok');
