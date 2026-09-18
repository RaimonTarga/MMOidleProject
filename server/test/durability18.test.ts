import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY18_CELLS, installDurability18Treatment } from '../bench/balance/durability18Spec';
assert.equal(DURABILITY18_CELLS.length,8);
assert.equal(new Set(DURABILITY18_CELLS.map(c=>c.id)).size,8);
const snapshot=JSON.stringify([...MONSTER_DATABASE]);
for(const cell of DURABILITY18_CELLS) {
  assert.equal(cell.stance,cell.treatment.endsWith('defensive')?'defensive-stance':'offensive-stance');
  // REBASED 2026-09-18: ancient-wolf 1575/22 and ironwood-golem 945/25 are authored
  // source now. The Durability17 overlay underneath is retired, and the `wolf22`
  // arm writes the value already live, so BOTH arms leave the database untouched.
  // The stance contrast this block was really about is unaffected.
  const expected=new Map<string,any>(JSON.parse(snapshot));
  const overlay=installDurability18Treatment(cell);
  try {assert.deepEqual([...MONSTER_DATABASE],[...expected]);assert.equal(overlay.changes[0].afterAttack,22);} finally {overlay.restore();}
  assert.equal(JSON.stringify([...MONSTER_DATABASE]),snapshot);
}
console.log('durability18: ok');
