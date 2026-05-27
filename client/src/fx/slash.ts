import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

export function fxSlash(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number, empowered: boolean, blueEmpowered = false): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const perp = angle + Math.PI / 2;
  const empColor = blueEmpowered ? 0x4499ff : 0xffdd22;
  const shadowColor = blueEmpowered ? 0xaaccff : 0xffffcc;
  const mainColor = empowered ? empColor : 0xffffff;
  const shadow = empowered ? shadowColor : 0xeeeeff;
  const lineW = empowered ? 3.5 : 2.5;
  const len = empowered ? 62 : 48;

  for (let i = 0; i < 3; i++) {
    const a = perp + (i - 1) * 0.3;
    scene.time.delayedCall(i * 35, () => {
      const g = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      g.lineStyle(lineW, mainColor, 1);
      g.lineBetween(-Math.cos(a) * len, -Math.sin(a) * len, Math.cos(a) * len, Math.sin(a) * len);
      g.lineStyle(lineW * 0.5, shadow, 0.6);
      const off = 7;
      g.lineBetween(
        -Math.cos(a) * (len * 0.7) + Math.cos(angle) * off,
        -Math.sin(a) * (len * 0.7) + Math.sin(angle) * off,
        Math.cos(a) * (len * 0.7) + Math.cos(angle) * off,
        Math.sin(a) * (len * 0.7) + Math.sin(angle) * off,
      );
      scene.tweens.add({ targets: g, alpha: 0, duration: 210, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
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
