import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import type { AttackTint } from './elementTint';

/**
 * Striker (cadence) basic attack.
 *
 * The plain three-line `fxSlash` this replaces read as a scratch rather than a
 * sword stroke. This is built on the Forest Greatbear's rake treatment — a
 * progressive write-on, a glow under a bright core, an impact flash and a real
 * spark burst — but deliberately ONE cut instead of four claws: a single
 * tapered crescent that bows forward through the target.
 *
 * Empowered keeps cadence's blue surge identity; the baseline is white steel so
 * the two never blur together.
 *
 * An optional elemental `tint` recolors the wash and the sparks. The bright core
 * is deliberately left alone: it carries the empowered read, and a green weapon
 * must not be able to hide a surge.
 */

const BASE_CORE = 0xffffff;
const BASE_GLOW = 0xffe3a0;
const EMP_CORE = 0xdfefff;
const EMP_GLOW = 0x4499ff;

/** Arc resolution. High enough that the taper reads as a blade, not a polyline. */
const SEGMENTS = 24;

/** Alternate the diagonal so a sustained cadence never looks like one stamp. */
let mirrorNextSlash = false;

export function fxStrikerSlash(
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
  const spark = tint?.particles ?? glow;
  const halfLen = empowered ? 62 : 48;
  const maxWidth = empowered ? 9 : 6.5;
  const bow = empowered ? 26 : 20;

  const attackAngle = Math.atan2(toY - fromY, toX - fromX);
  const mirror = mirrorNextSlash ? -1 : 1;
  mirrorNextSlash = !mirrorNextSlash;

  // The chord runs across the attack path (perpendicular, tilted for a diagonal
  // swing); the bow pushes the belly of the crescent past the target, along the
  // attack vector, so the cut reads as coming from the attacker.
  const chordAngle = attackAngle + Math.PI / 2 + mirror * 0.45;
  const cx = Math.cos(chordAngle);
  const cy = Math.sin(chordAngle);
  const bx = Math.cos(attackAngle);
  const by = Math.sin(attackAngle);

  /** Point on the crescent at 0..1 along the chord, bowed forward at the belly. */
  const pointAt = (t: number): { x: number; y: number } => {
    const along = (t * 2 - 1) * halfLen;
    const belly = Math.sin(Math.PI * t) * bow;
    return {
      x: cx * along + bx * belly,
      y: cy * along + by * belly,
    };
  };

  // Anticipation ghost: a thin, faint copy of the same arc pulled back toward
  // the attacker, so the main cut lands on a line the eye already started.
  const ghost = scene.add
    .graphics({ x: toX - bx * 15, y: toY - by * 15 })
    .setDepth(DEPTH.FX);
  ghost.lineStyle(1.5, glow, 0.4);
  ghost.beginPath();
  for (let i = 0; i <= SEGMENTS; i++) {
    const p = pointAt(i / SEGMENTS);
    if (i === 0) ghost.moveTo(p.x * 0.8, p.y * 0.8);
    else ghost.lineTo(p.x * 0.8, p.y * 0.8);
  }
  ghost.strokePath();
  scene.tweens.add({
    targets: ghost,
    alpha: 0,
    duration: 170,
    ease: 'Quad.easeOut',
    onComplete: () => ghost.destroy(),
  });

  // The cut itself. `head` is the leading edge of the blade, `tail` the point the
  // trail has already dissolved past, so the stroke wipes across the target in
  // the swing direction instead of appearing whole.
  const blade = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  const sweep = { progress: 0 };
  const drawBlade = (): void => {
    const head = Math.min(1, sweep.progress / 0.45);
    const tail = Math.max(0, (sweep.progress - 0.3) / 0.7);
    blade.clear();
    if (head <= tail) return;
    for (let i = 0; i < SEGMENTS; i++) {
      const t0 = i / SEGMENTS;
      const t1 = (i + 1) / SEGMENTS;
      if (t1 < tail || t0 > head) continue;
      const p0 = pointAt(t0);
      const p1 = pointAt(t1);
      // Taper: fat at the belly, vanishing at both tips.
      const w = maxWidth * Math.pow(Math.sin(Math.PI * ((t0 + t1) / 2)), 0.55);
      blade.lineStyle(w * 2.1, glow, 0.34);
      blade.lineBetween(p0.x, p0.y, p1.x, p1.y);
      blade.lineStyle(w, core, 1);
      blade.lineBetween(p0.x, p0.y, p1.x, p1.y);
    }
  };
  scene.tweens.add({
    targets: sweep,
    progress: 1,
    duration: empowered ? 320 : 260,
    ease: 'Cubic.easeOut',
    onUpdate: drawBlade,
    onComplete: () => blade.destroy(),
  });

  // Contact flash, sitting under the blade's belly rather than dead-centre so
  // the brightest point is where the edge actually passes through.
  const flash = scene.add
    .graphics({ x: toX + bx * bow * 0.35, y: toY + by * bow * 0.35 })
    .setDepth(DEPTH.FX);
  flash.fillStyle(glow, empowered ? 0.7 : 0.55);
  flash.fillCircle(0, 0, empowered ? 26 : 20);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.1,
    scaleY: 2.1,
    duration: 230,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Sparks throw off the edge, so they fan along the chord instead of scattering
  // in a circle — the debris tells you which way the blade went.
  const chordDeg = (chordAngle * 180) / Math.PI;
  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 24 : 16, 420, {
    tint: core,
    speed: { min: 90, max: empowered ? 300 : 220 },
    angle: { min: chordDeg - 42, max: chordDeg + 42 },
    scale: { start: empowered ? 1.05 : 0.85, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 24 : 16, 420, {
    tint: spark,
    speed: { min: 90, max: empowered ? 300 : 220 },
    angle: { min: chordDeg + 138, max: chordDeg + 222 },
    scale: { start: empowered ? 1.05 : 0.85, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });

  if (empowered) {
    const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    ring.lineStyle(3, core, 1);
    ring.strokeCircle(0, 0, 12);
    scene.tweens.add({
      targets: ring,
      scaleX: 4.2,
      scaleY: 4.2,
      alpha: 0,
      duration: 340,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}
