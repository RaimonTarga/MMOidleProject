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
    const snap = state.snapshot.get(id);
    if (!sprite || !cdBar || !meta || !snap) continue;

    cdBar.clear();
    if (snap.attackTargetId === null) continue;

    const cdPct = Math.min(1, (now - snap.lastAttackAt) / Math.max(1, snap.attackCooldown));
    const cdColor = cdPct >= 1 ? 0xffdd22 : 0x4466cc;
    const barY = sprite.y - meta.barOffsetY + 6;

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
}
