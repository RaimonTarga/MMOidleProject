import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { NIGHT4_SURVEY, NIGHT4_AOE, NIGHT4_FOLLOWUP, installNight4Treatment } from '../bench/balance/night4Spec';
assert.equal(NIGHT4_SURVEY.length, 168);
assert.equal(NIGHT4_AOE.length, 96);
assert.equal(NIGHT4_FOLLOWUP.length, 48);
for (const cells of [NIGHT4_SURVEY, NIGHT4_AOE, NIGHT4_FOLLOWUP]) assert.equal(new Set(cells.map(c => c.id)).size, cells.length);
const original = JSON.stringify([...MONSTER_DATABASE]);
for (const cell of NIGHT4_FOLLOWUP) {
  const expected = new Map<string, any>(JSON.parse(original));
  for (const type of cell.targetTypes) {
    const def = expected.get(type), oldHp = def.stats.hp;
    const factor = cell.role === 'desert' ? (cell.treatment.startsWith('hp3') ? 3 : 2)
      : cell.treatment.startsWith('hp1.5') ? 1.5 : cell.treatment.startsWith('hp2.5') ? 2.5 : 2;
    def.stats.hp = Math.round(oldHp * factor);
    if (cell.role === 'tundra') def.enemyShield.shieldPct = def.enemyShield.shieldPct * oldHp / def.stats.hp;
  }
  if (cell.role === 'desert' && cell.treatment.endsWith('dealer80')) expected.get('sandweaver').stats.attack = Math.round(expected.get('sandweaver').stats.attack * 0.8);
  const overlay = installNight4Treatment(cell);
  try { assert.deepEqual([...MONSTER_DATABASE], [...expected]); }
  finally { overlay.restore(); }
  assert.equal(JSON.stringify([...MONSTER_DATABASE]), original);
}
for (let i=0; i<NIGHT4_AOE.length; i+=2) assert.deepEqual(NIGHT4_AOE[i].build, NIGHT4_AOE[i+1].build);
console.log('night4: ok');
