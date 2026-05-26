import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';

export function fxGunshot(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number, empowered: boolean): void {
  const color = empowered ? 0xffee66 : 0xddeeff;
  const width = empowered ? 2.5 : 1.5;

  const g = scene.add.graphics().setDepth(12);
  g.lineStyle(width + 3, color, 0.15);
  g.lineBetween(fromX, fromY, toX, toY);
  g.lineStyle(width, color, 1);
  g.lineBetween(fromX, fromY, toX, toY);
  scene.tweens.add({ targets: g, alpha: 0, duration: 90, ease: 'Quad.easeIn', onComplete: () => g.destroy() });

  const muzzle = scene.add.graphics({ x: fromX, y: fromY }).setDepth(12);
  muzzle.fillStyle(color, 0.7);
  muzzle.fillCircle(0, 0, empowered ? 7 : 4);
  scene.tweens.add({ targets: muzzle, alpha: 0, scaleX: 2, scaleY: 2, duration: 80, onComplete: () => muzzle.destroy() });

  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(13);
  flash.fillStyle(color, 0.88);
  flash.fillCircle(0, 0, empowered ? 16 : 8);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 150, onComplete: () => flash.destroy() });

  const travelAngleDeg = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
  const backDeg = (travelAngleDeg + 180 + 360) % 360;
  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 10 : 5, empowered ? 280 : 190, {
    tint: color,
    speed: { min: 80, max: empowered ? 260 : 180 },
    angle: { min: backDeg - 40, max: backDeg + 40 },
    scale: { start: empowered ? 1.0 : 0.65, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
