import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import { zigzagPoints } from './lightning';
import type { AttackTint } from './elementTint';

/**
 * Equinox (`energy-balanced-a`) basic attack.
 *
 * Equinox is always in one of two phases, and they are genuine opposites:
 *
 *   Charge State     slow energy gain, +on-hit damage, SLOWER attacks
 *   Discharge State  fast energy gain, +attack damage, FASTER attacks
 *
 * The aura already tells you which phase you are in (opposed green/magenta), so
 * this is the lower-value half of the pair — but the attacks themselves were
 * identical stock Spirit zigzags in both phases, which made the tempo change the
 * player can feel in their hands invisible on screen.
 *
 * Palette deliberately matches the aura's two colours rather than inventing a
 * third pair, so the glow and the bolt always agree on the phase. The geometry
 * carries the rest: Charge is a fat, slow, coherent arc (power accumulating),
 * Discharge is a thin, fast, forked one (power being spent).
 */

/** Charge — the same green the `equinox-charge` aura uses. */
const CHARGE_BODY = 0x44dd66;
const CHARGE_CORE = 0xd6ffdf;
/** Discharge — the same magenta as `equinox-discharge`. */
const DISCHARGE_BODY = 0xdd44cc;
const DISCHARGE_CORE = 0xffd6f7;

export function fxEquinoxArc(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  discharging: boolean,
  empowered: boolean,
  tint?: AttackTint,
): void {
  const core = discharging ? DISCHARGE_CORE : CHARGE_CORE;
  const body = tint?.glow ?? (discharging ? DISCHARGE_BODY : CHARGE_BODY);
  const spark = tint?.particles ?? core;

  // Charge gathers: few segments, little wander, fat stroke, held longer.
  // Discharge spends: more segments, wide wander, thin stroke, gone fast.
  const segments = discharging ? 9 : 5;
  const spread = discharging ? 24 : 10;
  const glowWidth = (discharging ? 4 : 7) * (empowered ? 1.4 : 1);
  const coreWidth = (discharging ? 1.5 : 2.5) * (empowered ? 1.4 : 1);
  const durationMs = discharging ? 110 : 210;

  const pts = zigzagPoints(fromX, fromY, toX, toY, segments, spread);
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  g.lineStyle(glowWidth, body, 0.26);
  for (let i = 1; i < pts.length; i++)
    g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  g.lineStyle(coreWidth, core, 1);
  for (let i = 1; i < pts.length; i++)
    g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  scene.tweens.add({
    targets: g,
    alpha: 0,
    duration: durationMs,
    onComplete: () => g.destroy(),
  });

  if (discharging) {
    // A second forked branch: spending the pool throws stray current.
    const branch = zigzagPoints(fromX, fromY, toX, toY, segments - 2, spread * 1.6);
    const gb = scene.add.graphics().setDepth(DEPTH.FX);
    gb.lineStyle(1.25, body, 0.6);
    for (let i = 1; i < branch.length; i++)
      gb.lineBetween(branch[i - 1].x, branch[i - 1].y, branch[i].x, branch[i].y);
    scene.tweens.add({
      targets: gb,
      alpha: 0,
      duration: 140,
      onComplete: () => gb.destroy(),
    });
  } else {
    // Charge pulls a ring INWARD at the target — accumulation, not release.
    const gather = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    gather.lineStyle(2, body, 0.75);
    gather.strokeCircle(0, 0, 26);
    scene.tweens.add({
      targets: gather,
      scaleX: 0.3,
      scaleY: 0.3,
      alpha: 0,
      duration: 220,
      ease: 'Quad.easeIn',
      onComplete: () => gather.destroy(),
    });
  }

  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(body, discharging ? 0.65 : 0.5);
  flash.fillCircle(0, 0, empowered ? 20 : 15);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: discharging ? 2.2 : 1.6,
    scaleY: discharging ? 2.2 : 1.6,
    duration: discharging ? 170 : 230,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  burstFx(scene, 'ptx-spark', toX, toY, discharging ? 14 : 7, 300, {
    tint: spark,
    speed: { min: discharging ? 90 : 40, max: discharging ? 280 : 130 },
    angle: { min: 0, max: 360 },
    scale: { start: empowered ? 0.9 : 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
