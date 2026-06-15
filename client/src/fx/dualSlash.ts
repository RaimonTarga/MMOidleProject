import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Swiftblade's signature: a dual diagonal slash forming an X — one stroke from
 * top-left to bottom-right, the other from top-right to bottom-left, the two
 * perpendicular lines intersecting at the target's centre. The second stroke
 * lands a beat after the first to read as two distinct cuts.
 */
export function fxDualSlash(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const mainColor = empowered ? 0x4499ff : 0xffffff;
  const shadow = empowered ? 0xaaccff : 0xeeeeff;
  const lineW = empowered ? 3.5 : 2.5;
  const len = empowered ? 60 : 46;

  // Two perpendicular diagonals (±45°): TL→BR then TR→BL.
  const angles = [Math.PI / 4, -Math.PI / 4];
  angles.forEach((a, i) => {
    scene.time.delayedCall(i * 70, () => {
      const g = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      g.lineStyle(lineW, mainColor, 1);
      g.lineBetween(-Math.cos(a) * len, -Math.sin(a) * len, Math.cos(a) * len, Math.sin(a) * len);
      // Soft parallel highlight offset perpendicular to the stroke.
      const perp = a + Math.PI / 2;
      const off = 6;
      g.lineStyle(lineW * 0.5, shadow, 0.6);
      g.lineBetween(
        -Math.cos(a) * (len * 0.72) + Math.cos(perp) * off,
        -Math.sin(a) * (len * 0.72) + Math.sin(perp) * off,
        Math.cos(a) * (len * 0.72) + Math.cos(perp) * off,
        Math.sin(a) * (len * 0.72) + Math.sin(perp) * off,
      );
      scene.tweens.add({
        targets: g,
        alpha: 0,
        duration: 230,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      });
    });
  });

  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 14 : 9, 290, {
    tint: mainColor,
    speed: { min: 70, max: 230 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0.1 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });

  if (empowered) {
    const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    ring.lineStyle(3, mainColor, 1);
    ring.strokeCircle(0, 0, 12);
    scene.tweens.add({
      targets: ring,
      scaleX: 3.8,
      scaleY: 3.8,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}
