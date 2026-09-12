import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const BONE = 0xe8e2d0;
const BONE_SHADOW = 0x9a9280;
const GRAVE = 0x6f7a55;

/**
 * BONE STRIKE — the Graveyard's skeletal melee: a dry, clattering swipe of bare
 * bone rather than anything venomous.
 *
 * Bone Crawler and Bone Rat were both authored on `poison` while carrying **no
 * `dotEffect` at all** — the graveyard's actual poison carriers are Plague Hound and
 * Charnel Brute, which are separate mobs. So these two were drawing a green venom
 * splash for an attack that has nothing to do with venom.
 *
 * Reads as brittle and cheap on purpose: these are the tier's chaff, and the cue
 * should say "clatter", not "threat". Three short bone slivers snap across the
 * target with a pale off-white flash and a dry shard spray — no glow, no saturation.
 */
export function fxBoneStrike(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const reach = empowered ? 30 : 24;
  const baseAngle = -Math.PI / 5 + (Math.random() - 0.5) * 0.5;

  // Three slivers at slightly different angles — a rattle, not a clean rake.
  for (let i = 0; i < 3; i++) {
    const angle = baseAngle + (i - 1) * 0.3;
    const sliver = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    sliver.lineStyle(empowered ? 4 : 3, BONE_SHADOW, 0.6);
    sliver.lineBetween(-reach, 0, reach, 0);
    sliver.lineStyle(empowered ? 2.5 : 2, BONE, 1);
    sliver.lineBetween(-reach, 0, reach, 0);
    sliver.setRotation(angle);
    sliver.setAlpha(0);
    scene.tweens.add({
      targets: sliver,
      alpha: 1,
      duration: 60,
      delay: i * 45,
      ease: 'Quad.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: sliver,
          alpha: 0,
          duration: 180,
          ease: 'Quad.easeIn',
          onComplete: () => sliver.destroy(),
        });
      },
    });
  }

  // Flat, unsaturated impact — no bloom. The graveyard chaff should not flash
  // brighter than the elites that share its nodes.
  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(BONE, empowered ? 0.5 : 0.38);
  flash.fillCircle(0, 0, empowered ? 18 : 14);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 1.7,
    scaleY: 1.7,
    duration: 220,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Dry shards fall rather than spray — bone chips, not sparks.
  burstFx(scene, 'ptx-dot', toX, toY, empowered ? 12 : 9, 420, {
    tint: BONE,
    speed: { min: 50, max: 150 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 210,
  });
  burstFx(scene, 'ptx-dot', toX, toY, 5, 460, {
    tint: GRAVE,
    speed: { min: 30, max: 90 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.8, end: 0 },
    gravityY: 120,
  });
}
