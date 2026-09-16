import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY17_CELLS, DURABILITY17_SEEDS, installDurability17Treatment } from '../bench/balance/durability17Spec';
assert.equal(DURABILITY17_CELLS.length,48);
assert.equal(new Set(DURABILITY17_CELLS.map(c=>c.id)).size,48);
assert.deepEqual(DURABILITY17_SEEDS,[9029,10427,12007]);
const snapshot=JSON.stringify([...MONSTER_DATABASE]);
for(const cell of DURABILITY17_CELLS) {
  const expected=new Map<string,any>(JSON.parse(snapshot));
  for(const type of ['ancient-wolf','ironwood-golem']) {
    const s=expected.get(type).stats;
    s.hp*=cell.treatment==='control'?1:cell.treatment==='adults2'?2:3;
    if(cell.treatment==='adults3-pressure80') s.attack=Math.round(s.attack*0.8);
  }
  const overlay=installDurability17Treatment(cell);
  try {assert.deepEqual([...MONSTER_DATABASE],[...expected]);} finally {overlay.restore();}
  assert.equal(JSON.stringify([...MONSTER_DATABASE]),snapshot);
}
console.log('durability17: ok');
