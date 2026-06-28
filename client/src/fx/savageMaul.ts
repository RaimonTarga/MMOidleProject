import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const BLOOD = 0xcc1122;
const RAKE = 0xff5544;

/**
 * Savage Maul — the forest alpha boss's charged pounce (Gnarled Greatbear). After
 * the cast-bar wind-up it lunges, a crimson leap-streak trailing into the target,
 * then rakes three parallel claw gashes and bursts a shove ring on impact. Reads
 * as a heavy predator maul, distinct from the generic strong-kick ring it used to
 * borrow.
 */
export function fxSavageMaul(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);

  // Leap streak — a tapering crimson smear from the boss into the target.
  const streak = scene.add.graphics().setDepth(DEPTH.FX);
  streak.lineStyle(7, BLOOD, 0.35);
  streak.lineBetween(fromX, fromY, toX, toY);
  streak.lineStyle(3, RAKE, 0.7);
  streak.lineBetween(fromX, fromY, toX, toY);
  scene.tweens.add({
    targets: streak,
    alpha: 0,
    duration: 180,
    ease: 'Quad.easeIn',
    onComplete: () => streak.destroy(),
  });

  // Three parallel claw gashes across the target, perpendicular to the lunge.
  const perp = angle + Math.PI / 2;
  const gashLen = 30;
  for (let i = 0; i < 3; i++) {
    const off = (i - 1) * 11;
    const ox = Math.cos(angle) * off;
    const oy = Math.sin(angle) * off;
    const gash = scene.add.graphics({ x: toX + ox, y: toY + oy }).setDepth(DEPTH.FX);
    gash.lineStyle(3, i === 1 ? 0xffffff : RAKE, 1);
    gash.lineBetween(
      -Math.cos(perp) * gashLen,
      -Math.sin(perp) * gashLen,
      Math.cos(perp) * gashLen,
      Math.sin(perp) * gashLen,
    );
    gash.setScale(0.5);
    scene.tweens.add({
      targets: gash,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 260,
      delay: 60 + i * 25,
      ease: 'Quad.easeOut',
      onComplete: () => gash.destroy(),
    });
  }

  // Shove ring — the pounce slamming home.
  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  ring.lineStyle(3, BLOOD, 0.8);
  ring.strokeCircle(0, 0, 12);
  scene.tweens.add({
    targets: ring,
    scaleX: 3.4,
    scaleY: 3.4,
    alpha: 0,
    duration: 360,
    delay: 80,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  burstFx(scene, 'ptx-dot', toX, toY, 12, 360, {
    tint: BLOOD,
    speed: { min: 90, max: 240 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 180,
  });
}
