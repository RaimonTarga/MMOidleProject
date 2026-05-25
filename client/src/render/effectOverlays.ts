import { EFFECT_BY_ID, EFFECT_FRAME_COUNT } from '@mmo-idle/shared';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';

function getEffectScale(state: RenderState, id: string, baseScale = 1.5): number {
  const sprite = state.sprite.get(id);
  if (!sprite) return baseScale;
  const bossScale = Math.max(sprite.displayWidth, sprite.displayHeight) > 64 ? 1.33 : 1;
  return baseScale * bossScale;
}

export function updateEffectOverlays(
  state: RenderState,
  scene: GameScene,
  dt: number,
): void {
  for (const id of state.ids) {
    const sprite = state.sprite.get(id);
    const snap = state.snapshot.get(id);
    if (!sprite || !snap) continue;

    const activeEffects = snap.activeEffects ?? {};
    const activeEffectFrames = snap.activeEffectFrames ?? {};

    let overlays = state.effectOverlays.get(id);
    if (!overlays) {
      overlays = new Map();
      state.effectOverlays.set(id, overlays);
    }

    for (const [effectId, overlay] of overlays) {
      const remainingMs = activeEffects[effectId] ?? 0;
      const frame = activeEffectFrames[effectId];
      if (remainingMs <= 0 && frame == null) {
        overlay.destroy();
        overlays.delete(effectId);
      }
    }

    const effectIds = new Set([
      ...Object.keys(activeEffects),
      ...Object.keys(activeEffectFrames),
    ]);

    for (const effectId of effectIds) {
      const def = EFFECT_BY_ID.get(effectId);
      const explicitFrame = activeEffectFrames[effectId];
      const remainingMsRaw = activeEffects[effectId] ?? 0;
      const remainingMs = Math.max(0, remainingMsRaw);
      if (!def || (remainingMs <= 0 && explicitFrame == null)) {
        if (snap.activeEffects) snap.activeEffects[effectId] = 0;
        continue;
      }

      let overlay = overlays.get(effectId);
      if (!overlay) {
        overlay = scene.add
          .sprite(sprite.x, sprite.y, def.key)
          .setDepth(def.depth ?? Math.max(3, sprite.depth + 2));
        overlays.set(effectId, overlay);
      }

      let rawFrame: number;
      if (explicitFrame != null && def.loopFrames != null && def.loopFrames > 0) {
        const t = (scene.time.now / def.durationMs) % 1;
        const offset = Math.min(def.loopFrames - 1, Math.floor(t * def.loopFrames));
        rawFrame = explicitFrame + offset;
      } else if (explicitFrame != null) {
        rawFrame = explicitFrame;
      } else {
        rawFrame = Math.floor((remainingMs / def.durationMs) * EFFECT_FRAME_COUNT);
      }
      const frame = Math.max(0, Math.min(EFFECT_FRAME_COUNT - 1, rawFrame));
      overlay.setFrame(frame);

      const baseW = (def.baseSize ?? 96) * getEffectScale(state, id, def.scale);
      const fw = overlay.frame.width || def.frameSize;
      const fh = overlay.frame.height || def.frameSize;
      overlay.setDisplaySize(baseW, baseW * (fh / fw));

      overlay
        .setPosition(sprite.x, sprite.y + (def.anchorYPx ?? -4))
        .setVisible(true);

      if (explicitFrame == null && snap.activeEffects) {
        snap.activeEffects[effectId] = Math.max(0, remainingMs - dt * 1000);
      }
    }
  }
}

export function destroyEffectOverlays(state: RenderState, id: string): void {
  const overlays = state.effectOverlays.get(id);
  if (!overlays) return;
  for (const overlay of overlays.values()) overlay.destroy();
  state.effectOverlays.delete(id);
}
