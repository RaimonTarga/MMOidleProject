import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const RAGE_BRIGHT = 0xffd07a;
const RAGE_CORE = 0xff6a1e;

/**
 * Frenzy (offensive-buff Technique): speed lines whip outward and the player
 * flares hot.
 *
 * Frenzy grants attack SPEED and nothing else, so the FX is pure motion — radial
 * streaks and a quick double flare, with no shield, no impact, no numbers
 * anywhere. A player who sees it should expect their hands to move faster, not
 * their hits to land harder.
 */
export function fxFrenzy(scene: GameScene, x: number, y: number): void {
  const cy = y - 6;

  // Radial speed streaks, drawn as short chords sweeping outward.
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10 + 0.15;
    const streak = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
    streak.lineStyle(3, i % 2 === 0 ? RAGE_CORE : RAGE_BRIGHT, 0.9);
    streak.beginPath();
    streak.moveTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
    streak.lineTo(Math.cos(angle) * 34, Math.sin(angle) * 34);
    streak.strokePath();
    scene.tweens.add({
      targets: streak,
      x: x + Math.cos(angle) * 22,
      y: cy + Math.sin(angle) * 22,
      alpha: 0,
      duration: 320,
      delay: (i % 3) * 40,
      ease: 'Quad.easeOut',
      onComplete: () => streak.destroy(),
    });
  }

  // Two quick flares — the tempo of the ability stated in the FX itself.
  for (let i = 0; i < 2; i++) {
    scene.time.delayedCall(i * 130, () => {
      const flare = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
      flare.fillStyle(RAGE_BRIGHT, 0.55);
      flare.fillCircle(0, 0, 15);
      scene.tweens.add({
        targets: flare,
        alpha: 0,
        scaleX: 2.1,
        scaleY: 2.1,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => flare.destroy(),
      });
    });
  }

  // Embers flung off, fast and short-lived.
  burstFx(scene, 'ptx-spark', x, cy, 18, 340, {
    tint: RAGE_CORE,
    speed: { min: 150, max: 340 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
