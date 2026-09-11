import type { PlayerView, Vec2 } from '@mmo-idle/shared';
import { movePlayerWithCollisions } from '@mmo-idle/shared';
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
  advanceOwnClickPath,
  clearOwnMovePath,
  applyOwnMoveAck,
  beginOwnClick,
  planOwnClickPath,
} from './pathPrediction';
import {
  getOwnBlockShapes,
  getOwnMovePad,
  resolveOwnMoveAgainstBlocks,
} from './obstacleResolve';
import type { GameScene } from '../scenes/GameScene';
import { nodeToScene } from '../render/sceneCoords';

export interface SendClampedMoveOptions {
  /** Click-to-move: plan an A* path for client prediction. */
  pathfind?: boolean;
}

let activeMovementScene: GameScene | null = null;

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
    const generation = beginOwnClick(scene.state);
    const steering = planOwnClickPath(scene, from, dest);
    const ownId = scene.state.ownId;
    const nodeId = scene.state.ownNodeId;
    sendMove(scene.socket, dest, { mode: 'path' }, (result) => {
      if (scene.state.ownMoveGeneration !== generation || scene.state.ownId !== ownId || scene.state.ownNodeId !== nodeId || result.nodeId !== nodeId) return;
      const resolved = ownId
        ? applyOwnMoveAck(scene, generation, ownId, nodeId, result)
        : null;
      if (resolved) {
        const marker = scene.targetMarker;
        const scenePos = nodeToScene(resolved.x, resolved.y);
        marker.show(scenePos.x, scenePos.y, 'move');
        const transform = ownId ? scene.state.transform.get(ownId) : undefined;
        if (transform && scene.state.ownPathWaypoints.length > 0) {
          transform.target = scene.state.ownPathWaypoints[0];
        } else if (transform) {
          transform.target = resolved;
        }
      } else {
        scene.targetMarker.hide();
        const transform = ownId ? scene.state.transform.get(ownId) : undefined;
        const base = getOwnBase(scene.state);
        if (transform && base) {
          transform.target = base;
          beginPendingStop(base, performance.now());
        }
      }
    });
    return steering;
  }

  clearOwnMovePath(scene.state);
  const clamped = resolveOwnMoveAgainstBlocks(scene, from, dest);
  sendMove(scene.socket, clamped, { mode: 'direct' });
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
  sendMove(scene.socket, stop, { mode: 'direct' });
  transform.target = stop;
  beginPendingStop(stop, performance.now());
}

export function setKeyboardVector(dx: number, dy: number): void {
  if (kbVec.dx === dx && kbVec.dy === dy) return;
  kbVec = { dx, dy };
  activeMovementScene && tickMovement(activeMovementScene);
}

export function setGamepadVector(dx: number, dy: number): void {
  const threshold = 0.035;
  const wasZero = Math.hypot(padVec.dx, padVec.dy) < 0.0001;
  const isZero = Math.hypot(dx, dy) < 0.0001;
  const changed = wasZero !== isZero || Math.hypot(padVec.dx - dx, padVec.dy - dy) >= threshold;
  padVec = { dx, dy };
  if (changed && activeMovementScene) tickMovement(activeMovementScene);
}

export function startMovementTick(scene: GameScene): () => void {
  activeMovementScene = scene;
  const id = window.setInterval(() => tickMovement(scene), MOVE_TICK_MS);
  return () => {
    window.clearInterval(id);
    if (activeMovementScene === scene) activeMovementScene = null;
    clearOwnMovePath(scene.state);
  };
}

function tickMovement(scene: GameScene): void {
  if (!scene.myId || scene.transitioning) return;
  const ownId = scene.state.ownId;
  if (!ownId) return;
  const transform = scene.state.transform.get(ownId);
  if (!transform) return;

  const player = scene.state.view.get(ownId) as PlayerView | undefined;
  if (player?.isDead) return;

  maintainPendingStop(transform.pos, performance.now());

  let dx = holdStill ? 0 : kbVec.dx + padVec.dx;
  let dy = holdStill ? 0 : kbVec.dy + padVec.dy;
  const mag = Math.hypot(dx, dy);
  if (mag >= 0.0001) {
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
      sendMove(scene.socket, stop, { mode: 'direct' });
      transform.target = stop;
      beginPendingStop(stop, performance.now());
    }
    return;
  }

  // Steering under your own power retires the click destination, EVERY tick and
  // not just on the edge into manual movement. A click does not take the manual
  // latch back off the keyboard, so a marker planted while a key is already held
  // would never see the transition below and would hang around for the whole
  // hold. `hide()` is idempotent and early-returns when nothing is shown.
  scene.targetMarker.hide();

  if (!isManualActive()) {
    if (scene.autoMode) setAutoMode(scene, false);
    cancelAutoPath();
    scene.flashCameraHold = false;
    scene.flashCameraHoldTargetId = null;
    clearOwnMovePath(scene.state);
    setManualActive(true);
  }

  const dest: Vec2 = {
    x: Math.round(origin.x + dx * STEP_DISTANCE),
    y: Math.round(origin.y + dy * STEP_DISTANCE),
  };

  clearOwnMovePath(scene.state);
  sendMove(scene.socket, dest, {
    mode: 'direct',
    direction: { x: dx, y: dy },
  });
  // The wire horizon remains 600 px for compatibility. Actual prediction is
  // advanced from the current base every render frame below.
  transform.target = dest;
}

/** Current full-speed manual heading, or null while manual prediction is gated. */
export function manualMoveDirection(scene: GameScene): Vec2 | null {
  if (scene.transitioning || holdStill || !isManualActive()) return null;
  const ownId = scene.state.ownId;
  if (!ownId) return null;
  const player = scene.state.view.get(ownId) as PlayerView | undefined;
  if (
    player?.isDead ||
    player?.isChanneling ||
    player?.activeBuffs?.some((buff) => buff.speedMult === 0)
  ) return null;
  let dx = kbVec.dx + padVec.dx;
  let dy = kbVec.dy + padVec.dy;
  const mag = Math.hypot(dx, dy);
  if (mag < 0.0001) return null;
  dx /= mag;
  dy /= mag;
  return { x: dx, y: dy };
}

/** One frame of collision-safe direct keyboard/gamepad prediction. */
export function predictManualMove(
  scene: GameScene,
  from: Vec2,
  dt: number,
): Vec2 | null {
  const direction = manualMoveDirection(scene);
  if (!direction) return isManualActive() && !scene.transitioning ? from : null;
  const ownId = scene.state.ownId;
  const transform = ownId ? scene.state.transform.get(ownId) : undefined;
  if (!transform || !Number.isFinite(transform.speed) || transform.speed <= 0) {
    return from;
  }
  const to = {
    x: from.x + direction.x * transform.speed * dt,
    y: from.y + direction.y * transform.speed * dt,
  };
  return movePlayerWithCollisions(
    from,
    to,
    getOwnBlockShapes(scene),
    getOwnMovePad(scene.state),
  );
}

/** One frame of retained click-path prediction. */
export function predictClickMove(
  scene: GameScene,
  from: Vec2,
  dt: number,
): Vec2 | null {
  const ownId = scene.state.ownId;
  const transform = ownId ? scene.state.transform.get(ownId) : undefined;
  if (!transform || !Number.isFinite(transform.speed) || transform.speed <= 0) {
    return from;
  }
  return advanceOwnClickPath(scene, from, transform.speed * dt)?.position ?? null;
}
