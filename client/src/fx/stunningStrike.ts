import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const CONCUSS_BRIGHT = 0xfffbe0;
const CONCUSS_CORE = 0xffe066;

/** A four-pointed star, the classic "seeing stars" glyph. */
function star(g: Phaser.GameObjects.Graphics, r: number): void {
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.28, -r * 0.28);
  g.lineTo(r, 0);
  g.lineTo(r * 0.28, r * 0.28);
  g.lineTo(0, r);
  g.lineTo(-r * 0.28, r * 0.28);
  g.lineTo(-r, 0);
  g.lineTo(-r * 0.28, -r * 0.28);
  g.closePath();
}

/**
 * Stunning Strike (hard-control cast): a concussive blow to the head.
 *
 * Played HIGH — at and above the target's head — which is exactly where Binding
 * Strike's root is not. The two sit on adjacent rungs of the control ladder and
 * the only way a player tells them apart mid-fight is where the effect happens:
 * root locks the ground, stun rattles the skull. Three orbiting stars carry the
 * "it can't act at all" read that a ring alone would not.
 */
export function fxStunningStrike(scene: GameScene, x: number, y: number): void {
  const hy = y - 22;

  // Concussion flash at the point of impact.
  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(CONCUSS_BRIGHT, 0.95);
  flash.fillCircle(0, 0, 18);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.6,
    scaleY: 2.6,
    duration: 200,
    ease: 'Expo.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Two hard shock rings — the blow's force, not a splash.
  for (let i = 0; i < 2; i++) {
    const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    ring.lineStyle(3.5 - i, CONCUSS_CORE, 0.95 - i * 0.3);
    ring.strokeCircle(0, 0, 14 + i * 8);
    scene.tweens.add({
      targets: ring,
      scaleX: 2.8 + i,
      scaleY: 2.8 + i,
      alpha: 0,
      duration: 320 + i * 110,
      ease: 'Expo.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  // Stars circling the head for most of a second — the state, after the impact.
  for (let i = 0; i < 3; i++) {
    const phase = (Math.PI * 2 * i) / 3;
    const s = scene.add.graphics({ x, y: hy }).setDepth(DEPTH.FX);
    s.fillStyle(CONCUSS_BRIGHT, 1);
    star(s, 6);
    s.fillPath();
    const spin = { t: 0 };
    scene.tweens.add({
      targets: spin,
      t: Math.PI * 2.4,
      duration: 900,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        s.x = x + Math.cos(spin.t + phase) * 20;
        s.y = hy + Math.sin(spin.t + phase) * 7;
      },
      onComplete: () => s.destroy(),
    });
    scene.tweens.add({
      targets: s,
      alpha: 0,
      delay: 620,
      duration: 280,
    });
  }

  burstFx(scene, 'ptx-spark', x, y, 18, 380, {
    tint: CONCUSS_CORE,
    speed: { min: 130, max: 320 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.95, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
