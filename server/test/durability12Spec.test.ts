import assert from 'node:assert/strict';
import {DURABILITY12_MOVEMENT,DURABILITY12_SWARM,DURABILITY12_MOVEMENT_SEEDS,DURABILITY12_SEEDS} from '../bench/balance/durability12Spec';
assert.equal(DURABILITY12_MOVEMENT.length,2);
assert.deepEqual(DURABILITY12_MOVEMENT_SEEDS,[173,3911]);
assert.equal(DURABILITY12_SWARM.length,48);
assert.equal(DURABILITY12_SEEDS.length,3);
for(const sweep of DURABILITY12_SWARM.filter(c=>c.technique==='sweep')) {
 const slam=DURABILITY12_SWARM.find(c=>c.nodeId===sweep.nodeId&&c.className===sweep.className&&c.technique==='slam')!;
 assert(slam);
 assert.deepEqual(sweep.build,slam.build,'ability pair retains exactly the same gear and class');
 assert.equal(sweep.stance,slam.stance);
}
assert.equal(new Set(DURABILITY12_SWARM.map(c=>c.className)).size,6);
console.log('durability12Spec: ok');
