import { strict as assert } from 'node:assert';
import { GAME_CONFIG, nodeExitsForNodeId } from '@mmo-idle/shared';
import { neighborDestination, destinationScenePoint } from '../../client/src/input/neighborDestination';
const w = GAME_CONFIG.NODE_WIDTH, h = GAME_CONFIG.NODE_HEIGHT;
const exits = nodeExitsForNodeId('node-clearing');
for (const [direction, point] of [
  ['west', { x: -100, y: 1200 }], ['east', { x: w + 100, y: 1200 }],
  ['north', { x: 1200, y: -100 }], ['south', { x: 1200, y: h + 100 }],
] as const) {
  const destination = neighborDestination('node-clearing', point)!;
  assert.equal(destination.nodeId, exits[direction]);
  assert.deepEqual(destinationScenePoint('node-clearing', destination), point, 'marker starts at clicked preview point');
  assert.deepEqual(destinationScenePoint(destination.nodeId, destination), destination.pos, 'marker rebases to destination coordinates');
}
assert.equal(neighborDestination('node-clearing', { x: -1, y: -1 }), null);
assert.equal(neighborDestination('node-clearing', { x: 10, y: 10 }), null);
assert.equal(neighborDestination('node-clearing', { x: w * 3, y: 10 }), null);
console.log('neighborDestination: ok');
