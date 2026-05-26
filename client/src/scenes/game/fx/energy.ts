import type { Vec2 } from '@mmo-idle/shared';
import type { GameScene } from '../GameScene';
import { burstFx } from './particles';

function zigzagPoints(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  segments: number,
  spread: number,
): Vec2[] {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const perpX = dist > 0 ? -dy / dist : 0;
  const perpY = dist > 0 ? dx / dist : 0;
  const pts: Vec2[] = [{ x: fromX, y: fromY }];
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const jitter = (Math.random() - 0.5) * 2 * spread;
    pts.push({ x: fromX + dx * t + perpX * jitter, y: fromY + dy * t + perpY * jitter });
  }
  pts.push({ x: toX, y: toY });
  return pts;
}

export function fxLightning(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number, discharge: boolean): void {
  const color = discharge ? 0xffffff : 0x88aaff;
  const glowCol = discharge ? 0xaaccff : 0x3355cc;
  const segs = discharge ? 9 : 6;
  const spread = discharge ? 28 : 14;
  const pts = zigzagPoints(fromX, fromY, toX, toY, segs, spread);

  const g = scene.add.graphics().setDepth(12);
  g.lineStyle(discharge ? 6 : 4, glowCol, 0.22);
  for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  g.lineStyle(discharge ? 2.5 : 1.5, color, 1);
  for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  scene.tweens.add({ targets: g, alpha: 0, duration: discharge ? 220 : 130, onComplete: () => g.destroy() });

  if (!discharge) {
    burstFx(scene, 'ptx-spark', toX, toY, 5, 180, {
      tint: 0x88aaff, speed: { min: 60, max: 160 }, angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 }, rotate: { min: 0, max: 360 },
    });
    return;
  }

  for (let b = 0; b < 2; b++) {
    scene.time.delayedCall(b * 28, () => {
      const bpts = zigzagPoints(fromX, fromY, toX, toY, segs - 1, spread * 1.5);
      const gb = scene.add.graphics().setDepth(11);
      gb.lineStyle(1.5, 0x88ccff, 0.65);
      for (let i = 1; i < bpts.length; i++) gb.lineBetween(bpts[i - 1].x, bpts[i - 1].y, bpts[i].x, bpts[i].y);
      scene.tweens.add({ targets: gb, alpha: 0, duration: 170, onComplete: () => gb.destroy() });
    });
  }

  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(13);
  flash.fillStyle(0xffffff, 0.92);
  flash.fillCircle(0, 0, 28);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 3, scaleY: 3, duration: 180, onComplete: () => flash.destroy() });
  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(12);
  ring.lineStyle(3, 0xaaddff, 1);
  ring.strokeCircle(0, 0, 10);
  scene.tweens.add({ targets: ring, scaleX: 5.5, scaleY: 5.5, alpha: 0, duration: 340, ease: 'Power2', onComplete: () => ring.destroy() });
  burstFx(scene, 'ptx-spark', toX, toY, 18, 400, {
    tint: 0x88ccff, speed: { min: 120, max: 380 }, angle: { min: 0, max: 360 },
    scale: { start: 1.1, end: 0 }, alpha: { start: 1, end: 0 }, rotate: { min: 0, max: 360 },
  });
  burstFx(scene, 'ptx-dot', toX, toY, 9, 280, {
    tint: 0xffffff, speed: { min: 60, max: 220 }, angle: { min: 0, max: 360 },
    scale: { start: 0.65, end: 0 }, alpha: { start: 1, end: 0 },
  });
}
