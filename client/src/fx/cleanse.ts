import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const PURE_WHITE = 0xffffff;
const PURE_SOFT = 0xddeeff; // faintly cool white

/**
 * Cleanse (cleanse Guard): a pillar of white purifying light crashes over the
 * player, carrying off the rot. A hard flash blooms at the body, a light column
 * sweeps upward, three clean rings ripple out, and motes stream off the player
 * like impurities being drawn away. Pure white keeps it legible as "purge",
 * distinct from the blue Brace and green Second Wind.
 */
export function fxCleanse(scene: GameScene, x: number, y: number): void {
  const cy = y - 6;

  // Central flash — a hard white bloom at the body.
  const flash = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  flash.fillStyle(PURE_WHITE, 0.9);
  flash.fillCircle(0, 0, 24);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.6,
    scaleY: 2.6,
    duration: 240,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Pillar of light — a tall column that drops over the player, holds a beat,
  // then narrows and lifts away. The big vertical read makes the purge landmark
  // visible across the whole screen.
  const pillar = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  pillar.fillStyle(PURE_WHITE, 0.32);
  pillar.fillRect(-16, -78, 32, 90);
  pillar.fillStyle(PURE_SOFT, 0.5);
  pillar.fillRect(-7, -78, 14, 90);
  pillar.setScale(1.6, 0);
  pillar.setAlpha(1);
  scene.tweens.add({
    targets: pillar,
    scaleX: 1,
    scaleY: 1,
    duration: 150,
    ease: 'Quad.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: pillar,
        scaleX: 0.25,
        alpha: 0,
        delay: 240,
        duration: 380,
        ease: 'Sine.easeIn',
        onComplete: () => pillar.destroy(),
      });
    },
  });

  // Three clean rings rippling outward from the feet.
  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(i * 90, () => {
      const ring = scene.add.graphics({ x, y: y + 8 }).setDepth(DEPTH.FX);
      ring.lineStyle(3.5 - i, i === 0 ? PURE_WHITE : PURE_SOFT, 0.9);
      ring.strokeCircle(0, 0, 10 + i * 7);
      scene.tweens.add({
        targets: ring,
        scaleX: 3.4 + i * 0.8,
        scaleY: 1.7 + i * 0.4,
        alpha: 0,
        duration: 460 + i * 90,
        ease: 'Quad.easeOut',
        onComplete: () => ring.destroy(),
      });
    });
  }

  // A rising sheet of light — a thin white glow that sweeps up the body.
  const sheet = scene.add.graphics({ x, y: y + 14 }).setDepth(DEPTH.FX);
  sheet.fillStyle(PURE_WHITE, 0.5);
  sheet.fillEllipse(0, 0, 40, 16);
  scene.tweens.add({
    targets: sheet,
    y: y - 52,
    scaleX: 0.35,
    scaleY: 1.8,
    alpha: 0,
    duration: 520,
    ease: 'Sine.easeIn',
    onComplete: () => sheet.destroy(),
  });

  // Impurities drawn upward — white motes and sparks streaming off the player.
  burstFx(scene, 'ptx-dot', x, y + 6, 20, 780, {
    tint: PURE_SOFT,
    speed: { min: 50, max: 140 },
    angle: { min: 245, max: 295 },
    scale: { start: 0.65, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -110,
  });
  burstFx(scene, 'ptx-spark', x, cy, 10, 480, {
    tint: PURE_WHITE,
    speed: { min: 70, max: 190 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
  });
}
