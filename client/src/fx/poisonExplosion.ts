import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Venomslinger poison detonation — a big billowing cloud of toxic gas (not a sharp
 * blast): soft overlapping green puffs that swell and fade, plus thick layers of
 * venom motes drifting outward and rising like fumes. Built from the same `ptx-dot`
 * smog particle as the regular poison FX, just much denser and longer-lived.
 */
export function fxPoisonExplosion(scene: GameScene, x: number, y: number): void {
  if (document.hidden) return;
  const bright = 0x7ce84a; // sickly bright green
  const mid    = 0x33cc55;
  const deep   = 0x1f7a2a;

  // Swelling gas puff — soft, translucent, slow expand + lingering fade.
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  const s = { r: 12, alpha: 0.5 };
  scene.tweens.add({
    targets: s, r: 54, alpha: 0, duration: 850, ease: 'Sine.easeOut',
    onUpdate: () => {
      g.clear();
      g.fillStyle(deep,   s.alpha * 0.45); g.fillCircle(x, y, s.r * 1.15);
      g.fillStyle(mid,    s.alpha * 0.55); g.fillCircle(x, y, s.r * 0.8);
      g.fillStyle(bright, s.alpha * 0.5);  g.fillCircle(x, y, s.r * 0.45);
    },
    onComplete: () => g.destroy(),
  });

  // Dense outer fumes — billow in all directions and rise, long lifetime so it lingers.
  burstFx(scene, 'ptx-dot', x, y, 26, 1100, {
    tint: mid,
    speed: { min: 18, max: 110 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.7, end: 0 },
    alpha: { start: 0.85, end: 0 },
    gravityY: -40,
  });
  // Slow, darker inner haze for density.
  burstFx(scene, 'ptx-dot', x, y, 16, 1300, {
    tint: deep,
    speed: { min: 6, max: 55 },
    angle: { min: 0, max: 360 },
    scale: { start: 2.1, end: 0 },
    alpha: { start: 0.6, end: 0 },
    gravityY: -22,
  });
}
