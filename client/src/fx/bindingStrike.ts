import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const BIND_BRIGHT = 0xeaf4ff;
const BIND_CORE = 0x6fa8dc;
const BIND_DEEP = 0x2e5f8f;

/**
 * Binding Strike (root Technique): bands clamp shut around the target's feet.
 *
 * Root stops MOVEMENT and nothing else, so the FX stays entirely at ground level:
 * the target's body is untouched, and only the ground under it is locked. That is
 * the visual difference from Stunning Strike, which goes at the head — the two
 * abilities are different rungs of the control ladder, not different numbers, and
 * a player should be able to tell which one landed at a glance.
 */
export function fxBindingStrike(
  scene: GameScene,
  x: number,
  y: number,
  empowered: boolean,
): void {
  const gy = y + 16;

  // Four bands snapping inward and closing.
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i + Math.PI / 4;
    const band = scene.add.graphics({ x, y: gy }).setDepth(DEPTH.FX);
    band.lineStyle(empowered ? 5 : 4, BIND_CORE, 0.95);
    band.beginPath();
    band.arc(0, 0, 20, angle - 0.55, angle + 0.55, false);
    band.strokePath();
    band.setScale(2.1);
    band.setAlpha(0);
    scene.tweens.add({
      targets: band,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 160,
      ease: 'Quad.easeIn',
      onComplete: () => {
        scene.tweens.add({
          targets: band,
          alpha: 0,
          delay: 220,
          duration: 380,
          onComplete: () => band.destroy(),
        });
      },
    });
  }

  // The lock: a bright ring that flashes the instant the bands meet.
  scene.time.delayedCall(160, () => {
    const lock = scene.add.graphics({ x, y: gy }).setDepth(DEPTH.FX);
    lock.lineStyle(3, BIND_BRIGHT, 1);
    lock.strokeEllipse(0, 0, 42, 17);
    scene.tweens.add({
      targets: lock,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 340,
      ease: 'Expo.easeOut',
      onComplete: () => lock.destroy(),
    });

    burstFx(scene, 'ptx-spark', x, gy, empowered ? 16 : 12, 380, {
      tint: BIND_BRIGHT,
      speed: { min: 80, max: 210 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.85, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: 90,
    });
  });

  // Spikes driven into the ground around the target — the anchor, held longer
  // than the snap so the root reads as a state rather than an impact.
  const anchor = scene.add.graphics({ x, y: gy }).setDepth(DEPTH.FX);
  anchor.fillStyle(BIND_DEEP, 0.75);
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6;
    anchor.fillTriangle(
      Math.cos(a) * 24, Math.sin(a) * 10,
      Math.cos(a) * 16 - 3, Math.sin(a) * 7 + 4,
      Math.cos(a) * 16 + 3, Math.sin(a) * 7 - 4,
    );
  }
  scene.tweens.add({
    targets: anchor,
    alpha: 0,
    delay: 420,
    duration: 520,
    ease: 'Sine.easeIn',
    onComplete: () => anchor.destroy(),
  });
}
