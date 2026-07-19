import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Power Shot — the Ridge Ambusher's charged release. A heavy, glowing projectile
 * rips from the monster to the target with a thick tracer and a charged muzzle
 * flash, then detonates in a big impact ring + spark spray. Deliberately bigger
 * and brighter than a normal gunshot so the telegraphed payoff reads as a heavy hit.
 */
export function fxPowerShot(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const core = 0xffe066;
  const glow = 0xff7722;

  // Charged muzzle flash at the archer.
  const muzzle = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  muzzle.fillStyle(core, 0.9);
  muzzle.fillCircle(0, 0, 9);
  muzzle.lineStyle(2.5, glow, 0.9);
  muzzle.strokeCircle(0, 0, 13);
  scene.tweens.add({
    targets: muzzle,
    scaleX: 1.8,
    scaleY: 1.8,
    alpha: 0,
    duration: 220,
    ease: 'Quad.easeOut',
    onComplete: () => muzzle.destroy(),
  });

  // Heavy projectile with a trailing tracer.
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const proj = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  proj.rotation = angle;
  // Tracer streak behind the head.
  proj.fillStyle(glow, 0.55);
  proj.fillRect(-26, -3, 26, 6);
  proj.fillStyle(core, 1);
  proj.fillCircle(0, 0, 5.5);
  proj.lineStyle(2, glow, 0.9);
  proj.strokeCircle(0, 0, 8);

  scene.tweens.add({
    targets: proj,
    x: toX,
    y: toY,
    duration: 240,
    ease: 'Quad.easeIn',
    onComplete: () => {
      proj.destroy();

      // Heavy impact: double ring + spark spray.
      const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      ring.lineStyle(4, core, 1);
      ring.strokeCircle(0, 0, 12);
      ring.lineStyle(2.5, glow, 0.8);
      ring.strokeCircle(0, 0, 20);
      scene.tweens.add({
        targets: ring,
        scaleX: 4.2,
        scaleY: 4.2,
        alpha: 0,
        duration: 380,
        ease: 'Quad.easeOut',
        onComplete: () => ring.destroy(),
      });

      const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      flash.fillStyle(core, 0.85);
      flash.fillCircle(0, 0, 16);
      scene.tweens.add({
        targets: flash,
        scaleX: 1.9,
        scaleY: 1.9,
        alpha: 0,
        duration: 240,
        ease: 'Quad.easeOut',
        onComplete: () => flash.destroy(),
      });

      burstFx(scene, 'ptx-spark', toX, toY, 22, 360, {
        tint: core,
        speed: { min: 110, max: 320 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.1, end: 0.1 },
        alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 360 },
      });
    },
  });
}
