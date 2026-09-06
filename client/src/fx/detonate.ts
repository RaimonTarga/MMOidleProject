import type { GameScene } from '../scenes/GameScene';
import type { DamageElement } from '@mmo-idle/shared';
import { ELEMENT_STYLE } from '../render/damageNumberStyle';
import { DEPTH } from '../render/depth';

/**
 * Detonate — every affliction on the target going off at once.
 *
 * Tinted by whichever element was owed the most damage, so a fire build's
 * detonation is orange and a frost build's is blue. That colour is the only cue
 * telling the player which of their damage-over-time sources actually mattered,
 * and it is why the element is resolved server-side rather than guessed here.
 *
 * The shape is deliberately the loudest FX in the affliction pair: Contagion is
 * a quiet crawl, Detonate is the payoff. It is a hard flash, an expanding shock
 * ring, and radial shards — no lingering field, because the effects are GONE and
 * the visual has to say so.
 */

const SHARD_COUNT = 12;

function elementColor(element: DamageElement): number {
  return Number.parseInt(ELEMENT_STYLE[element].color.replace('#', ''), 16);
}

export function fxDetonate(
  scene: GameScene,
  x: number,
  y: number,
  element: DamageElement,
): void {
  const color = elementColor(element);
  const cy = y - 8;

  // 1. Core flash — the instant of release.
  const core = scene.add.circle(x, cy, 12, 0xffffff, 0.95).setDepth(DEPTH.FX);
  scene.tweens.add({
    targets: core,
    scale: 2.6,
    alpha: 0,
    duration: 190,
    ease: 'Quad.easeOut',
    onComplete: () => core.destroy(),
  });

  // 2. Element-tinted body, slower and larger than the white core so the colour
  //    is what the eye is left holding.
  const body = scene.add.circle(x, cy, 16, color, 0.7).setDepth(DEPTH.FX);
  scene.tweens.add({
    targets: body,
    scale: 4.2,
    alpha: 0,
    duration: 380,
    ease: 'Cubic.easeOut',
    onComplete: () => body.destroy(),
  });

  // 3. Shock ring — a stroked circle, which reads at a glance as "a thing burst"
  //    in a way a filled blob never does.
  const ring = scene.add.graphics().setDepth(DEPTH.FX);
  const ringState = { radius: 8, alpha: 0.9 };
  scene.tweens.add({
    targets: ringState,
    radius: 78,
    alpha: 0,
    duration: 420,
    ease: 'Cubic.easeOut',
    onUpdate: () => {
      ring.clear();
      ring.lineStyle(3, color, ringState.alpha);
      ring.strokeCircle(x, cy, ringState.radius);
    },
    onComplete: () => ring.destroy(),
  });

  // 4. Radial shards — the afflictions themselves being thrown off.
  for (let i = 0; i < SHARD_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / SHARD_COUNT + Math.random() * 0.25;
    const distance = 46 + Math.random() * 34;
    const shard = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
    shard.lineStyle(3, color, 0.95);
    shard.beginPath();
    shard.moveTo(0, 0);
    shard.lineTo(Math.cos(angle) * 11, Math.sin(angle) * 11);
    shard.strokePath();
    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(angle) * distance,
      y: cy + Math.sin(angle) * distance,
      alpha: 0,
      duration: 340 + Math.random() * 120,
      ease: 'Quad.easeOut',
      onComplete: () => shard.destroy(),
    });
  }
}
