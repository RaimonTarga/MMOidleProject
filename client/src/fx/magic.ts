import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

export function fxMagic(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number): void {
  const orb = scene.add.circle(fromX, fromY, 6, 0xaa44ff).setDepth(DEPTH.FX);

  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(i * 45, () => {
      const trail = scene.add.circle(orb.x, orb.y, 3 - i * 0.5, 0xcc88ff, 0.75).setDepth(DEPTH.FX);
      scene.tweens.add({ targets: trail, alpha: 0, scaleX: 0.1, scaleY: 0.1, duration: 180, onComplete: () => trail.destroy() });
    });
  }

  scene.tweens.add({
    targets: orb, x: toX, y: toY, duration: 200, ease: 'Quad.easeIn',
    onComplete: () => {
      orb.destroy();
      const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      ring.lineStyle(2.5, 0xcc88ff, 1);
      ring.strokeCircle(0, 0, 6);
      scene.tweens.add({ targets: ring, scaleX: 3.5, scaleY: 3.5, alpha: 0, duration: 260, onComplete: () => ring.destroy() });

      burstFx(scene, 'ptx-dot', toX, toY, 10, 320, {
        tint: 0xaa44ff,
        speed: { min: 50, max: 180 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.65, end: 0 },
        alpha: { start: 1, end: 0 },
      });
    },
  });
}
