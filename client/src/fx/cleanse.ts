import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const PURE_WHITE = 0xffffff;
const PURE_SOFT = 0xddeeff; // faintly cool white

/**
 * Cleanse (cleanse Guard): a bright white purifying wash sweeps up the player,
 * carrying off the rot. A flash blooms at the body, two clean rings ripple out,
 * and motes lift upward like impurities being drawn away. Pure white keeps it
 * legible as "purge", distinct from the blue Brace and green Second Wind.
 */
export function fxCleanse(scene: GameScene, x: number, y: number): void {
  const cy = y - 6;

  // Central flash — a quick white bloom at the body.
  const flash = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  flash.fillStyle(PURE_WHITE, 0.85);
  flash.fillCircle(0, 0, 18);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.1,
    scaleY: 2.1,
    duration: 200,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Two clean rings rippling outward from the feet.
  for (let i = 0; i < 2; i++) {
    const ring = scene.add.graphics({ x, y: y + 8 }).setDepth(DEPTH.FX);
    ring.lineStyle(3 - i, i === 0 ? PURE_WHITE : PURE_SOFT, 0.85);
    ring.strokeCircle(0, 0, 10 + i * 8);
    scene.tweens.add({
      targets: ring,
      scaleX: 3 + i,
      scaleY: 1.5 + i * 0.5,
      alpha: 0,
      duration: 420 + i * 90,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  // A rising sheet of light — a tall thin white glow that sweeps up the body.
  const sheet = scene.add.graphics({ x, y: y + 14 }).setDepth(DEPTH.FX);
  sheet.fillStyle(PURE_WHITE, 0.4);
  sheet.fillEllipse(0, 0, 34, 14);
  scene.tweens.add({
    targets: sheet,
    y: y - 40,
    scaleX: 0.4,
    scaleY: 1.6,
    alpha: 0,
    duration: 460,
    ease: 'Sine.easeIn',
    onComplete: () => sheet.destroy(),
  });

  // Impurities drawn upward — white motes streaming off the player.
  burstFx(scene, 'ptx-dot', x, y + 6, 14, 700, {
    tint: PURE_SOFT,
    speed: { min: 40, max: 110 },
    angle: { min: 250, max: 290 },
    scale: { start: 0.55, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -90,
  });
}
