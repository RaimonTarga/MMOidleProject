import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const BRONZE_LIGHT = 0xe0c07a;
const BRONZE_CORE = 0xa8791f;
const BRONZE_DEEP = 0x6b4a12;

/**
 * Endure (sustained-mitigation Guard): the player settles their weight and a low
 * bronze dome closes over them, slowly.
 *
 * Deliberately the SLOW sibling of Brace's snap. Brace is a shield thrown up in
 * one frame and gone in three seconds; Endure eases in over half a second and
 * holds, because that difference — strong-and-brief versus modest-and-long — is
 * the only thing separating the two Guards, and a player has to be able to read
 * it without opening a tooltip. Warm bronze against Brace's cold blue for the
 * same reason.
 */
export function fxEndure(scene: GameScene, x: number, y: number): void {
  const cy = y - 4;

  // Ground plate — the stance being set. Widens outward, not upward.
  const plate = scene.add.graphics({ x, y: y + 10 }).setDepth(DEPTH.FX);
  plate.lineStyle(3, BRONZE_CORE, 0.85);
  plate.strokeEllipse(0, 0, 46, 20);
  plate.setScale(0.4);
  scene.tweens.add({
    targets: plate,
    scaleX: 1.25,
    scaleY: 1.25,
    alpha: 0,
    duration: 620,
    ease: 'Sine.easeOut',
    onComplete: () => plate.destroy(),
  });

  // The dome itself: eased in, held, then breathed out. Three concentric arcs so
  // it reads as layered plating rather than a bubble.
  for (let i = 0; i < 3; i++) {
    const dome = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
    dome.lineStyle(2.5 - i * 0.5, i === 0 ? BRONZE_LIGHT : BRONZE_CORE, 0.8 - i * 0.18);
    dome.beginPath();
    dome.arc(0, 8, 26 + i * 7, Math.PI, 0, false);
    dome.strokePath();
    dome.setAlpha(0);
    dome.setScale(0.75);
    scene.tweens.add({
      targets: dome,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      delay: i * 70,
      duration: 420,
      ease: 'Sine.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: dome,
          alpha: 0,
          scaleX: 1.06,
          scaleY: 1.06,
          delay: 300,
          duration: 520,
          ease: 'Sine.easeInOut',
          onComplete: () => dome.destroy(),
        });
      },
    });
  }

  // A dull inner glow at the body — the "dig in" beat.
  const core = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  core.fillStyle(BRONZE_DEEP, 0.4);
  core.fillCircle(0, 0, 16);
  scene.tweens.add({
    targets: core,
    alpha: 0,
    scaleX: 1.7,
    scaleY: 1.7,
    duration: 560,
    ease: 'Sine.easeOut',
    onComplete: () => core.destroy(),
  });

  // Dust pressed out from under the feet, drifting rather than flying.
  burstFx(scene, 'ptx-dot', x, y + 10, 12, 700, {
    tint: BRONZE_LIGHT,
    speed: { min: 20, max: 60 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.8, end: 0 },
    gravityY: 20,
  });
}
