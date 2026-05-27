import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

export function fxFrost(scene: GameScene, toX: number, toY: number): void {
  const spokes = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  const sLen = 40;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const perpA = a + Math.PI / 2;
    const tx = Math.cos(a) * sLen;
    const ty = Math.sin(a) * sLen;
    spokes.lineStyle(2, 0xaaddff, 1);
    spokes.lineBetween(0, 0, tx, ty);
    spokes.lineStyle(1.5, 0xddeeff, 0.85);
    spokes.lineBetween(tx - Math.cos(perpA) * 7, ty - Math.sin(perpA) * 7, tx + Math.cos(perpA) * 7, ty + Math.sin(perpA) * 7);
  }
  scene.tweens.add({ targets: spokes, alpha: 0, duration: 300, ease: 'Quad.easeOut', onComplete: () => spokes.destroy() });

  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  ring.lineStyle(2.5, 0x66ccff, 1);
  ring.strokeCircle(0, 0, 10);
  scene.tweens.add({ targets: ring, scaleX: 3.8, scaleY: 3.8, alpha: 0, duration: 340, ease: 'Power2', onComplete: () => ring.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, 7, 330, {
    tint: 0xaaddff,
    speed: { min: 50, max: 140 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
  });
}
