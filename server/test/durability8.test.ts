import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY8_CELLS, installDurability8Treatment } from '../bench/balance/durability8Spec';

assert.equal(DURABILITY8_CELLS.length, 48);
assert.equal(new Set(DURABILITY8_CELLS.map(c => c.id)).size, 48);
const original = JSON.stringify([...MONSTER_DATABASE]);
for (const cell of DURABILITY8_CELLS) {
  const expected = new Map<string, any>(JSON.parse(original));
  for (const type of cell.targetTypes) {
    const def = expected.get(type);
    const factor = cell.treatment === 'control' ? 1 : cell.role === 'desert'
      ? (cell.treatment === 'controller-hp2' ? 2 : 3) : 1.5;
    const oldHp = def.stats.hp;
    def.stats.hp = Math.round(oldHp * factor);
    if (cell.treatment.endsWith('fixed-shell')) def.enemyShield.shieldPct *= oldHp / def.stats.hp;
  }
  const overlay = installDurability8Treatment(cell);
  try { assert.deepEqual([...MONSTER_DATABASE], [...expected], 'No dealer, companion, attack or other mechanic changes'); }
  finally { overlay.restore(); }
  assert.equal(JSON.stringify([...MONSTER_DATABASE]), original, 'Restore HP and nested shell between Worlds');
}
console.log('durability8: ok');
