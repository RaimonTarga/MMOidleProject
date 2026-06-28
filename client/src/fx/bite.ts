import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const FANG = 0xf2eede; // bone-white fangs
const GORE = 0xcc3322; // red bite spark

/** Draw one row of fangs (triangles) along a shallow line, pointing in `dir` (±y). */
function drawJaw(g: Phaser.GameObjects.Graphics, w: number, toothLen: number, dir: number, count: number): void {
  g.fillStyle(FANG, 1);
  const step = (2 * w) / count;
  for (let i = 0; i < count; i++) {
    const x0 = -w + i * step;
    const x1 = x0 + step;
    g.fillTriangle(x0, 0, x1, 0, (x0 + x1) / 2, dir * toothLen);
  }
  // Gum line backing the teeth.
  g.fillStyle(FANG, 0.7);
  g.fillRect(-w, dir < 0 ? -2.5 : 0, 2 * w, 2.5);
}

/**
 * Bite — two rows of fangs snap shut on the target. The jaws start apart, drive
 * together in a fast chomp, then a red bite-spark flashes and the fangs recoil
 * and fade. Used by fanged predators (wolves, hounds, stalkers) in place of the
 * generic slash, so a pack reads as something that tears rather than slices.
 */
export function fxBite(scene: GameScene, x: number, y: number, empowered: boolean): void {
  const w = empowered ? 24 : 19;
  const toothLen = empowered ? 11 : 9;
  const count = 5;
  const gapStart = empowered ? 30 : 24;
  const gapEnd = 3;
  const snapMs = 110;

  // Upper jaw (teeth point down) drops in from above.
  const upper = scene.add.graphics({ x, y: y - gapStart }).setDepth(DEPTH.FX);
  drawJaw(upper, w, toothLen, 1, count);
  // Lower jaw (teeth point up) drives up from below.
  const lower = scene.add.graphics({ x, y: y + gapStart }).setDepth(DEPTH.FX);
  drawJaw(lower, w, toothLen, -1, count);

  const fade = (g: Phaser.GameObjects.Graphics) =>
    scene.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: 1.15,
      duration: 150,
      delay: 60,
      ease: 'Quad.easeOut',
      onComplete: () => g.destroy(),
    });

  scene.tweens.add({
    targets: upper,
    y: y - gapEnd,
    duration: snapMs,
    ease: 'Back.easeIn',
    onComplete: () => fade(upper),
  });
  scene.tweens.add({
    targets: lower,
    y: y + gapEnd,
    duration: snapMs,
    ease: 'Back.easeIn',
    onComplete: () => fade(lower),
  });

  // The chomp connects: a quick flash + a spray of red right when the jaws meet.
  scene.time.delayedCall(snapMs, () => {
    const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    flash.fillStyle(GORE, 0.55);
    flash.fillCircle(0, 0, empowered ? 16 : 12);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    burstFx(scene, 'ptx-dot', x, y, empowered ? 10 : 7, 320, {
      tint: GORE,
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: 160,
    });
  });
}
