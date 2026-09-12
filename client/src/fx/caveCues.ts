import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * CAVE ability cues.
 *
 * Cave Gargoyle's Stalactite Shot drew an arrow tracer; the two burrowing bosses'
 * **Burrow** step drew `fxShieldUp`, a shield bubble, for the act of going
 * underground; and their Eruption drew `strong-kick`.
 *
 * Shared grammar: the cave attacks from ABOVE (falling rock) and from BELOW
 * (burrow/eruption), never head-on — that vertical axis is the biome's identity and
 * is precisely what a horizontal arrow tracer destroyed.
 */

const ROCK = 0x6e6a63;
const ROCK_LIT = 0xb0a89a;
const CORRUPT = 0x9a5ed8;

/**
 * STALACTITE SHOT — the Gargoyle's heavy projectile. The bestiary calls it "a
 * deliberate, heavy projectile from a creature that treats its ledge as a fortress",
 * so it falls from above onto the target rather than flying from the perch.
 */
export function fxStalactiteShot(scene: GameScene, toX: number, toY: number): void {
  // Warning tick where it will land: small, brief — this is a fast ability, not a
  // telegraphed boss slam, so it must not read as an avoidable footprint.
  const mark = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  mark.lineStyle(2, ROCK_LIT, 0.7);
  mark.strokeCircle(0, 0, 12);
  scene.tweens.add({
    targets: mark,
    alpha: 0,
    duration: 200,
    onComplete: () => mark.destroy(),
  });

  // The spike itself, dropping in point-first.
  const spike = scene.add.graphics({ x: toX, y: toY - 150 }).setDepth(DEPTH.FX);
  spike.fillStyle(ROCK, 1);
  spike.fillTriangle(-8, -26, 8, -26, 0, 10);
  spike.fillStyle(ROCK_LIT, 0.45);
  spike.fillTriangle(-3, -22, 2, -22, 0, 4);
  scene.tweens.add({
    targets: spike,
    y: toY,
    duration: 170,
    ease: 'Quad.easeIn',
    onComplete: () => {
      spike.destroy();

      const dust = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      dust.fillStyle(ROCK_LIT, 0.7);
      dust.fillCircle(0, 0, 13);
      scene.tweens.add({
        targets: dust,
        alpha: 0,
        scaleX: 2.3,
        scaleY: 1.6,
        duration: 260,
        ease: 'Quad.easeOut',
        onComplete: () => dust.destroy(),
      });

      burstFx(scene, 'ptx-spark', toX, toY, 12, 380, {
        tint: ROCK_LIT,
        speed: { min: 90, max: 240 },
        angle: { min: 200, max: 340 },
        scale: { start: 0.85, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 240,
      });
    },
  });
}

/**
 * BURROW — a boss submerging (Chitinous Dreadbore, Deep-Core Burrow-Gorger).
 *
 * It was drawing a shield bubble, which said "protected" when the mechanic is "gone,
 * and about to arrive somewhere else". So: a collapsing ground funnel that pulls
 * inward and down, plus a mound of thrown spoil. Nothing rises.
 */
export function fxBurrow(scene: GameScene, x: number, y: number): void {
  // Funnel collapsing inward — the hole opening and swallowing the boss.
  for (let i = 0; i < 3; i++) {
    const ring = scene.add.graphics({ x, y: y + 8 }).setDepth(DEPTH.FX);
    ring.lineStyle(4 - i, ROCK_LIT, 0.8 - i * 0.2);
    ring.strokeEllipse(0, 0, 66 - i * 8, 33 - i * 4);
    scene.tweens.add({
      targets: ring,
      scaleX: 0.15,
      scaleY: 0.15,
      alpha: 0,
      delay: i * 70,
      duration: 420,
      ease: 'Cubic.easeIn',
      onComplete: () => ring.destroy(),
    });
  }

  // Spoil thrown out low and falling back fast.
  burstFx(scene, 'ptx-dot', x, y + 6, 20, 560, {
    tint: ROCK,
    speed: { min: 70, max: 200 },
    angle: { min: 190, max: 350 },
    scale: { start: 1, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 280,
  });
}

/**
 * DEEP-CORE ERUPTION — the boss arriving from below. The mirror of `fxBurrow`:
 * everything that collapsed inward now bursts upward and outward, in the Cave
 * lineage's corrosive violet rather than plain rock, because the emergence is what
 * carries the plating shred.
 */
export function fxEmerge(scene: GameScene, x: number, y: number, radius: number): void {
  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(6, CORRUPT, 0.85);
  ring.strokeEllipse(0, 0, radius * 1.4, radius * 0.7);
  ring.setScale(0.15);
  scene.tweens.add({
    targets: ring,
    scaleX: 1,
    scaleY: 1,
    alpha: 0,
    duration: 420,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });

  // Slabs heaving up out of the floor.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const d = radius * (0.3 + Math.random() * 0.4);
    const slab = scene.add
      .graphics({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.5 + 10 })
      .setDepth(DEPTH.FX);
    slab.fillStyle(ROCK, 0.95);
    slab.fillTriangle(-11, 0, 11, 0, Math.random() * 8 - 4, -30);
    slab.setScale(1, 0.15);
    scene.tweens.add({
      targets: slab,
      scaleY: 1,
      duration: 200,
      delay: i * 25,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: slab,
          alpha: 0,
          scaleY: 0.2,
          duration: 300,
          delay: 120,
          ease: 'Quad.easeIn',
          onComplete: () => slab.destroy(),
        });
      },
    });
  }

  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(CORRUPT, 0.6);
  flash.fillCircle(0, 0, 26);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.4,
    scaleY: 2.4,
    duration: 340,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  burstFx(scene, 'ptx-spark', x, y, 26, 620, {
    tint: CORRUPT,
    speed: { min: 120, max: 300 },
    angle: { min: 240, max: 300 },
    scale: { start: 1.1, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 240,
  });
  burstFx(scene, 'ptx-dot', x, y, 16, 560, {
    tint: ROCK_LIT,
    speed: { min: 60, max: 190 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 260,
  });
}
