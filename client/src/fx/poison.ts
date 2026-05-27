import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

export function fxPoison(scene: GameScene, toX: number, toY: number): void {
  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  ring.lineStyle(2.5, 0x44ff66, 1);
  ring.strokeCircle(0, 0, 8);
  scene.tweens.add({ targets: ring, scaleX: 4.2, scaleY: 4.2, alpha: 0, duration: 380, ease: 'Power2', onComplete: () => ring.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, 9, 520, {
    tint: 0x44ff66,
    speed: { min: 30, max: 110 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.65, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -70,
  });
}
