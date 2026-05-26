import type { PlayerView } from '@mmo-idle/shared';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';

export function ensureHpBar(
  state: RenderState,
  id: string,
  scene: GameScene,
  depth: number,
): void {
  if (state.hpBar.has(id)) return;
  state.hpBar.set(id, scene.add.graphics().setDepth(depth));
}

export function drawHealthBars(state: RenderState): void {
  for (const id of state.ids) {
    const sprite = state.sprite.get(id);
    const hpBar = state.hpBar.get(id);
    const meta = state.spriteMeta.get(id);
    const snap = state.view.get(id);
    if (!sprite || !hpBar || !meta || !snap) continue;

    const barY = sprite.y - meta.barOffsetY;
    const hpPct = snap.maxHp > 0 ? Math.max(0, snap.hp / snap.maxHp) : 0;
    const hpColor = hpPct > 0.5 ? 0x44ee44 : hpPct > 0.25 ? 0xeeaa22 : 0xee3322;
    let shieldPct = 0;
    let shieldShown = false;

    if (state.kind.get(id) === 'player') {
      const player = snap as PlayerView;
      const totalShield = player.shields.reduce((sum, s) => sum + s.amount, 0);
      shieldPct = snap.maxHp > 0 ? totalShield / snap.maxHp : 0;
      shieldShown = totalShield > 0;
    }

    const prev = state.hpBarCache.get(id);
    if (
      prev &&
      prev.x === sprite.x &&
      prev.y === barY &&
      prev.hpPct === hpPct &&
      prev.shieldPct === shieldPct &&
      prev.shieldShown === shieldShown
    ) {
      continue;
    }
    state.hpBarCache.set(id, { x: sprite.x, y: barY, hpPct, shieldPct, shieldShown });

    hpBar.clear();
    hpBar.fillStyle(0x1a1a1a);
    hpBar.fillRect(sprite.x - 16, barY, 32, 4);
    hpBar.fillStyle(hpColor);
    hpBar.fillRect(sprite.x - 16, barY, Math.round(32 * hpPct), 4);

    if (state.kind.get(id) === 'player') {
      if (shieldShown) {
        const shieldStart = Math.round(32 * hpPct);
        const shieldWidth = Math.min(32 - shieldStart, Math.round(32 * shieldPct));
        if (shieldWidth > 0) {
          hpBar.fillStyle(0x44ccdd, 0.9);
          hpBar.fillRect(sprite.x - 16 + shieldStart, barY, shieldWidth, 4);
        }
      }
    }

    hpBar.lineStyle(1, 0x000000, 0.75);
    hpBar.strokeRect(sprite.x - 16.5, barY - 0.5, 33, 5);
  }
}

export function destroyHpBar(state: RenderState, id: string): void {
  state.hpBar.get(id)?.destroy();
  state.hpBar.delete(id);
  state.hpBarCache.delete(id);
}
