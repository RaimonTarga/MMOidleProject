import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY2_CELLS, installDurability2Treatment } from '../bench/balance/durability2Spec';

assert.equal(DURABILITY2_CELLS.length,160);
const original=JSON.stringify([...MONSTER_DATABASE]);
const originals=new Map<string,unknown>(JSON.parse(original));
for(const c of DURABILITY2_CELLS) {
  const before=structuredClone(MONSTER_DATABASE.get(c.eliteType)!);
  const overlay=installDurability2Treatment(c);
  try {
    const after=MONSTER_DATABASE.get(c.eliteType)!;
    assert.equal(after.stats.hp,Math.round(before.stats.hp*c.hpFactor));
    assert.equal(after.stats.attack,Math.round(before.stats.attack*c.attackFactor));
    const restoredShape=structuredClone(after);
    restoredShape.stats.hp=before.stats.hp;restoredShape.stats.attack=before.stats.attack;
    assert.deepEqual(restoredShape,before,'Defenses and mechanics must stay fixed');
    for(const [id,def] of MONSTER_DATABASE) if(id!==c.eliteType) {
      assert.deepEqual(def,originals.get(id));
    }
  } finally {overlay.restore();}
  assert.equal(JSON.stringify([...MONSTER_DATABASE]),original);
}
console.log('durability2: ok');
