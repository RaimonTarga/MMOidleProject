import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const MEND_LIGHT = 0xbdf3e4;
const MEND_CORE = 0x4fbfa0;

/**
 * Recuperate (long Recovery Guard): a slow, patient mend.
 *
 * The weak/long counterpart to Second Wind's strong/short burst, and the FX says
 * so: no snap, no bloom. Three rings rise over the better part of a second and
 * motes drift up lazily, so a glance tells the player which of the two Recovery
 * buttons is running without reading the buff bar.
 */
export function fxRecuperate(scene: GameScene, x: number, y: number): void {
  // Rings rising up the body, unhurried and evenly spaced.
  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(i * 190, () => {
      const ring = scene.add.graphics({ x, y: y + 10 }).setDepth(DEPTH.FX);
      ring.lineStyle(2.5, i === 1 ? MEND_LIGHT : MEND_CORE, 0.75);
      ring.strokeEllipse(0, 0, 34, 13);
      scene.tweens.add({
        targets: ring,
        y: y - 46,
        scaleX: 0.55,
        alpha: 0,
        duration: 900,
        ease: 'Sine.easeInOut',
        onComplete: () => ring.destroy(),
      });
    });
  }

  // A soft held glow at the chest — present, but never bright enough to be
  // mistaken for a burst heal.
  const glow = scene.add.graphics({ x, y: y - 10 }).setDepth(DEPTH.FX);
  glow.fillStyle(MEND_CORE, 0.28);
  glow.fillCircle(0, 0, 18);
  glow.setAlpha(0);
  scene.tweens.add({
    targets: glow,
    alpha: 1,
    duration: 380,
    ease: 'Sine.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: glow,
        alpha: 0,
        scaleX: 1.4,
        scaleY: 1.4,
        delay: 260,
        duration: 700,
        ease: 'Sine.easeInOut',
        onComplete: () => glow.destroy(),
      });
    },
  });

  // Slow drifting motes.
  burstFx(scene, 'ptx-dot', x, y + 4, 16, 1400, {
    tint: MEND_LIGHT,
    speed: { min: 15, max: 45 },
    angle: { min: 250, max: 290 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: -30,
  });
}
