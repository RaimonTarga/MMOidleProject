import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const ROCK = 0x70787f;
const CHIP = 0xb8c2cc;

/**
 * Stone spit — the cave gargoyles' ranged attack. A jagged rock shard is hurled
 * fast and flat at the target and shatters into chips on impact. Replaces the
 * generic bright `gunshot` tracer with something that reads as flung stone.
 */
export function fxStoneSpit(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);

  // Jagged shard, rotated to face its flight.
  const shard = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  shard.fillStyle(ROCK, 1);
  shard.fillTriangle(7, 0, -5, -4, -4, 5);
  shard.fillStyle(CHIP, 0.5);
  shard.fillTriangle(5, -1, -2, -3, -1, 2);
  shard.setRotation(angle);

  scene.tweens.add({
    targets: shard,
    x: toX,
    y: toY,
    rotation: angle + Math.PI * 1.5,
    duration: 220,
    ease: 'Quad.easeIn',
    onComplete: () => {
      shard.destroy();

      const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      flash.fillStyle(CHIP, 0.8);
      flash.fillCircle(0, 0, 7);
      scene.tweens.add({
        targets: flash,
        alpha: 0,
        scaleX: 1.8,
        scaleY: 1.8,
        duration: 160,
        ease: 'Quad.easeOut',
        onComplete: () => flash.destroy(),
      });

      // Stone chips shattering off.
      burstFx(scene, 'ptx-spark', toX, toY, 9, 300, {
        tint: CHIP,
        speed: { min: 80, max: 220 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 360 },
      });
      burstFx(scene, 'ptx-dot', toX, toY, 5, 320, {
        tint: ROCK,
        speed: { min: 40, max: 120 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.8, end: 0 },
        gravityY: 160,
      });
    },
  });
}
