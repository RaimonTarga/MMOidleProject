import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const QUICK_BRIGHT = 0xfff4d0;
const QUICK_CORE = 0xffc857;

/**
 * Quick Strike (the low-impact, high-frequency Technique): a small, crisp tick.
 *
 * Deliberately the QUIETEST ability FX in the set. Quick Strike fires every two
 * and a half seconds, and a Sweep-sized flourish at that cadence would bury every
 * other cue on screen and make the ability feel more important than it is. Two
 * short ticks and a few sparks: visible, over in a fifth of a second, gone.
 */
export function fxQuickStrike(
  scene: GameScene,
  x: number,
  y: number,
  empowered: boolean,
): void {
  const size = empowered ? 15 : 12;

  // A tight cross of two quick ticks — the "two fast taps" read.
  for (let i = 0; i < 2; i++) {
    scene.time.delayedCall(i * 60, () => {
      const tick = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
      tick.lineStyle(i === 0 ? 3 : 2, i === 0 ? QUICK_BRIGHT : QUICK_CORE, 1);
      tick.beginPath();
      const angle = i === 0 ? -0.6 : 0.7;
      tick.moveTo(-Math.cos(angle) * size, -Math.sin(angle) * size);
      tick.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
      tick.strokePath();
      scene.tweens.add({
        targets: tick,
        alpha: 0,
        scaleX: 1.45,
        scaleY: 1.45,
        duration: 150,
        ease: 'Quad.easeOut',
        onComplete: () => tick.destroy(),
      });
    });
  }

  burstFx(scene, 'ptx-spark', x, y, empowered ? 8 : 6, 220, {
    tint: QUICK_CORE,
    speed: { min: 90, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 1, end: 0 },
  });
}
