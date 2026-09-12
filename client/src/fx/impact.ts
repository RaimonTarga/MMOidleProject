import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import type { AttackTint } from './elementTint';

/**
 * Blunt impact. The Squire's basic attack, and the fallback style for every
 * monster with no style of its own — monsters pass no `tint`, so they keep the
 * original orange bloom.
 *
 * A tint recolors the outer ring and the debris. The inner flash and inner ring
 * keep the execution white/orange, because that is the execution tell.
 */
export function fxImpact(scene: GameScene, toX: number, toY: number, execution: boolean, tint?: AttackTint): void {
  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(execution ? 0xffffff : 0xff8844, execution ? 0.9 : 0.8);
  flash.fillCircle(0, 0, execution ? 28 : 16);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 90, onComplete: () => flash.destroy() });

  for (let i = 0; i < 2; i++) {
    // Inner ring (i === 0) is the archetype/execution tell; the outer ring is
    // the layer an element gets to wash.
    const ringColor = i === 0
      ? (execution ? 0xffffff : 0xff7744)
      : (tint?.glow ?? (execution ? 0xaabbff : 0xffaa22));
    const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    ring.lineStyle(3 - i * 0.5, ringColor, 1);
    ring.strokeCircle(0, 0, 10 + i * 8);
    scene.tweens.add({ targets: ring, scaleX: 4.5 + i, scaleY: 4.5 + i, alpha: 0, duration: 320 + i * 60, ease: 'Power2', onComplete: () => ring.destroy() });
  }

  burstFx(scene, 'ptx-dot', toX, toY, execution ? 14 : 8, 380, {
    tint: tint?.particles ?? (execution ? 0xddeeff : 0xff7744),
    speed: { min: 80, max: 240 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.55, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 180,
  });

  if (execution) {
    const cross = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    const cLen = 42;
    cross.lineStyle(3, 0xeeeeff, 1);
    cross.lineBetween(-cLen, -cLen, cLen, cLen);
    cross.lineBetween(cLen, -cLen, -cLen, cLen);
    cross.lineStyle(3, 0xffffff, 0.9);
    cross.lineBetween(-cLen, 0, cLen, 0);
    cross.lineBetween(0, -cLen, 0, cLen);
    scene.tweens.add({ targets: cross, alpha: 0, scaleX: 1.9, scaleY: 1.9, duration: 380, ease: 'Quad.easeOut', onComplete: () => cross.destroy() });
  }
}
