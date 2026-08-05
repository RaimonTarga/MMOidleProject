import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import type { GameScene } from '../scenes/GameScene';

/**
 * Attack FX for the Conduit's summons. Range picks the style in
 * `spawn.ts` (resolveMinionType's sibling), so the formation's fighting
 * distance is legible from what its summons throw:
 *
 *   Vigil (close)      -> 'impact', the shared melee thump
 *   Procession (mid)   -> fxConduitBolt, a fast red travelling orb
 *   Harrier (far)      -> fxConduitBeam, a short-lived red beam
 *
 * Both ranged styles use one red ramp on purpose: shape separates them far more
 * legibly than hue at these sizes, and a single Conduit red keeps the summons'
 * output tied to the deep-red robe rather than to their own bone bodies.
 *
 * Distinct from `fx/laser.ts`, which is the Slinger's PERSISTENT beam driven by
 * render state across snapshots. These are one-shot, fire-and-forget.
 */

/** Harrier: a beam that snaps on and fades inside ~140ms. */
export function fxConduitBeam(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  // Three stacked strokes: wide soft glow, mid body, hot core. Shares the
  // bolt's red ramp — the two read apart by SHAPE (instant line vs travelling
  // orb), so they do not also need separate hues.
  g.lineStyle(7, 0x992430, 0.20);
  g.lineBetween(fromX, fromY, toX, toY);
  g.lineStyle(3.5, 0xff4455, 0.55);
  g.lineBetween(fromX, fromY, toX, toY);
  g.lineStyle(1.5, 0xffe8e6, 0.95);
  g.lineBetween(fromX, fromY, toX, toY);
  g.fillStyle(0xffe8e6, 0.8);
  g.fillCircle(toX, toY, 3.5);
  g.fillStyle(0xff4455, 0.28);
  g.fillCircle(toX, toY, 8);

  scene.tweens.add({
    targets: g,
    alpha: 0,
    duration: 140,
    ease: 'Quad.easeOut',
    onComplete: () => g.destroy(),
  });

  burstFx(scene, 'ptx-dot', toX, toY, 5, 200, {
    tint: 0xff4455,
    speed: { min: 40, max: 130 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 1, end: 0 },
  });
}

/**
 * Procession: the same travelling-orb shape as `fxMagic`, but red and roughly
 * 40% faster (120ms vs 200ms) so a mid-range formation reads as a quicker,
 * closer-quarters cadence than the Harrier's beam.
 */
export function fxConduitBolt(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const orb = scene.add.circle(fromX, fromY, 5, 0xff3344).setDepth(DEPTH.FX);

  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(i * 28, () => {
      const trail = scene.add
        .circle(orb.x, orb.y, 2.5 - i * 0.5, 0xff8899, 0.75)
        .setDepth(DEPTH.FX);
      scene.tweens.add({
        targets: trail,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 140,
        onComplete: () => trail.destroy(),
      });
    });
  }

  scene.tweens.add({
    targets: orb,
    x: toX,
    y: toY,
    duration: 120,
    ease: 'Quad.easeIn',
    onComplete: () => {
      orb.destroy();
      const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      ring.lineStyle(2.5, 0xff8899, 1);
      ring.strokeCircle(0, 0, 5);
      scene.tweens.add({
        targets: ring,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 200,
        onComplete: () => ring.destroy(),
      });

      burstFx(scene, 'ptx-dot', toX, toY, 8, 240, {
        tint: 0xff3344,
        speed: { min: 50, max: 170 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
      });
    },
  });
}
