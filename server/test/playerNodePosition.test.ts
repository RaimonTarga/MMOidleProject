import assert from 'node:assert/strict';
import { createRenderState } from '../../client/src/render/state';
import { resetPlayerNodePosition } from '../../client/src/render/playerNodePosition';

// Both IDs survive a full party destination snapshot. Test either processing
// order, all four boundary directions, and a stationary destination target.
for (const order of [['own', 'party'], ['party', 'own']]) {
  for (const [exit, entry] of [
    [{ x: 4790, y: 2400 }, { x: 10, y: 2400 }],
    [{ x: 10, y: 2400 }, { x: 4790, y: 2400 }],
    [{ x: 2400, y: 4790 }, { x: 2400, y: 10 }],
    [{ x: 2400, y: 10 }, { x: 2400, y: 4790 }],
  ]) {
    const state = createRenderState();
    state.ownId = 'own';
    const drawn = new Map<string, { x: number; y: number }>();
    const oldOffsets = new Map<string, { x: number; y: number }>();
    for (const id of order) {
      const offset = { x: 12, y: -3 };
      oldOffsets.set(id, offset);
      state.interpolation.set(id, { base: { ...exit }, lungeOffset: offset });
      state.transform.set(id, { pos: { ...exit }, target: { ...exit }, speed: 120 });
      state.sprite.set(id, { setPosition(x: number, y: number) { drawn.set(id, { x, y }); } } as never);
    }
    for (const id of order) {
      const player = { id, nodeId: 'destination', pos: { ...entry }, target: { ...entry } };
      resetPlayerNodePosition(state, 'origin', player);
      assert.deepEqual(state.interpolation.get(id)?.base, entry);
      assert.deepEqual(state.transform.get(id)?.pos, entry);
      assert.deepEqual(state.transform.get(id)?.target, entry);
      assert.deepEqual(drawn.get(id), entry);
      oldOffsets.get(id)!.x = 100;
      assert.deepEqual(state.interpolation.get(id)?.lungeOffset, { x: 0, y: 0 });
      // Normal deltas/resyncs in the same node must not erase interpolation.
      state.interpolation.get(id)!.base.x += 5;
      const expected = { ...state.interpolation.get(id)!.base };
      resetPlayerNodePosition(state, 'destination', player);
      assert.deepEqual(state.interpolation.get(id)?.base, expected);
    }
  }
}
// Newly seen players use the ordinary sprite creation path.
resetPlayerNodePosition(createRenderState(), undefined, {
  id: 'new', nodeId: 'destination', pos: { x: 10, y: 20 }, target: { x: 30, y: 40 },
});
console.log('playerNodePosition: ok');
