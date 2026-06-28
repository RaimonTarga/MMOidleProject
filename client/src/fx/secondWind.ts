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
 * Second Wind (heal Guard): a green healing cross rises off the player while
 * motes of life drift upward and a soft ring blooms at their feet. The classic
 * "+" health glyph makes the recovery unmistakable, in restorative green to set
 * it apart from the blue Brace and white Cleanse guards.
 */
export function fxSecondWind(scene: GameScene, x: number, y: number): void {
  // Soft green bloom at the feet — the heal washing up over the body.
  const ring = scene.add.graphics({ x, y: y + 8 }).setDepth(DEPTH.FX);
  ring.lineStyle(3, HEAL_SOFT, 0.75);
  ring.strokeCircle(0, 0, 12);
  scene.tweens.add({
    targets: ring,
    scaleX: 3,
    scaleY: 1.5,
    alpha: 0,
    duration: 480,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  // The healing cross — pops in over the body, then floats up and fades.
  const cross = scene.add.graphics({ x, y: y - 18 }).setDepth(DEPTH.FX);
  healCross(cross, 16, 7, HEAL_BRIGHT, 1);
  healCross(cross, 16, 3, 0xffffff, 0.9); // bright inner highlight
  cross.setScale(0.4);
  cross.setAlpha(0);
  scene.tweens.add({
    targets: cross,
    scale: 1,
    alpha: 1,
    duration: 160,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: cross,
        y: y - 52,
        alpha: 0,
        duration: 620,
        ease: 'Sine.easeIn',
        onComplete: () => cross.destroy(),
      });
    },
  });

  // Motes of life rising off the player.
  burstFx(scene, 'ptx-dot', x, y, 12, 760, {
    tint: HEAL_BRIGHT,
    speed: { min: 30, max: 80 },
    angle: { min: 240, max: 300 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -70,
  });
}
