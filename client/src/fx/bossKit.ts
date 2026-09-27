/**
 * Shared drawing primitives for the per-lineage boss animation modules
 * (premium pass, 2026-09-27): debris kicks, lobbed projectiles, growing ground
 * cracks, "inhale" convergence, rings and a drawn-on sigil.
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import type { Pt } from './windups';

/** Debris thrown in a direction (degrees), falling back under gravity. */
export function debrisKick(
  scene: GameScene,
  x: number,
  y: number,
  dirDeg: number,
  colors: number[],
  count = 10,
  spreadDeg = 40,
  speed = 180,
): void {
  burstFx(scene, 'ptx-dot', x, y, count, 520, {
    tint: colors,
    speed: { min: speed * 0.4, max: speed },
    angle: { min: dirDeg - spreadDeg, max: dirDeg + spreadDeg },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 360,
    rotate: { min: 0, max: 360 },
  });
}

/** A soft cloud of dust spreading on the ground. */
export function dustCloud(scene: GameScene, x: number, y: number, colors: number[], scale = 1): void {
  burstFx(scene, 'ptx-dot', x, y, Math.round(14 * scale), 800, {
    tint: colors,
    speed: { min: 15 * scale, max: 90 * scale },
    angle: { min: 0, max: 360 },
    scale: { start: 1.2 * scale, end: 2.4 * scale },
    alpha: { start: 0.55, end: 0 },
    gravityY: -10,
  });
}

/** Particles drawn IN toward a point (a breath, a charge gathering). */
export function inhale(scene: GameScene, x: number, y: number, colors: number[], radius: number, ms: number): void {
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const mote = scene.add
      .graphics({ x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius * 0.7 })
      .setDepth(DEPTH.FX);
    mote.fillStyle(colors[i % colors.length], 0.85);
    mote.fillCircle(0, 0, 2.5);
    scene.tweens.add({
      targets: mote,
      x,
      y,
      alpha: 0.2,
      duration: ms * (0.7 + Math.random() * 0.3),
      ease: 'Cubic.easeIn',
      onComplete: () => mote.destroy(),
    });
  }
}

/** One expanding ring. */
export function ring(
  scene: GameScene,
  x: number,
  y: number,
  color: number,
  opts: { from?: number; scale?: number; width?: number; ms?: number; alpha?: number; flat?: boolean; delay?: number } = {},
): void {
  const g = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  g.lineStyle(opts.width ?? 3, color, opts.alpha ?? 0.85);
  const r = opts.from ?? 16;
  if (opts.flat) g.strokeEllipse(0, 0, r * 2, r * 0.8);
  else g.strokeCircle(0, 0, r);
  scene.tweens.add({
    targets: g,
    scaleX: opts.scale ?? 4,
    scaleY: opts.scale ?? 4,
    alpha: 0,
    duration: opts.ms ?? 420,
    delay: opts.delay ?? 0,
    ease: 'Quad.easeOut',
    onComplete: () => g.destroy(),
  });
}

/**
 * A lobbed projectile on a parabola, with a ground shadow tracking under it.
 * `draw` paints the projectile at the origin; `onLand` fires at the target.
 */
export function lob(
  scene: GameScene,
  from: Pt,
  to: Pt,
  ms: number,
  height: number,
  draw: (g: Phaser.GameObjects.Graphics) => void,
  onLand?: () => void,
): void {
  const body = scene.add.graphics().setDepth(DEPTH.FX + 1);
  draw(body);
  const shadow = scene.add.graphics().setDepth(DEPTH.FX - 1);
  shadow.fillStyle(0x000000, 0.28);
  shadow.fillEllipse(0, 0, 18, 7);
  const p = { t: 0 };
  scene.tweens.add({
    targets: p,
    t: 1,
    duration: ms,
    ease: 'Linear',
    onUpdate: () => {
      const x = from.x + (to.x - from.x) * p.t;
      const gy = from.y + (to.y - from.y) * p.t;
      const arc = Math.sin(p.t * Math.PI) * height;
      body.setPosition(x, gy - arc).setRotation(p.t * 6);
      shadow.setPosition(x, gy).setScale(0.6 + p.t * 0.6);
    },
    onComplete: () => {
      body.destroy();
      shadow.destroy();
      onLand?.();
    },
  });
}

/** Deterministic pseudo-random from a seed (stable crack shapes per zone). */
function seeded(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Jagged cracks radiating from a point, drawn to `progress` (0..1) of their length. */
export function drawCracks(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  progress: number,
  color: number,
  alpha: number,
  seed: number,
  count = 7,
): void {
  const rand = seeded(seed);
  g.lineStyle(2, color, alpha);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rand() * 0.6;
    const len = radius * (0.6 + rand() * 0.4) * progress;
    let px = x;
    let py = y;
    g.beginPath();
    g.moveTo(px, py);
    const segs = 4;
    for (let sgm = 1; sgm <= segs; sgm++) {
      const d = (len * sgm) / segs;
      const jitter = (rand() - 0.5) * 0.5;
      px = x + Math.cos(a + jitter) * d;
      py = y + Math.sin(a + jitter) * d * 0.55;
      g.lineTo(px, py);
    }
    g.strokePath();
  }
}

/** A sigil drawn on over time: circle, then an inner star, `progress` 0..1. */
export function drawSigil(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  progress: number,
  color: number,
  alpha: number,
  spin: number,
  points = 5,
  flat = 1,
): void {
  const circle = Math.min(1, progress * 1.6);
  g.lineStyle(2.5, color, alpha);
  g.beginPath();
  const steps = 40;
  for (let i = 0; i <= Math.floor(steps * circle); i++) {
    const a = spin + (i / steps) * Math.PI * 2;
    const px = x + Math.cos(a) * radius;
    const py = y + Math.sin(a) * radius * flat;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.strokePath();
  const star = Math.max(0, (progress - 0.4) / 0.6);
  if (star <= 0) return;
  g.lineStyle(2, color, alpha * star);
  g.beginPath();
  for (let i = 0; i <= points; i++) {
    const a = spin * -1.5 + ((i * 2) / points) * Math.PI * 2;
    const px = x + Math.cos(a) * radius * 0.82;
    const py = y + Math.sin(a) * radius * 0.82 * flat;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.strokePath();
}

/** Unit direction from `a` to `b` (or +x when they coincide). */
export function dirTo(a: Pt, b: Pt): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  return d > 1 ? { x: dx / d, y: dy / d } : { x: 1, y: 0 };
}

/** Degrees of a direction. */
export const deg = (d: Pt): number => (Math.atan2(d.y, d.x) * 180) / Math.PI;

/** Direction the body is moving right now (toward its broadcast destination). */
export function travelDir(scene: GameScene, id: string): Pt | null {
  const transform = scene.state.transform.get(id);
  const interp = scene.state.interpolation.get(id);
  if (!transform || !interp) return null;
  const dx = transform.target.x - interp.base.x;
  const dy = transform.target.y - interp.base.y;
  const d = Math.hypot(dx, dy);
  return d > 1 ? { x: dx / d, y: dy / d } : null;
}
