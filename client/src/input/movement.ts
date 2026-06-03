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
let wasMoving = false;
let holdStill = false;

export function setHoldStill(still: boolean): void {
  holdStill = still;
}

export function isHoldStill(): boolean {
  return holdStill;
}

/**
 * True while keyboard/gamepad input is actively driving the own player. During
 * manual movement the client owns its own motion target (re-anchored every
 * {@link MOVE_TICK_MS}); the authoritative `node:delta` carries a target that is
 * ~1 RTT stale, so letting it overwrite `transform.target` makes the predicted
 * sprite briefly chase the old heading on every direction change (the "subtle
 * rubberband"). `upsertPlayer` uses this to skip that overwrite for the own
 * player while manual movement owns the heading. Click-to-move and server-driven
 * movement (auto-combat, traverse, party follow, knockback) leave this false so
 * the server target is applied normally.
 */
export function isManualMovementActive(): boolean {
  return wasMoving;
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
  wasMoving = false;
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

  let dx = holdStill ? 0 : kbVec.dx + padVec.dx;
  let dy = holdStill ? 0 : kbVec.dy + padVec.dy;
  const mag = Math.hypot(dx, dy);
  if (mag > 1) {
    dx /= mag;
    dy /= mag;
  }

  const origin = getOwnBase(scene.state) ?? transform.pos;

  if (mag < 0.0001) {
    if (wasMoving) {
      const stop: Vec2 = {
        x: Math.round(origin.x),
        y: Math.round(origin.y),
      };
      sendMove(scene.socket, stop);
      transform.target = stop;
      wasMoving = false;
    }
    return;
  }

  if (!wasMoving) {
    if (scene.autoMode) setAutoMode(scene, false);
    cancelAutoPath();
    scene.flashCameraHold = false;
    scene.flashCameraHoldTargetId = null;
    scene.targetMarker.setVisible(false);
    wasMoving = true;
  }

  const dest: Vec2 = {
    x: Math.round(origin.x + dx * STEP_DISTANCE),
    y: Math.round(origin.y + dy * STEP_DISTANCE),
  };
  sendMove(scene.socket, dest);
  transform.target = clampOwnMoveTarget(scene, dest);
}
