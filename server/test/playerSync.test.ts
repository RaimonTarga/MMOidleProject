import assert from 'node:assert/strict';
import { createRenderState } from '../../client/src/render/state';
import { resetPlayerNodePosition } from '../../client/src/render/playerNodePosition';
import { RemotePlayerPosition, REMOTE_PLAYER_DELAY_MS } from '../../client/src/render/remotePlayerPosition';
import { snapRenderStateOnTabVisible } from '../../client/src/fx/guard';
import { stepInterpolation } from '../../client/src/render/interpolation';
import type { GameScene } from '../../client/src/scenes/GameScene';

// At 5 Hz, steady walking must have a steady rendered velocity between
// packets, even with arrival jitter, different frame rates, and clock origins.
for (const fps of [30, 60, 144]) {
  for (const epoch of [0, 9_000_000_000_000]) {
    const timeline = new RemotePlayerPosition();
    let packet = 0;
    let previous: number | undefined;
    for (let frame = 0; frame < fps * 3; frame++) {
      const now = frame * 1000 / fps;
      while (packet * 200 + 100 + [0, 30, 10, 40][packet % 4] <= now) {
        timeline.observe('node', epoch + packet * 200,
          { x: packet * 24, y: 0 }, packet * 200 + 100 + [0, 30, 10, 40][packet % 4]);
        packet++;
      }
      const pos = timeline.position(now);
      if (now > 600 && pos) {
        assert(Math.abs(pos.x - (now - 100 - REMOTE_PLAYER_DELAY_MS) * 0.12) < 1e-6);
        if (previous !== undefined) assert(Math.abs(pos.x - previous - 120 / fps) < 1e-6);
        previous = pos.x;
      }
    }
    assert.deepEqual(timeline.position(100000), { x: (packet - 1) * 24, y: 0 }, 'packet silence holds latest authority');
  }
}
const timeline = new RemotePlayerPosition();
timeline.observe('a', 0, { x: 0, y: 0 }, 0);
timeline.observe('a', 200, { x: 24, y: 0 }, 200);
timeline.observe('a', 400, { x: 24, y: 24 }, 400);
assert.deepEqual(timeline.position(550), { x: 24, y: 12 }, 'retain corner samples');
timeline.observe('b', 600, { x: 4700, y: 100 }, 600);
assert.deepEqual(timeline.position(600), { x: 4700, y: 100 }, 'node change snaps immediately');
timeline.observe('b', 800, { x: 1000, y: 800 }, 800);
assert.deepEqual(timeline.position(800), { x: 1000, y: 800 }, 'large displacement resets');
timeline.observe('b', 3000, { x: 1010, y: 800 }, 3000);
assert.deepEqual(timeline.position(3000), { x: 1010, y: 800 }, 'long interruption discards stale path');

const state = createRenderState();
state.ids.add('party');
state.interpolation.set('party', { base: { x: 0, y: 0 }, lungeOffset: { x: 26, y: 0 } });
state.transform.set('party', { pos: { x: 100, y: 150 }, target: { x: 3000, y: 150 }, speed: 120 });
let drawn = { x: 0, y: 0 };
state.sprite.set('party', { setPosition(x: number, y: number) { drawn = { x, y }; }, setDepth() {} } as never);
snapRenderStateOnTabVisible(state, { tweens: { killTweensOf() {} } } as unknown as GameScene);
assert.deepEqual(drawn, { x: 100, y: 150 }, 'tab return restores position, not distant intent');
assert.deepEqual(state.interpolation.get('party')!.lungeOffset, { x: 0, y: 0 });

// A requested state sync rebases a retained same-node sprite without walking
// through the stale interval. Ordinary full node-membership refreshes do not.
const sync = { id: 'party', nodeId: 'same-node', pos: { x: 500, y: 600 }, target: { x: 800, y: 600 } };
state.remotePlayerPositions.set('party', timeline);
resetPlayerNodePosition(state, 'same-node', sync, true);
assert.equal(state.remotePlayerPositions.has('party'), false, 'resync discards buffered motion');
assert.deepEqual(drawn, sync.pos);
assert.deepEqual(state.interpolation.get('party')!.base, sync.pos);
assert.deepEqual(state.transform.get('party')!.target, sync.target);
sync.pos.x = 900;
assert.equal(state.interpolation.get('party')!.base.x, 500, 'render cache does not mutate snapshot data');

// Exercise the real per-frame renderer: a remote with zero movement speed and
// a stale distant intent still settles on authority and stays there.
state.kind.set('party', 'player');
state.transform.get('party')!.speed = 0;
state.transform.get('party')!.pos = { x: 520, y: 620 };
const renderScene = { state } as GameScene;
for (let i = 0; i < 120; i++) stepInterpolation(renderScene, 1 / 60);
assert.deepEqual(drawn, { x: 520, y: 620 });
const renderTimeline = new RemotePlayerPosition();
const receipt = performance.now();
for (const at of [0, 200, 400]) {
  renderTimeline.observe('same-node', at, { x: at * 0.12, y: 0 }, receipt - 400 + at);
}
state.remotePlayerPositions.set('party', renderTimeline);
state.transform.get('party')!.pos = { x: 48, y: 0 };
stepInterpolation(renderScene, 1 / 60);
assert(drawn.x >= 18 && drawn.x < 48, 'renderer uses delayed snapshots, not newest position');
assert.equal(drawn.y, 0);
console.log('playerSync: ok');
