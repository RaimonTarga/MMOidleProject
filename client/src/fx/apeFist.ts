import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const KNUCKLE = 0x6b5a48;
const IMPACT = 0xffe0a8;

/**
 * APE FIST — a two-handed downward pound, the Jungle ape lineage's ordinary swing.
 *
 * Jungle Ape, Silverback and Apex Silverback already have `chest-beat` for their
 * rally cast, so the mob was half-authored: the loud moment read as an ape and the
 * basic attack read as a generic bloom. This matches the basic attack to the creature
 * that already has a signature.
 *
 * Two offset impacts landing a beat apart — the defining shape, and it also makes the
 * ape line's `rampOnCombat` legible, because a doubling rhythm is what "keeps
 * building while engaged" should feel like. Distinct from `fxTrollFist` (one mass)
 * and `fxGore` (upward hook).
 */
export function fxApeFist(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const r = empowered ? 15 : 12;
  const spread = empowered ? 17 : 14;
  // Which hand lands first, so a pack of three apes does not beat in lockstep.
  const lead = Math.random() < 0.5 ? -1 : 1;

  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? lead : -lead;
    const x = toX + side * spread;
    const delay = i * 90;

    scene.time.delayedCall(delay, () => {
      const fist = scene.add.graphics({ x, y: toY - 10 }).setDepth(DEPTH.FX);
      fist.fillStyle(KNUCKLE, 0.85);
      fist.fillCircle(0, 0, r);
      fist.fillStyle(IMPACT, 0.35);
      fist.fillCircle(0, 0, r * 0.5);
      scene.tweens.add({
        targets: fist,
        y: toY + 4,
        alpha: 0,
        duration: 150,
        ease: 'Quad.easeIn',
        onComplete: () => fist.destroy(),
      });

      // Each hand leaves its own flat ground ring.
      const ring = scene.add.graphics({ x, y: toY + 8 }).setDepth(DEPTH.FX);
      ring.lineStyle(3, IMPACT, 0.7);
      ring.strokeEllipse(0, 0, r * 1.8, r * 0.9);
      scene.tweens.add({
        targets: ring,
        scaleX: 2.3,
        scaleY: 2.3,
        alpha: 0,
        duration: 280,
        delay: 110,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy(),
      });

      burstFx(scene, 'ptx-dot', x, toY + 6, empowered ? 9 : 6, 400, {
        tint: KNUCKLE,
        speed: { min: 55, max: 160 },
        angle: { min: 200, max: 340 },
        scale: { start: 0.85, end: 0 },
        alpha: { start: 0.9, end: 0 },
        gravityY: 230,
      });
    });
  }

  // One shared centre flash on the second landing, tying the pair into one beat.
  scene.time.delayedCall(90, () => {
    const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    flash.fillStyle(IMPACT, empowered ? 0.5 : 0.38);
    flash.fillCircle(0, 0, empowered ? 22 : 18);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 1.4,
      duration: 240,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
  });
}
