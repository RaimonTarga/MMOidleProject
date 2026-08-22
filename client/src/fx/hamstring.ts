import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const SINEW_BRIGHT = 0xd8f07a;
const SINEW_CORE = 0x8fae2a;

/**
 * Hamstring (slow Technique): a low cut across the target's legs.
 *
 * Sits BELOW the target's centre, not through it — the whole point of the ability
 * is that it takes the legs and leaves everything else working, and a slash drawn
 * at chest height would read as ordinary damage. Two drag-marks fall away from
 * the cut to say "this thing is now moving slower", which is the part a player
 * cannot see in a damage number.
 */
export function fxHamstring(
  scene: GameScene,
  x: number,
  y: number,
  empowered: boolean,
): void {
  const cy = y + 14; // low: at the legs
  const width = empowered ? 34 : 28;

  // The cut — a flat, shallow slash under the body.
  const cut = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  cut.lineStyle(empowered ? 5 : 4, SINEW_BRIGHT, 1);
  cut.beginPath();
  cut.moveTo(-width, 6);
  cut.lineTo(width, -4);
  cut.strokePath();
  scene.tweens.add({
    targets: cut,
    alpha: 0,
    scaleX: 1.35,
    duration: 260,
    ease: 'Quad.easeOut',
    onComplete: () => cut.destroy(),
  });

  // Drag marks trailing behind the cut — the "it can't keep up" beat.
  for (let i = 0; i < 2; i++) {
    const drag = scene.add.graphics({ x, y: cy + 4 + i * 5 }).setDepth(DEPTH.FX);
    drag.lineStyle(2, SINEW_CORE, 0.7 - i * 0.2);
    drag.beginPath();
    drag.moveTo(-width * 0.7, 0);
    drag.lineTo(width * 0.5, 0);
    drag.strokePath();
    scene.tweens.add({
      targets: drag,
      x: x - 16 - i * 6,
      alpha: 0,
      duration: 400 + i * 120,
      ease: 'Sine.easeOut',
      onComplete: () => drag.destroy(),
    });
  }

  // A squat ring at the feet — the slow settling onto the target.
  const ring = scene.add.graphics({ x, y: cy + 6 }).setDepth(DEPTH.FX);
  ring.lineStyle(2.5, SINEW_CORE, 0.8);
  ring.strokeEllipse(0, 0, 30, 11);
  scene.tweens.add({
    targets: ring,
    scaleX: 1.9,
    scaleY: 1.9,
    alpha: 0,
    duration: 460,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  // Low spray, thrown sideways rather than up.
  burstFx(scene, 'ptx-spark', x, cy, empowered ? 14 : 10, 320, {
    tint: SINEW_BRIGHT,
    speed: { min: 70, max: 190 },
    angle: { min: 150, max: 210 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 140,
  });
}
