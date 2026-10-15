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
 * sharing a visual grammar, not unrelated effects. Each is a threshold
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
