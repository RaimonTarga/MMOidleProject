import type { Vec2 } from '@mmo-idle/shared';
import { sendMove } from '../net/intents';
import { getOwnBase } from '../render/interpolation';
import { cancelAutoPath, setAutoMode } from './autoPath';
import type { GameScene } from '../scenes/GameScene';

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
    if (scene.autoPath.length > 0) cancelAutoPath(scene);
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
  transform.target = dest;
}
