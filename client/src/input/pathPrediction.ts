import {
  distanceSq,
  advancePlayerPath,
  findPathForMover,
  resolveMoveAgainstBlocks,
  type PlayerMoveResult,
  type Vec2,
} from '@mmo-idle/shared';
import type { RenderState } from '../render/state';
import type { GameScene } from '../scenes/GameScene';
import { isCurrentClickOrder } from './clickOrder';
import {
  ABYSSAL_THRONE_FEATURE_ID,
  isVoidThroneUnblocked,
} from '../scenes/game/voidThrone';
import {
  getOwnBlockShapes,
  getOwnMovePad,
} from './obstacleResolve';

const replannedBlockedPaths = new WeakSet<RenderState>();

function suppressedFeatureIds(scene: GameScene): Set<string> {
  const suppressed = new Set<string>();
  if (isVoidThroneUnblocked(scene)) {
    suppressed.add(ABYSSAL_THRONE_FEATURE_ID);
  }
  return suppressed;
}

export function clearOwnMovePath(state: RenderState): void {
  replannedBlockedPaths.delete(state);
  state.ownMoveGeneration += 1;
  state.ownClickActive = false;
  state.ownClickConfirmed = false;
  state.ownPathWaypoints = [];
  state.ownPathGoal = null;
}

/** Start one click order and return its generation for the optional server ack. */
export function beginOwnClick(state: RenderState): number {
  replannedBlockedPaths.delete(state);
  state.ownMoveGeneration += 1;
  state.ownClickActive = true;
  state.ownClickConfirmed = false;
  state.ownPathWaypoints = [];
  state.ownPathGoal = null;
  return state.ownMoveGeneration;
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
    // Keep the order alive until the server replies. There is deliberately no
    // direct-segment fallback here: an unreachable local plan must not make the
    // client walk through a ledge while the authoritative route is rejected.
    state.ownPathWaypoints = [];
    state.ownPathGoal = { x: goal.x, y: goal.y };
    state.ownClickActive = true;
    return { ...from };
  }

  state.ownClickActive = true;
  const resolvedGoal = path[path.length - 1];
  state.ownPathGoal = { x: resolvedGoal.x, y: resolvedGoal.y };
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

/**
 * Check the retained route without running A* again. This is used on
 * authoritative corrections so ordinary 5 Hz deltas do not churn the route.
 */
export function isOwnPathUsable(
  scene: GameScene,
  from: Vec2,
  state: RenderState = scene.state,
): boolean {
  if (!state.ownClickActive || state.ownPathWaypoints.length === 0) return true;
  const shapes = getOwnBlockShapes(scene);
  const pad = getOwnMovePad(state);
  let cursor = from;
  for (const waypoint of state.ownPathWaypoints) {
    const resolved = resolveMoveAgainstBlocks(cursor, waypoint, shapes, pad);
    if (distanceSq(resolved, waypoint) > 0.01 * 0.01) return false;
    cursor = waypoint;
  }
  return true;
}

/** Apply a current click acknowledgement and return its resolved endpoint. */
export function applyOwnMoveAck(
  scene: GameScene,
  generation: number,
  ownId: string,
  nodeId: string,
  result: PlayerMoveResult,
): Vec2 | null {
  const state = scene.state;
  if (
    !isCurrentClickOrder(state, generation, ownId, nodeId) ||
    result.nodeId !== nodeId
  ) {
    return null;
  }

  if (!result.accepted) {
    clearOwnMovePath(state);
    return null;
  }

  const goal = { x: result.goal.x, y: result.goal.y };
  state.ownClickConfirmed = true;
  const previousGoal = state.ownPathGoal;
  state.ownClickActive = true;
  state.ownPathGoal = goal;
  const base = scene.state.interpolation.get(ownId)?.base;
  const goalChanged =
    !previousGoal || distanceSq(previousGoal, goal) > 0.01 * 0.01;
  const needsRoute = base && state.ownPathWaypoints.length === 0 && distanceSq(base, goal) > 0.01 * 0.01;
  if (base && (goalChanged || needsRoute || !isOwnPathUsable(scene, base))) {
    planOwnClickPath(scene, base, goal);
  }
  return goal;
}

/** Predict one click-path frame using the shared swept primitive. */
export function advanceOwnClickPath(
  scene: GameScene,
  from: Vec2,
  distance: number,
): { position: Vec2; blocked: boolean } | null {
  const state = scene.state;
  if (!state.ownClickActive) return null;
  if (state.ownPathWaypoints.length === 0) return { position: { ...from }, blocked: false };
  const result = advancePlayerPath(
    from,
    state.ownPathWaypoints,
    distance,
    getOwnBlockShapes(scene),
    getOwnMovePad(state),
  );
  state.ownPathWaypoints = result.waypoints;
  if (result.blocked && state.ownPathGoal && !replannedBlockedPaths.has(state)) {
    // Reconciliation can displace the base off its planned segment. Replan once
    // on contact, not once per render frame while a route remains unavailable.
    replannedBlockedPaths.add(state);
    planOwnClickPath(scene, result.position, state.ownPathGoal);
  } else if (!result.blocked && distanceSq(from, result.position) > 0.01 * 0.01) {
    replannedBlockedPaths.delete(state);
  }
  return { position: result.position, blocked: result.blocked };
}
