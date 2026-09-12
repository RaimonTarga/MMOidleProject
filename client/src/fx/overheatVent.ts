import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Melter (`reload-heavy-a`) overheating.
 *
 * The laser itself was already rendered, but the moment it hits 100% Heat and
 * locks out had nothing: the beam simply stopped. That is the one beat in the
 * mechanic the player most needs to feel, because it is a self-inflicted
 * downtime rather than a target dying or a reload finishing.
 *
 * So the weapon vents: the barrel flashes red-hot, steam jets sideways off it,
 * and a slow white cloud rises and lingers well past the beam's disappearance.
 * The long tail is intentional — the lockout lasts until fully cooled, so the FX
 * should not read as instantaneous.
 */

const HOT = 0xff5533;
const EMBER = 0xffaa44;
const STEAM = 0xf2f6ff;

export function fxOverheatVent(scene: GameScene, x: number, y: number): void {
  // The barrel glowing through, then dumping its heat.
  const glow = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  glow.fillStyle(HOT, 0.7);
  glow.fillCircle(0, 0, 15);
  glow.fillStyle(EMBER, 0.9);
  glow.fillCircle(0, 0, 7);
  scene.tweens.add({
    targets: glow,
    alpha: 0,
    scaleX: 2.4,
    scaleY: 2.4,
    duration: 420,
    ease: 'Quad.easeOut',
    onComplete: () => glow.destroy(),
  });

  // Two opposed vent jets — a machine dumping pressure through ports, which
  // reads differently from an explosion going every direction at once.
  for (const dir of [-1, 1]) {
    const jet = scene.add.graphics({ x, y: y - 4 }).setDepth(DEPTH.FX);
    jet.fillStyle(STEAM, 0.55);
    jet.fillTriangle(0, -4, 0, 4, dir * 30, 0);
    jet.setScale(0.3, 1);
    scene.tweens.add({
      targets: jet,
      scaleX: 1.3,
      alpha: 0,
      duration: 300,
      ease: 'Quart.easeOut',
      onComplete: () => jet.destroy(),
    });
  }

  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(2.5, EMBER, 0.8);
  ring.strokeCircle(0, 0, 12);
  scene.tweens.add({
    targets: ring,
    scaleX: 3.2,
    scaleY: 3.2,
    alpha: 0,
    duration: 380,
    ease: 'Power2',
    onComplete: () => ring.destroy(),
  });

  // Steam rises and hangs around: the lockout is not over when the flash is.
  burstFx(scene, 'ptx-dot', x, y - 6, 16, 1100, {
    tint: STEAM,
    speed: { min: 20, max: 70 },
    angle: { min: 210, max: 330 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 0.55, end: 0 },
    gravityY: -70,
  });
  // A few hot sparks fall out of it, so the cloud reads as heat rather than fog.
  burstFx(scene, 'ptx-spark', x, y, 8, 560, {
    tint: EMBER,
    speed: { min: 50, max: 160 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 260,
  });
}
