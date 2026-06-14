import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Cultist on-hit FX — a billowing purple "doom" cloud (the doom-flavored cousin of
 * the green poison smog): a violet ring puff and dark-purple wisps curling upward.
 */
export function fxDoomCloud(scene: GameScene, x: number, y: number, empowered: boolean): void {
  if (document.hidden) return;
  const purple = 0x9d4dff;
  const deep   = 0x5a1f9a;

  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(2, purple, 0.75);
  ring.strokeCircle(0, 0, 8);
  scene.tweens.add({ targets: ring, scaleX: empowered ? 5 : 3.5, scaleY: empowered ? 5 : 3.5, alpha: 0, duration: 520, ease: 'Power1', onComplete: () => ring.destroy() });

  burstFx(scene, 'ptx-dot', x, y, empowered ? 16 : 9, 760, {
    tint: purple,
    speed: { min: 12, max: empowered ? 70 : 50 },
    angle: { min: 200, max: 340 },
    scale: { start: empowered ? 1.2 : 0.85, end: 0 },
    alpha: { start: 0.88, end: 0 },
    gravityY: -50,
  });
  if (empowered) {
    burstFx(scene, 'ptx-dot', x, y, 10, 900, {
      tint: deep, speed: { min: 6, max: 30 }, angle: { min: 180, max: 360 },
      scale: { start: 1.5, end: 0 }, alpha: { start: 0.7, end: 0 }, gravityY: -30,
    });
  }
}

/**
 * Cultist eternal-doom DoT tick — a compact void-style implosion → burst (a smaller
 * sibling of the Voidwalker discharge): a violet ring collapses inward, then a quick
 * flash + expanding double ring. Kept light since it fires every tick.
 */
export function fxDoomTick(scene: GameScene, x: number, y: number): void {
  if (document.hidden) return;
  const violet = 0x9d4dff;
  const dark   = 0x3a0d52;
  const core   = 0xe6c2ff;

  // Implosion — ring collapsing into the point.
  const imp = scene.add.graphics().setDepth(DEPTH.FX);
  const si = { r: 26, alpha: 0.8 };
  scene.tweens.add({
    targets: si, r: 4, alpha: 0, duration: 160, ease: 'Quad.easeIn',
    onUpdate: () => { imp.clear(); imp.lineStyle(2, violet, si.alpha); imp.strokeCircle(x, y, si.r); },
    onComplete: () => imp.destroy(),
  });

  // Burst after the implosion lands.
  scene.time.delayedCall(150, () => {
    if (document.hidden) return;
    const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    flash.fillStyle(core, 0.9);
    flash.fillCircle(0, 0, 9);
    flash.fillStyle(violet, 0.4);
    flash.fillCircle(0, 0, 18);
    scene.tweens.add({ targets: flash, alpha: 0, scaleX: 2.2, scaleY: 2.2, duration: 220, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });

    const ring = scene.add.graphics().setDepth(DEPTH.FX);
    const s = { r: 6, alpha: 0.85 };
    scene.tweens.add({
      targets: s, r: 34, alpha: 0, duration: 280, ease: 'Cubic.Out',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(2.5, violet, s.alpha);
        ring.strokeCircle(x, y, s.r);
        ring.lineStyle(1.5, dark, s.alpha * 0.8);
        ring.strokeCircle(x, y, s.r * 0.65);
      },
      onComplete: () => ring.destroy(),
    });
  });
}
