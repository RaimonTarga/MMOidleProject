import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const HEAVY_BRIGHT = 0xfff6dd;
const HEAVY_CORE = 0xffb020;
const HEAVY_DEEP = 0xb85c00;

/**
 * Power Strike (the reference all-damage cast): one enormous overhead blow.
 *
 * This is the ability every other cast is measured against — Snipe trades some
 * of its damage for range, Stunning Strike trades some for control — so it gets
 * the biggest, plainest impact in the set: a vertical drop, a white core, and a
 * shockwave. No colour trickery, no secondary status cue, because there is no
 * secondary effect to hint at. The player waited 1.6 s for this and it should
 * land like it.
 */
export function fxPowerStrike(scene: GameScene, x: number, y: number): void {
  // The blow itself, falling from above the target.
  const blade = scene.add.graphics({ x, y: y - 70 }).setDepth(DEPTH.FX);
  blade.fillStyle(HEAVY_BRIGHT, 0.9);
  blade.fillTriangle(-9, -34, 9, -34, 0, 34);
  scene.tweens.add({
    targets: blade,
    y,
    duration: 110,
    ease: 'Quad.easeIn',
    onComplete: () => {
      scene.tweens.add({
        targets: blade,
        alpha: 0,
        scaleY: 0.4,
        duration: 140,
        onComplete: () => blade.destroy(),
      });
    },
  });

  scene.time.delayedCall(110, () => {
    // Impact core.
    const core = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    core.fillStyle(HEAVY_BRIGHT, 0.95);
    core.fillCircle(0, 0, 22);
    scene.tweens.add({
      targets: core,
      alpha: 0,
      scaleX: 2.4,
      scaleY: 2.4,
      duration: 220,
      ease: 'Expo.easeOut',
      onComplete: () => core.destroy(),
    });

    // Two shockwave rings, flattened so they sit on the ground plane.
    for (let i = 0; i < 2; i++) {
      const ring = scene.add.graphics({ x, y: y + 6 }).setDepth(DEPTH.FX);
      ring.lineStyle(4 - i * 1.5, i === 0 ? HEAVY_CORE : HEAVY_DEEP, 0.9 - i * 0.3);
      ring.strokeEllipse(0, 0, 30 + i * 12, 13 + i * 5);
      scene.tweens.add({
        targets: ring,
        scaleX: 3.2 + i,
        scaleY: 3.2 + i,
        alpha: 0,
        duration: 400 + i * 120,
        ease: 'Quad.easeOut',
        onComplete: () => ring.destroy(),
      });
    }

    // Debris kicked up by the impact.
    burstFx(scene, 'ptx-spark', x, y, 26, 460, {
      tint: HEAVY_CORE,
      speed: { min: 160, max: 400 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.1, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
      gravityY: 220,
    });
  });
}
