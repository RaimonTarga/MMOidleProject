import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';

export function fxPoisonSmog(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(12);
  ring.lineStyle(2, 0x33dd55, 0.75);
  ring.strokeCircle(0, 0, 8);
  scene.tweens.add({ targets: ring, scaleX: empowered ? 5 : 3.5, scaleY: empowered ? 5 : 3.5, alpha: 0, duration: 520, ease: 'Power1', onComplete: () => ring.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, empowered ? 16 : 9, 750, {
    tint: 0x33dd66,
    speed: { min: 12, max: empowered ? 70 : 50 },
    angle: { min: 200, max: 340 },
    scale: { start: empowered ? 1.2 : 0.85, end: 0 },
    alpha: { start: 0.88, end: 0 },
    gravityY: -50,
  });

  if (empowered) {
    burstFx(scene, 'ptx-dot', toX, toY, 10, 900, {
      tint: 0x22aa44, speed: { min: 6, max: 30 }, angle: { min: 180, max: 360 },
      scale: { start: 1.5, end: 0 }, alpha: { start: 0.7, end: 0 }, gravityY: -30,
    });
  }
}
