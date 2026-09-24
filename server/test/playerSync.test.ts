import assert from 'node:assert/strict';
import { createRenderState } from '../../client/src/render/state';
import { resetPlayerNodePosition } from '../../client/src/render/playerNodePosition';
import { stepRemotePlayerPosition } from '../../client/src/render/remotePlayerPosition';
import { snapRenderStateOnTabVisible } from '../../client/src/fx/guard';
import { stepInterpolation } from '../../client/src/render/interpolation';
import type { GameScene } from '../../client/src/scenes/GameScene';

// A stopped/rooted remote player must converge even if its speed is now zero.
// The old speed-limited target chase could retain this error indefinitely.
let position = { x: 0, y: 0 };
for (let i = 0; i < 60; i++) position = stepRemotePlayerPosition(position, { x: 60, y: 0 }, 1 / 60);
assert.deepEqual(position, { x: 60, y: 0 });

// Packet silence cannot keep driving the sprite toward an old, distant goal.
for (let i = 0; i < 600; i++) position = stepRemotePlayerPosition(position, { x: 60, y: 0 }, 1 / 60);
assert.deepEqual(position, { x: 60, y: 0 });

// 5 Hz observations turn a corner and stop. No frame runs beyond authority.
position = { x: 0, y: 0 };
for (const observed of [{ x: 24, y: 0 }, { x: 48, y: 0 }, { x: 48, y: 24 }, { x: 48, y: 48 }]) {
  for (let frame = 0; frame < 12; frame++) {
    const next = stepRemotePlayerPosition(position, observed, 1 / 60);
    assert(next.x >= position.x && next.x <= observed.x);
    assert(next.y >= position.y && next.y <= observed.y);
    position = next;
  }
}
const after = (fps: number) => {
  let p = { x: 0, y: 0 };
  for (let i = 0; i < fps / 10; i++) p = stepRemotePlayerPosition(p, { x: 100, y: 0 }, 1 / fps);
  return p.x;
};
assert(Math.abs(after(30) - after(120)) < 1e-9);
assert.deepEqual(stepRemotePlayerPosition({ x: 0, y: 0 }, { x: 1000, y: 800 }, 1 / 60), { x: 1000, y: 800 });

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
resetPlayerNodePosition(state, 'same-node', sync, true);
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
console.log('playerSync: ok');
