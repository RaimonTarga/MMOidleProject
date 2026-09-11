import { createRenderState } from '../../client/src/render/state';
import { advanceOwnClickPath, applyOwnMoveAck, beginOwnClick, clearOwnMovePath, planOwnClickPath } from '../../client/src/input/pathPrediction';
import { correctPlayerPosition } from '../../client/src/render/movementCorrection';
import { sendMove } from '../../client/src/net/intents';
import type { GameScene } from '../../client/src/scenes/GameScene';
import type { GameSocket } from '../../client/src/net/socket';
import { blockShapesForMover, moverOverlapsBlockShapes, navigationBodyHalfExtents } from '@mmo-idle/shared';

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const state = createRenderState();
state.ownId = 'player';
state.ownNodeId = 'node-t1-mountain-01';
const base = { x: 2520, y: 1600 };
state.interpolation.set('player', { base, lungeOffset: { x: 0, y: 0 } });
const scene = { state } as GameScene;
const generation = beginOwnClick(state);
planOwnClickPath(scene, base, { x: 1040, y: 440 });
assert(state.ownPathGoal && state.ownPathWaypoints.length > 1, 'client plans the mountain dogleg');
const goal = { ...state.ownPathGoal };
const plannedQueue = state.ownPathWaypoints;
applyOwnMoveAck(scene, generation, 'player', state.ownNodeId, { accepted: true, nodeId: state.ownNodeId, goal });
assert(state.ownPathWaypoints === plannedQueue, 'confirming the same goal retains valid route');
const shapes = blockShapesForMover(state.ownNodeId, 'player');
const pad = navigationBodyHalfExtents('player');
for (let i = 0; i < 10000 && state.ownPathWaypoints.length; i++) {
  const result = advanceOwnClickPath(scene, base, 120 / 60);
  assert(result && !result.blocked, 'client traverses valid path without corner blockage');
  Object.assign(base, result.position);
  assert(!moverOverlapsBlockShapes(base, shapes, pad), 'client remains clear on every frame');
}
assert(Math.hypot(base.x - goal.x, base.y - goal.y) < 0.02, 'client arrives at resolved endpoint');
const held = advanceOwnClickPath(scene, base, 100);
assert(held?.position.x === base.x && held.position.y === base.y, 'completed path waits without backward fallback');

clearOwnMovePath(state);
assert(applyOwnMoveAck(scene, generation, 'player', state.ownNodeId, { accepted: true, nodeId: state.ownNodeId, goal }) === null, 'superseded click callback ignored');
assert(!state.ownClickActive, 'stale callback does not revive click');
const newer = beginOwnClick(state);
assert(applyOwnMoveAck(scene, newer, 'player', 'other-node', { accepted: true, nodeId: 'other-node', goal }) === null, 'node mismatch callback ignored');
applyOwnMoveAck(scene, newer, 'player', state.ownNodeId, { accepted: false, nodeId: state.ownNodeId, goal });
assert(!state.ownClickActive && state.ownPathWaypoints.length === 0, 'rejection clears route');

const wall = [{ kind: 'rect' as const, x: 100, y: 100, halfW: 20, halfH: 100 }];
const corrected = correctPlayerPosition({ x: 60, y: 100 }, { x: 140, y: 100 }, { x: 90, y: 100 }, wall, { x: 0, y: 0 });
assert(corrected.snapped && corrected.position.x === 140, 'cross-wall correction snaps to safe authority instead of easing through wall');
const eased = correctPlayerPosition({ x: 40, y: 100 }, { x: 60, y: 100 }, { x: 45, y: 100 }, wall, { x: 0, y: 0 });
assert(!eased.snapped && eased.position.x === 45, 'clear correction retains easing');

let wire: unknown[] = [];
const socket = { emit: (...args: unknown[]) => { wire = args; } } as unknown as GameSocket;
const callback = () => {};
sendMove(socket, goal, { mode: 'path' }, callback);
assert(wire[0] === 'player:move' && wire[3] === callback, 'move helper sends optional acknowledgement');
sendMove(socket, goal, { mode: 'direct' });
assert(wire.length === 3, 'legacy direct helper omits callback');
console.log('clientMovementState: ok');
