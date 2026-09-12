import { strict as assert } from 'node:assert';
import { cameraFollowAlpha, edgeCameraPosition } from '../../client/src/render/cameraMotion';

// Equal elapsed time must produce equal camera settling, including irregular
// frame pacing. The previous per-frame lerp failed this across refresh rates.
for (const auto of [false, true]) {
  const settle = (frames: number[]) => frames.reduce(
    (position, dt) => position + (1000 - position) * cameraFollowAlpha(dt, auto), 0);
  const reference = settle(Array(60).fill(1 / 60));
  for (const fps of [30, 60, 144]) {
    assert(Math.abs(settle(Array(fps).fill(1 / fps)) - reference) < 1e-8);
  }
  assert(Math.abs(settle(Array(10).fill([0.01, 0.04, 0.05]).flat()) - reference) < 1e-8);
  assert.equal(cameraFollowAlpha(0, auto), 0);
  assert(cameraFollowAlpha(0.1, auto) < 1, 'large lag never selects a hard snap');
}

const size = 4800;
let previous = edgeCameraPosition(0, size);
for (let x = 0.25; x <= size; x += 0.25) {
  const position = edgeCameraPosition(x, size);
  assert(position >= previous, 'camera does not reverse while walking inward');
  assert(position - previous < 0.5, 'edge release has no target discontinuity');
  assert(Math.abs(position + edgeCameraPosition(size - x, size) - size) < 1e-8,
    'opposite crossings have symmetric framing');
  previous = position;
}
assert.equal(edgeCameraPosition(0, size), 0);
assert.equal(edgeCameraPosition(size, size), size);
assert.equal(edgeCameraPosition(2400, size), 2400);
// Rebase preserves the boundary frame on either side of an ordinary crossing.
assert.equal(edgeCameraPosition(size, size) - size, edgeCameraPosition(0, size));
console.log('cameraMotion: ok');
