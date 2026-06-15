import type { Vec2 } from '@mmo-idle/shared';
import { slideMoveAgainstBlocks } from '@mmo-idle/shared';
import { sendMove } from '../net/intents';
import { getOwnBase } from '../render/interpolation';
import { cancelAutoPath, setAutoMode } from './autoPath';
import {
  beginPendingStop,
  isManualActive,
  maintainPendingStop,
  setManualActive,
} from './moveOwnership';
import {
  clearOwnMovePath,
  planOwnClickPath,
} from './pathPrediction';
import {
  getOwnBlockShapes,
  getOwnMovePad,
  resolveOwnMoveAgainstBlocks,
} from './obstacleResolve';
import type { GameScene } from '../scenes/GameScene';

export interface SendClampedMoveOptions {
  /** Click-to-move: plan an A* path for client prediction. */
  pathfind?: boolean;
}

/**
 * Clamp an own-player move target so the body never overlaps block shapes. Uses
 * the predicted base as the segment start so client prediction cannot outrun the
 * obstacle check while the authoritative position lags behind.
 */
export function clampOwnMoveTarget(scene: GameScene, dest: Vec2): Vec2 {
  const ownId = scene.state.ownId;
  if (!ownId) return dest;

  const from = getOwnBase(scene.state);
  if (!from) return dest;
  return resolveOwnMoveAgainstBlocks(scene, from, dest);
}

/** Clamp using an explicit segment start (e.g. authoritative server position). */
export function clampOwnMoveFrom(scene: GameScene, from: Vec2, dest: Vec2): Vec2 {
  return resolveOwnMoveAgainstBlocks(scene, from, dest);
}

/**
 * Send a player move intent only after box-vs-block clamping. Returns the
 * clamped destination so prediction and the wire intent stay aligned.
 */
export function sendClampedMove(
  scene: GameScene,
  dest: Vec2,
  opts?: SendClampedMoveOptions,
): Vec2 {
  const ownId = scene.state.ownId;
  if (!ownId) return dest;

  const from = getOwnBase(scene.state) ?? scene.state.transform.get(ownId)?.pos;
  if (!from) return dest;

  if (opts?.pathfind) {
    const steering = planOwnClickPath(scene, from, dest);
    sendMove(scene.socket, dest);
    return steering;
  }

  clearOwnMovePath(scene.state);
  const clamped = resolveOwnMoveAgainstBlocks(scene, from, dest);
  sendMove(scene.socket, clamped);
  return clamped;
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

/** True while keyboard or gamepad is actively providing a movement vector. */
export function hasKeyboardMoveIntent(): boolean {
  if (holdStill) return false;
  const dx = kbVec.dx + padVec.dx;
  const dy = kbVec.dy + padVec.dy;
  return Math.hypot(dx, dy) >= 0.0001;
}

/** Stop click-to-move / keyboard motion and tell the server to hold position. */
export function cancelActiveMove(scene: GameScene): void {
  if (!scene.myId) return;
  const ownId = scene.state.ownId;
  if (!ownId) return;
  const transform = scene.state.transform.get(ownId);
  if (!transform) return;

  clearOwnMovePath(scene.state);

  const origin = getOwnBase(scene.state) ?? transform.pos;
  const stop: Vec2 = {
    x: Math.round(origin.x),
    y: Math.round(origin.y),
  };
  sendMove(scene.socket, stop);
  transform.target = stop;
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
  if (!scene.myId || scene.transitioning) return;
  const ownId = scene.state.ownId;
  if (!ownId) return;
  const transform = scene.state.transform.get(ownId);
  if (!transform) return;

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
    clearOwnMovePath(scene.state);
    setManualActive(true);
  }

  const dest: Vec2 = {
    x: Math.round(origin.x + dx * STEP_DISTANCE),
    y: Math.round(origin.y + dy * STEP_DISTANCE),
  };

  clearOwnMovePath(scene.state);
  const shapes = getOwnBlockShapes(scene);
  const pad = getOwnMovePad(scene.state);
  const predicted = shapes.length > 0
    ? slideMoveAgainstBlocks(origin, dest, shapes, pad)
    : dest;
  sendMove(scene.socket, dest);
  transform.target = predicted;
}
