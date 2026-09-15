import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { SURVEY_CELLS } from '../bench/balance/ttkSurveySpec';
import { DURABILITY5_CELLS, DURABILITY5_SEEDS, assertDurability5Definitions } from '../bench/balance/durability5Spec';

assert.equal(DURABILITY5_CELLS.length, 32);
assert.equal(new Set(DURABILITY5_CELLS.map(c => c.id)).size, 32);
assert.equal(DURABILITY5_SEEDS.length, 5);
for (const cell of DURABILITY5_CELLS) {
  const baseline = SURVEY_CELLS.find(c => c.id === cell.id.replace(/^dur5-/, 'ttk-'))!;
  assert.deepEqual(cell.build, baseline.build, 'Confirmation must retain historical equipment and skill baselines');
  assert.equal('hpFactor' in cell, false, 'Confirmation must not apply another HP treatment');
}
// Historical packet preflight is intentionally pinned to Durability5 values.
// Test that contract against its fixture, not against later live balance patches.
const savedHp = new Map(['cave-troll', 'cavern-troll', 'granite-titan', 'mountain-colossus']
  .map(id => [id, MONSTER_DATABASE.get(id)!.stats.hp]));
try {
for (const [id, hp] of [['cave-troll', 1320], ['cavern-troll', 3780], ['granite-titan', 1380], ['mountain-colossus', 4250]] as const) {
  MONSTER_DATABASE.get(id)!.stats.hp = hp;
}
const original = JSON.stringify([...MONSTER_DATABASE]);
assertDurability5Definitions();
assert.equal(JSON.stringify([...MONSTER_DATABASE]), original, 'Preflight must not mutate definitions');
const troll = MONSTER_DATABASE.get('cave-troll')!;
const hp = troll.stats.hp;
try {
  troll.stats.hp *= 2.4;
  assert.throws(assertDurability5Definitions, /Selected patch drift/, 'Reject double-applied durability');
} finally { troll.stats.hp = hp; }
assertDurability5Definitions();
console.log('durability5: ok');
} finally { for (const [id, hp] of savedHp) MONSTER_DATABASE.get(id)!.stats.hp = hp; }
