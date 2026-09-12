import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * RANGED SPIT — projectiles for the mobs that were firing nothing at all.
 *
 * `fxPoison`, `fxFire` and `fxFrost` take only a target position: they bloom on the
 * victim and draw no travel. That is right for a melee bite, but seven `ranged`
 * mobs were authored on those styles, so their damage arrived from off-screen with
 * nothing in between. Their siblings already do this correctly (the Gargoyles spit
 * stone, the archers loose arrows), so this closes an inconsistency rather than
 * inventing a new idea.
 *
 * One core with three palettes rather than three near-identical files, following the
 * shared-helper precedent in `t4Triggers.ts`. The distinguishing grammar is what the
 * debris does on impact: embers rise, ice falls, darts drop and stick.
 */

interface SpitStyle {
  core: number;
  glow: number;
  /** Half-length of the projectile body along its flight axis. */
  len: number;
  halfWidth: number;
  travelMs: number;
  /** Tumble in flight (thrown matter) vs. hold true (a fired dart/bolt). */
  spin: boolean;
  /** Impact debris drift: negative rises, positive falls. */
  gravityY: number;
  /** Leading motes trailing the projectile. */
  trail: boolean;
}

function spit(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  s: SpitStyle,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);

  // Muzzle tick at the shooter, so the origin is legible even at a distance.
  const muzzle = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  muzzle.fillStyle(s.glow, 0.7);
  muzzle.fillCircle(0, 0, 7);
  scene.tweens.add({
    targets: muzzle,
    alpha: 0,
    scaleX: 1.8,
    scaleY: 1.8,
    duration: 150,
    ease: 'Quad.easeOut',
    onComplete: () => muzzle.destroy(),
  });

  // The projectile: built along local +x and rotated to the firing axis. Never
  // scaleX-tweened — on a vertical shot that squashes the body's WIDTH instead of
  // lengthening it along flight (the trap the class pass hit twice).
  const shot = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  shot.fillStyle(s.glow, 0.55);
  shot.fillTriangle(-s.len * 0.8, -s.halfWidth * 1.7, s.len * 1.15, 0, -s.len * 0.8, s.halfWidth * 1.7);
  shot.fillStyle(s.core, 1);
  shot.fillTriangle(-s.len * 0.6, -s.halfWidth, s.len, 0, -s.len * 0.6, s.halfWidth);
  shot.setRotation(angle);

  if (s.trail) {
    burstFx(scene, 'ptx-dot', fromX, fromY, 4, s.travelMs, {
      tint: s.glow,
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.7, end: 0 },
    });
  }

  scene.tweens.add({
    targets: shot,
    x: toX,
    y: toY,
    rotation: s.spin ? angle + Math.PI * 1.25 : angle,
    duration: s.travelMs,
    ease: 'Quad.easeIn',
    onComplete: () => {
      shot.destroy();

      const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      flash.fillStyle(s.core, 0.85);
      flash.fillCircle(0, 0, 8);
      flash.fillStyle(s.glow, 0.4);
      flash.fillCircle(0, 0, 15);
      scene.tweens.add({
        targets: flash,
        alpha: 0,
        scaleX: 2.1,
        scaleY: 2.1,
        duration: 190,
        ease: 'Quad.easeOut',
        onComplete: () => flash.destroy(),
      });

      burstFx(scene, 'ptx-spark', toX, toY, 9, 340, {
        tint: s.core,
        speed: { min: 70, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.75, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: s.gravityY,
      });
      burstFx(scene, 'ptx-dot', toX, toY, 5, 380, {
        tint: s.glow,
        speed: { min: 30, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.55, end: 0 },
        alpha: { start: 0.85, end: 0 },
        gravityY: s.gravityY,
      });
    },
  });
}

/**
 * Vine Chameleon's blowdart. Its id is literally `jungle-blowdarter` and its
 * bestiary line is "until the dart has already landed" — a thin, fast, true-flying
 * needle that drops its debris straight down.
 */
export function fxDart(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number): void {
  spit(scene, fromX, fromY, toX, toY, {
    core: 0xc8e68a,
    glow: 0x6f9c3a,
    len: 9,
    halfWidth: 1.6,
    travelMs: 160,
    spin: false,
    gravityY: 190,
    trail: false,
  });
}

/**
 * The volcanic Salamanders' ash gob — thrown matter, so it tumbles in flight and
 * its embers RISE off the impact.
 */
export function fxFireSpit(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number): void {
  spit(scene, fromX, fromY, toX, toY, {
    core: 0xffc04a,
    glow: 0xe04a1a,
    len: 7,
    halfWidth: 4.5,
    travelMs: 230,
    spin: true,
    gravityY: -110,
    trail: true,
  });
}

/**
 * The tundra casters' ice shard — a fired bolt, so it holds its line, and its
 * fragments FALL. Deliberately the mirror of the ember rise above.
 */
export function fxFrostBolt(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number): void {
  spit(scene, fromX, fromY, toX, toY, {
    core: 0xdff4ff,
    glow: 0x5aa8d8,
    len: 11,
    halfWidth: 3,
    travelMs: 200,
    spin: false,
    gravityY: 150,
    trail: true,
  });
}
