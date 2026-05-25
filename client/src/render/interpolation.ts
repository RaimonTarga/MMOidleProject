import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';

export function stepInterpolation(state: RenderState, dt: number): void {
  for (const id of state.ids) {
    const transform = state.transform.get(id);
    const interp = state.interpolation.get(id);
    const sprite = state.sprite.get(id);
    if (!transform || !interp || !sprite) continue;

    const dx = transform.targetX - interp.baseX;
    const dy = transform.targetY - interp.baseY;
    const distSq = dx * dx + dy * dy;
    if (distSq > 1) {
      const dist = Math.sqrt(distSq);
      const step = Math.min(transform.speed * dt, dist);
      interp.baseX += (dx / dist) * step;
      interp.baseY += (dy / dist) * step;
    } else {
      interp.baseX = transform.targetX;
      interp.baseY = transform.targetY;
    }

    sprite.setPosition(
      interp.baseX + interp.lungeOffsetX,
      interp.baseY + interp.lungeOffsetY,
    );
  }
}

export function getOwnBase(state: RenderState): { x: number; y: number } | null {
  if (!state.ownId) return null;
  const interp = state.interpolation.get(state.ownId);
  if (!interp) return null;
  return { x: interp.baseX, y: interp.baseY };
}

export function applyLunge(
  state: RenderState,
  id: string,
  targetX: number,
  targetY: number,
  scene: GameScene,
): void {
  const interp = state.interpolation.get(id);
  if (!interp) return;

  const LUNGE_DIST = 26;
  const dx = targetX - interp.baseX;
  const dy = targetY - interp.baseY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return;

  scene.tweens.killTweensOf(interp);

  interp.lungeOffsetX = (dx / dist) * LUNGE_DIST;
  interp.lungeOffsetY = (dy / dist) * LUNGE_DIST;
  scene.tweens.add({
    targets: interp,
    lungeOffsetX: 0,
    lungeOffsetY: 0,
    delay: 60,
    duration: 200,
    ease: 'Quad.easeOut',
  });
}
