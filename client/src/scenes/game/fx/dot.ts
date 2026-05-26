import type { PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../GameScene';
import { burstFx } from './particles';

export type DotPath = 'poison' | 'fire' | 'frost';

export function getDotPath(player: PlayerView): DotPath {
  const p = player.passives;
  if ((p['dot.fan-the-flames'] ?? 0) > 0 || (p['dot.smoldering-ember'] ?? 0) > 0 || (p['dot.conflagration'] ?? 0) > 0) return 'fire';
  if ((p['dot.permafrost'] ?? 0) > 0 || (p['dot.freezing-cold'] ?? 0) > 0 || (p['dot.glacial-fracture'] ?? 0) > 0) return 'frost';
  if ((p['dot.poison-explosion'] ?? 0) > 0 || (p['dot.eternal-doom'] ?? 0) > 0 || (p['dot.invigorating-toxins'] ?? 0) > 0) return 'poison';
  if (player.selectedSubVariant === 'balanced') return 'fire';
  if (player.selectedSubVariant === 'heavy') return 'frost';
  return 'poison';
}

export function fxPoisonSmog(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(12);
  ring.lineStyle(2, 0x33dd55, 0.75);
  ring.strokeCircle(0, 0, 8);
  scene.tweens.add({ targets: ring, scaleX: empowered ? 5 : 3.5, scaleY: empowered ? 5 : 3.5, alpha: 0, duration: 520, ease: 'Power1', onComplete: () => ring.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, empowered ? 16 : 9, 750, {
    tint: 0x33dd66,
    speed: { min: 12, max: empowered ? 70 : 50 },
    angle: { min: 200, max: 340 },
    scale: { start: empowered ? 1.2 : 0.85, end: 0 },
    alpha: { start: 0.88, end: 0 },
    gravityY: -50,
  });

  if (empowered) {
    burstFx(scene, 'ptx-dot', toX, toY, 10, 900, {
      tint: 0x22aa44, speed: { min: 6, max: 30 }, angle: { min: 180, max: 360 },
      scale: { start: 1.5, end: 0 }, alpha: { start: 0.7, end: 0 }, gravityY: -30,
    });
  }
}

export function fxFireFlame(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(13);
  flash.fillStyle(0xffffff, empowered ? 0.9 : 0.72);
  flash.fillCircle(0, 0, empowered ? 18 : 11);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 75, onComplete: () => flash.destroy() });

  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(12);
  ring.lineStyle(3, 0xdd1100, 1);
  ring.strokeCircle(0, 0, empowered ? 14 : 9);
  scene.tweens.add({ targets: ring, scaleX: empowered ? 4.5 : 3.2, scaleY: empowered ? 4.5 : 3.2, alpha: 0, duration: 300, ease: 'Power2', onComplete: () => ring.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, empowered ? 16 : 10, 560, {
    tint: 0xff2200,
    speed: { min: 80, max: empowered ? 280 : 200 },
    angle: { min: 210, max: 330 },
    scale: { start: empowered ? 0.9 : 0.65, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -135,
  });

  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 10 : 5, 460, {
    tint: 0xff4422, speed: { min: 50, max: 150 }, angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 },
    gravityY: 100, rotate: { min: 0, max: 360 },
  });
}

export function fxFrostSnowflake(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const sLen = empowered ? 54 : 36;
  const spokes = empowered ? 8 : 6;
  const g = scene.add.graphics({ x: toX, y: toY }).setDepth(12);
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

  const cFlash = scene.add.graphics({ x: toX, y: toY }).setDepth(13);
  cFlash.fillStyle(0xffffff, empowered ? 0.88 : 0.65);
  cFlash.fillCircle(0, 0, empowered ? 10 : 6);
  scene.tweens.add({ targets: cFlash, alpha: 0, scaleX: 2, scaleY: 2, duration: 110, onComplete: () => cFlash.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, empowered ? 10 : 5, 350, {
    tint: 0xaaddff, speed: { min: 35, max: 120 }, angle: { min: 0, max: 360 },
    scale: { start: 0.55, end: 0 }, alpha: { start: 1, end: 0 },
  });
}
