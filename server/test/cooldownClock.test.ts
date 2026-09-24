import assert from 'node:assert/strict';
import { ServerClock, attackCooldownFraction } from '../../client/src/render/serverClock';

// Browser wall time may be hours ahead or behind Railway. Only the snapshot's
// server timestamp and elapsed monotonic time determine the bar.
const clock = new ServerClock();
assert.equal(attackCooldownFraction(clock.now(0), 0, 1000), 0);
for (const serverTime of [1_000_000, 9_000_000_000_000]) {
  clock.observe(serverTime, 100);
  assert.equal(attackCooldownFraction(clock.now(100), serverTime - 200, 1000), 0.2);
  assert.equal(attackCooldownFraction(clock.now(400), serverTime - 200, 1000), 0.5);
  assert.equal(attackCooldownFraction(clock.now(2100), serverTime - 200, 1000), 1);
  assert.equal(attackCooldownFraction(clock.now(100), serverTime + 100, 1000), 0);
}
// A fresh sync after suspension/reconnection replaces the old clock anchor.
clock.observe(5000, 10000);
assert.equal(clock.now(10100), 5100);
clock.observe(undefined, 10100);
assert.equal(clock.now(10200), 5200);
assert.equal(attackCooldownFraction(5000, 5000, 0), 0);
assert.equal(attackCooldownFraction(5001, 5000, 0), 1);
console.log('cooldownClock: ok');
