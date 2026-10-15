import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';

/**
 * Cannoneer burst — a big, heavy explosion on the target when the stored pool fires.
 * White-hot core, double orange shockwave rings, and a wide spark blast.
 */
export function fxCannonBlast(scene: GameScene, x: number, y: number): void {
  if (document.hidden) return;
  const orange = 0xff7722;
  const core   = 0xfff2d0;

  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(core, 0.95);
  flash.fillCircle(0, 0, 16);
  flash.fillStyle(orange, 0.5);
  flash.fillCircle(0, 0, 28);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 2, scaleY: 2, duration: 260, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });

  // Two staggered shockwave rings for weight.
  for (let k = 0; k < 2; k++) {
    const ring = scene.add.graphics().setDepth(DEPTH.FX);
    const s = { r: 8, alpha: 0.9 };
    scene.tweens.add({
      targets: s, r: 58 + k * 16, alpha: 0, duration: 360 + k * 120, delay: k * 90, ease: 'Cubic.Out',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(4 - k, orange, s.alpha);
        ring.strokeCircle(x, y, s.r);
      },
      onComplete: () => ring.destroy(),
    });
  }

  burstFx(scene, 'ptx-spark', x, y, 18, 380, {
    tint: orange,
    speed: { min: 140, max: 380 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.3, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
