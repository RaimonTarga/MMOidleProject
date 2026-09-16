import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY9_ROSTER, DURABILITY9_BEAR, DURABILITY9_PATCH, installDurability9Treatment } from '../bench/balance/durability9Spec';

// Historical definition guards belong to the frozen packet revision; test overlay isolation against current data.
assert.equal(DURABILITY9_ROSTER.length,200);
assert.equal(DURABILITY9_BEAR.length,32);
const original = JSON.stringify([...MONSTER_DATABASE]);
for (const cells of [DURABILITY9_ROSTER,DURABILITY9_BEAR]) {
  assert.equal(new Set(cells.map(c=>c.id)).size,cells.length);
  for(let i=0;i<cells.length;i+=2) assert.deepEqual(cells[i].build,cells[i+1].build);
  for(const cell of cells) {
    const expected = new Map<string,any>(JSON.parse(original));
    if(cell.treatment.startsWith('bear-')) {
      const bear=expected.get('glacier-bear');bear.stats.hp=3750;
      bear.stats.attack=cell.treatment==='bear-soft'?148:185;bear.enemyShield.shieldPct=0.08;
    } else for(const [type,change] of Object.entries(DURABILITY9_PATCH)) Object.assign(expected.get(type).stats,change[cell.treatment as 'previous'|'selected']);
    const overlay=installDurability9Treatment(cell);
    try { assert.deepEqual([...MONSTER_DATABASE],[...expected]); }
    finally { overlay.restore(); }
    assert.equal(JSON.stringify([...MONSTER_DATABASE]),original,'Overlay leaked into next World');
  }
}
console.log('durability9: ok');
