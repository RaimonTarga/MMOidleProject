import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY10_SWAMP,DURABILITY10_JUNGLE,installDurability10Treatment } from '../bench/balance/durability10Spec';
assert.equal(DURABILITY10_SWAMP.length,36);assert.equal(DURABILITY10_JUNGLE.length,40);
const snapshot=JSON.stringify([...MONSTER_DATABASE]);
// Control preserves current data; historical packets use their original frozen source.
assert.equal(MONSTER_DATABASE.get('silverback')!.stats.hp,2090);
assert.equal(MONSTER_DATABASE.get('silverback')!.rampOnCombat!.maxPct,0.45);
for(const cell of [...DURABILITY10_SWAMP,...DURABILITY10_JUNGLE]){
  const expected=new Map<string,any>(JSON.parse(snapshot)),target=expected.get(cell.targetTypes[0]);
  if(cell.treatment==='hp1.5')target.stats.hp=1740;
  if(cell.treatment==='hp2')target.stats.hp=2320;
  if(cell.treatment==='ramp25')target.rampOnCombat.maxPct=0.25;
  const overlay=installDurability10Treatment(cell);
  try {assert.deepEqual([...MONSTER_DATABASE],[...expected]);}
  finally {overlay.restore();}
  assert.equal(JSON.stringify([...MONSTER_DATABASE]),snapshot);
}
console.log('durability10: ok');
