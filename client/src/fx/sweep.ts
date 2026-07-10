import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Sweep (Technique ability): a wide horizontal cleave laid ON TOP of the normal
 * attack FX. It reads as a big scything arc across the target — bolder and more
 * visible than a basic slash so the player can SEE the ability fire. The arc
 * sweeps left→right or right→left depending on which side the attacker is on, so
 * it tracks the swing direction. A faint ring echoes the cleave's splash radius.
 */
export function fxSweep(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  empowered: boolean,
): void {
  const mainColor = empowered ? 0xffd24a : 0xffe6a0;
  const trailColor = 0xffb347;
  const lineW = empowered ? 7 : 6;
  const radius = empowered ? 88 : 72;

  // Swing left→right when the attacker is to the left of the target, else mirror.
  const leftToRight = toX >= fromX;
  // A bottom-bowed crescent (centre lifted above the target) reads as a flat,
  // horizontal sweep through the enemy rather than a vertical chop.
  const cx = toX;
  const cy = toY - radius * 0.42;
  const startA = leftToRight ? Math.PI * 0.86 : Math.PI * 0.14;
  const endA = leftToRight ? Math.PI * 0.14 : Math.PI * 0.86;

  // Offset passes (leading ghost → white-hot core → bright cleave → trailing
  // fade) give the arc a sense of motion as it carves across.
  const passes = [
    { delay: 0, width: lineW * 0.5, alpha: 0.45, r: radius * 0.86, color: trailColor },
    { delay: 45, width: lineW, alpha: 1.0, r: radius, color: mainColor },
    { delay: 45, width: lineW * 0.45, alpha: 1.0, r: radius, color: 0xffffff },
    { delay: 95, width: lineW * 0.5, alpha: 0.35, r: radius * 1.12, color: trailColor },
    { delay: 145, width: lineW * 0.35, alpha: 0.25, r: radius * 1.24, color: trailColor },
  ] as const;

  for (const p of passes) {
    scene.time.delayedCall(p.delay, () => {
      const g = scene.add.graphics({ x: cx, y: cy }).setDepth(DEPTH.FX);
      g.lineStyle(p.width, p.color, p.alpha);
      g.beginPath();
      // anticlockwise = leftToRight so the SHORT, lower crescent (through the
      // target, angle ~π/2 = down in screen space) is drawn, not the long top arc.
      g.arc(0, 0, p.r, startA, endA, leftToRight);
      g.strokePath();
      scene.tweens.add({
        targets: g,
        alpha: 0,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 230,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      });
    });
  }

  // Impact flash on the target — the cleave biting in.
  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(0xffffff, 0.7);
  flash.fillCircle(0, 0, empowered ? 16 : 12);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.2,
    scaleY: 2.2,
    duration: 160,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Spark spray flung along the swing arc.
  const sprayCentre = leftToRight ? 20 : 160;
  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 24 : 18, 340, {
    tint: mainColor,
    speed: { min: 110, max: 330 },
    angle: { min: sprayCentre - 60, max: sprayCentre + 60 },
    scale: { start: 1.1, end: 0.1 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });

  // Cleave rings — echo that this strike splashes to nearby enemies.
  for (let i = 0; i < 2; i++) {
    const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    ring.lineStyle(2.5 - i, i === 0 ? mainColor : trailColor, 0.55);
    ring.strokeCircle(0, 0, 14 + i * 6);
    scene.tweens.add({
      targets: ring,
      scaleX: 6 + i * 1.5,
      scaleY: 6 + i * 1.5,
      alpha: 0,
      duration: 380 + i * 90,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}
