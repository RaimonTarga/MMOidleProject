import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const SHOCK_VIOLET = 0xbb66ff;
const SHOCK_PALE = 0xe0baff;

/**
 * Visual for a Shockblade aftershock hit: a violet electric crackle layered on
 * top of the normal slash. The hit's on-hit damage lands twice, so the FX reads
 * as a quick double jolt — a few jagged arcs plus a small delayed re-spark.
 */
export function fxAftershock(scene: GameScene, toX: number, toY: number): void {
  const drawJolt = (delay: number, scale: number) => {
    scene.time.delayedCall(delay, () => {
      // Jagged electric arcs radiating from the impact point.
      const arms = 4;
      for (let i = 0; i < arms; i++) {
        const baseAngle = (i / arms) * Math.PI * 2 + Math.random() * 0.6;
        const segs = 3;
        const len = (16 + Math.random() * 10) * scale;
        const bolt = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
        bolt.lineStyle(2, SHOCK_VIOLET, 1);
        bolt.beginPath();
        bolt.moveTo(0, 0);
        for (let s = 1; s <= segs; s++) {
          const r = (len * s) / segs;
          const jitter = (Math.random() - 0.5) * 10 * scale;
          bolt.lineTo(
            Math.cos(baseAngle) * r + Math.cos(baseAngle + Math.PI / 2) * jitter,
            Math.sin(baseAngle) * r + Math.sin(baseAngle + Math.PI / 2) * jitter,
          );
        }
        bolt.strokePath();
        scene.tweens.add({
          targets: bolt,
          alpha: 0,
          duration: 170,
          ease: 'Power1',
          onComplete: () => bolt.destroy(),
        });
      }

      // Bright core flash.
      const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      flash.fillStyle(SHOCK_PALE, 0.85);
      flash.fillCircle(0, 0, 8 * scale);
      scene.tweens.add({
        targets: flash,
        alpha: 0,
        scaleX: 2.2,
        scaleY: 2.2,
        duration: 150,
        onComplete: () => flash.destroy(),
      });

      // Spark particles.
      burstFx(scene, 'ptx-spark', toX, toY, 7, 260, {
        tint: SHOCK_VIOLET,
        speed: { min: 90, max: 220 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.9 * scale, end: 0 },
        alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 360 },
      });
    });
  };

  // First jolt immediately, a smaller echo jolt shortly after to sell the
  // "fires twice" theme.
  drawJolt(0, 1);
  drawJolt(90, 0.6);
}
