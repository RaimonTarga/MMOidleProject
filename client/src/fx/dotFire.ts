import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

export function fxFireFlame(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(0xffffff, empowered ? 0.9 : 0.72);
  flash.fillCircle(0, 0, empowered ? 18 : 11);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 75, onComplete: () => flash.destroy() });

  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  ring.lineStyle(3, 0xdd1100, 1);
  ring.strokeCircle(0, 0, empowered ? 14 : 9);
  scene.tweens.add({ targets: ring, scaleX: empowered ? 4.5 : 3.2, scaleY: empowered ? 4.5 : 3.2, alpha: 0, duration: 300, ease: 'Power2', onComplete: () => ring.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, empowered ? 16 : 10, 560, {
    tint: 0xff2200,
    speed: { min: 80, max: empowered ? 280 : 200 },
    angle: { min: 210, max: 330 },
    scale: { start: empowered ? 0.9 : 0.65, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -135,
  });

  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 10 : 5, 460, {
    tint: 0xff4422, speed: { min: 50, max: 150 }, angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 },
    gravityY: 100, rotate: { min: 0, max: 360 },
  });
}
