import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import type { AttackTint } from './elementTint';

/**
 * Squire (cooldown) basic attack.
 *
 * The Squire used to swing with `fxImpact` — which is also the fallback style for
 * every monster that has no style of its own, and is authored on 41 of them. The
 * heaviest chassis in the game therefore hit with the same orange bloom as an
 * unstyled mob.
 *
 * This is the same blunt vocabulary, given real weight: an overhead slam that
 * cracks a crater into the ground. The ground-plane ellipse is the whole point —
 * it is what separates "something very heavy landed here" from "a generic hit
 * happened here". Spokes radiate from the point of contact, debris is thrown UP
 * rather than sideways, and the whole thing is slower than any other baseline.
 *
 * `fxImpact` is untouched, so the 41 monsters keep exactly what they had.
 */

const BASE_CORE = 0xffb066;
const BASE_GLOW = 0xff7733;
const EXEC_CORE = 0xffffff;
const EXEC_GLOW = 0xaabbff;

/** Radial ground cracks. Odd count so none is exactly opposite another. */
const SPOKES = 5;

export function fxSquireSlam(
  scene: GameScene,
  toX: number,
  toY: number,
  execution: boolean,
  tint?: AttackTint,
): void {
  const core = execution ? EXEC_CORE : BASE_CORE;
  const glow = tint?.glow ?? (execution ? EXEC_GLOW : BASE_GLOW);
  const spark = tint?.particles ?? core;

  // Crater: a flattened ellipse on the ground plane, slightly below the target's
  // centre so it reads as the floor rather than as a ring around the body.
  const crater = scene.add
    .graphics({ x: toX, y: toY + 8 })
    .setDepth(DEPTH.FX);
  crater.lineStyle(execution ? 4 : 3, glow, 0.85);
  crater.strokeEllipse(0, 0, execution ? 46 : 36, execution ? 20 : 15);
  crater.setScale(0.5);
  scene.tweens.add({
    targets: crater,
    scaleX: execution ? 1.9 : 1.55,
    scaleY: execution ? 1.9 : 1.55,
    alpha: 0,
    duration: 380,
    ease: 'Cubic.easeOut',
    onComplete: () => crater.destroy(),
  });

  // Cracks running out of the point of contact, written outward so the ground
  // splits rather than appearing pre-split. Squashed vertically to sit flat.
  const cracks = scene.add.graphics({ x: toX, y: toY + 8 }).setDepth(DEPTH.FX);
  const angles = Array.from(
    { length: SPOKES },
    (_, i) => (i / SPOKES) * Math.PI * 2 + Math.random() * 0.4,
  );
  const lengths = angles.map(() => (execution ? 40 : 31) * (0.75 + Math.random() * 0.5));
  const grow = { t: 0 };
  const drawCracks = (): void => {
    cracks.clear();
    cracks.lineStyle(execution ? 3 : 2.25, glow, 0.7);
    for (let i = 0; i < SPOKES; i++) {
      const r = lengths[i] * grow.t;
      // 0.42 vertical squash keeps the spokes on the floor plane, matching the
      // crater ellipse rather than radiating spherically.
      cracks.lineBetween(0, 0, Math.cos(angles[i]) * r, Math.sin(angles[i]) * r * 0.42);
    }
  };
  scene.tweens.add({
    targets: grow,
    t: 1,
    duration: 190,
    ease: 'Quart.easeOut',
    onUpdate: drawCracks,
    onComplete: () => {
      scene.tweens.add({
        targets: cracks,
        alpha: 0,
        duration: 280,
        onComplete: () => cracks.destroy(),
      });
    },
  });

  // The blow itself: a hard bright core at contact, on the body not the floor.
  const hit = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  hit.fillStyle(glow, execution ? 0.85 : 0.7);
  hit.fillCircle(0, 0, execution ? 30 : 22);
  hit.fillStyle(core, 0.95);
  hit.fillCircle(0, 0, execution ? 15 : 11);
  scene.tweens.add({
    targets: hit,
    alpha: 0,
    scaleX: 1.7,
    scaleY: 1.7,
    duration: 150,
    ease: 'Quad.easeOut',
    onComplete: () => hit.destroy(),
  });

  // One shockwave, kept circular so it reads as concussion through the air —
  // deliberately a different plane from the flat crater under it.
  const wave = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  wave.lineStyle(execution ? 3 : 2.25, core, 0.9);
  wave.strokeCircle(0, 0, 12);
  scene.tweens.add({
    targets: wave,
    scaleX: execution ? 4.4 : 3.6,
    scaleY: execution ? 4.4 : 3.6,
    alpha: 0,
    duration: 400,
    ease: 'Power2',
    onComplete: () => wave.destroy(),
  });

  // Debris goes UP and falls back — mass displaced, not sprayed. The heavy
  // gravityY is what makes it read as rubble instead of sparks.
  burstFx(scene, 'ptx-dot', toX, toY + 4, execution ? 20 : 13, 560, {
    tint: spark,
    speed: { min: 90, max: execution ? 300 : 215 },
    angle: { min: 238, max: 302 },
    scale: { start: execution ? 0.95 : 0.75, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 420,
  });

  if (execution) {
    // Keep the existing execution tell: the four-point star from `fxImpact`, so
    // an execution still reads the same way it always has.
    const cross = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    const len = 44;
    cross.lineStyle(3, 0xeeeeff, 1);
    cross.lineBetween(-len, -len, len, len);
    cross.lineBetween(len, -len, -len, len);
    cross.lineStyle(3, 0xffffff, 0.9);
    cross.lineBetween(-len, 0, len, 0);
    cross.lineBetween(0, -len, 0, len);
    scene.tweens.add({
      targets: cross,
      alpha: 0,
      scaleX: 1.9,
      scaleY: 1.9,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => cross.destroy(),
    });
  }
}
