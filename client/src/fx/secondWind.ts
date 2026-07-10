import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const HEAL_BRIGHT = 0x9cff8a; // vivid leaf-green
const HEAL_SOFT = 0x55cc66; // deeper green

/** Draw a thick rounded healing cross (plus sign) centered at the local origin. */
function healCross(g: Phaser.GameObjects.Graphics, arm: number, thick: number, color: number, alpha: number): void {
  g.fillStyle(color, alpha);
  g.fillRect(-thick / 2, -arm, thick, arm * 2); // vertical bar
  g.fillRect(-arm, -thick / 2, arm * 2, thick); // horizontal bar
}

/**
 * Second Wind (heal Guard): a burst of restorative green — a bright flash at the
 * body, a big healing cross that pops in and floats off, a trail of smaller
 * crosses rising behind it, and blooming rings at the feet. The classic "+"
 * health glyph makes the recovery unmistakable, in green to set it apart from
 * the blue Brace and white Cleanse guards.
 */
export function fxSecondWind(scene: GameScene, x: number, y: number): void {
  // Green flash at the body — the heal hitting all at once.
  const flash = scene.add.graphics({ x, y: y - 8 }).setDepth(DEPTH.FX);
  flash.fillStyle(HEAL_BRIGHT, 0.65);
  flash.fillCircle(0, 0, 22);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.3,
    scaleY: 2.3,
    duration: 230,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Twin blooms at the feet — the heal washing up over the body.
  for (let i = 0; i < 2; i++) {
    scene.time.delayedCall(i * 110, () => {
      const ring = scene.add.graphics({ x, y: y + 8 }).setDepth(DEPTH.FX);
      ring.lineStyle(3.5 - i, i === 0 ? HEAL_SOFT : HEAL_BRIGHT, 0.85);
      ring.strokeCircle(0, 0, 12 + i * 5);
      scene.tweens.add({
        targets: ring,
        scaleX: 3.4 + i * 0.6,
        scaleY: 1.7 + i * 0.3,
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => ring.destroy(),
      });
    });
  }

  // The healing cross — pops in big over the body, then floats up and fades.
  const cross = scene.add.graphics({ x, y: y - 20 }).setDepth(DEPTH.FX);
  healCross(cross, 20, 9, HEAL_BRIGHT, 1);
  healCross(cross, 20, 4, 0xffffff, 0.95); // bright inner highlight
  cross.setScale(0.3);
  cross.setAlpha(0);
  scene.tweens.add({
    targets: cross,
    scale: 1.15,
    alpha: 1,
    duration: 150,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: cross,
        y: y - 60,
        scale: 0.9,
        alpha: 0,
        duration: 680,
        ease: 'Sine.easeIn',
        onComplete: () => cross.destroy(),
      });
    },
  });

  // A trail of smaller crosses rising behind the big one.
  const offsets = [-16, 14, -6];
  offsets.forEach((dx, i) => {
    scene.time.delayedCall(140 + i * 110, () => {
      const mini = scene.add.graphics({ x: x + dx, y: y - 6 }).setDepth(DEPTH.FX);
      healCross(mini, 8, 3.5, i % 2 === 0 ? HEAL_BRIGHT : HEAL_SOFT, 0.95);
      mini.setScale(0.5);
      mini.setAlpha(0);
      scene.tweens.add({
        targets: mini,
        y: y - 44 - i * 6,
        scale: 1,
        alpha: { from: 1, to: 0 },
        duration: 560,
        ease: 'Sine.easeOut',
        onComplete: () => mini.destroy(),
      });
    });
  });

  // Motes of life rising off the player.
  burstFx(scene, 'ptx-dot', x, y, 18, 820, {
    tint: HEAL_BRIGHT,
    speed: { min: 35, max: 100 },
    angle: { min: 235, max: 305 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -85,
  });
}
