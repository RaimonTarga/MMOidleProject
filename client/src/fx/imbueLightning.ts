import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';

/**
 * Imbue Lightning — the storm sitting in your hands, waiting.
 *
 * Two distinct cues, because the ability has two distinct moments and a player
 * has to be able to tell them apart:
 *
 *  - {@link fxImbueCast} fires ONCE when the wind-up resolves: the charge
 *    arriving.
 *  - {@link fxImbueCrackle} fires on each buffed hit: the charge being spent.
 *
 * There is no timed aura here on purpose. The window is spent in HITS, not in
 * seconds, so a fading ring would be a lie about how long it lasts — the buff
 * bar's charge count is the honest readout, and the per-hit crackle is what
 * tells you a charge just went.
 */

const ARC_BRIGHT = 0xe4d9ff;
const ARC_CORE = 0xc77dff;

/**
 * One jagged arc, as a polyline with randomised perpendicular kinks. Lightning
 * has to be drawn with hard angles — a smooth curve reads as magic, not voltage.
 */
function drawArc(
  gfx: Phaser.GameObjects.Graphics,
  from: { x: number; y: number },
  to: { x: number; y: number },
  jaggedness: number,
  width: number,
  color: number,
  alpha: number,
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const px = -(dy / length);
  const py = dx / length;
  const steps = 5;

  gfx.lineStyle(width, color, alpha);
  gfx.beginPath();
  gfx.moveTo(from.x, from.y);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const kink = (Math.random() - 0.5) * jaggedness;
    gfx.lineTo(from.x + dx * t + px * kink, from.y + dy * t + py * kink);
  }
  gfx.lineTo(to.x, to.y);
  gfx.strokePath();
}

/** A ring of arcs crawling around the character. */
function crackleRing(
  scene: GameScene,
  x: number,
  y: number,
  opts: { arcs: number; radius: number; jaggedness: number; durationMs: number },
): void {
  const gfx = scene.add.graphics().setDepth(DEPTH.FX);
  const cy = y - 10;

  const redraw = (): void => {
    gfx.clear();
    for (let i = 0; i < opts.arcs; i++) {
      const a0 = (Math.PI * 2 * i) / opts.arcs + Math.random() * 0.4;
      const a1 = a0 + 0.7 + Math.random() * 0.6;
      const from = {
        x: x + Math.cos(a0) * opts.radius,
        y: cy + Math.sin(a0) * opts.radius * 0.7,
      };
      const to = {
        x: x + Math.cos(a1) * opts.radius,
        y: cy + Math.sin(a1) * opts.radius * 0.7,
      };
      drawArc(gfx, from, to, opts.jaggedness, 4, ARC_CORE, 0.5);
      drawArc(gfx, from, to, opts.jaggedness, 1.6, ARC_BRIGHT, 0.95);
    }
  };

  redraw();
  // Re-randomise a few times so the arcs FLICKER. A static bolt reads as a
  // decal; lightning has to move or it stops looking like lightning.
  const flickers = Math.max(1, Math.round(opts.durationMs / 70));
  let done = 0;
  const timer = scene.time.addEvent({
    delay: 70,
    repeat: flickers - 1,
    callback: () => {
      done++;
      redraw();
      gfx.setAlpha(Math.max(0, 1 - done / flickers));
    },
  });

  scene.tweens.add({
    targets: gfx,
    alpha: 0,
    duration: opts.durationMs,
    ease: 'Quad.easeIn',
    onComplete: () => {
      timer.remove();
      gfx.destroy();
    },
  });
}

/** The wind-up resolving: the storm arrives. Big, bright, unmistakable. */
export function fxImbueCast(scene: GameScene, x: number, y: number): void {
  crackleRing(scene, x, y, { arcs: 7, radius: 30, jaggedness: 16, durationMs: 620 });

  // A vertical strike into the character, so the charge reads as coming FROM
  // somewhere rather than simply appearing around them.
  const bolt = scene.add.graphics().setDepth(DEPTH.FX);
  drawArc(bolt, { x, y: y - 120 }, { x, y: y - 8 }, 22, 5, ARC_CORE, 0.55);
  drawArc(bolt, { x, y: y - 120 }, { x, y: y - 8 }, 22, 2, ARC_BRIGHT, 1);
  scene.tweens.add({
    targets: bolt,
    alpha: 0,
    duration: 300,
    ease: 'Quad.easeIn',
    onComplete: () => bolt.destroy(),
  });

  const flash = scene.add.circle(x, y - 10, 26, ARC_BRIGHT, 0.5).setDepth(DEPTH.FX);
  scene.tweens.add({
    targets: flash,
    scale: 1.9,
    alpha: 0,
    duration: 280,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });
}

/**
 * A charge being spent on a landed hit. Deliberately much quieter than the cast:
 * this fires up to five times in quick succession, and at cast volume it would
 * bury every other cue on screen.
 */
export function fxImbueCrackle(scene: GameScene, x: number, y: number): void {
  crackleRing(scene, x, y, { arcs: 3, radius: 20, jaggedness: 10, durationMs: 240 });
}
