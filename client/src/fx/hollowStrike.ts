import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';

/**
 * Destroyer (`cooldown-heavy-b`) regular attack.
 *
 * Destroyer's normal hits deal literally nothing — `normalHit.ts` sets
 * `ctx.damage = 0` — and the client never checked `ev.damage`, so they played
 * the full Squire slam: crater, cracks, rubble, for zero damage. That is not a
 * missing animation, it is an actively lying one.
 *
 * The absence IS the message here, so this is deliberately the quietest effect
 * in the game: a thin desaturated ring that barely expands, and nothing else.
 * No sparks, no debris, no flash. On-hit gear still fires on these swings, so it
 * must not read as a total whiff either — just as a blow with no force behind it.
 */

const HOLLOW = 0x8d93a1;

export function fxHollowStrike(scene: GameScene, toX: number, toY: number): void {
  const g = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  g.lineStyle(1.5, HOLLOW, 0.55);
  g.strokeCircle(0, 0, 9);
  scene.tweens.add({
    targets: g,
    scaleX: 1.5,
    scaleY: 1.5,
    alpha: 0,
    duration: 180,
    ease: 'Quad.easeOut',
    onComplete: () => g.destroy(),
  });
}
