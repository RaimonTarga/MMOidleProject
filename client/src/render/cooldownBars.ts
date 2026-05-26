import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';

export function ensureCdBar(
  state: RenderState,
  id: string,
  scene: GameScene,
  depth: number,
): void {
  if (state.cdBar.has(id)) return;
  state.cdBar.set(id, scene.add.graphics().setDepth(depth));
}

export function drawCooldownBars(state: RenderState): void {
  const now = Date.now();

  for (const id of state.ids) {
    const sprite = state.sprite.get(id);
    const cdBar = state.cdBar.get(id);
    const meta = state.spriteMeta.get(id);
    const snap = state.view.get(id);
    if (!sprite || !cdBar || !meta || !snap) continue;

    const hasTarget = snap.attackTargetId !== null;
    const barY = sprite.y - meta.barOffsetY + 6;
    const cdPct = hasTarget
      ? Math.min(1, (now - snap.lastAttackAt) / Math.max(1, snap.attackCooldown))
      : 0;
    const bucket = Math.round(cdPct * 64);
    const prev = state.cdBarCache.get(id);
    if (
      prev &&
      prev.x === sprite.x &&
      prev.y === barY &&
      prev.bucket === bucket &&
      prev.hasTarget === hasTarget
    ) {
      continue;
    }
    state.cdBarCache.set(id, { x: sprite.x, y: barY, bucket, hasTarget });

    cdBar.clear();
    if (!hasTarget) continue;

    const cdColor = cdPct >= 1 ? 0xffdd22 : 0x4466cc;

    cdBar.fillStyle(0x1a1a1a);
    cdBar.fillRect(sprite.x - 16, barY, 32, 3);
    cdBar.fillStyle(cdColor);
    cdBar.fillRect(sprite.x - 16, barY, Math.round(32 * cdPct), 3);
    cdBar.lineStyle(1, 0x000000, 0.75);
    cdBar.strokeRect(sprite.x - 16.5, barY - 0.5, 33, 4);
  }
}

export function destroyCdBar(state: RenderState, id: string): void {
  state.cdBar.get(id)?.destroy();
  state.cdBar.delete(id);
  state.cdBarCache.delete(id);
}
