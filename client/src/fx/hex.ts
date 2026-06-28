import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const HEX_PURPLE = 0xaa55cc;
const HEX_GREEN = 0x88dd55;

/**
 * Hex bolt — the swamp casters' attack (Bog Witch, Mire Hex Spitter). A sickly
 * orb of violet rot, shot through with marsh-green, wobbles to the target trailing
 * spores, then bursts into a hex ring with a small runic cross. Replaces the
 * generic arcane `magic` bolt so the swamp's curse-and-rot identity reads.
 */
export function fxHex(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  // Wobbling hex orb travelling to the target.
  const orb = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  orb.fillStyle(HEX_PURPLE, 0.85);
  orb.fillCircle(0, 0, 7);
  orb.fillStyle(HEX_GREEN, 0.6);
  orb.fillCircle(0, 0, 3.5);

  const dx = toX - fromX;
  const dy = toY - fromY;
  // Perpendicular wobble so the bolt drifts like a curse, not a bullet.
  const px = -dy;
  const py = dx;
  const plen = Math.hypot(px, py) || 1;

  const t = { v: 0 };
  scene.tweens.add({
    targets: t,
    v: 1,
    duration: 300,
    ease: 'Sine.easeIn',
    onUpdate: () => {
      const wob = Math.sin(t.v * Math.PI * 3) * 10 * (1 - t.v);
      orb.x = fromX + dx * t.v + (px / plen) * wob;
      orb.y = fromY + dy * t.v + (py / plen) * wob;
      if (Math.random() < 0.5) {
        burstFx(scene, 'ptx-dot', orb.x, orb.y, 1, 320, {
          tint: HEX_GREEN,
          speed: { min: 5, max: 30 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.7, end: 0 },
        });
      }
    },
    onComplete: () => {
      orb.destroy();
      spawnHexImpact(scene, toX, toY);
    },
  });
}

function spawnHexImpact(scene: GameScene, x: number, y: number): void {
  // Hex ring.
  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(2.5, HEX_PURPLE, 0.9);
  ring.strokeCircle(0, 0, 12);
  scene.tweens.add({
    targets: ring,
    scaleX: 3,
    scaleY: 3,
    alpha: 0,
    duration: 360,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  // A small runic cross flashing inside the burst.
  const rune = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  rune.lineStyle(2, HEX_GREEN, 0.95);
  rune.lineBetween(-9, 0, 9, 0);
  rune.lineBetween(0, -9, 0, 9);
  rune.lineBetween(-6, -6, 6, 6);
  rune.lineBetween(6, -6, -6, 6);
  rune.setScale(0.6);
  scene.tweens.add({
    targets: rune,
    rotation: 0.6,
    scaleX: 1.3,
    scaleY: 1.3,
    alpha: 0,
    duration: 320,
    ease: 'Quad.easeOut',
    onComplete: () => rune.destroy(),
  });

  burstFx(scene, 'ptx-dot', x, y, 12, 460, {
    tint: HEX_PURPLE,
    speed: { min: 40, max: 150 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 0.9, end: 0 },
  });
}
