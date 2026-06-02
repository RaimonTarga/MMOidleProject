import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Visual for the first-strike weapon proc: a deep crimson burst with
 * radial slash lines. Intentionally heavier than a normal hit — this is
 * the "opener" moment.
 */
export function fxFirstStrike(scene: GameScene, toX: number, toY: number): void {
  // Central flash — deep crimson, larger and slower than fxImpact's orange
  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(0xdd0011, 0.92);
  flash.fillCircle(0, 0, 26);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.0,
    scaleY: 2.0,
    duration: 130,
    onComplete: () => flash.destroy(),
  });

  // Two expanding rings in dark red / blood red
  for (let i = 0; i < 2; i++) {
    const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    ring.lineStyle(3 - i * 0.5, i === 0 ? 0xbb0000 : 0xff2200, 1);
    ring.strokeCircle(0, 0, 10 + i * 9);
    scene.tweens.add({
      targets: ring,
      scaleX: 5.5 + i,
      scaleY: 5.5 + i,
      alpha: 0,
      duration: 400 + i * 70,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  // Four diagonal slash lines radiating outward — "the first blow"
  const len = 28;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const slash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    slash.lineStyle(2, 0xff1100, 1);
    slash.lineBetween(0, 0, Math.cos(angle) * len, Math.sin(angle) * len);
    scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 260,
      ease: 'Power1',
      onComplete: () => slash.destroy(),
    });
  }

  // Crimson particle burst — more particles and faster than standard impact
  burstFx(scene, 'ptx-dot', toX, toY, 12, 440, {
    tint: 0xcc1100,
    speed: { min: 110, max: 300 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 170,
  });
}
