import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

export function fxFrostSnowflake(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const sLen = empowered ? 54 : 36;
  const spokes = empowered ? 8 : 6;
  const g = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    const perpA = a + Math.PI / 2;
    const tx = Math.cos(a) * sLen;
    const ty = Math.sin(a) * sLen;
    g.lineStyle(empowered ? 2.5 : 2, empowered ? 0xddeeff : 0xaaddff, 1);
    g.lineBetween(0, 0, tx, ty);
    const bx = Math.cos(a) * sLen * 0.58;
    const by = Math.sin(a) * sLen * 0.58;
    const tk = empowered ? 10 : 7;
    g.lineStyle(1.5, empowered ? 0xffffff : 0xddeeff, 0.85);
    g.lineBetween(bx - Math.cos(perpA) * tk, by - Math.sin(perpA) * tk, bx + Math.cos(perpA) * tk, by + Math.sin(perpA) * tk);
    g.lineBetween(tx - Math.cos(perpA) * 5, ty - Math.sin(perpA) * 5, tx + Math.cos(perpA) * 5, ty + Math.sin(perpA) * 5);
  }
  scene.tweens.add({ targets: g, alpha: 0, duration: empowered ? 420 : 280, ease: 'Quad.easeOut', onComplete: () => g.destroy() });

  const cFlash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  cFlash.fillStyle(0xffffff, empowered ? 0.88 : 0.65);
  cFlash.fillCircle(0, 0, empowered ? 10 : 6);
  scene.tweens.add({ targets: cFlash, alpha: 0, scaleX: 2, scaleY: 2, duration: 110, onComplete: () => cFlash.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, empowered ? 10 : 5, 350, {
    tint: 0xaaddff, speed: { min: 35, max: 120 }, angle: { min: 0, max: 360 },
    scale: { start: 0.55, end: 0 }, alpha: { start: 1, end: 0 },
  });
}
