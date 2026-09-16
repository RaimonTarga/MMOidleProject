import assert from 'node:assert/strict';
import { DURABILITY11_CELLS, DURABILITY11_SEEDS, assertDurability11Definitions } from '../bench/balance/durability11Spec';
assertDurability11Definitions();
assert.equal(DURABILITY11_CELLS.length,42);
assert.equal(new Set(DURABILITY11_CELLS.map(c=>c.id)).size,42);
assert.equal(DURABILITY11_CELLS.filter(c=>c.stance==='defensive-stance').length,4);
assert.equal(DURABILITY11_CELLS.filter(c=>c.alternate).length,4);
assert(DURABILITY11_SEEDS.every(s=>![173,947,2027].includes(s)));
for(const c of DURABILITY11_CELLS.filter(c=>c.role==='jungle'&&['apprentice','spirit'].includes(c.className)))
  assert.equal(c.stance,'offensive-stance');
console.log('durability11: ok');
