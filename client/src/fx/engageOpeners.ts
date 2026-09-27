/**
 * ENGAGE OPENERS — the committed rush a handful of mobs open a fight with (premium
 * pass for mobs, 2026-09-27). Until now all six drew one straight line for 0.23s
 * at the moment they LAUNCHED: no wind-up past the cast bar, nothing during the
 * dash, nothing on contact. The Cave Trolls even borrowed the raptors' dive cue.
 *
 * Each opener now follows the boss grammar, one variant per animal:
 *   WIND-UP  a clock you can read (`monster-cast-start`), registered as a wind-up;
 *   LAUNCH   the cast-end fires as the dash sets off (the wind-up's `fire`);
 *   DASH     the `charge-rush` aura draws the run while the server flags it
 *            (`OPENER_RUSH` below supplies the per-animal streak and beat);
 *   LANDING  `monster-engage-land`, the contact where the root or strike lands;
 *   CANCEL   a stun or reset during the wind-up (the wind-up's `cancel`).
 *
 *   dive-bomb     Savanna Hawk: rises on beating wings while its shadow circles the
 *                 victim and tightens; stoops; pins the victim with talon prints.
 *   skyfall-rend  Stone Eagle: the same dive in stone, higher, shedding grit.
 *   roc-skyfall   Cliffside Roc: a spreading shadow, a downdraft, a heavy landing.
 *   savage-rush   Cave / Cavern Troll: hunches and stomps twice while cracks run
 *                 down the lane; a furrow on the rush; stone shackles on contact.
 *   rime-pounce   Frost Lurker: a low crouch, frost breath, rime creeping to you.
 *
 * Budget: an opener happens once per pull, so its wind-up may afford one `follow`.
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { afterimages, posePath, releasePose, tweenPose } from './bodyPose';
import { deg, dirTo, ring } from './bossKit';
import { burstFx } from './particles';
import { impact } from './impactFeel';
import { fxTalonStrike } from './talonStrike';
import { castTargetId, follow, registerWindup, spriteAt, type Pt } from './windups';

type OpenerFx = 'dive-bomb' | 'skyfall-rend' | 'roc-skyfall' | 'savage-rush' | 'rime-pounce';

interface RaptorLook {
  /** Wing / feather colours, dark to light. */
  feathers: number[];
  streak: number;
  /** Peak lift of the hover, px. */
  lift: number;
  /** A shadow that SPREADS (the roc) instead of one that circles (hawk, eagle). */
  spreadingShadow: boolean;
  /** Stone grit shed while hovering. */
  grit?: number[];
}

const RAPTORS: Record<'dive-bomb' | 'skyfall-rend' | 'roc-skyfall', RaptorLook> = {
  'dive-bomb': { feathers: [0x8a5a30, 0xc8955a, 0xe8d0a0], streak: 0xfff3ba, lift: 22, spreadingShadow: false },
  'skyfall-rend': {
    feathers: [0x6a7680, 0x9aa8b4, 0xccdde8], streak: 0xe8eef2, lift: 30, spreadingShadow: false,
    grit: [0x6e6660, 0x9a918a, 0xc8c0b4],
  },
  'roc-skyfall': {
    feathers: [0x445566, 0x778899, 0xaabbcc], streak: 0xdde6ee, lift: 34, spreadingShadow: true,
    grit: [0x6e6660, 0x9a918a],
  },
};

const TROLL_ROCK = [0x3a3540, 0x6f6878, 0x9a93a4];
const TROLL_CRACK = 0x241f28;
const FROST = [0x6699bb, 0xccffff, 0xffffff];

/** What the `charge-rush` aura draws while an opener's dash is running. */
export interface OpenerRush {
  streak: number;
  beat(scene: GameScene, x: number, y: number): void;
}

export const OPENER_RUSH: Record<OpenerFx, OpenerRush> = {
  'dive-bomb': { streak: RAPTORS['dive-bomb'].streak, beat: (s, x, y) => feathers(s, x, y, RAPTORS['dive-bomb'].feathers, 1) },
  'skyfall-rend': { streak: RAPTORS['skyfall-rend'].streak, beat: (s, x, y) => grit(s, x, y, RAPTORS['skyfall-rend'].grit!, 3) },
  'roc-skyfall': { streak: RAPTORS['roc-skyfall'].streak, beat: (s, x, y) => feathers(s, x, y, RAPTORS['roc-skyfall'].feathers, 2) },
  'savage-rush': { streak: 0xd8d0c4, beat: (s, x, y) => grit(s, x, y + 12, TROLL_ROCK, 4) },
  'rime-pounce': {
    streak: 0xccffff,
    beat: (s, x, y) =>
      burstFx(s, 'ptx-mist', x, y + 8, 2, 520, {
        tint: FROST, speed: { min: 5, max: 25 }, angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 1.1 }, alpha: { start: 0.45, end: 0 },
      }),
  },
};

export const isOpenerFx = (fx: string | undefined): fx is OpenerFx =>
  fx !== undefined && fx in OPENER_RUSH;

/** Set on landing so the dash's end (a frame later) does not undo the landing pose. */
const landedAt = new WeakMap<GameScene, Map<string, number>>();

/** The dash stopped: stand the body up, unless a landing already posed it. */
export function openerDashEnd(scene: GameScene, id: string): void {
  const at = landedAt.get(scene)?.get(id);
  if (at !== undefined && performance.now() - at < 600) return;
  releasePose(scene, id, 260);
}

// ── Small primitives ─────────────────────────────────────────────────────────

/** A few drawn feathers that tumble and drift down. */
function feathers(scene: GameScene, x: number, y: number, colors: number[], count: number, burst = 0): void {
  for (let i = 0; i < count; i++) {
    const f = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    const c = colors[i % colors.length];
    f.fillStyle(c, 0.95);
    f.fillEllipse(0, 0, 4, 11);
    f.lineStyle(1, colors[0], 0.8);
    f.lineBetween(0, -5, 0, 6);
    f.setRotation(Math.random() * Math.PI * 2);
    const a = Math.random() * Math.PI * 2;
    const d = burst > 0 ? burst * (0.5 + Math.random() * 0.5) : 8 + Math.random() * 10;
    scene.tweens.add({
      targets: f,
      x: x + Math.cos(a) * d,
      y: y + Math.sin(a) * d * 0.6 + 22,
      rotation: f.rotation + (Math.random() - 0.5) * 5,
      alpha: 0,
      duration: 650 + Math.random() * 350,
      ease: 'Sine.easeOut',
      onComplete: () => f.destroy(),
    });
  }
}

/** Grit or rubble falling from a body. */
function grit(scene: GameScene, x: number, y: number, colors: number[], count: number): void {
  burstFx(scene, 'ptx-dot', x + (Math.random() - 0.5) * 16, y, count, 520, {
    tint: colors, speed: { min: 10, max: 50 }, angle: { min: 60, max: 120 },
    scale: { start: 0.7, end: 0.2 }, alpha: { start: 0.9, end: 0 }, gravityY: 380,
  });
}

/** Seeded jagged line from `a` toward `b`, drawn to `progress` of its length. */
function drawLaneCrack(g: Phaser.GameObjects.Graphics, a: Pt, b: Pt, progress: number, seed: number): void {
  const segs = 9;
  const n = Math.max(1, Math.ceil(segs * progress));
  const d = dirTo(a, b);
  const full = Math.hypot(b.x - a.x, b.y - a.y);
  let rnd = seed;
  const next = (): number => {
    rnd = (rnd * 16807) % 2147483647;
    return (rnd / 2147483647) * 2 - 1;
  };
  g.beginPath();
  g.moveTo(a.x, a.y);
  for (let i = 1; i <= n; i++) {
    const t = full * Math.min(i / segs, progress);
    // The last point lands on the line so the crack ends on its target.
    const jitter = i === segs ? 0 : next() * 7;
    g.lineTo(a.x + d.x * t - d.y * jitter, a.y + d.y * t + d.x * jitter);
  }
  g.strokePath();
}

const feetOf = (s: { x: number; y: number; displayHeight: number }): Pt => ({ x: s.x, y: s.y + s.displayHeight * 0.38 });
const isOwn = (scene: GameScene, id: string | undefined): boolean => !!id && id === scene.state.ownId;

// ── WIND-UP ──────────────────────────────────────────────────────────────────

/** Cast-start of an opener: draw its clock and register launch / cancel. */
export function fxOpenerWindup(scene: GameScene, monsterId: string, castMs: number, fx: string): void {
  if (!isOpenerFx(fx)) return;
  if (fx === 'savage-rush') trollWindup(scene, monsterId, castMs, fx);
  else if (fx === 'rime-pounce') lurkerWindup(scene, monsterId, castMs, fx);
  else raptorWindup(scene, monsterId, castMs, fx, RAPTORS[fx]);
}

function raptorWindup(scene: GameScene, id: string, castMs: number, fx: OpenerFx, look: RaptorLook): void {
  const body = scene.state.sprite.get(id);
  if (!body) return;
  const victimId = castTargetId(scene, id);
  // Rise on beating wings for most of the cast, then tuck for the stoop.
  const flapMs = 110;
  const rise = castMs * 0.75;
  const flaps = Math.max(2, Math.floor(rise / flapMs));
  const keys: Parameters<typeof posePath>[2] = [];
  for (let i = 0; i < flaps; i++) {
    const up = i % 2 === 0;
    keys.push({ lift: look.lift * ((i + 1) / flaps), sx: up ? 1.14 : 0.92, sy: up ? 0.9 : 1.06, ms: flapMs, ease: 'Sine.easeInOut' });
  }
  const v0 = spriteAt(scene, victimId);
  const lean = Math.sign((v0?.x ?? body.x + 1) - body.x || 1) * 0.35;
  keys.push({ lift: look.lift * 1.1, sx: 0.84, sy: 1.14, rot: lean * 0.4, ms: Math.max(120, castMs - flaps * flapMs), ease: 'Quad.easeOut' });
  posePath(scene, id, keys);

  // The clock: a wing shadow over the victim, circling in (hawk, eagle) or
  // spreading dark (roc). Drawn on the ground, beneath every sprite.
  const g = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
  const start = performance.now();
  let lastGrit = 0;
  const stop = follow(scene, () => {
    if (!g.active) return false;
    const t = Math.min(1, (performance.now() - start) / castMs);
    const v = spriteAt(scene, victimId);
    g.clear();
    if (v) {
      const s = scene.state.sprite.get(victimId!);
      const gy = v.y + (s ? s.displayHeight * 0.38 : 14);
      if (look.spreadingShadow) {
        const r = 20 + 60 * t;
        g.fillStyle(0x000000, 0.12 + 0.24 * t);
        g.fillEllipse(v.x, gy, r * 2, r * 0.8);
        g.lineStyle(2, look.streak, 0.25 + 0.4 * t);
        g.strokeEllipse(v.x, gy, r * 2, r * 0.8);
      } else {
        const r = 64 - 48 * t;
        const a = t * Math.PI * 5;
        const sx = v.x + Math.cos(a) * r;
        const sy = gy + Math.sin(a) * r * 0.4;
        g.fillStyle(0x000000, 0.2 + 0.2 * t);
        g.fillEllipse(sx, sy, 30, 9);
        g.fillTriangle(sx - 15, sy, sx - 26, sy - 5, sx - 26, sy + 3);
        g.fillTriangle(sx + 15, sy, sx + 26, sy - 5, sx + 26, sy + 3);
        g.lineStyle(1.5, look.streak, 0.2 + 0.45 * t);
        g.strokeEllipse(v.x, gy, r * 2 + 12, (r * 2 + 12) * 0.4);
      }
    }
    const now = performance.now();
    if (look.grit && body.active && now - lastGrit > 140) {
      lastGrit = now;
      grit(scene, body.x, body.y + body.displayHeight * 0.2, look.grit, 2);
    }
    return t < 1.4;
  });
  const clear = (): void => {
    stop();
    g.destroy();
  };

  registerWindup(scene, id, {
    fire: () => {
      clear();
      const b = scene.state.sprite.get(id);
      if (!b) return;
      // The stoop: tilt into the dive and hold it low until contact.
      const v = spriteAt(scene, victimId);
      const tilt = Math.sign((v?.x ?? b.x + 1) - b.x || 1) * 0.5;
      posePath(scene, id, [
        { rot: tilt, sx: 0.88, sy: 1.12, lift: look.lift * 0.8, ms: 110 },
        { rot: tilt * 0.9, lift: look.lift * 0.45, ms: 2600, ease: 'Sine.easeIn' },
        { rot: 0, sx: 1, sy: 1, lift: 0, ms: 300, ease: 'Back.easeOut' },
      ]);
      feathers(scene, b.x, b.y, look.feathers, look.spreadingShadow ? 6 : 4, 30);
      afterimages(scene, id, { count: 3, everyMs: 50, tint: look.streak, alpha: 0.35, fadeMs: 240 });
    },
    cancel: () => {
      clear();
      // Flustered: flap back down, shedding a few feathers.
      posePath(scene, id, [
        { lift: look.lift * 0.6, sx: 1.12, sy: 0.9, rot: 0, ms: 100 },
        { lift: 0, sx: 0.94, sy: 1.04, ms: 180, ease: 'Quad.easeIn' },
        { sx: 1, sy: 1, ms: 200, ease: 'Back.easeOut' },
      ]);
      const b = scene.state.sprite.get(id);
      if (b) feathers(scene, b.x, b.y - look.lift * 0.5, look.feathers, 4);
    },
  }, { fx, ttlMs: castMs + 1500 });
}

function trollWindup(scene: GameScene, id: string, castMs: number, fx: OpenerFx): void {
  const body = scene.state.sprite.get(id);
  if (!body) return;
  const victimId = castTargetId(scene, id);
  // Hunch, then two stomps (each a squash with dust at the feet).
  const beat = castMs / 4;
  posePath(scene, id, [
    { sx: 1.14, sy: 0.84, rot: 0, ms: beat, ease: 'Quad.easeOut' },
    { sx: 1.04, sy: 0.96, lift: 6, ms: beat * 0.5 },
    { sx: 1.18, sy: 0.8, lift: 0, ms: beat * 0.5, ease: 'Quad.easeIn' },
    { sx: 1.04, sy: 0.96, lift: 6, ms: beat * 0.5 },
    { sx: 1.2, sy: 0.78, lift: 0, ms: beat * 0.5, ease: 'Quad.easeIn' },
  ]);
  const stomp = (): void => {
    const b = scene.state.sprite.get(id);
    if (!b) return;
    const f = feetOf(b);
    burstFx(scene, 'ptx-dot', f.x, f.y, 8, 480, {
      tint: TROLL_ROCK, speed: { min: 30, max: 110 }, angle: { min: 180, max: 360 },
      scale: { start: 0.9, end: 0.2 }, alpha: { start: 0.8, end: 0 }, gravityY: 320,
    });
    ring(scene, f.x, f.y, 0x9a93a4, { from: b.displayWidth * 0.3, scale: 2, width: 2, ms: 260, alpha: 0.5, flat: true });
  };
  const stomps = [scene.time.delayedCall(beat * 2, stomp), scene.time.delayedCall(beat * 3, stomp)];

  // The clock: cracks running down the lane toward the victim.
  const g = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
  const seed = 1 + Math.floor(Math.random() * 1e6);
  const start = performance.now();
  const stop = follow(scene, () => {
    if (!g.active) return false;
    const t = Math.min(1, (performance.now() - start) / castMs);
    const b = scene.state.sprite.get(id);
    const v = spriteAt(scene, victimId);
    g.clear();
    if (b && v) {
      const from = feetOf(b);
      g.lineStyle(4, TROLL_CRACK, 0.55);
      drawLaneCrack(g, from, v, 0.15 + 0.85 * t, seed);
      g.lineStyle(1.5, 0xc8b8a0, 0.35 + 0.3 * t);
      drawLaneCrack(g, from, v, 0.15 + 0.85 * t, seed);
    }
    return t < 1.4;
  });
  const clear = (): void => {
    stop();
    stomps.forEach((s) => s.remove());
    g.destroy();
  };

  registerWindup(scene, id, {
    fire: () => {
      clear();
      const b = scene.state.sprite.get(id);
      const v = spriteAt(scene, victimId);
      if (!b) return;
      const from = feetOf(b);
      const d = v ? dirTo(from, v) : { x: 1, y: 0 };
      tweenPose(scene, id, { sx: 0.9, sy: 1.1, rot: Math.sign(d.x || 1) * 0.28, lift: 0 }, 90);
      // The rush is near-instant, so its FURROW is what reads: a torn line of
      // ground along the lane, with rubble thrown off it.
      if (v) {
        const furrow = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
        furrow.lineStyle(6, TROLL_CRACK, 0.6);
        drawLaneCrack(furrow, from, v, 1, seed);
        furrow.lineStyle(2, 0xc8b8a0, 0.5);
        drawLaneCrack(furrow, from, v, 1, seed);
        scene.tweens.add({ targets: furrow, alpha: 0, delay: 500, duration: 700, onComplete: () => furrow.destroy() });
        const len = Math.hypot(v.x - from.x, v.y - from.y);
        for (let i = 1; i <= 4; i++) {
          const p = { x: from.x + d.x * len * (i / 5), y: from.y + d.y * len * (i / 5) };
          scene.time.delayedCall(i * 25, () => grit(scene, p.x, p.y - 6, TROLL_ROCK, 5));
        }
      }
      burstFx(scene, 'ptx-dot', from.x, from.y, 12, 480, {
        tint: TROLL_ROCK, speed: { min: 80, max: 200 },
        angle: { min: deg({ x: -d.x, y: -d.y }) - 30, max: deg({ x: -d.x, y: -d.y }) + 30 },
        scale: { start: 0.9, end: 0 }, alpha: { start: 0.9, end: 0 }, gravityY: 320,
      });
    },
    cancel: () => {
      clear();
      // A stumble: the hunch pitches, wobbles, and rights itself.
      posePath(scene, id, [
        { sx: 1.06, sy: 0.94, rot: 0.18, ms: 90 },
        { rot: -0.12, ms: 120 },
        { sx: 1, sy: 1, rot: 0, ms: 240, ease: 'Back.easeOut' },
      ]);
    },
  }, { fx, ttlMs: castMs + 1500 });
}

function lurkerWindup(scene: GameScene, id: string, castMs: number, fx: OpenerFx): void {
  const body = scene.state.sprite.get(id);
  if (!body) return;
  const victimId = castTargetId(scene, id);
  tweenPose(scene, id, { sx: 1.2, sy: 0.76, rot: 0, lift: 0 }, castMs * 0.6, 'Quad.easeOut');

  // The clock: rime crystals creeping from the lurker to the victim, while it
  // breathes frost.
  const g = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
  const start = performance.now();
  let lastBreath = 0;
  const stop = follow(scene, () => {
    if (!g.active) return false;
    const now = performance.now();
    const t = Math.min(1, (now - start) / castMs);
    const b = scene.state.sprite.get(id);
    const v = spriteAt(scene, victimId);
    g.clear();
    if (b && v) {
      const from = feetOf(b);
      const d = dirTo(from, v);
      const len = Math.hypot(v.x - from.x, v.y - from.y) * t;
      for (let s = 12; s < len; s += 16) {
        const x = from.x + d.x * s;
        const y = from.y + d.y * s;
        const k = 3 + ((s * 7) % 5);
        g.lineStyle(1.5, 0xccffff, 0.7);
        g.lineBetween(x - k, y, x + k, y);
        g.lineBetween(x, y - k * 0.6, x, y + k * 0.6);
        g.lineStyle(1, 0xffffff, 0.5);
        g.lineBetween(x - k * 0.6, y - k * 0.4, x + k * 0.6, y + k * 0.4);
      }
      if (now - lastBreath > 160) {
        lastBreath = now;
        burstFx(scene, 'ptx-mist', b.x + d.x * b.displayWidth * 0.35, b.y, 2, 520, {
          tint: FROST, speed: { min: 20, max: 50 }, angle: { min: deg(d) - 20, max: deg(d) + 20 },
          scale: { start: 0.4, end: 0.9 }, alpha: { start: 0.55, end: 0 },
        });
      }
    }
    return t < 1.4;
  });
  const clear = (): void => {
    stop();
    scene.tweens.add({ targets: g, alpha: 0, duration: 400, onComplete: () => g.destroy() });
  };

  registerWindup(scene, id, {
    fire: () => {
      stop();
      g.destroy();
      const b = scene.state.sprite.get(id);
      if (!b) return;
      const v = spriteAt(scene, victimId);
      const d = v ? dirTo(b, v) : { x: 1, y: 0 };
      // The skim: long and low.
      posePath(scene, id, [
        { sx: 1.18, sy: 0.84, rot: Math.sign(d.x || 1) * 0.12, ms: 90 },
        { ms: 1800 },
        { sx: 1, sy: 1, rot: 0, ms: 260, ease: 'Back.easeOut' },
      ]);
      const back = deg({ x: -d.x, y: -d.y });
      burstFx(scene, 'ptx-spark', b.x, feetOf(b).y, 12, 420, {
        tint: FROST, speed: { min: 80, max: 200 }, angle: { min: back - 30, max: back + 30 },
        scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 200,
      });
    },
    cancel: () => {
      clear();
      releasePose(scene, id, 300);
    },
  }, { fx, ttlMs: castMs + 1500 });
}

// ── LANDING ──────────────────────────────────────────────────────────────────

/** `monster-engage-land`: the opener reached its victim. */
export function fxOpenerLand(scene: GameScene, monsterId: string, targetId: string, fx: string | undefined): void {
  if (!isOpenerFx(fx)) return;
  const body = scene.state.sprite.get(monsterId);
  const victim = scene.state.sprite.get(targetId);
  if (!body || !victim) return;
  let map = landedAt.get(scene);
  if (!map) {
    map = new Map();
    landedAt.set(scene, map);
  }
  map.set(monsterId, performance.now());
  const at = feetOf(victim);
  const own = isOwn(scene, targetId);

  if (fx === 'savage-rush') {
    // The shoulder-check, then stone shackles for the length of the root.
    posePath(scene, monsterId, [
      { sx: 1.16, sy: 0.84, rot: 0, ms: 70, ease: 'Quad.easeIn' },
      { sx: 1, sy: 1, ms: 240, ease: 'Back.easeOut' },
    ]);
    burstFx(scene, 'ptx-dot', victim.x, victim.y, 16, 560, {
      tint: TROLL_ROCK, speed: { min: 90, max: 240 }, angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 380,
    });
    ring(scene, at.x, at.y, 0x9a93a4, { from: 18, scale: 3, width: 3, ms: 320, alpha: 0.7, flat: true });
    shackles(scene, targetId, 1700);
    if (own) impact(scene, 'light', at);
    return;
  }

  if (fx === 'rime-pounce') {
    tweenPose(scene, monsterId, { sx: 0.92, sy: 1.1, rot: 0 }, 80);
    releasePose(scene, monsterId, 260, 80);
    burstFx(scene, 'ptx-spark', victim.x, victim.y, 18, 480, {
      tint: FROST, speed: { min: 90, max: 230 }, angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 160,
    });
    const star = scene.add.graphics({ x: victim.x, y: victim.y }).setDepth(DEPTH.FX);
    star.lineStyle(3, 0xccffff, 0.95);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      star.lineBetween(0, 0, Math.cos(a) * 20, Math.sin(a) * 20);
    }
    star.setScale(0.3);
    scene.tweens.add({ targets: star, scale: 1.3, alpha: 0, duration: 320, ease: 'Quad.easeOut', onComplete: () => star.destroy() });
    ring(scene, at.x, at.y, 0xccffff, { from: 16, scale: 3, width: 2, ms: 360, alpha: 0.7, flat: true });
    if (own) impact(scene, 'light', at);
    return;
  }

  // Raptors: drop out of the stoop onto the victim.
  const look = RAPTORS[fx];
  posePath(scene, monsterId, [
    { lift: 0, sx: 1.2, sy: 0.78, rot: 0, ms: 90, ease: 'Quad.easeIn' },
    { sx: 1, sy: 1, ms: 280, ease: 'Back.easeOut' },
  ]);
  fxTalonStrike(scene, body.x, body.y - 30, victim.x, victim.y);
  feathers(scene, victim.x, victim.y - 6, look.feathers, look.spreadingShadow ? 8 : 5, 36);
  if (look.grit) {
    burstFx(scene, 'ptx-dot', victim.x, victim.y, look.spreadingShadow ? 16 : 10, 520, {
      tint: look.grit, speed: { min: 80, max: 200 }, angle: { min: 0, max: 360 },
      scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 360,
    });
  }
  if (look.spreadingShadow) {
    // The downdraft: ground flattened outward from the landing.
    burstFx(scene, 'ptx-dot', at.x, at.y, 20, 520, {
      tint: [0xb9a582, 0xd8c8a4], speed: { min: 140, max: 260 }, angle: { min: 0, max: 360 },
      scale: { start: 1, end: 1.8 }, alpha: { start: 0.5, end: 0 },
    });
    ring(scene, at.x, at.y, look.streak, { from: 24, scale: 4, width: 3, ms: 420, alpha: 0.6, flat: true });
    if (own) impact(scene, 'light', at);
  } else {
    ring(scene, at.x, at.y, look.streak, { from: 14, scale: 2.6, width: 2, ms: 300, alpha: 0.55, flat: true });
  }
  // The hawk's Dive Bomb roots: its talons pin the victim where they stand.
  if (fx === 'dive-bomb') talonPin(scene, at, 2000);
}

/** Talon prints gripping the ground around the victim's feet for the root. */
function talonPin(scene: GameScene, at: Pt, ms: number): void {
  const g = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.SPRITE - 1);
  for (const side of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      const bx = side * 14;
      g.lineStyle(2.5, 0x5a3a1c, 0.85);
      g.lineBetween(bx, 0, bx + side * 6 + i * 4, -4 + Math.abs(i) * 2 + (i === 0 ? -3 : 0));
    }
  }
  g.setScale(1.3).setAlpha(0);
  scene.tweens.add({ targets: g, scale: 1, alpha: 1, duration: 120, ease: 'Quad.easeOut' });
  scene.tweens.add({ targets: g, alpha: 0, delay: ms - 300, duration: 300, onComplete: () => g.destroy() });
}

/** Two stone half-rings closing on the victim's feet, crumbling when the root ends. */
function shackles(scene: GameScene, victimId: string, ms: number): void {
  const g = scene.add.graphics();
  const start = performance.now();
  const stop = follow(scene, () => {
    const s = scene.state.sprite.get(victimId);
    const age = performance.now() - start;
    if (!s || !g.active || age > ms) return false;
    const f = feetOf(s);
    g.setDepth(s.depth + 0.5);
    const close = Math.min(1, age / 140);
    const w = s.displayWidth * (0.9 - 0.25 * close);
    g.clear();
    g.lineStyle(5, 0x3a3540, 0.9);
    g.strokeEllipse(f.x, f.y, w, w * 0.36);
    g.lineStyle(2, 0x9a93a4, 0.9);
    g.strokeEllipse(f.x, f.y - 1, w, w * 0.36);
    return true;
  });
  scene.time.delayedCall(ms, () => {
    stop();
    const s = scene.state.sprite.get(victimId);
    if (s) {
      const f = feetOf(s);
      burstFx(scene, 'ptx-dot', f.x, f.y, 10, 480, {
        tint: TROLL_ROCK, speed: { min: 30, max: 100 }, angle: { min: 180, max: 360 },
        scale: { start: 0.8, end: 0 }, alpha: { start: 0.9, end: 0 }, gravityY: 360,
      });
    }
    g.destroy();
  });
}
