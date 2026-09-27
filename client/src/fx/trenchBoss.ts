/**
 * TRENCH BOSS — the Elder Trench Serpent's hunt, animated (premium pass, 2026-09-27).
 *
 *   UNDERTOW   a current spirals in around the victim over the wind-up, then water
 *              streams toward the serpent as they are dragged.
 *   BITES      jaws hover open over the victim and close across the cast; they SNAP
 *              shut on the hit, or crack apart if a stun chokes the serpent. The
 *              Devour's jaws are huge, and glow hotter per distinct debuff on the
 *              victim — the multiplier the fight is about.
 *   PRESSURE   rings clamp down on the victim, then an implosion squashes them.
 *   TAIL LASH  the serpent coils away, then a crescent of tail sweeps through.
 *   THE DARK   a submerge swirl, a wake trailing the hidden body, and a column of
 *              water where it surfaces.
 */
import type { MonsterView, PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { posePath, releasePose, tweenPose } from './bodyPose';
import { impact } from './impactFeel';

const WATER = 0x82c8ff;
const WATER_LIT = 0xd6f1ff;
const DEEP = 0x123a5a;
const ABYSS = 0x07182a;
const FANG = 0xeaf6ff;

type Pt = { x: number; y: number };

function spriteAt(scene: GameScene, id: string | undefined): Pt | undefined {
  const s = id ? scene.state.sprite.get(id) : undefined;
  return s ? { x: s.x, y: s.y } : undefined;
}

/** The serpent's current victim, for wind-ups (cast-start carries no target). */
export function castTargetId(scene: GameScene, monsterId: string): string | undefined {
  const view = scene.state.view.get(monsterId) as MonsterView | undefined;
  return view?.attackTargetId ?? scene.state.ownId ?? undefined;
}

// ── Running wind-ups, so a cast-end can resolve or cancel them ────────────────

interface Windup {
  /** Called when the cast fires; returns nothing. */
  fire(at: Pt | undefined): void;
  /** Called when the cast is stopped (stun, reset). */
  cancel(): void;
}
const windups = new WeakMap<GameScene, Map<string, Windup>>();

function registerWindup(scene: GameScene, monsterId: string, w: Windup): void {
  let map = windups.get(scene);
  if (!map) {
    map = new Map();
    windups.set(scene, map);
  }
  map.get(monsterId)?.cancel();
  map.set(monsterId, w);
}

/** Resolve a running Trench wind-up (cast-end). Returns true when one existed. */
export function resolveTrenchWindup(scene: GameScene, monsterId: string, fired: boolean, at?: Pt): boolean {
  const map = windups.get(scene);
  const w = map?.get(monsterId);
  if (!w) return false;
  map!.delete(monsterId);
  if (fired) w.fire(at);
  else w.cancel();
  return true;
}

/** A per-frame follower that stops itself when `step` returns false. */
function follow(scene: GameScene, step: () => boolean): () => void {
  let stopped = false;
  const tick = (): void => {
    if (stopped || !step()) stop();
  };
  const stop = (): void => {
    if (stopped) return;
    stopped = true;
    scene.events.off('update', tick);
  };
  scene.events.on('update', tick);
  return stop;
}

// ── JAWS (Wounding Bite, the surges' bite, Devour) ──────────────────────────

function drawJaw(g: Phaser.GameObjects.Graphics, width: number, dir: 1 | -1, glow: number, glowAlpha: number): void {
  g.clear();
  // Dark jaw mass.
  g.fillStyle(ABYSS, 0.85);
  g.fillEllipse(0, -dir * width * 0.16, width, width * 0.34);
  // Inner glow along the gum line.
  g.fillStyle(glow, glowAlpha);
  g.fillEllipse(0, 0, width * 0.86, width * 0.08);
  // Teeth pointing toward the other jaw.
  const teeth = 9;
  g.fillStyle(FANG, 1);
  for (let i = 0; i < teeth; i++) {
    const t = i / (teeth - 1);
    const x = (t - 0.5) * width * 0.8;
    const curve = Math.pow(t - 0.5, 2) * width * 0.18;
    const len = width * (0.09 + 0.05 * (1 - Math.abs(t - 0.5) * 2));
    const half = width * 0.022;
    g.fillTriangle(x - half, -dir * curve, x + half, -dir * curve, x, -dir * curve + dir * len);
  }
}

/** Distinct debuffs on a player, as the Devour counts them (approximate, client side). */
function debuffCount(scene: GameScene, playerId: string | undefined): number {
  const view = playerId ? (scene.state.view.get(playerId) as PlayerView | undefined) : undefined;
  const keys = new Set<string>();
  for (const buff of view?.activeBuffs ?? []) {
    if (buff.id.startsWith('debuff-')) keys.add(buff.instanceKey ?? buff.id);
  }
  return keys.size;
}

/**
 * Jaws open over the victim and close across the cast. `devour` is the big one,
 * glowing hotter per distinct debuff; the serpent rears while it gathers.
 */
export function fxMawWindup(
  scene: GameScene,
  monsterId: string,
  castMs: number,
  kind: 'bite' | 'devour',
): void {
  const targetId = castTargetId(scene, monsterId);
  const start = spriteAt(scene, targetId) ?? spriteAt(scene, monsterId);
  if (!start) return;
  const width = kind === 'devour' ? 150 : 92;
  const upper = scene.add.graphics().setDepth(DEPTH.FX + 1);
  const lower = scene.add.graphics().setDepth(DEPTH.FX + 1);
  upper.setAlpha(0);
  lower.setAlpha(0);
  const began = performance.now();
  tweenPose(scene, monsterId, { sy: 1.1, sx: 0.94, lift: 8 }, castMs * 0.85, 'Sine.easeOut');

  let last = start;
  const stop = follow(scene, () => {
    const at = spriteAt(scene, targetId) ?? last;
    last = at;
    const k = Math.min(1, (performance.now() - began) / castMs);
    const gap = width * (0.62 - 0.4 * k * k);
    const debuffs = kind === 'devour' ? debuffCount(scene, targetId) : 0;
    const heat = Math.min(1, debuffs / 3);
    const glow = kind === 'devour' ? (heat > 0.5 ? 0xff4a3a : heat > 0 ? 0xffa04a : WATER) : WATER;
    const glowAlpha = 0.35 + 0.45 * k + 0.2 * heat;
    drawJaw(upper, width, 1, glow, glowAlpha);
    drawJaw(lower, width, -1, glow, glowAlpha);
    const fadeIn = Math.min(1, (performance.now() - began) / 220);
    upper.setPosition(at.x, at.y - 18 - gap / 2).setAlpha(fadeIn);
    lower.setPosition(at.x, at.y - 18 + gap / 2).setAlpha(fadeIn);
    return true;
  });

  registerWindup(scene, monsterId, {
    fire: (hit) => {
      stop();
      const at = hit ?? spriteAt(scene, targetId) ?? last;
      // SNAP.
      for (const [jaw, dir] of [[upper, -1], [lower, 1]] as const) {
        scene.tweens.add({
          targets: jaw,
          y: at.y - 18 + dir * -2,
          duration: kind === 'devour' ? 80 : 60,
          ease: 'Quad.easeIn',
          onComplete: () => {
            scene.tweens.add({
              targets: jaw,
              alpha: 0,
              scaleX: 1.15,
              duration: 260,
              delay: 60,
              onComplete: () => jaw.destroy(),
            });
          },
        });
      }
      scene.time.delayedCall(kind === 'devour' ? 80 : 60, () => {
        splash(scene, at.x, at.y, kind === 'devour' ? 1.6 : 1);
        impact(scene, kind === 'devour' ? 'heavy' : 'medium', at);
      });
      // The lunge that does it, then the serpent settles.
      posePath(scene, monsterId, [
        { sy: 0.86, sx: 1.14, lift: 0, ms: 90, ease: 'Quad.easeIn' },
        { sy: 1, sx: 1, lift: 0, ms: 300, ease: 'Back.easeOut' },
      ]);
    },
    cancel: () => {
      // CHOKED: the jaws crack apart into bubbles.
      stop();
      for (const jaw of [upper, lower]) {
        burstFx(scene, 'ptx-dot', jaw.x, jaw.y, 10, 520, {
          tint: [WATER, WATER_LIT],
          speed: { min: 30, max: 110 },
          angle: { min: 200, max: 340 },
          scale: { start: 0.7, end: 0 },
          alpha: { start: 0.9, end: 0 },
          gravityY: -80,
        });
        scene.tweens.add({
          targets: jaw,
          alpha: 0,
          scaleX: 0.6,
          scaleY: 1.4,
          duration: 260,
          onComplete: () => jaw.destroy(),
        });
      }
      releasePose(scene, monsterId, 300);
    },
  });
}

/** A burst of dark water with a white crest and a ring wave. */
function splash(scene: GameScene, x: number, y: number, scale: number): void {
  burstFx(scene, 'ptx-dot', x, y, Math.round(22 * scale), 620, {
    tint: [WATER, WATER_LIT, DEEP],
    speed: { min: 100 * scale, max: 280 * scale },
    angle: { min: 200, max: 340 },
    scale: { start: 0.9 * scale, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 520,
  });
  const ring = scene.add.graphics({ x, y: y + 8 }).setDepth(DEPTH.FX - 1);
  ring.lineStyle(4, WATER_LIT, 0.8);
  ring.strokeEllipse(0, 0, 50 * scale, 20 * scale);
  scene.tweens.add({
    targets: ring,
    scaleX: 3,
    scaleY: 3,
    alpha: 0,
    duration: 460,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });
}

// ── UNDERTOW ─────────────────────────────────────────────────────────────────

/** A current spirals in around the victim, tightening across the wind-up. */
export function fxUndertowWindup(scene: GameScene, monsterId: string, castMs: number): void {
  const targetId = castTargetId(scene, monsterId);
  if (!spriteAt(scene, targetId)) return;
  const arcs = [0, 1, 2].map(() => scene.add.graphics().setDepth(DEPTH.FX - 1));
  const began = performance.now();
  const stop = follow(scene, () => {
    const at = spriteAt(scene, targetId);
    if (!at) return false;
    const k = Math.min(1, (performance.now() - began) / castMs);
    const spin = (performance.now() / 1000) * (2 + k * 5);
    arcs.forEach((g, i) => {
      g.clear();
      const r = 70 - 34 * k + i * 12;
      g.lineStyle(3 - i * 0.6, i === 0 ? WATER_LIT : WATER, 0.75 - i * 0.18);
      g.beginPath();
      g.arc(at.x, at.y + 6, r, spin + i * 2.1, spin + i * 2.1 + 1.6);
      g.strokePath();
    });
    return k < 1;
  });
  registerWindup(scene, monsterId, {
    fire: (hitAt) => {
      stop();
      arcs.forEach((g) => g.destroy());
      const from = hitAt ?? spriteAt(scene, targetId);
      const to = spriteAt(scene, monsterId);
      if (from && to) undertowStream(scene, from, to);
    },
    cancel: () => {
      stop();
      arcs.forEach((g) => g.destroy());
    },
  });
}

/** Water streaming from the victim back to the serpent while the drag happens. */
function undertowStream(scene: GameScene, from: Pt, to: Pt): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  for (let i = 0; i < 5; i++) {
    const offset = (i - 2) * 9;
    const g = scene.add.graphics().setDepth(DEPTH.FX - 1);
    g.lineStyle(i === 2 ? 3 : 2, i === 2 ? WATER_LIT : WATER, 0.8);
    g.beginPath();
    for (let s = 0; s <= 12; s++) {
      const t = s / 12;
      const wave = Math.sin(t * Math.PI * 3 + i) * 6;
      const x = from.x + dx * t + nx * (offset + wave);
      const y = from.y + dy * t + ny * (offset + wave);
      if (s === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
    g.setAlpha(0);
    scene.tweens.add({
      targets: g,
      alpha: 1,
      duration: 90,
      delay: i * 30,
      yoyo: true,
      hold: 220,
      onComplete: () => g.destroy(),
    });
  }
  burstFx(scene, 'ptx-dot', from.x, from.y, 14, 520, {
    tint: [WATER, WATER_LIT],
    speed: { min: 60, max: 160 },
    angle: {
      min: (Math.atan2(dy, dx) * 180) / Math.PI - 25,
      max: (Math.atan2(dy, dx) * 180) / Math.PI + 25,
    },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 0.9, end: 0 },
  });
}

// ── CRUSHING PRESSURE ────────────────────────────────────────────────────────

/** Rings clamp down on the victim, pulse after pulse. */
export function fxPressureWindup(scene: GameScene, monsterId: string, castMs: number): void {
  const targetId = castTargetId(scene, monsterId);
  if (!spriteAt(scene, targetId)) return;
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  const began = performance.now();
  const stop = follow(scene, () => {
    const at = spriteAt(scene, targetId);
    if (!at) return false;
    const k = Math.min(1, (performance.now() - began) / castMs);
    g.clear();
    for (let i = 0; i < 3; i++) {
      const phase = ((performance.now() / 380) + i / 3) % 1;
      const r = 80 * (1 - phase) + 10;
      g.lineStyle(3, i === 0 ? WATER_LIT : DEEP, (0.25 + 0.6 * k) * phase);
      g.strokeCircle(at.x, at.y, r);
    }
    return true;
  });
  registerWindup(scene, monsterId, {
    fire: (hitAt) => {
      stop();
      g.destroy();
      const at = hitAt ?? spriteAt(scene, targetId);
      if (!at) return;
      // The implosion: a bright ring snapping inward, a dark flash, bubbles.
      const ring = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX);
      ring.lineStyle(5, WATER_LIT, 1);
      ring.strokeCircle(0, 0, 70);
      scene.tweens.add({
        targets: ring,
        scaleX: 0.1,
        scaleY: 0.1,
        alpha: 0.2,
        duration: 140,
        ease: 'Cubic.easeIn',
        onComplete: () => ring.destroy(),
      });
      const flash = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX);
      flash.fillStyle(ABYSS, 0.6);
      flash.fillCircle(0, 0, 40);
      scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 360, delay: 120, onComplete: () => flash.destroy() });
      burstFx(scene, 'ptx-dot', at.x, at.y, 14, 700, {
        tint: [WATER, WATER_LIT],
        speed: { min: 20, max: 80 },
        angle: { min: 240, max: 300 },
        scale: { start: 0.6, end: 0.1 },
        alpha: { start: 0.9, end: 0 },
        gravityY: -120,
      });
      // The weight lands on the victim.
      if (targetId) {
        posePath(scene, targetId, [
          { sx: 1.18, sy: 0.78, ms: 110, ease: 'Quad.easeIn' },
          { sx: 1, sy: 1, ms: 360, ease: 'Back.easeOut' },
        ]);
      }
      impact(scene, 'light', at);
    },
    cancel: () => {
      stop();
      g.destroy();
    },
  });
}

// ── TAIL LASH ────────────────────────────────────────────────────────────────

/** The serpent coils away from the victim, gathering the swing. */
export function fxTailWindup(scene: GameScene, monsterId: string, castMs: number): void {
  const targetId = castTargetId(scene, monsterId);
  const me = spriteAt(scene, monsterId);
  const them = spriteAt(scene, targetId);
  const side = me && them ? Math.sign(them.x - me.x || 1) : 1;
  tweenPose(scene, monsterId, { rot: -side * 0.2, sx: 1.12, sy: 0.92 }, castMs * 0.9, 'Sine.easeOut');
  registerWindup(scene, monsterId, {
    fire: (hitAt) => {
      const from = spriteAt(scene, monsterId);
      const at = hitAt ?? spriteAt(scene, targetId);
      posePath(scene, monsterId, [
        { rot: side * 0.25, sx: 0.92, sy: 1.04, ms: 110, ease: 'Quad.easeIn' },
        { rot: 0, sx: 1, sy: 1, ms: 320, ease: 'Back.easeOut' },
      ]);
      if (from && at) tailSweep(scene, from, at, side);
    },
    cancel: () => releasePose(scene, monsterId, 280),
  });
}

/** A thick crescent of tail swinging through the victim, trailing spray. */
function tailSweep(scene: GameScene, from: Pt, at: Pt, side: number): void {
  const angle = Math.atan2(at.y - from.y, at.x - from.x);
  const radius = Math.max(70, Math.hypot(at.x - from.x, at.y - from.y));
  const g = scene.add.graphics({ x: from.x, y: from.y }).setDepth(DEPTH.FX);
  const span = 1.3;
  g.lineStyle(20, DEEP, 0.85);
  g.beginPath();
  g.arc(0, 0, radius, -span / 2, span / 2);
  g.strokePath();
  g.lineStyle(6, WATER_LIT, 0.9);
  g.beginPath();
  g.arc(0, 0, radius + 7, -span / 2, span / 2);
  g.strokePath();
  // Swing from behind the victim, through them, and past.
  g.setRotation(angle - side * 1.1);
  scene.tweens.add({
    targets: g,
    rotation: angle + side * 1.1,
    duration: 200,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      scene.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
    },
  });
  scene.time.delayedCall(100, () => {
    splash(scene, at.x, at.y, 0.9);
    impact(scene, 'light', at);
  });
}

// ── INTO THE DARK ────────────────────────────────────────────────────────────

/** It goes under: rings pull inward, the water darkens, bubbles rise. */
export function fxTrenchSubmerge(scene: GameScene, x: number, y: number): void {
  for (let i = 0; i < 3; i++) {
    const ring = scene.add.graphics({ x, y: y + 20 }).setDepth(DEPTH.FX - 1);
    ring.lineStyle(3, i === 0 ? WATER_LIT : WATER, 0.8);
    ring.strokeEllipse(0, 0, 150, 56);
    scene.tweens.add({
      targets: ring,
      scaleX: 0.15,
      scaleY: 0.15,
      alpha: 0,
      duration: 520,
      delay: i * 90,
      ease: 'Cubic.easeIn',
      onComplete: () => ring.destroy(),
    });
  }
  const dark = scene.add.graphics({ x, y: y + 20 }).setDepth(DEPTH.FX - 1);
  dark.fillStyle(ABYSS, 0.55);
  dark.fillEllipse(0, 0, 130, 48);
  dark.setScale(0.3);
  scene.tweens.add({
    targets: dark,
    scaleX: 1.3,
    scaleY: 1.3,
    alpha: 0,
    duration: 700,
    ease: 'Quad.easeOut',
    onComplete: () => dark.destroy(),
  });
  burstFx(scene, 'ptx-dot', x, y, 16, 900, {
    tint: [WATER, WATER_LIT],
    speed: { min: 20, max: 70 },
    angle: { min: 240, max: 300 },
    scale: { start: 0.7, end: 0.1 },
    alpha: { start: 0.9, end: 0 },
    gravityY: -90,
  });
}

/** The wake behind the hidden body: a spreading ripple and a bubble or two. */
export function fxTrenchWake(scene: GameScene, x: number, y: number): void {
  const ripple = scene.add.graphics({ x, y: y + 22 }).setDepth(DEPTH.FX - 1);
  ripple.lineStyle(2, WATER, 0.6);
  ripple.strokeEllipse(0, 0, 60, 20);
  scene.tweens.add({
    targets: ripple,
    scaleX: 2.2,
    scaleY: 2.2,
    alpha: 0,
    duration: 800,
    ease: 'Quad.easeOut',
    onComplete: () => ripple.destroy(),
  });
  burstFx(scene, 'ptx-dot', x, y + 10, 2, 700, {
    tint: WATER_LIT,
    speed: { min: 10, max: 30 },
    angle: { min: 250, max: 290 },
    scale: { start: 0.45, end: 0.1 },
    alpha: { start: 0.8, end: 0 },
    gravityY: -60,
  });
}

/** It surges up: a column of water, a crown of spray and a ring wave. */
export function fxTrenchSurface(scene: GameScene, x: number, y: number): void {
  const column = scene.add.graphics({ x, y: y + 24 }).setDepth(DEPTH.FX);
  column.fillStyle(WATER, 0.55);
  column.fillEllipse(0, -60, 70, 140);
  column.fillStyle(WATER_LIT, 0.6);
  column.fillEllipse(0, -60, 30, 120);
  column.setScale(0.4, 0.1);
  scene.tweens.add({
    targets: column,
    scaleX: 1,
    scaleY: 1,
    duration: 140,
    ease: 'Quad.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: column,
        alpha: 0,
        scaleX: 1.4,
        scaleY: 0.6,
        duration: 420,
        ease: 'Quad.easeIn',
        onComplete: () => column.destroy(),
      });
    },
  });
  splash(scene, x, y, 1.3);
  impact(scene, 'light', { x, y });
}
