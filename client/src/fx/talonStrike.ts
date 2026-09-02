import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';

const TALON_BRIGHT = 0xfff3ba;
const TALON_EDGE = 0xd8a83c;

/**
 * A raptor's close rake: three hooked, gold-white talon trails closing across
 * the victim. Shared by the Savanna Hawk, Stone Eagle, and Cliffside Roc so
 * their melee identity reads consistently instead of like a ground sword swing.
 */
export function fxTalonStrike(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const perp = angle + Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * 10;
    const x = toX + Math.cos(perp) * offset;
    const y = toY + Math.sin(perp) * offset;
    const rake = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    rake.lineStyle(3, i === 1 ? TALON_BRIGHT : TALON_EDGE, 0.95);
    const startX = -Math.cos(angle) * 19 - Math.cos(perp) * 8;
    const startY = -Math.sin(angle) * 19 - Math.sin(perp) * 8;
    const midX = Math.cos(angle) * 4;
    const midY = Math.sin(angle) * 4;
    const endX = Math.cos(angle) * 23 + Math.cos(perp) * 11;
    const endY = Math.sin(angle) * 23 + Math.sin(perp) * 11;
    rake.beginPath();
    rake.moveTo(startX, startY);
    rake.lineTo(midX, midY);
    rake.lineTo(endX, endY);
    rake.strokePath();
    rake.setScale(0.45);
    scene.tweens.add({
      targets: rake, scaleX: 1.2, scaleY: 1.2, alpha: 0,
      duration: 210, delay: i * 22, ease: 'Quad.easeOut',
      onComplete: () => rake.destroy(),
    });
  }
  burstFx(scene, 'ptx-spark', toX, toY, 7, 230, {
    tint: TALON_BRIGHT,
    speed: { min: 65, max: 175 }, angle: { min: 0, max: 360 },
    scale: { start: 0.55, end: 0 }, alpha: { start: 0.9, end: 0 }, gravityY: 100,
  });
}

/** The short golden flight streak that releases when Dive Bomb's cast completes. */
export function fxDiveBomb(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const trail = scene.add.graphics().setDepth(DEPTH.FX);
  trail.lineStyle(8, TALON_EDGE, 0.25);
  trail.lineBetween(fromX, fromY, toX, toY);
  trail.lineStyle(2.5, TALON_BRIGHT, 0.85);
  trail.lineBetween(fromX, fromY, toX, toY);
  scene.tweens.add({
    targets: trail, alpha: 0, duration: 230, ease: 'Quad.easeIn',
    onComplete: () => trail.destroy(),
  });
}
