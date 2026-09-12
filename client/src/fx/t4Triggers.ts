import type { DamageElement } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import { elementColor } from './elementTint';

/**
 * One-shot cues for tier-4 path THRESHOLDS — the moments where a specialization
 * pays off and the game previously said nothing.
 *
 * Grouped in one file for the same reason `bossCues.ts` is: these are a family
 * sharing a visual grammar, not seven unrelated effects. Each is a threshold
 * being crossed, so each is a short, hard, non-repeating pop — deliberately
 * louder than a DoT tick and quieter than a boss cue.
 *
 * The grammar has one rule worth stating, because two of these are otherwise
 * the same picture: shards travelling OUTWARD mean something broke (armor,
 * stacks, a cap), and shards travelling INWARD mean something closed around the
 * target (an encasement). Rimeshatter and Frozen sit on opposite sides of it.
 */

// ── shared helpers ─────────────────────────────────────────────────────────

/** Angular shards thrown out from, or drawn in to, a point. */
function shards(
  scene: GameScene,
  x: number,
  y: number,
  opts: {
    count: number;
    color: number;
    inward?: boolean;
    radius: number;
    length: number;
    width?: number;
    durationMs?: number;
  },
): void {
  const { count, color, inward = false, radius, length } = opts;
  const width = opts.width ?? 2.5;
  const durationMs = opts.durationMs ?? 320;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const g = scene.add.graphics().setDepth(DEPTH.FX);
    g.lineStyle(width, color, 0.95);
    g.lineBetween(0, 0, Math.cos(a) * length, Math.sin(a) * length);
    const near = { x: x + Math.cos(a) * radius * 0.2, y: y + Math.sin(a) * radius * 0.2 };
    const far = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
    const from = inward ? far : near;
    const to = inward ? near : far;
    g.setPosition(from.x, from.y);
    g.setRotation(a);
    scene.tweens.add({
      targets: g,
      x: to.x,
      y: to.y,
      alpha: 0,
      duration: durationMs,
      ease: inward ? 'Quad.easeIn' : 'Quad.easeOut',
      onComplete: () => g.destroy(),
    });
  }
}

/** Expanding ring. The common "a threshold was crossed here" spine. */
function ring(
  scene: GameScene,
  x: number,
  y: number,
  color: number,
  opts?: { start?: number; scale?: number; width?: number; durationMs?: number },
): void {
  const g = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  g.lineStyle(opts?.width ?? 3, color, 1);
  g.strokeCircle(0, 0, opts?.start ?? 10);
  scene.tweens.add({
    targets: g,
    scaleX: opts?.scale ?? 4,
    scaleY: opts?.scale ?? 4,
    alpha: 0,
    duration: opts?.durationMs ?? 340,
    ease: 'Power2',
    onComplete: () => g.destroy(),
  });
}

function flash(
  scene: GameScene,
  x: number,
  y: number,
  color: number,
  radius: number,
  alpha = 0.7,
): void {
  const g = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  g.fillStyle(color, alpha);
  g.fillCircle(0, 0, radius);
  scene.tweens.add({
    targets: g,
    alpha: 0,
    scaleX: 2,
    scaleY: 2,
    duration: 200,
    ease: 'Quad.easeOut',
    onComplete: () => g.destroy(),
  });
}

// ── cadence ────────────────────────────────────────────────────────────────

const VERDICT_CORE = 0xffffff;
const VERDICT_GOLD = 0xffe98a;

/**
 * Justicar — the Verdict executes. The banked pool covers the target's remaining
 * health and the finisher simply ends it.
 *
 * A sentence being carried out, so the motion is a single descending stroke
 * rather than a burst: the blade of light falls from above, then the ring
 * confirms it. The server has tagged this as `verdict-execute` all along; there
 * was never a handler for it.
 */
export function fxVerdictExecute(scene: GameScene, x: number, y: number): void {
  const blade = scene.add.graphics({ x, y: y - 90 }).setDepth(DEPTH.FX);
  blade.fillStyle(VERDICT_GOLD, 0.35);
  blade.fillRect(-11, -70, 22, 140);
  blade.fillStyle(VERDICT_CORE, 0.95);
  blade.fillRect(-3.5, -70, 7, 140);
  blade.setScale(1, 0.2);
  scene.tweens.add({
    targets: blade,
    y,
    scaleY: 1,
    duration: 130,
    ease: 'Quart.easeIn',
    onComplete: () => {
      scene.tweens.add({
        targets: blade,
        alpha: 0,
        scaleX: 2.4,
        duration: 240,
        ease: 'Quad.easeOut',
        onComplete: () => blade.destroy(),
      });
      flash(scene, x, y, VERDICT_GOLD, 30, 0.85);
      ring(scene, x, y, VERDICT_CORE, { scale: 5, durationMs: 380 });
      burstFx(scene, 'ptx-spark', x, y, 22, 460, {
        tint: VERDICT_CORE,
        speed: { min: 100, max: 320 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 360 },
      });
    },
  });
}

/**
 * Berserker — Rampage overloads at max stacks and crashes to zero.
 *
 * The aura already ramps red→orange across the climb (`rampage-1..3`), so this
 * is only the CRASH: everything the aura accumulated is thrown off at once.
 * Shards go outward because a cap broke.
 */
export function fxRampageOverload(scene: GameScene, x: number, y: number): void {
  const hot = 0xff7a1a;
  const pale = 0xffcf9a;
  flash(scene, x, y, hot, 34, 0.8);
  ring(scene, x, y, pale, { scale: 5.5, width: 4, durationMs: 420 });
  ring(scene, x, y, hot, { start: 18, scale: 4, width: 2.5, durationMs: 500 });
  shards(scene, x, y, {
    count: 10,
    color: pale,
    radius: 64,
    length: 16,
    width: 3,
    durationMs: 380,
  });
  burstFx(scene, 'ptx-spark', x, y, 30, 560, {
    tint: hot,
    speed: { min: 120, max: 380 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.15, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}

/**
 * Scrapper — the Cursed Finale brands the target: +damage taken, and a
 * PERMANENT plating strip that persists on that target.
 *
 * Target-side and lingering, which nothing else in cadence does, so it reads as
 * a mark pressed INTO the enemy rather than an explosion off it: a sigil snaps
 * shut and short cracks stay behind where the plating came away. Sickly
 * violet-grey, deliberately not the Cultist's clean doom purple.
 */
export function fxCursedFinale(scene: GameScene, x: number, y: number): void {
  const curse = 0xa07ab8;
  const dark = 0x4a2f5c;

  const sigil = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  sigil.lineStyle(2.5, curse, 0.95);
  // A hexagram-ish brand: two offset triangles read as a mark at small sizes
  // where a circle would just read as another ring.
  for (const rot of [0, Math.PI / 3]) {
    sigil.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = rot + (i * Math.PI * 2) / 3;
      const px = Math.cos(a) * 22;
      const py = Math.sin(a) * 22;
      if (i === 0) sigil.moveTo(px, py);
      else sigil.lineTo(px, py);
    }
    sigil.strokePath();
  }
  sigil.setScale(1.9);
  sigil.setAlpha(0);
  scene.tweens.add({
    targets: sigil,
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    rotation: 0.5,
    duration: 170,
    ease: 'Quart.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: sigil,
        alpha: 0,
        duration: 280,
        onComplete: () => sigil.destroy(),
      });
    },
  });

  flash(scene, x, y, dark, 24, 0.55);
  // Plating coming away: a few short cracks that fall rather than fly.
  burstFx(scene, 'ptx-dot', x, y, 9, 520, {
    tint: curse,
    speed: { min: 40, max: 130 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 260,
  });
}

// ── cooldown ───────────────────────────────────────────────────────────────

/**
 * Sunderer — the execution bypasses 100% of plating and opens a 2s window where
 * regular attacks keep piercing half of it.
 *
 * Armor coming apart, so: angular steel shards outward plus a hard white flash.
 * The Squire's orange stays on the ring so it still reads as a cooldown
 * execution rather than a generic break.
 */
export function fxSunderShatter(scene: GameScene, x: number, y: number): void {
  const steel = 0xdfe8f5;
  const squire = 0xffaa22;
  flash(scene, x, y, steel, 28, 0.85);
  ring(scene, x, y, squire, { scale: 4.6, width: 3, durationMs: 380 });
  shards(scene, x, y, {
    count: 8,
    color: steel,
    radius: 58,
    length: 18,
    width: 3.5,
    durationMs: 340,
  });
  burstFx(scene, 'ptx-dot', x, y, 16, 520, {
    tint: steel,
    speed: { min: 100, max: 300 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.85, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 300,
  });
}

// ── dot ────────────────────────────────────────────────────────────────────

/**
 * Pyromancer — a hit landing on an already-maxed stack bar converts into bonus
 * DIRECT damage instead of another stack.
 *
 * Element-driven rather than fire-locked: the "the bar is full, this one hits
 * instead" moment is a shape any DoT path could want, so the colour comes from
 * the element. A full ring plus an inward snap says "capped", where an outward
 * burst would have read as another application.
 */
export function fxMaxStackBurst(
  scene: GameScene,
  x: number,
  y: number,
  element: DamageElement,
): void {
  const color = elementColor(element);
  flash(scene, x, y, color, 26, 0.7);
  ring(scene, x, y, color, { start: 14, scale: 3.4, width: 3.5, durationMs: 300 });
  shards(scene, x, y, {
    count: 7,
    color,
    inward: true,
    radius: 52,
    length: 13,
    width: 2.5,
    durationMs: 240,
  });
  burstFx(scene, 'ptx-spark', x, y, 18, 420, {
    tint: color,
    speed: { min: 90, max: 260 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.95, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}

/**
 * Icebreaker — at max frost stacks the conversion flips off: direct attacks land
 * at FULL damage and the target eats a DR debuff.
 *
 * The frost shell breaking, so shards go OUTWARD — the mirror of
 * {@link fxFrozenShatter}, which closes inward. The two fire on the same class
 * and must never be confused for one another.
 */
export function fxRimeshatter(scene: GameScene, x: number, y: number): void {
  const ice = 0x5fd0ff;
  const pale = 0xe4fbff;
  flash(scene, x, y, pale, 24, 0.75);
  ring(scene, x, y, ice, { scale: 4.2, width: 3, durationMs: 360 });
  shards(scene, x, y, {
    count: 9,
    color: pale,
    radius: 60,
    length: 15,
    width: 3,
    durationMs: 330,
  });
  burstFx(scene, 'ptx-spark', x, y, 20, 480, {
    tint: ice,
    speed: { min: 100, max: 300 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}

/**
 * Winter Warden — 9 Chill stacks convert into Frozen: a 2s severe slow at +35%
 * damage taken.
 *
 * Something CLOSING on the target, so the shards converge and a shell snaps into
 * place. Deliberately the inverse motion of {@link fxRimeshatter}.
 */
export function fxFrozenShatter(scene: GameScene, x: number, y: number): void {
  const ice = 0x71cfff;
  const pale = 0xe4fbff;

  shards(scene, x, y, {
    count: 10,
    color: pale,
    inward: true,
    radius: 66,
    length: 17,
    width: 3,
    durationMs: 260,
  });

  // The shell itself lands a beat after the shards arrive.
  scene.time.delayedCall(230, () => {
    const shell = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    shell.lineStyle(3, pale, 0.9);
    shell.fillStyle(ice, 0.22);
    // Hexagonal casing — angular so it reads as ice rather than a bubble.
    const pts: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 3;
      pts.push({ x: Math.cos(a) * 30, y: Math.sin(a) * 36 });
    }
    shell.fillPoints(pts, true);
    shell.strokePoints(pts, true);
    shell.setScale(0.6);
    scene.tweens.add({
      targets: shell,
      scaleX: 1,
      scaleY: 1,
      duration: 120,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: shell,
          alpha: 0,
          duration: 340,
          onComplete: () => shell.destroy(),
        });
      },
    });
    flash(scene, x, y, pale, 22, 0.6);
    burstFx(scene, 'ptx-spark', x, y, 12, 420, {
      tint: pale,
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.9, end: 0 },
    });
  });
}
