import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import type { AttackTint } from './elementTint';

/**
 * Haunt (`energy-range-close`) basic attack.
 *
 * Spirit's default bolt is a zigzag drawn between two points, and a Haunt fights
 * at 12px — the standard FX had no room to zigzag, so a 6-segment jitter with a
 * 14px spread collapsed into a scribble.
 *
 * Inverted here: instead of electricity CROSSING a gap, it discharges INTO the
 * body and crawls back out. Short forked tendrils burst from the contact point
 * and curl outward, so the energy reads as earthing through the target rather
 * than travelling to it.
 *
 * Palette follows energy: cornflower at baseline, white on the discharge.
 */

const BASE_CORE = 0x88aaff;
const BASE_GLOW = 0x3355cc;
const EMP_CORE = 0xffffff;
const EMP_GLOW = 0xaaccff;

/** Tendrils per discharge. Enough to read as a burst, few enough to stay legible. */
const TENDRILS = 5;
const SEGMENTS_PER_TENDRIL = 4;

export function fxArcDischarge(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  empowered: boolean,
  tint?: AttackTint,
): void {
  const core = empowered ? EMP_CORE : BASE_CORE;
  const glow = tint?.glow ?? (empowered ? EMP_GLOW : BASE_GLOW);
  const spark = tint?.particles ?? core;
  const reach = empowered ? 40 : 30;

  // Bias the fan away from the attacker, so the arcs look like they were driven
  // through the target rather than radiating from nowhere.
  const awayAngle = Math.atan2(toY - fromY, toX - fromX);

  const g = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  for (let t = 0; t < TENDRILS; t++) {
    // Spread across most of a circle but weighted forward: -2.2..+2.2 rad off
    // the attack vector, so a couple still curl back toward the attacker.
    const base = awayAngle + (t / (TENDRILS - 1) - 0.5) * 4.4;
    let x = 0;
    let y = 0;
    let heading = base;
    const pts: { x: number; y: number }[] = [{ x, y }];
    for (let s = 0; s < SEGMENTS_PER_TENDRIL; s++) {
      // Each segment wanders and shortens, giving the branching taper of a real
      // arc instead of a uniform star.
      heading += (Math.random() - 0.5) * 1.5;
      const step = (reach / SEGMENTS_PER_TENDRIL) * (1.25 - s * 0.18);
      x += Math.cos(heading) * step;
      y += Math.sin(heading) * step;
      pts.push({ x, y });
    }
    g.lineStyle(empowered ? 4 : 3, glow, 0.3);
    for (let i = 1; i < pts.length; i++)
      g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    g.lineStyle(empowered ? 1.75 : 1.25, core, 0.95);
    for (let i = 1; i < pts.length; i++)
      g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  }
  // Strobe rather than fade: electricity does not dim, it stops. Phaser's
  // `Stepped` ease takes its step count through easeParams.
  scene.tweens.add({
    targets: g,
    alpha: { from: 1, to: 0 },
    duration: empowered ? 150 : 115,
    ease: 'Stepped',
    easeParams: [3],
    onComplete: () => g.destroy(),
  });

  // The hand that delivered it, and the body that took it.
  const hand = scene.add.graphics({ x: fromX, y: fromY - 8 }).setDepth(DEPTH.FX);
  hand.fillStyle(core, 0.85);
  hand.fillCircle(0, 0, empowered ? 8 : 6);
  scene.tweens.add({
    targets: hand,
    alpha: 0,
    scaleX: 1.9,
    scaleY: 1.9,
    duration: 130,
    onComplete: () => hand.destroy(),
  });

  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(glow, empowered ? 0.6 : 0.45);
  flash.fillCircle(0, 0, empowered ? 22 : 16);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2,
    scaleY: 2,
    duration: 200,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 16 : 10, 300, {
    tint: spark,
    speed: { min: 70, max: empowered ? 260 : 180 },
    angle: { min: 0, max: 360 },
    scale: { start: empowered ? 0.85 : 0.65, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
