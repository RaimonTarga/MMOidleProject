import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const SHARD_BRIGHT = 0xf0e6ff;
const SHARD_CORE = 0xa06fe8;
const SHARD_DEEP = 0x5c2f9e;

/**
 * Break Free (hard-CC counter): the thing holding the player SHATTERS.
 *
 * The one ability that fires while the player is stunned, so its FX has to cut
 * through whatever is already on the sprite — a stun swirl, a frost tint, a
 * lockdown ring. Hence the violent read: a white flash, four bands snapping
 * apart in opposite directions, and shards flung outward on every axis. Violet
 * because nothing else in the ability set uses it, so "you got free" is never
 * mistaken for a heal or a shield.
 */
export function fxBreakFree(scene: GameScene, x: number, y: number): void {
  const cy = y - 6;

  // Snap flash.
  const flash = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  flash.fillStyle(SHARD_BRIGHT, 0.85);
  flash.fillCircle(0, 0, 20);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.8,
    scaleY: 2.8,
    duration: 180,
    ease: 'Expo.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Four broken bands flying apart — the restraint coming off. Drawn as short
  // arcs so they read as pieces of a ring rather than as generic streaks.
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i + Math.PI / 4;
    const band = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
    band.lineStyle(4, SHARD_CORE, 0.95);
    band.beginPath();
    band.arc(0, 0, 22, angle - 0.5, angle + 0.5, false);
    band.strokePath();
    scene.tweens.add({
      targets: band,
      x: x + Math.cos(angle) * 46,
      y: cy + Math.sin(angle) * 46,
      alpha: 0,
      rotation: (i % 2 === 0 ? 1 : -1) * 1.2,
      duration: 340,
      ease: 'Quad.easeOut',
      onComplete: () => band.destroy(),
    });
  }

  // Expanding break ring.
  const ring = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  ring.lineStyle(3, SHARD_BRIGHT, 0.9);
  ring.strokeCircle(0, 0, 16);
  scene.tweens.add({
    targets: ring,
    scaleX: 3.6,
    scaleY: 3.6,
    alpha: 0,
    duration: 380,
    ease: 'Expo.easeOut',
    onComplete: () => ring.destroy(),
  });

  // Shards, thrown hard and in every direction.
  burstFx(scene, 'ptx-spark', x, cy, 26, 420, {
    tint: SHARD_CORE,
    speed: { min: 180, max: 420 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
  burstFx(scene, 'ptx-dot', x, cy, 12, 520, {
    tint: SHARD_DEEP,
    speed: { min: 60, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 0.9, end: 0 },
  });
}
