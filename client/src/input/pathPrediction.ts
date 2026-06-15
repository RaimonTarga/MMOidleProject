import {
  distanceSq,
  findPathForMover,
  PATH_ARRIVAL_THRESHOLD,
  type Vec2,
} from '@mmo-idle/shared';
import type { RenderState } from '../render/state';
import type { GameScene } from '../scenes/GameScene';
import {
  ABYSSAL_THRONE_FEATURE_ID,
  isVoidThroneUnblocked,
} from '../scenes/game/voidThrone';
import {
  getOwnBlockShapes,
  getOwnMovePad,
  resolveOwnMoveAgainstBlocks,
} from './obstacleResolve';

function suppressedFeatureIds(scene: GameScene): Set<string> {
  const suppressed = new Set<string>();
  if (isVoidThroneUnblocked(scene)) {
    suppressed.add(ABYSSAL_THRONE_FEATURE_ID);
  }
  return suppressed;
}

export function clearOwnMovePath(state: RenderState): void {
  state.ownPathWaypoints = [];
  state.ownPathGoal = null;
}

export function planOwnClickPath(
  scene: GameScene,
  from: Vec2,
  goal: Vec2,
): Vec2 {
  const state = scene.state;
  const pad = getOwnMovePad(state);
  const path = findPathForMover(
    state.ownNodeId,
    'player',
    pad,
    from,
    goal,
    suppressedFeatureIds(scene),
  );

  if (!path || path.length === 0) {
    clearOwnMovePath(state);
    return resolveOwnMoveAgainstBlocks(scene, from, goal);
  }

  state.ownPathGoal = { x: goal.x, y: goal.y };
  state.ownPathWaypoints = path.map(wp => ({ x: wp.x, y: wp.y }));
  return state.ownPathWaypoints[0];
}

export function reconcileOwnPathFromServer(
  scene: GameScene,
  from: Vec2,
  goal: Vec2,
): Vec2 {
  return planOwnClickPath(scene, from, goal);
}

/** Pop reached waypoints and return the next steering target. */
export function advanceOwnPathWaypoint(state: RenderState, pos: Vec2): void {
  const thresholdSq = PATH_ARRIVAL_THRESHOLD * PATH_ARRIVAL_THRESHOLD;
  while (state.ownPathWaypoints.length > 0) {
    const wp = state.ownPathWaypoints[0];
    if (distanceSq(pos, wp) > thresholdSq) break;
    state.ownPathWaypoints.shift();
  }
  if (state.ownPathWaypoints.length === 0) {
    state.ownPathGoal = null;
  }
}

export function ownPathSteeringTarget(state: RenderState, fallback: Vec2): Vec2 {
  if (state.ownPathWaypoints.length > 0) {
    return state.ownPathWaypoints[0];
  }
  return fallback;
}
