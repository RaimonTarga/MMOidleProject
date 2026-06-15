import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Firebrand (Ignition) — the "searing brand" applied when a fresh target is
 * instantly loaded with every fire stack. A sharp branding flash (distinct from
 * the soft fire smog): a bright core flash, a fast-expanding sear ring, a quick
 * flame burst, and rising embers that linger like a fresh burn.
 */
export function fxFirebrand(scene: GameScene, x: number, y: number): void {
  if (document.hidden) return;
  const core   = 0xfff1c2; // white-hot center
  const orange = 0xff7a1a;
  const red    = 0xd62f12;

  // White-hot brand flash — quick pop at the strike point.
  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(core, 0.95);
  flash.fillCircle(0, 0, 10);
  flash.fillStyle(orange, 0.5);
  flash.fillCircle(0, 0, 18);
  scene.tweens.add({
    targets: flash, alpha: 0, scaleX: 2.4, scaleY: 2.4, duration: 240,
    ease: 'Quad.easeOut', onComplete: () => flash.destroy(),
  });

  // Searing ring — sharp expanding sear line that brands the target.
  const ring = scene.add.graphics().setDepth(DEPTH.FX);
  const s = { r: 6, alpha: 0.9 };
  scene.tweens.add({
    targets: s, r: 46, alpha: 0, duration: 360, ease: 'Cubic.Out',
    onUpdate: () => {
      ring.clear();
      ring.lineStyle(3, orange, s.alpha);
      ring.strokeCircle(x, y, s.r);
      ring.lineStyle(1.5, red, s.alpha * 0.8);
      ring.strokeCircle(x, y, s.r * 0.7);
    },
    onComplete: () => ring.destroy(),
  });

  // Flame burst — fast outward spray of fire motes.
  burstFx(scene, 'ptx-dot', x, y, 18, 520, {
    tint: orange,
    speed: { min: 40, max: 150 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.1, end: 0 },
    alpha: { start: 0.95, end: 0 },
  });
  // Rising embers — slow sparks drifting upward, the lingering brand.
  burstFx(scene, 'ptx-spark', x, y, 12, 900, {
    tint: core,
    speed: { min: 20, max: 70 },
    angle: { min: 230, max: 310 },
    scale: { start: 1.2, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -90,
    rotate: { min: 0, max: 360 },
  });
}
