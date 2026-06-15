import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

export function fxSlash(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number, empowered: boolean, blueEmpowered = false): void {
  const empColor   = blueEmpowered ? 0x4499ff : 0xffdd22;
  const trailColor = blueEmpowered ? 0xaaccff : 0xffffcc;
  const mainColor  = empowered ? empColor : 0xffffff;
  const lineW = empowered ? 3.5 : 2.5;
  const len   = empowered ? 72 : 56;

  // Pick a fixed diagonal that crosses the attack path:
  //   attacker to the right → slash goes top-right→bottom-left  (like /)
  //   attacker to the left  → slash goes top-left→bottom-right  (like \)
  const attackAngle = Math.atan2(toY - fromY, toX - fromX);
  const slashAngle  = Math.cos(attackAngle) >= 0 ? -Math.PI / 4 : Math.PI / 4;

  // Sweep direction runs along the attack vector, so lines march through the target.
  const sx = Math.cos(attackAngle);
  const sy = Math.sin(attackAngle);

  // Three passes: leading ghost → main hit → trailing fade, each offset along the sweep.
  const passes = [
    { delay:  0, offset: -14, width: lineW * 0.5, alpha: 0.45, lenMult: 0.78, tint: trailColor },
    { delay: 40, offset:   0, width: lineW,        alpha: 1.00, lenMult: 1.00, tint: mainColor  },
    { delay: 75, offset:  11, width: lineW * 0.4,  alpha: 0.35, lenMult: 0.65, tint: trailColor },
  ] as const;

  for (const p of passes) {
    scene.time.delayedCall(p.delay, () => {
      const cx = toX + sx * p.offset;
      const cy = toY + sy * p.offset;
      const l  = len * p.lenMult;
      const g  = scene.add.graphics({ x: cx, y: cy }).setDepth(DEPTH.FX);
      g.lineStyle(p.width, p.tint, p.alpha);
      g.lineBetween(
        -Math.cos(slashAngle) * l, -Math.sin(slashAngle) * l,
         Math.cos(slashAngle) * l,  Math.sin(slashAngle) * l,
      );
      scene.tweens.add({ targets: g, alpha: 0, duration: 200, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
    });
  }

  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 14 : 9, 280, {
    tint: mainColor,
    speed: { min: 60, max: 220 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0.1 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });

  if (empowered) {
    const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    ring.lineStyle(3, mainColor, 1);
    ring.strokeCircle(0, 0, 12);
    scene.tweens.add({ targets: ring, scaleX: 3.8, scaleY: 3.8, alpha: 0, duration: 320, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }
}
