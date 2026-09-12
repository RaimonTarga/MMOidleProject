import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * DESERT ability cues.
 *
 * Every named ability in this biome was drawing `fxPowerShot` — an ARROW tracer,
 * authored for the Ridge Ambusher's bow. A gaze, a sunbeam and a venom sting are
 * three different verbs and none of them is an arrow; the first two are not even
 * projectiles, they are rays, which is the shape the tracer most actively contradicts.
 *
 * Shared grammar for the biome: sun-bleached gold, and a beam that ARRIVES ALL AT
 * ONCE (no travel time) so a ray never reads as something you could have dodged.
 */

const SUN_CORE = 0xfff3c4;
const SUN_GLOW = 0xe8a12a;
const STONE_GREY = 0x9a9e93;
const VENOM = 0x9fd14a;

/** A beam drawn instantly from caster to target, along local +x then rotated. */
function beam(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  core: number,
  glow: number,
  width: number,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const len = Math.hypot(toX - fromX, toY - fromY);
  const g = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  // Built along +x and rotated. Tweening scaleX here would squash the beam's WIDTH
  // whenever the shot is vertical — the trap the class pass hit twice.
  g.fillStyle(glow, 0.4);
  g.fillRect(0, -width * 1.9, len, width * 3.8);
  g.fillStyle(core, 0.95);
  g.fillRect(0, -width / 2, len, width);
  g.setRotation(angle);
  scene.tweens.add({
    targets: g,
    alpha: 0,
    duration: 300,
    ease: 'Quad.easeOut',
    onComplete: () => g.destroy(),
  });
}

/**
 * PETRIFYING GAZE — the three Basilisks' root cast.
 *
 * A pale stone-grey ray plus rings closing INWARD on the target: per the class pass's
 * shard grammar, inward means something closed on you, which is exactly what a root
 * is. Deliberately desaturated — this is the one Desert cue that is not gold, because
 * it is turning you to stone rather than burning you.
 */
export function fxPetrifyingGaze(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  beam(scene, fromX, fromY, toX, toY, 0xe4e8e0, STONE_GREY, 4);

  // Three rings contracting onto the victim — the stone closing.
  for (let i = 0; i < 3; i++) {
    const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    ring.lineStyle(3, STONE_GREY, 0.9);
    ring.strokeCircle(0, 0, 46);
    ring.setScale(1);
    scene.tweens.add({
      targets: ring,
      scaleX: 0.18,
      scaleY: 0.18,
      alpha: 0,
      delay: i * 80,
      duration: 380,
      ease: 'Cubic.easeIn',
      onComplete: () => ring.destroy(),
    });
  }

  // Grey flecks settling, not spraying: the target is stiffening.
  burstFx(scene, 'ptx-dot', toX, toY, 12, 560, {
    tint: STONE_GREY,
    speed: { min: 15, max: 55 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 60,
  });
}

/**
 * SUNBEAM — the Gilded Scarab's signature burst. The gold counterpart to the gaze:
 * same instant-arrival beam, but it BLOOMS outward on landing instead of closing.
 */
export function fxSunbeam(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  beam(scene, fromX, fromY, toX, toY, SUN_CORE, SUN_GLOW, 5);

  // Radiant spokes fanning out from the point of focus.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spoke = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    spoke.fillStyle(SUN_CORE, 0.85);
    spoke.fillTriangle(0, -2.5, 30, 0, 0, 2.5);
    spoke.setRotation(a);
    scene.tweens.add({
      targets: spoke,
      scaleX: 2.1,
      alpha: 0,
      duration: 330,
      ease: 'Cubic.easeOut',
      onComplete: () => spoke.destroy(),
    });
  }

  const flare = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flare.fillStyle(SUN_CORE, 0.9);
  flare.fillCircle(0, 0, 14);
  flare.fillStyle(SUN_GLOW, 0.45);
  flare.fillCircle(0, 0, 26);
  scene.tweens.add({
    targets: flare,
    alpha: 0,
    scaleX: 2.4,
    scaleY: 2.4,
    duration: 300,
    ease: 'Quad.easeOut',
    onComplete: () => flare.destroy(),
  });

  burstFx(scene, 'ptx-spark', toX, toY, 20, 460, {
    tint: SUN_GLOW,
    speed: { min: 100, max: 250 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
  });
}

/**
 * NUMBING STING — the scorpion/viper slow cast (Sand Scorpion, Dune Stalker, Sand
 * Viper). Not a ray: a physical puncture, so it stabs in along the attack axis and
 * leaves a spreading numb blot rather than a bloom.
 */
export function fxNumbingSting(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);

  // The stinger: a long thin barb driving the last stretch into the target.
  const barb = scene.add
    .graphics({ x: toX - Math.cos(angle) * 44, y: toY - Math.sin(angle) * 44 })
    .setDepth(DEPTH.FX);
  barb.fillStyle(0x4a3b2a, 0.9);
  barb.fillTriangle(0, -3, 30, 0, 0, 3);
  barb.fillStyle(VENOM, 0.85);
  barb.fillTriangle(18, -1.4, 30, 0, 18, 1.4);
  barb.setRotation(angle);
  scene.tweens.add({
    targets: barb,
    x: toX,
    y: toY,
    duration: 110,
    ease: 'Quad.easeIn',
    onComplete: () => {
      scene.tweens.add({
        targets: barb,
        alpha: 0,
        duration: 160,
        onComplete: () => barb.destroy(),
      });

      // A slow, heavy blot spreading from the puncture — this is a SLOW, so it
      // expands lazily instead of snapping outward like a damage ring.
      const blot = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      blot.fillStyle(VENOM, 0.42);
      blot.fillCircle(0, 0, 12);
      blot.setScale(0.5);
      scene.tweens.add({
        targets: blot,
        scaleX: 2.6,
        scaleY: 2.6,
        alpha: 0,
        duration: 620,
        ease: 'Sine.easeOut',
        onComplete: () => blot.destroy(),
      });

      burstFx(scene, 'ptx-dot', toX, toY, 8, 520, {
        tint: VENOM,
        speed: { min: 25, max: 80 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.9, end: 0 },
        gravityY: 70,
      });
    },
  });
}

/**
 * DEATH STING — the mark that opens the Desert bosses' three-act pattern (Emperor,
 * Monarch, Sovereign). It has to read as "you are now marked", not as damage, so it
 * plants a hovering sun-glyph over the target rather than hitting it.
 */
export function fxDeathSting(scene: GameScene, x: number, y: number): void {
  const glyph = scene.add.graphics({ x, y: y - 34 }).setDepth(DEPTH.FX);
  glyph.lineStyle(3, SUN_GLOW, 0.95);
  glyph.strokeCircle(0, 0, 13);
  // Four short rays: a sun mark, matching the Sun Mark status it applies.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    glyph.lineBetween(Math.cos(a) * 17, Math.sin(a) * 17, Math.cos(a) * 25, Math.sin(a) * 25);
  }
  glyph.setScale(0.3);
  scene.tweens.add({
    targets: glyph,
    scaleX: 1,
    scaleY: 1,
    duration: 220,
    ease: 'Back.easeOut',
  });
  scene.tweens.add({
    targets: glyph,
    alpha: 0,
    y: y - 46,
    delay: 700,
    duration: 400,
    ease: 'Quad.easeIn',
    onComplete: () => glyph.destroy(),
  });

  burstFx(scene, 'ptx-spark', x, y - 30, 10, 500, {
    tint: SUN_CORE,
    speed: { min: 20, max: 70 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -40,
  });
}

/**
 * EXECUTION — the payoff that consumes the mark. The mirror of Death Sting: where
 * the mark bloomed open and hung above the target, the execution SLAMS shut on it.
 * Inward-collapsing blades plus a hard gold detonation at the centre.
 */
export function fxExecution(scene: GameScene, x: number, y: number, radius: number): void {
  // Blades converging from the rim — inward, because this is the thing closing.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const blade = scene.add
      .graphics({ x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius })
      .setDepth(DEPTH.FX);
    blade.fillStyle(SUN_CORE, 0.9);
    blade.fillTriangle(0, -5, 34, 0, 0, 5);
    blade.setRotation(a + Math.PI);
    scene.tweens.add({
      targets: blade,
      x,
      y,
      alpha: 0,
      duration: 260,
      ease: 'Cubic.easeIn',
      onComplete: () => blade.destroy(),
    });
  }

  scene.time.delayedCall(250, () => {
    const boom = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    boom.fillStyle(0xffffff, 0.95);
    boom.fillCircle(0, 0, 22);
    boom.fillStyle(SUN_GLOW, 0.5);
    boom.fillCircle(0, 0, 40);
    scene.tweens.add({
      targets: boom,
      alpha: 0,
      scaleX: 2.6,
      scaleY: 2.6,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => boom.destroy(),
    });

    const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    ring.lineStyle(5, SUN_CORE, 0.9);
    ring.strokeCircle(0, 0, radius * 0.5);
    scene.tweens.add({
      targets: ring,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 380,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    burstFx(scene, 'ptx-spark', x, y, 30, 560, {
      tint: SUN_GLOW,
      speed: { min: 140, max: 360 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
    });
  });
}
