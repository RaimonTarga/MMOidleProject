import type { Vec2 } from '@mmo-idle/shared';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from './depth';

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

export function stepInterpolation(state: RenderState, dt: number): void {
  for (const id of state.ids) {
    const transform = state.transform.get(id);
    const interp = state.interpolation.get(id);
    const sprite = state.sprite.get(id);
    const meta = state.spriteMeta.get(id);
    if (!transform || !interp || !sprite) continue;

    const dx = transform.target.x - interp.base.x;
    const dy = transform.target.y - interp.base.y;
    const distSq = dx * dx + dy * dy;
    if (distSq > 1) {
      const dist = Math.sqrt(distSq);
      const step = Math.min(transform.speed * dt, dist);
      interp.base.x += (dx / dist) * step;
      interp.base.y += (dy / dist) * step;
    } else {
      interp.base.x = transform.target.x;
      interp.base.y = transform.target.y;
    }

    if (id === state.ownId) {
      const ex = transform.pos.x - interp.base.x;
      const ey = transform.pos.y - interp.base.y;
      if (ex * ex + ey * ey > RECONCILE_DEADZONE_SQ) {
        const t = 1 - Math.exp(-RECONCILE_RATE * dt);
        interp.base.x += ex * t;
        interp.base.y += ey * t;
      }
    }

    const sx = interp.base.x + interp.lungeOffset.x;
    const sy = interp.base.y + interp.lungeOffset.y;
    const drawY = spriteDrawY(sy, meta?.visualOffsetY);
    sprite.setPosition(sx, drawY);
    sprite.setDepth(DEPTH.SPRITE + sy);
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
