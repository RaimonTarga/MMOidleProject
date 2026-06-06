import {
  clampSegmentBeforeShapes,
  RESOLVED_NODE_FEATURES,
  type NodeFeatureShape,
  type PlayerView,
  type Vec2,
} from '@mmo-idle/shared';
import { sendMove } from '../net/intents';
import { getOwnBase } from '../render/interpolation';
import { ABYSSAL_THRONE_FEATURE_ID, isVoidThroneUnblocked } from '../scenes/game/voidThrone';
import { cancelAutoPath, setAutoMode } from './autoPath';
import {
  beginPendingStop,
  isManualActive,
  maintainPendingStop,
  setManualActive,
} from './moveOwnership';
import type { GameScene } from '../scenes/GameScene';

/**
 * Stop the own-player prediction target before any feature that blocks players, so
 * the client never glides across an impassable boundary and gets snapped back by the
 * authoritative position. Uses the latest server position as the segment start: if the
 * server has already let the player inside (e.g. a stage lifted the block), the shape is
 * skipped and free movement resumes.
 */
export function clampOwnMoveTarget(scene: GameScene, dest: Vec2): Vec2 {
  const ownId = scene.state.ownId;
  if (!ownId) return dest;
  const features = RESOLVED_NODE_FEATURES[scene.state.ownNodeId];
  if (!features) return dest;

  const throneUnblocked = isVoidThroneUnblocked(scene);
  const shapes: NodeFeatureShape[] = [];
  for (const f of features) {
    if (!f.blocksMovement?.includes('player')) continue;
    if (throneUnblocked && f.id === ABYSSAL_THRONE_FEATURE_ID) continue;
    shapes.push(f.shape);
  }
  if (shapes.length === 0) return dest;

  const view = scene.state.view.get(ownId) as PlayerView | undefined;
  const from = view?.pos ?? getOwnBase(scene.state);
  if (!from) return dest;
  return clampSegmentBeforeShapes(from, dest, shapes);
}

const MOVE_TICK_MS = 100;
const STEP_DISTANCE = 600;

let kbVec = { dx: 0, dy: 0 };
let padVec = { dx: 0, dy: 0 };
let holdStill = false;

export function setHoldStill(still: boolean): void {
  holdStill = still;
}

export function isHoldStill(): boolean {
  return holdStill;
}

/** Stop click-to-move / keyboard motion and tell the server to hold position. */
export function cancelActiveMove(scene: GameScene): void {
  if (!scene.myId) return;
  const ownId = scene.state.ownId;
  if (!ownId) return;
  const transform = scene.state.transform.get(ownId);
  if (!transform) return;

  const origin = getOwnBase(scene.state) ?? transform.pos;
  const stop: Vec2 = {
    x: Math.round(origin.x),
    y: Math.round(origin.y),
  };
  sendMove(scene.socket, stop);
  transform.target = stop;
  // Hold heading ownership until the server confirms the stop (see moveOwnership).
  beginPendingStop(stop, performance.now());
}

export function setKeyboardVector(dx: number, dy: number): void {
  kbVec = { dx, dy };
}

export function setGamepadVector(dx: number, dy: number): void {
  padVec = { dx, dy };
}

export function startMovementTick(scene: GameScene): () => void {
  const id = window.setInterval(() => tickMovement(scene), MOVE_TICK_MS);
  return () => window.clearInterval(id);
}

function tickMovement(scene: GameScene): void {
  if (!scene.myId) return;
  const ownId = scene.state.ownId;
  if (!ownId) return;
  const transform = scene.state.transform.get(ownId);
  if (!transform) return;

  // Release the post-stop heading latch once the authoritative position has
  // caught up to the stop point (or the grace window has elapsed).
  maintainPendingStop(transform.pos, performance.now());

  let dx = holdStill ? 0 : kbVec.dx + padVec.dx;
  let dy = holdStill ? 0 : kbVec.dy + padVec.dy;
  const mag = Math.hypot(dx, dy);
  if (mag > 1) {
    dx /= mag;
    dy /= mag;
  }

  const origin = getOwnBase(scene.state) ?? transform.pos;

  if (mag < 0.0001) {
    if (isManualActive()) {
      const stop: Vec2 = {
        x: Math.round(origin.x),
        y: Math.round(origin.y),
      };
      sendMove(scene.socket, stop);
      transform.target = stop;
      // Keep owning the heading until the server confirms the stop, so the
      // lagging authoritative state can't drive the sprite forward and then
      // yank it back (the "backtrack on stop").
      beginPendingStop(stop, performance.now());
    }
    return;
  }

  if (!isManualActive()) {
    if (scene.autoMode) setAutoMode(scene, false);
    cancelAutoPath();
    scene.flashCameraHold = false;
    scene.flashCameraHoldTargetId = null;
    scene.targetMarker.setVisible(false);
    setManualActive(true);
  }

  const dest: Vec2 = {
    x: Math.round(origin.x + dx * STEP_DISTANCE),
    y: Math.round(origin.y + dy * STEP_DISTANCE),
  };
  sendMove(scene.socket, dest);
  transform.target = clampOwnMoveTarget(scene, dest);
}
