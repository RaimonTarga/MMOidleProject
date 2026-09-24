import assert from 'node:assert/strict';
import { essenceMoteProfile } from '../../client/src/fx/essenceMoteProfile';

for (const invalid of [0, -1, NaN, Infinity]) assert.equal(essenceMoteProfile(invalid).count, 0);
for (let magnitude = 1; magnitude <= 4; magnitude++) {
  const below = essenceMoteProfile(10 ** magnitude - 1);
  const above = essenceMoteProfile(10 ** magnitude);
  assert(above.size > below.size, 'each supported order of magnitude reads larger');
  assert(above.count >= below.count, 'crossing a tier must not reduce density');
}
for (const amount of [1, 9, 10, 72, 99, 100, 999, 1000, 10000, 1e9, Number.MAX_VALUE]) {
  const profile = essenceMoteProfile(amount);
  assert(profile.count >= 1 && profile.count <= 16, 'reward size cannot flood the renderer');
  assert(profile.size <= 29, 'extreme rewards cannot cover the screen');
}
assert(essenceMoteProfile(72).count < 10, 'dozens are bundled into a handful of motes');
console.log('essenceMoteProfile.test: ok');
