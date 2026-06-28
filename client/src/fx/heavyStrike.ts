import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Expose Weakness Technique: a target-marking strike laid over the normal attack
 * FX. It reads as a quick diagnostic cut plus a pulsing red reticle on the enemy.
 */
export function fxExposeWeakness(
  scene: GameScene,
  toX: number,
  toY: number,
  empowered: boolean,
): void {
  const core = empowered ? 0xff6680 : 0xff335d;
  const deep = 0x7d102a;
  const lineW = empowered ? 5 : 4;

  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(core, 0.9);
  flash.fillCircle(0, 0, empowered ? 18 : 14);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.2,
    scaleY: 2.2,
    duration: 170,
    onComplete: () => flash.destroy(),
  });

  const mark = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  mark.lineStyle(lineW, core, 0.95);
  mark.strokeCircle(0, 0, empowered ? 30 : 24);
  mark.lineStyle(2, deep, 0.85);
  mark.lineBetween(-34, 0, -14, 0);
  mark.lineBetween(14, 0, 34, 0);
  mark.lineBetween(0, -34, 0, -14);
  mark.lineBetween(0, 14, 0, 34);
  scene.tweens.add({
    targets: mark,
    scaleX: 1.25,
    scaleY: 1.25,
    alpha: 0,
    duration: 420,
    ease: 'Power2',
    onComplete: () => mark.destroy(),
  });

  const slash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  slash.lineStyle(lineW, core, 0.9);
  slash.lineBetween(-28, -18, 28, 18);
  slash.lineStyle(2, deep, 0.65);
  slash.lineBetween(-20, 18, 20, -18);
  scene.tweens.add({
    targets: slash,
    alpha: 0,
    scaleX: 1.15,
    scaleY: 1.15,
    duration: 240,
    ease: 'Quad.easeOut',
    onComplete: () => slash.destroy(),
  });

  for (let i = 0; i < 2; i++) {
    const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    ring.lineStyle(3 - i, i === 0 ? core : deep, 0.8);
    ring.strokeCircle(0, 0, 14 + i * 10);
    scene.tweens.add({
      targets: ring,
      scaleX: (empowered ? 3.4 : 2.8) + i * 0.45,
      scaleY: (empowered ? 3.4 : 2.8) + i * 0.45,
      alpha: 0,
      duration: 360 + i * 80,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  burstFx(scene, 'ptx-dot', toX, toY, empowered ? 13 : 9, 360, {
    tint: core,
    speed: { min: 80, max: 220 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.55, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 80,
  });
}
