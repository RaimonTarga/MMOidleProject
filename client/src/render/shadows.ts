import type Phaser from 'phaser';
import type { PlayerSnapshot } from '@mmo-idle/shared';
import { getPlayerShadowColor } from '../sprites';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';

/** Level 0 → black filled ellipse. Level 1+ → bright stroke outline, no fill. */
export function applyPlayerShadowStyle(
  shadow: Phaser.GameObjects.Ellipse,
  level: number,
): void {
  if (level === 0) {
    shadow.setFillStyle(0x000000, 0.45);
    shadow.setStrokeStyle();
  } else {
    shadow.setFillStyle();
    shadow.setStrokeStyle(3, getPlayerShadowColor(level), 1);
  }
}

export function ensureShadow(
  state: RenderState,
  id: string,
  x: number,
  y: number,
  shadowOffsetY: number,
  scene: GameScene,
  opts: { width: number; height: number; depth: number; fillColor?: number; fillAlpha?: number; playerTier?: number },
): void {
  if (state.shadow.has(id)) return;

  const shadow = scene.add
    .ellipse(x, y + shadowOffsetY, opts.width, opts.height)
    .setDepth(opts.depth);

  if (opts.playerTier !== undefined) {
    applyPlayerShadowStyle(shadow, opts.playerTier);
  } else {
    shadow.setFillStyle(opts.fillColor ?? 0x000000, opts.fillAlpha ?? 0.45);
  }

  state.shadow.set(id, shadow);
}

export function updateShadowStyle(state: RenderState, id: string): void {
  const kind = state.kind.get(id);
  if (kind !== 'player') return;

  const snap = state.snapshot.get(id) as PlayerSnapshot | undefined;
  const shadow = state.shadow.get(id);
  const meta = state.spriteMeta.get(id);
  if (!snap || !shadow || !meta) return;

  const lvl = snap.playerTier;
  if (lvl !== meta.shadowLevel) {
    applyPlayerShadowStyle(shadow, lvl);
    meta.shadowLevel = lvl;
  }
}

export function drawShadows(state: RenderState): void {
  for (const id of state.ids) {
    if (state.kind.get(id) === 'player') updateShadowStyle(state, id);
    const sprite = state.sprite.get(id);
    const shadow = state.shadow.get(id);
    const interp = state.interpolation.get(id);
    const meta = state.spriteMeta.get(id);
    if (!sprite || !shadow || !interp || !meta) continue;

    shadow.setPosition(
      interp.baseX + interp.lungeOffsetX,
      interp.baseY + interp.lungeOffsetY + meta.shadowOffsetY,
    );
  }
}

export function destroyShadow(state: RenderState, id: string): void {
  state.shadow.get(id)?.destroy();
  state.shadow.delete(id);
}
