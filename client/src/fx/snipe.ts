import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const TRACER_BRIGHT = 0xf2fbff;
const TRACER_CORE = 0x7fd4ff;

/**
 * Snipe (long-range cast): a tracer draws the whole distance the shot crossed.
 *
 * The line from muzzle to target IS the ability. Snipe reaches 300px past the
 * player's own range and spends real damage buying it, so the FX has to make
 * that distance visible — otherwise a melee character firing one just sees a
 * number appear on something far away with no explanation. Cold white-blue, so
 * it never reads as one of the warm-toned melee Techniques.
 */
export function fxSnipe(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const originY = fromY - 8;

  // The tracer: a thin bright line along the entire flight path, drawn once and
  // faded fast so it reads as a shot rather than a beam.
  const tracer = scene.add.graphics().setDepth(DEPTH.FX);
  tracer.lineStyle(2, TRACER_CORE, 0.85);
  tracer.beginPath();
  tracer.moveTo(fromX, originY);
  tracer.lineTo(toX, toY);
  tracer.strokePath();
  tracer.lineStyle(1, TRACER_BRIGHT, 1);
  tracer.beginPath();
  tracer.moveTo(fromX, originY);
  tracer.lineTo(toX, toY);
  tracer.strokePath();
  scene.tweens.add({
    targets: tracer,
    alpha: 0,
    duration: 260,
    ease: 'Quad.easeOut',
    onComplete: () => tracer.destroy(),
  });

  // Muzzle flash at the shooter, so the shot has an author.
  const muzzle = scene.add.graphics({ x: fromX, y: originY }).setDepth(DEPTH.FX);
  muzzle.fillStyle(TRACER_BRIGHT, 0.9);
  muzzle.fillCircle(0, 0, 9);
  scene.tweens.add({
    targets: muzzle,
    alpha: 0,
    scaleX: 2.2,
    scaleY: 2.2,
    duration: 170,
    ease: 'Expo.easeOut',
    onComplete: () => muzzle.destroy(),
  });

  // Impact: a tight, deep punch rather than a wide splash — Snipe is single
  // target, and a broad bloom would suggest an AoE it does not have.
  const hit = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  hit.fillStyle(TRACER_BRIGHT, 0.95);
  hit.fillCircle(0, 0, 13);
  scene.tweens.add({
    targets: hit,
    alpha: 0,
    scaleX: 2,
    scaleY: 2,
    duration: 240,
    ease: 'Expo.easeOut',
    onComplete: () => hit.destroy(),
  });

  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  ring.lineStyle(2, TRACER_CORE, 0.9);
  ring.strokeCircle(0, 0, 10);
  scene.tweens.add({
    targets: ring,
    scaleX: 3,
    scaleY: 3,
    alpha: 0,
    duration: 340,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  // Spray thrown back along the shot line.
  const back = (Math.atan2(fromY - toY, fromX - toX) * 180) / Math.PI;
  burstFx(scene, 'ptx-spark', toX, toY, 16, 340, {
    tint: TRACER_CORE,
    speed: { min: 120, max: 300 },
    angle: { min: back - 55, max: back + 55 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
  });
}
