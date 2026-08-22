import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const THORN_LIGHT = 0xc4e88a;
const THORN_CORE = 0x5f9b3a;
const THORN_DEEP = 0x2f5c1c;

/** One thorn: a narrow triangle pointing away from the player. */
function thorn(
  g: Phaser.GameObjects.Graphics,
  angle: number,
  inner: number,
  length: number,
  halfWidth: number,
): void {
  const tipX = Math.cos(angle) * (inner + length);
  const tipY = Math.sin(angle) * (inner + length);
  const baseX = Math.cos(angle) * inner;
  const baseY = Math.sin(angle) * inner;
  const nx = -Math.sin(angle) * halfWidth;
  const ny = Math.cos(angle) * halfWidth;
  g.beginPath();
  g.moveTo(tipX, tipY);
  g.lineTo(baseX + nx, baseY + ny);
  g.lineTo(baseX - nx, baseY - ny);
  g.closePath();
}

/**
 * Bramble Guard (anti-swarm Guard): a ring of thorns erupts outward.
 *
 * Points OUTWARD, on every side, because the ability is about being surrounded —
 * it is strongest exactly when many attackers are landing hits, and the FX
 * should promise that to anything standing close. Green and spiky, distinct from
 * the smooth plates of Brace and Endure, which do nothing back.
 */
export function fxBramble(scene: GameScene, x: number, y: number): void {
  const cy = y - 4;

  // Twelve thorns springing out of a tight ring.
  const spikes = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  spikes.fillStyle(THORN_CORE, 0.9);
  for (let i = 0; i < 12; i++) {
    thorn(spikes, (Math.PI * 2 * i) / 12, 14, 16 + (i % 3) * 4, 4);
    spikes.fillPath();
  }
  spikes.lineStyle(1.5, THORN_LIGHT, 0.9);
  for (let i = 0; i < 12; i++) {
    thorn(spikes, (Math.PI * 2 * i) / 12, 14, 16 + (i % 3) * 4, 4);
    spikes.strokePath();
  }
  spikes.setScale(0.3);
  scene.tweens.add({
    targets: spikes,
    scaleX: 1,
    scaleY: 1,
    duration: 200,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: spikes,
        alpha: 0,
        scaleX: 1.15,
        scaleY: 1.15,
        delay: 260,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => spikes.destroy(),
      });
    },
  });

  // Bark-dark hardening ring under the thorns — the plating half of the ability.
  const bark = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
  bark.lineStyle(4, THORN_DEEP, 0.7);
  bark.strokeCircle(0, 0, 15);
  scene.tweens.add({
    targets: bark,
    scaleX: 2.2,
    scaleY: 2.2,
    alpha: 0,
    duration: 420,
    ease: 'Quad.easeOut',
    onComplete: () => bark.destroy(),
  });

  // Leaf litter thrown up as the growth breaks through.
  burstFx(scene, 'ptx-dot', x, cy, 14, 620, {
    tint: THORN_LIGHT,
    speed: { min: 60, max: 190 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 60,
  });
}
