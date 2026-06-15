import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';

/**
 * Voidwalker singularity discharge — a flashy, void-themed burst: a collapsing
 * implosion ring, then a bright violet flash and a dark expanding shockwave with a
 * wide spark blast. Reads as a singularity detonating.
 */
export function fxVoidDischarge(scene: GameScene, x: number, y: number): void {
  if (document.hidden) return;
  const violet = 0x9b30ff;
  const dark   = 0x3a0d52;
  const core   = 0xe6c2ff;

  // 1) Implosion — a ring collapsing inward into the point.
  const imp = scene.add.graphics().setDepth(DEPTH.FX);
  const si = { r: 48, alpha: 0.85 };
  scene.tweens.add({
    targets: si, r: 5, alpha: 0, duration: 200, ease: 'Quad.easeIn',
    onUpdate: () => {
      imp.clear();
      imp.lineStyle(3, violet, si.alpha);
      imp.strokeCircle(x, y, si.r);
      imp.lineStyle(1.5, core, si.alpha * 0.8);
      imp.strokeCircle(x, y, si.r * 0.6);
    },
    onComplete: () => imp.destroy(),
  });

  // 2) Detonation — after the implosion lands.
  scene.time.delayedCall(190, () => {
    if (document.hidden) return;
    const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    flash.fillStyle(core, 0.95);
    flash.fillCircle(0, 0, 16);
    flash.fillStyle(violet, 0.5);
    flash.fillCircle(0, 0, 30);
    scene.tweens.add({ targets: flash, alpha: 0, scaleX: 2.8, scaleY: 2.8, duration: 320, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });

    const ring = scene.add.graphics().setDepth(DEPTH.FX);
    const s = { r: 8, alpha: 0.95 };
    scene.tweens.add({
      targets: s, r: 70, alpha: 0, duration: 400, ease: 'Cubic.Out',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(5, violet, s.alpha);
        ring.strokeCircle(x, y, s.r);
        ring.lineStyle(3, dark, s.alpha * 0.85);
        ring.strokeCircle(x, y, s.r * 0.68);
      },
      onComplete: () => ring.destroy(),
    });

    burstFx(scene, 'ptx-spark', x, y, 22, 460, {
      tint: violet,
      speed: { min: 150, max: 460 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
    });
  });
}
