import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Cinder Lord — Conflagration per-tick burn. Fires rapidly (every ~250ms) while
 * the inferno rages, so it's kept light: a short upward flame lick (a rising tongue
 * of fire that swells and fades) plus a few embers spitting upward. Reads as a
 * sustained raging blaze rather than the discrete on-hit fire pop (`fxFireFlame`).
 */
export function fxConflagrationTick(scene: GameScene, x: number, y: number): void {
  if (document.hidden) return;
  const hot    = 0xffd24a; // bright yellow core
  const flame  = 0xff5a14;
  const deep   = 0xcc1f08;

  // Rising flame tongue — a big vertical lick that grows then snuffs out.
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  const s = { h: 28, alpha: 0.9 };
  scene.tweens.add({
    targets: s, h: 90, alpha: 0, duration: 300, ease: 'Quad.easeOut',
    onUpdate: () => {
      g.clear();
      const w = Math.max(12, s.h * 0.5);
      // outer flame
      g.fillStyle(deep, s.alpha * 0.6);
      g.fillEllipse(x, y - s.h * 0.5, w * 1.3, s.h * 1.15);
      // mid flame
      g.fillStyle(flame, s.alpha * 0.8);
      g.fillEllipse(x, y - s.h * 0.55, w, s.h);
      // hot core
      g.fillStyle(hot, s.alpha);
      g.fillEllipse(x, y - s.h * 0.55, w * 0.45, s.h * 0.65);
    },
    onComplete: () => g.destroy(),
  });

  // Embers spitting upward — more, faster, farther.
  burstFx(scene, 'ptx-spark', x, y, 12, 620, {
    tint: hot,
    speed: { min: 90, max: 260 },
    angle: { min: 235, max: 305 },
    scale: { start: 1.4, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -120,
    rotate: { min: 0, max: 360 },
  });
  // Billowing flame body — fat fire motes filling the column.
  burstFx(scene, 'ptx-dot', x, y, 14, 520, {
    tint: flame,
    speed: { min: 40, max: 150 },
    angle: { min: 250, max: 290 },
    scale: { start: 2.2, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: -90,
  });
}
