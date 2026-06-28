import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const STONE = 0x99aabb;
const PALE = 0xccd6e2;
const DUST = 0xaa9977;

/**
 * Quake — the heavy single-target slam of the mountain/cave behemoth bosses. A
 * bigger, weightier version of the trash `impact` hit: a white-hot impact, ground
 * cracks splitting from the point of contact, twin stone shock rings and a heave of
 * dust. Sells the cap-tripping mega-slam as a boss-grade blow, not a mob swing.
 */
export function fxQuake(scene: GameScene, x: number, y: number): void {
  // Hard impact core.
  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(0xffffff, 0.9);
  flash.fillCircle(0, 0, 18);
  flash.fillStyle(STONE, 0.5);
  flash.fillCircle(0, 0, 30);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.1,
    scaleY: 2.1,
    duration: 200,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Ground cracks from the strike point.
  const cracks = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + Math.random() * 0.3;
    const len = 40 + Math.random() * 22;
    cracks.lineStyle(3, PALE, 0.85);
    cracks.beginPath();
    cracks.moveTo(0, 0);
    cracks.lineTo(Math.cos(a) * len * 0.55 + 5, Math.sin(a) * len * 0.55);
    cracks.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    cracks.strokePath();
  }
  scene.tweens.add({
    targets: cracks,
    alpha: 0,
    duration: 420,
    delay: 100,
    ease: 'Quad.easeIn',
    onComplete: () => cracks.destroy(),
  });

  // Twin stone shock rings.
  for (let i = 0; i < 2; i++) {
    const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    ring.lineStyle(4 - i, i === 0 ? PALE : STONE, 0.9);
    ring.strokeCircle(0, 0, 10 + i * 8);
    scene.tweens.add({
      targets: ring,
      scaleX: 4.5 + i,
      scaleY: 4.5 + i,
      alpha: 0,
      duration: 360 + i * 80,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  burstFx(scene, 'ptx-dot', x, y, 16, 500, {
    tint: DUST,
    speed: { min: 70, max: 230 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.4, end: 0 },
    alpha: { start: 0.85, end: 0 },
    gravityY: 170,
  });
}
