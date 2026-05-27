import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

export function fxVoid(scene: GameScene, toX: number, toY: number): void {
  const dark = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  dark.fillStyle(0x220033, 0.82);
  dark.fillCircle(0, 0, 28);
  dark.lineStyle(2.5, 0x6600cc, 1);
  dark.strokeCircle(0, 0, 28);
  dark.setScale(2.5);
  scene.tweens.add({
    targets: dark, scaleX: 0.15, scaleY: 0.15, alpha: 0.2, duration: 230, ease: 'Back.easeIn',
    onComplete: () => {
      dark.destroy();
      const burst = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      burst.fillStyle(0x9933ff, 0.88);
      burst.fillCircle(0, 0, 16);
      scene.tweens.add({ targets: burst, alpha: 0, scaleX: 2.8, scaleY: 2.8, duration: 190, onComplete: () => burst.destroy() });

      const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      ring.lineStyle(3, 0xaa44ff, 1);
      ring.strokeCircle(0, 0, 12);
      scene.tweens.add({ targets: ring, scaleX: 4.5, scaleY: 4.5, alpha: 0, duration: 340, ease: 'Power2', onComplete: () => ring.destroy() });

      burstFx(scene, 'ptx-dot', toX, toY, 12, 360, {
        tint: 0x9933ff,
        speed: { min: 60, max: 190 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 1, end: 0 },
      });
    },
  });
}
