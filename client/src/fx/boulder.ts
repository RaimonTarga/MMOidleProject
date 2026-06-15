import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const STONE  = 0x8899aa;  // mountain blue-grey
const DUST   = 0xaa9977;  // earthy throw/landing dust
const CHIP   = 0xccddee;  // pale stone highlight / flying chips

export function fxBoulder(
  scene: GameScene,
  fromX: number, fromY: number,
  toX: number, toY: number,
): void {
  // Throw puff at origin
  burstFx(scene, 'ptx-dot', fromX, fromY, 6, 300, {
    tint: DUST,
    speed: { min: 30, max: 80 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.85, end: 0 },
    alpha: { start: 0.65, end: 0 },
  });

  // Boulder projectile — arcs from thrower to target
  const boulder = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  boulder.fillStyle(STONE, 1);
  boulder.fillCircle(0, 0, 9);
  boulder.fillStyle(CHIP, 0.45);
  boulder.fillCircle(-2, -3, 4);  // surface highlight

  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const arcHeight = Math.min(72, dist * 0.30);
  const travelMs  = Math.min(520, Math.max(200, dist * 1.1));

  const t = { v: 0 };
  scene.tweens.add({
    targets: t,
    v: 1,
    duration: travelMs,
    ease: 'Linear',
    onUpdate: () => {
      boulder.x = fromX + dx * t.v;
      boulder.y = fromY + dy * t.v - arcHeight * Math.sin(t.v * Math.PI);
    },
    onComplete: () => {
      boulder.destroy();
      spawnBoulderImpact(scene, toX, toY);
    },
  });
}

function spawnBoulderImpact(scene: GameScene, x: number, y: number): void {
  // Expanding stone-dust ring
  const ring = scene.add.graphics().setDepth(DEPTH.FX);
  const s = { r: 5, alpha: 0.9 };
  scene.tweens.add({
    targets: s, r: 40, alpha: 0, duration: 380, ease: 'Cubic.Out',
    onUpdate: () => {
      ring.clear();
      ring.lineStyle(3, STONE, s.alpha);
      ring.strokeCircle(x, y, s.r);
    },
    onComplete: () => ring.destroy(),
  });

  // Heavy dust cloud
  burstFx(scene, 'ptx-dot', x, y, 16, 500, {
    tint: DUST,
    speed: { min: 45, max: 140 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.5, end: 0 },
    alpha: { start: 0.80, end: 0 },
  });

  // Stone chips sparking outward
  burstFx(scene, 'ptx-spark', x, y, 12, 380, {
    tint: CHIP,
    speed: { min: 90, max: 240 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.0, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
