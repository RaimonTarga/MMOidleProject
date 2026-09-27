/**
 * VOLCANIC bosses, animated (premium pass, 2026-09-27) — the heat race.
 *
 *   VENTS      a vent about to go swells: the magma glows, bubbles and shimmers as
 *              the clock (zone renderer), then a lava geyser erupts from it.
 *   FINAL      the Final Eruption / Cataclysm cast lives in cataclysm.ts; the body
 *              glow while it charges is the `final-charge` aura.
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { impact } from './impactFeel';
import { ring } from './bossKit';

const LAVA = 0xff7a1a;
const LAVA_CORE = 0xfff1c0;
const LAVA_DEEP = 0xa32000;

/** The vent's telegraph: a swelling glow, bubbles and heat shimmer as it builds. */
export function drawVentTelegraph(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  progress: number,
  seed: number,
): void {
  const t = performance.now() / 1000;
  // Swelling glow.
  g.fillStyle(LAVA_DEEP, 0.18 + 0.2 * progress);
  g.fillEllipse(x, y, radius * 2, radius * 1.1);
  g.fillStyle(LAVA, 0.12 + 0.35 * progress * progress);
  g.fillEllipse(x, y, radius * 1.3 * (0.6 + 0.4 * progress), radius * 0.7 * (0.6 + 0.4 * progress));
  // Bubbles popping faster as it builds.
  const bubbles = 6;
  for (let i = 0; i < bubbles; i++) {
    const phase = (t * (0.8 + progress * 2.5) + i / bubbles + seed) % 1;
    const a = (i / bubbles) * Math.PI * 2 + seed;
    const d = radius * 0.5 * ((i * 7) % 5) / 5;
    g.lineStyle(2, LAVA_CORE, (1 - phase) * (0.3 + 0.6 * progress));
    g.strokeCircle(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.5, 3 + phase * 8);
  }
  // Heat shimmer rising in the last half.
  if (progress > 0.5) {
    const k = (progress - 0.5) / 0.5;
    for (let i = 0; i < 4; i++) {
      const ox = (i - 1.5) * radius * 0.3;
      const rise = ((t * 60 + i * 20) % 50);
      g.lineStyle(2, LAVA_CORE, 0.35 * k);
      g.lineBetween(x + ox, y - rise, x + ox + Math.sin(t * 8 + i) * 4, y - rise - 14);
    }
  }
}

/** A vent erupting: a lava geyser, molten droplets and a heat ring. */
export function fxVentEruption(scene: GameScene, x: number, y: number, radius: number): void {
  const column = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  column.fillStyle(LAVA_DEEP, 0.85);
  column.fillEllipse(0, -70, radius * 0.9, 170);
  column.fillStyle(LAVA, 0.9);
  column.fillEllipse(0, -70, radius * 0.55, 150);
  column.fillStyle(LAVA_CORE, 0.85);
  column.fillEllipse(0, -60, radius * 0.22, 120);
  column.setScale(0.4, 0.05);
  scene.tweens.add({
    targets: column,
    scaleX: 1,
    scaleY: 1,
    duration: 130,
    ease: 'Quad.easeOut',
    onComplete: () => scene.tweens.add({
      targets: column, scaleY: 0.2, scaleX: 1.3, alpha: 0, duration: 460, ease: 'Quad.easeIn',
      onComplete: () => column.destroy(),
    }),
  });
  burstFx(scene, 'ptx-dot', x, y - 40, 22, 900, {
    tint: [LAVA, LAVA_CORE, LAVA_DEEP],
    speed: { min: 120, max: 300 },
    angle: { min: 220, max: 320 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 520,
  });
  burstFx(scene, 'ptx-spark', x, y - 30, 16, 1100, {
    tint: [LAVA_CORE, LAVA],
    speed: { min: 40, max: 120 },
    angle: { min: 240, max: 300 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -60,
  });
  ring(scene, x, y, LAVA, { from: radius * 0.6, scale: 1.8, width: 4, flat: true, ms: 420 });
  impact(scene, 'light', { x, y });
}
