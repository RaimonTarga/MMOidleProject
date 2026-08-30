import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Boss scripted-action cues (non-attack): a summon beat, a barrier coming up, and
 * a morph/transform flash. Summon beats anchor to the arriving add, while the
 * other cues draw on the boss, so otherwise-silent script beats read at a glance.
 * Cosmetic only.
 */

const SUMMON_DARK = 0x7733bb;
const SUMMON_GLOW = 0xcc88ff;

/** Summon beat — a dark conjuring pulse with motes rising as adds appear. */
export function fxSummonBurst(scene: GameScene, x: number, y: number): void {
  // Ground sigil ring snapping outward.
  const ring = scene.add.graphics({ x, y: y + 6 }).setDepth(DEPTH.FX);
  ring.lineStyle(3, SUMMON_GLOW, 0.85);
  ring.strokeCircle(0, 0, 14);
  ring.lineStyle(1.5, SUMMON_DARK, 0.7);
  ring.strokeCircle(0, 0, 22);
  scene.tweens.add({
    targets: ring,
    scaleX: 3.4,
    scaleY: 1.8,
    alpha: 0,
    duration: 460,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  // Dark core pulse.
  const core = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  core.fillStyle(SUMMON_DARK, 0.5);
  core.fillCircle(0, 0, 20);
  scene.tweens.add({
    targets: core,
    alpha: 0,
    scaleX: 1.8,
    scaleY: 1.8,
    duration: 320,
    ease: 'Quad.easeOut',
    onComplete: () => core.destroy(),
  });

  // Conjuring motes rising.
  burstFx(scene, 'ptx-dot', x, y + 4, 16, 640, {
    tint: SUMMON_GLOW,
    speed: { min: 40, max: 110 },
    angle: { min: 230, max: 310 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -60,
  });
}

const SHIELD_CYAN = 0x88ddff;

/** Barrier-up — a translucent dome flares around the boss, then settles and fades. */
export function fxShieldUp(scene: GameScene, x: number, y: number): void {
  const dome = scene.add.graphics({ x, y: y - 4 }).setDepth(DEPTH.FX);
  dome.fillStyle(SHIELD_CYAN, 0.18);
  dome.fillCircle(0, 0, 40);
  dome.lineStyle(2.5, SHIELD_CYAN, 0.9);
  dome.strokeCircle(0, 0, 40);
  dome.setScale(0.5);
  dome.setAlpha(0);
  scene.tweens.add({
    targets: dome,
    scale: 1,
    alpha: 1,
    duration: 180,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: dome,
        alpha: 0,
        scaleX: 1.1,
        scaleY: 1.1,
        delay: 320,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => dome.destroy(),
      });
    },
  });

  // Hex-facet shimmer sparks around the rim.
  burstFx(scene, 'ptx-spark', x, y - 4, 12, 460, {
    tint: SHIELD_CYAN,
    speed: { min: 50, max: 130 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 0.9, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}

const MORPH_GOLD = 0xffe066;

/** Morph/transform flash — a bright gold ring pulse + sparkle as the boss shifts shape. */
export function fxMorph(scene: GameScene, x: number, y: number): void {
  for (let i = 0; i < 2; i++) {
    const ring = scene.add.graphics({ x, y: y - 4 }).setDepth(DEPTH.FX);
    ring.lineStyle(3 - i, MORPH_GOLD, 0.9);
    ring.strokeCircle(0, 0, 12 + i * 8);
    scene.tweens.add({
      targets: ring,
      scaleX: 3.5 + i,
      scaleY: 3.5 + i,
      alpha: 0,
      duration: 380 + i * 100,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  const flash = scene.add.graphics({ x, y: y - 4 }).setDepth(DEPTH.FX);
  flash.fillStyle(0xffffff, 0.8);
  flash.fillCircle(0, 0, 22);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 1.6,
    scaleY: 1.6,
    duration: 260,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  burstFx(scene, 'ptx-spark', x, y - 4, 14, 420, {
    tint: MORPH_GOLD,
    speed: { min: 70, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}

/** Rallying roar: two warm pressure waves plus sparks lifting from nearby allies. */
export function fxBossRoar(scene: GameScene, x: number, y: number, radius: number): void {
  for (let i = 0; i < 2; i++) {
    const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    ring.lineStyle(4 - i, i === 0 ? 0xffcc55 : 0xff7744, 0.9);
    ring.strokeCircle(0, 0, 18);
    scene.tweens.add({
      targets: ring,
      scaleX: radius / 18,
      scaleY: radius / 36,
      alpha: 0,
      delay: i * 110,
      duration: 520,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
  burstFx(scene, 'ptx-spark', x, y, 18, 480, {
    tint: 0xffcc55,
    speed: { min: 70, max: 180 },
    angle: { min: 205, max: 335 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -80,
  });
}

/** Bestial Frenzy: boss-scale crimson claw-rings, a red flash, and a violent burst. */
export function fxBestialFrenzy(scene: GameScene, x: number, y: number): void {
  // A fresh, slightly irregular claw angle per cast keeps repeated Frenzies from
  // reading as the same stamped decal while retaining the three-rake silhouette.
  const rakeAngle = (Math.random() - 0.5) * 0.9;
  for (let i = 0; i < 3; i++) {
    const ring = scene.add.graphics({ x, y: y - 6 }).setDepth(DEPTH.FX);
    ring.lineStyle(5 - i, i === 1 ? 0xffd166 : 0xe85d45, 0.98);
    ring.strokeEllipse(0, 0, 34 + i * 14, 18 + i * 8);
    ring.setRotation(rakeAngle + (i - 1) * 0.48 + (Math.random() - 0.5) * 0.22);
    scene.tweens.add({
      targets: ring,
      scaleX: 7.2 + i * 0.9,
      scaleY: 3.5 + i * 0.4,
      alpha: 0,
      delay: i * 70,
      duration: 480 + i * 80,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  const flash = scene.add.graphics({ x, y: y - 6 }).setDepth(DEPTH.FX);
  flash.fillStyle(0xff6b4a, 0.7);
  flash.fillCircle(0, 0, 34);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 3.2,
    scaleY: 3.2,
    duration: 360,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  burstFx(scene, 'ptx-spark', x, y - 4, 36, 600, {
    tint: 0xe85d45,
    speed: { min: 110, max: 300 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.2, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -55,
  });
}
