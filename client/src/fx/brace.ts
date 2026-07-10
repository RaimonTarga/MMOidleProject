import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const SHIELD_LIGHT = 0xbfe6ff; // pale ice-blue rim
const SHIELD_CORE = 0x66bbff; // brighter blue body
const SHIELD_FLASH = 0xeaf6ff; // near-white snap-up flare

/** Trace a heater-shield silhouette (flat top, rounded shoulders, point bottom). */
function shieldPath(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
  g.beginPath();
  g.moveTo(-w, -h);
  g.lineTo(w, -h);
  g.lineTo(w, -h * 0.1);
  g.lineTo(0, h);
  g.lineTo(-w, -h * 0.1);
  g.closePath();
}

/**
 * Brace (damage-reduction Guard): a light-blue shield snaps up over the player.
 * A near-white flare cracks at the body, the translucent barrier snaps up with
 * one held pulse, a rim pulse rolls outward, and a ground ring marks the player
 * digging in. Reads as "raise guard" — calm, defensive blue, distinct from the
 * red/gold offensive techniques.
 */
export function fxBrace(scene: GameScene, x: number, y: number): void {
  const cy = y - 6;
  const w = 30;
  const h = 38;

  // Snap-up flare — a quick bloom behind the shield so the fire still reads in
  // the middle of a melee scrum.
  const flare = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  flare.fillStyle(SHIELD_FLASH, 0.65);
  flare.fillCircle(0, 0, 20);
  scene.tweens.add({
    targets: flare,
    alpha: 0,
    scaleX: 1.9,
    scaleY: 1.9,
    duration: 170,
    ease: 'Quad.easeOut',
    onComplete: () => flare.destroy(),
  });

  // Translucent barrier surface — flares bright, gives one held pulse, then
  // fades quickly, so it reads as a shield coming UP without lingering.
  const surface = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  surface.fillStyle(SHIELD_CORE, 0.36);
  shieldPath(surface, w, h);
  surface.fillPath();
  surface.lineStyle(2.5, SHIELD_LIGHT, 0.95);
  shieldPath(surface, w, h);
  surface.strokePath();
  surface.setScale(0.55);
  surface.setAlpha(0);
  scene.tweens.add({
    targets: surface,
    scale: 1,
    alpha: 1,
    duration: 120,
    ease: 'Back.easeOut',
    onComplete: () => {
      // Single held pulse, then out.
      scene.tweens.add({
        targets: surface,
        scaleX: 1.05,
        scaleY: 1.05,
        alpha: 0.85,
        yoyo: true,
        duration: 160,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          scene.tweens.add({
            targets: surface,
            alpha: 0,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 240,
            ease: 'Quad.easeOut',
            onComplete: () => surface.destroy(),
          });
        },
      });
    },
  });

  // Rim pulse — a shield outline rolling outward, a flash of energy on snap-up.
  const rim = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  rim.lineStyle(3, SHIELD_LIGHT, 0.9);
  shieldPath(rim, w, h);
  rim.strokePath();
  scene.tweens.add({
    targets: rim,
    scaleX: 1.45,
    scaleY: 1.45,
    alpha: 0,
    duration: 360,
    ease: 'Power2',
    onComplete: () => rim.destroy(),
  });

  // Ground ring — the player setting their stance.
  const ring = scene.add.graphics({ x, y: y + 8 }).setDepth(DEPTH.FX);
  ring.lineStyle(2.5, SHIELD_CORE, 0.75);
  ring.strokeCircle(0, 0, 13);
  scene.tweens.add({
    targets: ring,
    scaleX: 2.8,
    scaleY: 1.4,
    alpha: 0,
    duration: 360,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  // A few cool sparks flung up off the shield as it forms.
  burstFx(scene, 'ptx-spark', x, cy, 10, 460, {
    tint: SHIELD_LIGHT,
    speed: { min: 40, max: 120 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.55, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -45,
  });
}
