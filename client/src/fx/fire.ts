import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

export function fxFire(scene: GameScene, toX: number, toY: number): void {
  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(0xffffff, 0.88);
  flash.fillCircle(0, 0, 14);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 85, onComplete: () => flash.destroy() });

  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  ring.lineStyle(3, 0xff6600, 1);
  ring.strokeCircle(0, 0, 12);
  scene.tweens.add({ targets: ring, scaleX: 3.8, scaleY: 3.8, alpha: 0, duration: 320, ease: 'Power2', onComplete: () => ring.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, 12, 460, {
    tint: 0xff6600,
    speed: { min: 80, max: 230 },
    angle: { min: 220, max: 320 },
    scale: { start: 0.75, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -110,
  });

  burstFx(scene, 'ptx-spark', toX, toY, 8, 560, {
    tint: 0xff8800,
    speed: { min: 50, max: 150 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 130,
    rotate: { min: 0, max: 360 },
  });
}
