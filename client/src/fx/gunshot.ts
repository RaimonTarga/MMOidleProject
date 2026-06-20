import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Duelist exploding-clip shot — a fat, hot-red tracer with a heavy muzzle flash,
 * a bright impact bloom and a generous spark burst. Reads as a noticeably more
 * powerful round than the standard gunshot.
 */
export function fxDuelistShot(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number): void {
  const core = 0xffe2c0;   // near-white hot core
  const red  = 0xff3322;   // angry red body

  const g = scene.add.graphics().setDepth(DEPTH.FX);
  g.lineStyle(9, red, 0.22);
  g.lineBetween(fromX, fromY, toX, toY);
  g.lineStyle(5, red, 0.85);
  g.lineBetween(fromX, fromY, toX, toY);
  g.lineStyle(2, core, 1);
  g.lineBetween(fromX, fromY, toX, toY);
  scene.tweens.add({ targets: g, alpha: 0, duration: 140, ease: 'Quad.easeIn', onComplete: () => g.destroy() });

  const muzzle = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  muzzle.fillStyle(red, 0.55);
  muzzle.fillCircle(0, 0, 14);
  muzzle.fillStyle(core, 0.9);
  muzzle.fillCircle(0, 0, 7);
  scene.tweens.add({ targets: muzzle, alpha: 0, scaleX: 2.4, scaleY: 2.4, duration: 120, onComplete: () => muzzle.destroy() });

  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(red, 0.5);
  flash.fillCircle(0, 0, 26);
  flash.fillStyle(core, 0.9);
  flash.fillCircle(0, 0, 13);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 2.8, scaleY: 2.8, duration: 220, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });

  const travelAngleDeg = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
  const backDeg = (travelAngleDeg + 180 + 360) % 360;
  burstFx(scene, 'ptx-spark', toX, toY, 16, 340, {
    tint: red,
    speed: { min: 110, max: 340 },
    angle: { min: backDeg - 50, max: backDeg + 50 },
    scale: { start: 1.2, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}

/**
 * Dualslinger on-hit shot (the odd, 2× on-hit round). A cool electric-blue tracer
 * with a crisp cyan impact spark — visually distinct from the warm standard/attack
 * shot, so the alternating attack/on-hit rhythm reads at a glance.
 */
export function fxAltShot(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number): void {
  const core = 0xf8fc03;   // yellow core
  const blue = 0x3aa0ff;   // electric blue body

  const g = scene.add.graphics().setDepth(DEPTH.FX);
  g.lineStyle(6, blue, 0.2);
  g.lineBetween(fromX, fromY, toX, toY);
  g.lineStyle(3, blue, 0.85);
  g.lineBetween(fromX, fromY, toX, toY);
  g.lineStyle(1.5, core, 1);
  g.lineBetween(fromX, fromY, toX, toY);
  scene.tweens.add({ targets: g, alpha: 0, duration: 110, ease: 'Quad.easeIn', onComplete: () => g.destroy() });

  const muzzle = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  muzzle.fillStyle(blue, 0.5);
  muzzle.fillCircle(0, 0, 9);
  muzzle.fillStyle(core, 0.85);
  muzzle.fillCircle(0, 0, 4.5);
  scene.tweens.add({ targets: muzzle, alpha: 0, scaleX: 2, scaleY: 2, duration: 100, onComplete: () => muzzle.destroy() });

  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(blue, 0.5);
  flash.fillCircle(0, 0, 16);
  flash.fillStyle(core, 0.85);
  flash.fillCircle(0, 0, 8);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 2.6, scaleY: 2.6, duration: 170, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });

  const travelAngleDeg = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
  const backDeg = (travelAngleDeg + 180 + 360) % 360;
  burstFx(scene, 'ptx-spark', toX, toY, 9, 240, {
    tint: blue,
    speed: { min: 90, max: 230 },
    angle: { min: backDeg - 40, max: backDeg + 40 },
    scale: { start: 0.85, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}

/**
 * Bounty Hunter Death Mark detonation — a small, punchy explosion on the target:
 * a hot core flash, an expanding orange shockwave ring, and an outward spark burst.
 */
export function fxDeathMarkBlast(scene: GameScene, x: number, y: number): void {
  if (document.hidden) return;
  const orange = 0xff8833;
  const core   = 0xfff0d0;

  // Core flash
  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(core, 0.95);
  flash.fillCircle(0, 0, 10);
  flash.fillStyle(orange, 0.5);
  flash.fillCircle(0, 0, 18);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 200, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });

  // Expanding shockwave ring
  const ring = scene.add.graphics().setDepth(DEPTH.FX);
  const s = { r: 6, alpha: 0.9 };
  scene.tweens.add({
    targets: s, r: 38, alpha: 0, duration: 280, ease: 'Cubic.Out',
    onUpdate: () => {
      ring.clear();
      ring.lineStyle(3, orange, s.alpha);
      ring.strokeCircle(x, y, s.r);
    },
    onComplete: () => ring.destroy(),
  });

  burstFx(scene, 'ptx-spark', x, y, 12, 320, {
    tint: orange,
    speed: { min: 120, max: 300 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.0, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}

export function fxGunshot(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number, empowered: boolean, durationScale = 1): void {
  const color = empowered ? 0xffee66 : 0xddeeff;
  const width = empowered ? 2.5 : 1.5;
  const s = Math.max(0.2, durationScale);

  const g = scene.add.graphics().setDepth(DEPTH.FX);
  g.lineStyle(width + 3, color, 0.15);
  g.lineBetween(fromX, fromY, toX, toY);
  g.lineStyle(width, color, 1);
  g.lineBetween(fromX, fromY, toX, toY);
  scene.tweens.add({ targets: g, alpha: 0, duration: 90 * s, ease: 'Quad.easeIn', onComplete: () => g.destroy() });

  const muzzle = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  muzzle.fillStyle(color, 0.7);
  muzzle.fillCircle(0, 0, empowered ? 7 : 4);
  scene.tweens.add({ targets: muzzle, alpha: 0, scaleX: 2, scaleY: 2, duration: 80 * s, onComplete: () => muzzle.destroy() });

  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(color, 0.88);
  flash.fillCircle(0, 0, empowered ? 16 : 8);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 150 * s, onComplete: () => flash.destroy() });

  const travelAngleDeg = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
  const backDeg = (travelAngleDeg + 180 + 360) % 360;
  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 10 : 5, (empowered ? 280 : 190) * s, {
    tint: color,
    speed: { min: 80, max: empowered ? 260 : 180 },
    angle: { min: backDeg - 40, max: backDeg + 40 },
    scale: { start: empowered ? 1.0 : 0.65, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
