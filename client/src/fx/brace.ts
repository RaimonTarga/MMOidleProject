import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const SHIELD_LIGHT = 0xbfe6ff; // pale ice-blue rim
const SHIELD_CORE = 0x66bbff; // brighter blue body

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
 * A translucent shield-shaped barrier flares and settles, a bright rim pulses
 * outward, and a ground ring marks the player digging in. Reads as "raise guard"
 * — calm, defensive blue, distinct from the red/gold offensive techniques.
 */
export function fxBrace(scene: GameScene, x: number, y: number): void {
  const cy = y - 6;
  const w = 30;
  const h = 38;

  // Translucent barrier surface — flares bright, then settles to a held glow
  // before fading, so it reads as a shield coming UP rather than an explosion.
  const surface = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  surface.fillStyle(SHIELD_CORE, 0.32);
  shieldPath(surface, w, h);
  surface.fillPath();
  surface.lineStyle(2.5, SHIELD_LIGHT, 0.9);
  shieldPath(surface, w, h);
  surface.strokePath();
  surface.setScale(0.6);
  surface.setAlpha(0);
  scene.tweens.add({
    targets: surface,
    scale: 1,
    alpha: 1,
    duration: 140,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: surface,
        alpha: 0,
        scaleX: 1.08,
        scaleY: 1.08,
        delay: 380,
        duration: 360,
        ease: 'Quad.easeOut',
        onComplete: () => surface.destroy(),
      });
    },
  });

  // Bright rim pulse — a second shield outline that expands past the surface and
  // fades, giving the snap-up a flash of energy.
  const rim = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  rim.lineStyle(3, SHIELD_LIGHT, 0.9);
  shieldPath(rim, w, h);
  rim.strokePath();
  scene.tweens.add({
    targets: rim,
    scaleX: 1.45,
    scaleY: 1.45,
    alpha: 0,
    duration: 420,
    ease: 'Power2',
    onComplete: () => rim.destroy(),
  });

  // Ground ring — the player setting their stance.
  const ring = scene.add.graphics({ x, y: y + 8 }).setDepth(DEPTH.FX);
  ring.lineStyle(2, SHIELD_CORE, 0.7);
  ring.strokeCircle(0, 0, 14);
  scene.tweens.add({
    targets: ring,
    scaleX: 2.6,
    scaleY: 1.3,
    alpha: 0,
    duration: 380,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  // A few cool sparks drifting up off the shield as it forms.
  burstFx(scene, 'ptx-dot', x, cy, 9, 520, {
    tint: SHIELD_LIGHT,
    speed: { min: 30, max: 90 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.45, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: -40,
  });
}
