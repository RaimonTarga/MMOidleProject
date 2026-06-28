import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const STONE = 0xd8e2ef;
const DUST = 0xaa9977;

/**
 * Strong Kick — the Cliff Hopper's charged shove. A heavy pale impact at the
 * target, a burst of ground cracks fanning out from the boot, a stone-dust ring
 * and flying chips. Sells the knockback that the kick applies (Brace cuts both the
 * hit and the shove distance), replacing the plain ring it used to draw.
 */
export function fxStrongKick(scene: GameScene, x: number, y: number): void {
  // Heavy impact flash.
  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(0xffffff, 0.9);
  flash.fillCircle(0, 0, 16);
  flash.fillStyle(STONE, 0.5);
  flash.fillCircle(0, 0, 26);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2,
    scaleY: 2,
    duration: 180,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Ground cracks fanning out from the point of impact.
  const cracks = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.random() * 0.3;
    const len = 34 + Math.random() * 18;
    cracks.lineStyle(2.5, STONE, 0.85);
    cracks.beginPath();
    cracks.moveTo(0, 0);
    cracks.lineTo(Math.cos(a) * len * 0.55 + 4, Math.sin(a) * len * 0.55);
    cracks.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    cracks.strokePath();
  }
  scene.tweens.add({
    targets: cracks,
    alpha: 0,
    duration: 380,
    delay: 90,
    ease: 'Quad.easeIn',
    onComplete: () => cracks.destroy(),
  });

  // Dust shock ring.
  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(3, STONE, 0.8);
  ring.strokeCircle(0, 0, 10);
  scene.tweens.add({
    targets: ring,
    scaleX: 4,
    scaleY: 4,
    alpha: 0,
    duration: 340,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  burstFx(scene, 'ptx-dot', x, y, 14, 460, {
    tint: DUST,
    speed: { min: 60, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.3, end: 0 },
    alpha: { start: 0.85, end: 0 },
    gravityY: 160,
  });
  burstFx(scene, 'ptx-spark', x, y, 9, 320, {
    tint: STONE,
    speed: { min: 100, max: 260 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
