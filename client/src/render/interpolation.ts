import type { PlayerView, Vec2 } from '@mmo-idle/shared';
import { slideMoveAgainstBlocks, resolveMoveAgainstBlocks } from '@mmo-idle/shared';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from './depth';
import { nodeToSceneX, nodeToSceneY, sceneDepthY } from './sceneCoords';
import { getPendingStop, isStopPending } from '../input/moveOwnership';
import {
  reconcileOwnPathFromServer,
} from '../input/pathPrediction';
import { getOwnBlockShapes, getOwnMovePad } from '../input/obstacleResolve';
import { predictManualMove, predictClickMove } from '../input/movement';
import { correctPlayerPosition } from './movementCorrection';
import { predictAutoPath } from './autoPathPrediction';

function spriteDrawY(baseY: number, visualOffsetY?: number): number {
  return baseY + (visualOffsetY ?? 0);
}

// Fix #2: smooth own-player reconciliation. Below the hard-snap threshold
// (handled in `upsertPlayer`), the predicted base is eased toward the
// authoritative server position each frame instead of being left to drift until
// it snaps. The dead-zone preserves the intended small prediction lead so we
// don't fight responsive movement; only larger divergences (a turn, a dropped
// packet, a speed mismatch) get pulled back, and smoothly rather than as a jump.
const RECONCILE_DEADZONE_SQ = 80 * 80;
// Exponential approach rate (per second) — frame-rate independent via dt.
const RECONCILE_RATE = 6;

export function stepInterpolation(scene: GameScene, dt: number): void {
  const state = scene.state;
  const ownBlockShapes = state.ownId ? getOwnBlockShapes(scene) : [];
  const ownMovePad = state.ownId ? getOwnMovePad(state) : null;

  for (const id of state.ids) {
    const transform = state.transform.get(id);
    const interp = state.interpolation.get(id);
    const sprite = state.sprite.get(id);
    const meta = state.spriteMeta.get(id);
    if (!transform || !interp || !sprite) continue;

    const own = id === state.ownId;
    const player = own ? state.view.get(id) as PlayerView | undefined : undefined;
    const controlled = player?.isDead || player?.isChanneling || player?.activeBuffs.some(buff => buff.speedMult === 0);
    const preview = own && !isStopPending() ? state.entity.get(id)?.isMoving?.pathPreview : undefined;
    const predicted = own
      ? controlled ? { ...interp.base } : predictManualMove(scene, interp.base, dt) ?? predictClickMove(scene, interp.base, dt)
        ?? (preview ? predictAutoPath(interp.base, preview, transform.speed * dt,
          ownBlockShapes, ownMovePad ?? { x: 0, y: 0 }) : null)
      : null;
    const dx = transform.target.x - interp.base.x;
    const dy = transform.target.y - interp.base.y;
    const distSq = dx * dx + dy * dy;
    if (predicted) {
      interp.base.x = predicted.x;
      interp.base.y = predicted.y;
      if (state.ownClickActive) transform.target = state.ownPathWaypoints[0] ?? state.ownPathGoal ?? predicted;
    } else if (distSq > 1) {
      const dist = Math.sqrt(distSq);
      const step = Math.min(transform.speed * dt, dist);
      let nextX = interp.base.x + (dx / dist) * step;
      let nextY = interp.base.y + (dy / dist) * step;
      if (id === state.ownId && ownMovePad && ownBlockShapes.length > 0) {
        const safe = slideMoveAgainstBlocks(
          interp.base,
          { x: nextX, y: nextY },
          ownBlockShapes,
          ownMovePad,
        );
        nextX = safe.x;
        nextY = safe.y;
      }
      interp.base.x = nextX;
      interp.base.y = nextY;
    } else {
      const destination = own && ownMovePad
        ? resolveMoveAgainstBlocks(interp.base, transform.target, ownBlockShapes, ownMovePad)
        : transform.target;
      interp.base.x = destination.x;
      interp.base.y = destination.y;
    }

    if (id === state.ownId) {
      let ex = transform.pos.x - interp.base.x;
      let ey = transform.pos.y - interp.base.y;
      if (ex * ex + ey * ey > RECONCILE_DEADZONE_SQ) {
        // While still travelling to a target, the predicted base legitimately
        // runs ahead of the authoritative position along the path (client
        // prediction lead + 5 Hz broadcast staleness). With a far click-to-move
        // target the sprite reaches the destination before the server does, so
        // the raw error points straight backward and the reconcile would drag
        // the sprite back toward the lagging server position — the visible
        // "step backward then settle" on stop. Strip that backward-along-path
        // component so only genuine divergence is corrected: perpendicular
        // drift, or the server being *ahead* of the prediction.
        //
        // The forward path axis is normally server position → target. While a
        // stop is pending we use the unconfirmed stop point instead: the
        // authoritative `target` collapses onto `pos` the instant the server
        // halts, and with a zero axis the full (backward) error would otherwise
        // snap the base back — the "backtrack on stop". Referencing the stop
        // point keeps the axis forward right up to convergence.
        const ps = isStopPending() ? getPendingStop() : null;
        const fx = (ps ? ps.x : transform.target.x) - transform.pos.x;
        const fy = (ps ? ps.y : transform.target.y) - transform.pos.y;
        const fMag = Math.hypot(fx, fy);
        if (fMag > 1) {
          const ux = fx / fMag;
          const uy = fy / fMag;
          const along = ex * ux + ey * uy;
          if (along < 0) {
            ex -= along * ux;
            ey -= along * uy;
          }
        } else if (ps) {
          // Converged onto the stop point: drop residual backward error rather
          // than snapping the base back to the lagging authoritative position.
          ex = 0;
          ey = 0;
        }
        const t = 1 - Math.exp(-RECONCILE_RATE * dt);
        const correction = correctPlayerPosition(interp.base, transform.pos, {
          x: interp.base.x + ex * t, y: interp.base.y + ey * t,
        }, ownBlockShapes, ownMovePad ?? { x: 0, y: 0 });
        interp.base.x = correction.position.x;
        interp.base.y = correction.position.y;
        if (correction.snapped && state.ownClickActive && state.ownPathGoal) {
          transform.target = reconcileOwnPathFromServer(scene, interp.base, state.ownPathGoal);
        }
      }
    }

    const nodeX = interp.base.x + interp.lungeOffset.x;
    const nodeY = interp.base.y + interp.lungeOffset.y;
    const drawY = nodeToSceneY(nodeY + (meta?.visualOffsetY ?? 0));
    sprite.setPosition(nodeToSceneX(nodeX), drawY);
    sprite.setDepth(DEPTH.SPRITE + sceneDepthY(nodeY, meta?.visualOffsetY));
  }
}

export function getOwnBase(state: RenderState): Vec2 | null {
  if (!state.ownId) return null;
  const interp = state.interpolation.get(state.ownId);
  if (!interp) return null;
  return { x: interp.base.x, y: interp.base.y };
}

export function applyLunge(
  state: RenderState,
  id: string,
  target: Vec2,
  scene: GameScene,
): void {
  const interp = state.interpolation.get(id);
  if (!interp) return;

  const LUNGE_DIST = 26;
  const dx = target.x - interp.base.x;
  const dy = target.y - interp.base.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return;

  scene.tweens.killTweensOf(interp.lungeOffset);

  interp.lungeOffset = { x: (dx / dist) * LUNGE_DIST, y: (dy / dist) * LUNGE_DIST };
  scene.tweens.add({
    targets: interp.lungeOffset,
    x: 0,
    y: 0,
    delay: 60,
    duration: 200,
    ease: 'Quad.easeOut',
  });
}
