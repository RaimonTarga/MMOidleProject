import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY17_CELLS, DURABILITY17_SEEDS, installDurability17Treatment } from '../bench/balance/durability17Spec';
assert.equal(DURABILITY17_CELLS.length,48);
assert.equal(new Set(DURABILITY17_CELLS.map(c=>c.id)).size,48);
assert.deepEqual(DURABILITY17_SEEDS,[9029,10427,12007]);
const snapshot=JSON.stringify([...MONSTER_DATABASE]);
for(const cell of DURABILITY17_CELLS) {
  // REBASED 2026-09-18: the adults2/adults3 multipliers and the 0.8 pressure cut
  // are authored source now (ancient-wolf 1575/22, ironwood-golem 945/25), so the
  // overlay is RETIRED to a no-op -- re-applying it would multiply the adopted
  // values. What this test now guards is that it stays inert in every arm.
  const expected=new Map<string,any>(JSON.parse(snapshot));
  const overlay=installDurability17Treatment(cell);
  try {assert.deepEqual([...MONSTER_DATABASE],[...expected]);} finally {overlay.restore();}
  assert.equal(JSON.stringify([...MONSTER_DATABASE]),snapshot);
}
console.log('durability17: ok');
