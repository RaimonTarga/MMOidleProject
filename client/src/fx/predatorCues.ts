import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const LEAF = 0x4e8b3a;
const LEAF_LIT = 0xa8d66a;
const TRENCH_CORE = 0xcfefff;
const TRENCH_DEEP = 0x2f7f9e;

/**
 * PREDATOR / TRENCH cues for the remaining borrowed-cue abilities.
 *
 * The three Jungle bosses' **Flee** step drew `fxShieldUp` — a shield bubble for the
 * act of breaking away and vanishing into brush. And Hadal Stalker's **Pressure
 * Lance** drew the Ridge Ambusher's arrow, in a biome that already has its own cyan
 * vocabulary (`fxTrenchPulse`, `fxTrenchCurrent`).
 */

/**
 * PREDATOR'S FLEE — the escape-guard step (Jungle Dread-Gorger, Apex Bramble-Slasher,
 * Verdant-Crown Predator).
 *
 * This step raises a breakable guard AND runs. Breaking the guard is the encounter's
 * whole counterplay (it staggers the boss — see `fxStagger`), so the cue has to show a
 * guard worth hitting, not a bubble that reads as immunity. Leaves close around the
 * silhouette while the body fades back: "it is leaving, and this is your window".
 */
export function fxPredatorFlee(scene: GameScene, x: number, y: number): void {
  // Leaves spiralling inward to wrap the boss — inward, because something is closing
  // around it, per the class pass's shard grammar.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const leaf = scene.add
      .graphics({ x: x + Math.cos(a) * 58, y: y + Math.sin(a) * 58 })
      .setDepth(DEPTH.FX);
    leaf.fillStyle(i % 2 === 0 ? LEAF : LEAF_LIT, 0.9);
    leaf.fillEllipse(0, 0, 15, 6);
    leaf.setRotation(a + Math.PI / 2);
    scene.tweens.add({
      targets: leaf,
      x: x + Math.cos(a) * 8,
      y: y + Math.sin(a) * 8,
      rotation: a + Math.PI * 1.5,
      alpha: 0,
      duration: 420 + Math.random() * 140,
      ease: 'Cubic.easeIn',
      onComplete: () => leaf.destroy(),
    });
  }

  // A green veil pulling shut over the body.
  const veil = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  veil.fillStyle(LEAF, 0.5);
  veil.fillEllipse(0, 0, 60, 76);
  veil.setScale(1.2);
  scene.tweens.add({
    targets: veil,
    scaleX: 0.25,
    scaleY: 0.4,
    alpha: 0,
    duration: 480,
    ease: 'Cubic.easeIn',
    onComplete: () => veil.destroy(),
  });

  burstFx(scene, 'ptx-dot', x, y, 16, 620, {
    tint: LEAF_LIT,
    speed: { min: 30, max: 110 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.85, end: 0 },
    alpha: { start: 0.85, end: 0 },
    gravityY: 90,
  });
}

/**
 * PRESSURE LANCE — Hadal Stalker's ranged slow. A compressed spear of water fired
 * flat and fast, in the Trench's existing cyan rather than an archer's gold.
 */
export function fxPressureLance(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const len = Math.hypot(toX - fromX, toY - fromY);

  // The lance: a long tapered shaft spanning caster to target, drawn along local +x
  // and rotated — never scaleX-tweened, which would squash its width when vertical.
  const lance = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  lance.fillStyle(TRENCH_DEEP, 0.45);
  lance.fillTriangle(0, -9, len, 0, 0, 9);
  lance.fillStyle(TRENCH_CORE, 0.95);
  lance.fillTriangle(0, -3, len, 0, 0, 3);
  lance.setRotation(angle);
  lance.setAlpha(0);
  scene.tweens.add({
    targets: lance,
    alpha: 1,
    duration: 70,
    ease: 'Quad.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: lance,
        alpha: 0,
        duration: 220,
        ease: 'Quad.easeIn',
        onComplete: () => lance.destroy(),
      });
    },
  });

  // Recoil bloom at the muzzle: water under pressure escaping.
  burstFx(scene, 'ptx-dot', fromX, fromY, 8, 360, {
    tint: TRENCH_CORE,
    speed: { min: 40, max: 120 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 0.8, end: 0 },
  });

  // Impact: a flattened splash ring, then heavy droplets falling.
  const splash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  splash.lineStyle(4, TRENCH_CORE, 0.9);
  splash.strokeEllipse(0, 0, 26, 14);
  scene.tweens.add({
    targets: splash,
    scaleX: 2.3,
    scaleY: 2.3,
    alpha: 0,
    duration: 320,
    ease: 'Cubic.easeOut',
    onComplete: () => splash.destroy(),
  });

  burstFx(scene, 'ptx-dot', toX, toY, 14, 480, {
    tint: TRENCH_DEEP,
    speed: { min: 70, max: 190 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 200,
  });
}
