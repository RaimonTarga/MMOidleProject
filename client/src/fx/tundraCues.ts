import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * TUNDRA ability cues.
 *
 * Rime Caster's Frostbind drew an arrow tracer; Permafrost Behemoth's Glacial Slam
 * and both Tundra bosses' Deep Freeze → Shatter / Glacial Collapse sequences drew
 * `strong-kick`, i.e. warm STONE dust for a biome whose whole mechanic is cold.
 *
 * Shared grammar: pale blue-white, hard angular shards, and — per the class pass's
 * shard rule — Deep Freeze closes INWARD (something is locking you) while Shatter
 * throws OUTWARD (something broke). They are deliberate mirrors, because in this
 * lineage the second only happens after the first.
 */

const ICE_CORE = 0xeaf7ff;
const ICE_MID = 0x9fd4ee;
const ICE_DEEP = 0x4a86ad;

/** Angular ice shards radiating from a point; `inward` flips them to converge. */
function shards(
  scene: GameScene,
  x: number,
  y: number,
  count: number,
  dist: number,
  len: number,
  inward: boolean,
): void {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const startR = inward ? dist : 0;
    const endR = inward ? 0 : dist;
    const shard = scene.add
      .graphics({ x: x + Math.cos(a) * startR, y: y + Math.sin(a) * startR })
      .setDepth(DEPTH.FX);
    shard.fillStyle(ICE_CORE, 0.9);
    shard.fillTriangle(0, -len * 0.22, len, 0, 0, len * 0.22);
    shard.setRotation(inward ? a + Math.PI : a);
    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(a) * endR,
      y: y + Math.sin(a) * endR,
      alpha: 0,
      duration: 320 + Math.random() * 120,
      ease: inward ? 'Cubic.easeIn' : 'Cubic.easeOut',
      onComplete: () => shard.destroy(),
    });
  }
}

/**
 * FROSTBIND / DEEP FREEZE — the chill-gated root (Rime Caster, Hoarfrost Yeti, and
 * the opening step of both Tundra bosses' patterns).
 *
 * Ice closes in on the target: shards converge, then a cage of vertical spikes locks
 * around it. Nothing travels from the caster, because the mechanic is the ROOM's
 * accumulated Chill cashing in, not a projectile.
 */
export function fxDeepFreeze(scene: GameScene, x: number, y: number): void {
  shards(scene, x, y, 8, 52, 22, true);

  // The cage: spikes growing up around the victim.
  scene.time.delayedCall(200, () => {
    for (let i = 0; i < 5; i++) {
      const ox = (i - 2) * 11 + (Math.random() - 0.5) * 5;
      const h = 26 + Math.random() * 14;
      const spike = scene.add.graphics({ x: x + ox, y: y + 12 }).setDepth(DEPTH.FX);
      spike.fillStyle(ICE_MID, 0.75);
      spike.fillTriangle(-5, 0, 5, 0, 0, -h);
      spike.fillStyle(ICE_CORE, 0.9);
      spike.fillTriangle(-2, 0, 2, 0, 0, -h * 0.8);
      spike.setScale(1, 0.1);
      scene.tweens.add({
        targets: spike,
        scaleY: 1,
        duration: 170,
        delay: i * 40,
        ease: 'Back.easeOut',
      });
      scene.tweens.add({
        targets: spike,
        alpha: 0,
        delay: 620 + i * 40,
        duration: 320,
        ease: 'Quad.easeIn',
        onComplete: () => spike.destroy(),
      });
    }
  });

  burstFx(scene, 'ptx-dot', x, y, 16, 620, {
    tint: ICE_CORE,
    speed: { min: 20, max: 70 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.65, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 110,
  });
}

/**
 * SHATTER / GLACIAL COLLAPSE — the payoff that follows Deep Freeze. The exact mirror:
 * everything the freeze drew converging now leaves, hard and outward.
 */
export function fxShatter(scene: GameScene, x: number, y: number, radius: number): void {
  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(0xffffff, 0.9);
  flash.fillCircle(0, 0, 20);
  flash.fillStyle(ICE_MID, 0.45);
  flash.fillCircle(0, 0, 38);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.4,
    scaleY: 2.4,
    duration: 280,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  shards(scene, x, y, 14, radius * 0.75, 30, false);

  // Ground ring sized to the real footprint, so the cue teaches the radius.
  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(5, ICE_CORE, 0.85);
  ring.strokeEllipse(0, 0, radius * 1.5, radius * 0.75);
  ring.setScale(0.3);
  scene.tweens.add({
    targets: ring,
    scaleX: 1,
    scaleY: 1,
    alpha: 0,
    duration: 420,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });

  burstFx(scene, 'ptx-spark', x, y, 32, 620, {
    tint: ICE_MID,
    speed: { min: 150, max: 380 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.15, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 130,
  });
  burstFx(scene, 'ptx-dot', x, y, 18, 700, {
    tint: ICE_DEEP,
    speed: { min: 60, max: 180 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.85, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 180,
  });
}

/**
 * GLACIAL SLAM — Permafrost Behemoth's chill-fed planted slam. A slam, so it is
 * vertical and heavy like the Mountain family, but it lands in ice rather than dust.
 */
export function fxGlacialSlam(scene: GameScene, x: number, y: number, radius: number): void {
  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(6, ICE_MID, 0.9);
  ring.strokeEllipse(0, 0, radius * 1.4, radius * 0.7);
  ring.setScale(0.2);
  scene.tweens.add({
    targets: ring,
    scaleX: 1,
    scaleY: 1,
    alpha: 0,
    duration: 400,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });

  const crush = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  crush.fillStyle(ICE_CORE, 0.8);
  crush.fillCircle(0, 0, 18);
  scene.tweens.add({
    targets: crush,
    alpha: 0,
    scaleX: 2.2,
    scaleY: 1.5,
    duration: 300,
    ease: 'Quad.easeOut',
    onComplete: () => crush.destroy(),
  });

  shards(scene, x, y, 10, radius * 0.6, 24, false);

  burstFx(scene, 'ptx-dot', x, y, 20, 640, {
    tint: ICE_CORE,
    speed: { min: 80, max: 220 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 200,
  });
}
