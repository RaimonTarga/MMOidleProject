/**
 * JUNGLE BOSS — the predator's hunt, animated end to end (premium pass, 2026-09-27).
 *
 *   FLEE     it bolts: a lean into the run, a stretched body, a kick-off burst and a
 *            trail of afterimages (Desert dashes share it, in sand).
 *   VANISH   leaves burst and the body fades; while hidden the brush rustles along
 *            its path, so there is always something to track.
 *   AMBUSH   a crouch and an eye glint on the wind-up, then a real leap — lift,
 *            stretch, afterimages — into a three-claw rake (Ambush) or a venom bite
 *            (Venomous Bite), a landing squash, and a hit-stop.
 *   FRENZY   a roar and blood streaks on the start; the lasting look is the
 *            `predator-frenzy` aura (bossAuras.ts).
 *
 * Body motion goes through `bodyPose` (never the sprite's own scale), and the leap
 * travel through the interpolation lunge offset, like every other lunge.
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { afterimages, posePath, releasePose, tweenPose } from './bodyPose';
import { impact } from './impactFeel';
import { fxBite } from './bite';

export interface HuntPalette {
  /** Afterimage / trail tint. */
  trail: number;
  /** Kick-off and rustle debris. */
  debris: number[];
}

export const JUNGLE_HUNT: HuntPalette = { trail: 0x5fae4a, debris: [0x4e8b3a, 0xa8d66a, 0x2f5d25] };
export const DESERT_HUNT: HuntPalette = { trail: 0xe0b35a, debris: [0xd8b476, 0xb8905a, 0xf0d9a0] };

const BLOOD = 0xc4101c;
const RAKE_EDGE = 0xff5a4a;
const VENOM = 0x8ee03c;
const VENOM_DEEP = 0x3f8a1c;
const EYE = 0xffd23a;

/** Direction the body is moving right now (toward its broadcast destination). */
function travelDir(scene: GameScene, id: string): { x: number; y: number } | null {
  const transform = scene.state.transform.get(id);
  const interp = scene.state.interpolation.get(id);
  if (!transform || !interp) return null;
  const dx = transform.target.x - interp.base.x;
  const dy = transform.target.y - interp.base.y;
  const d = Math.hypot(dx, dy);
  return d > 1 ? { x: dx / d, y: dy / d } : null;
}

// ── FLEE ─────────────────────────────────────────────────────────────────────

/** The bolt: lean into the run, stretch, kick off, and trail afterimages. */
export function fxHuntBolt(scene: GameScene, id: string, palette: HuntPalette): void {
  const body = scene.state.sprite.get(id);
  if (!body) return;
  const dir = travelDir(scene, id) ?? { x: 1, y: 0 };
  // Lean into the direction of travel (screen x decides the tilt).
  const lean = Math.sign(dir.x || 1) * 0.22;
  posePath(scene, id, [
    { sx: 1.12, sy: 0.84, rot: -lean * 0.4, ms: 90 }, // the push-off crouch
    { sx: 0.9, sy: 1.12, rot: lean, ms: 110, ease: 'Quad.easeOut' }, // stretched into the run
    { sx: 0.94, sy: 1.06, rot: lean * 0.8, ms: 700, ease: 'Sine.easeInOut' },
    { sx: 1, sy: 1, rot: 0, ms: 260, ease: 'Back.easeOut' },
  ]);
  afterimages(scene, id, { count: 10, everyMs: 60, tint: palette.trail, alpha: 0.4, fadeMs: 280 });
  // Kick-off: debris thrown BACK, away from the run.
  const back = (Math.atan2(-dir.y, -dir.x) * 180) / Math.PI;
  burstFx(scene, 'ptx-dot', body.x, body.y + body.displayHeight * 0.35, 18, 520, {
    tint: palette.debris,
    speed: { min: 80, max: 220 },
    angle: { min: back - 35, max: back + 35 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 320,
  });
}

// ── VANISH / PROWL / EMERGE ──────────────────────────────────────────────────

/** Leaves burst outward and a shimmer column closes over the body. */
export function fxJungleVanish(scene: GameScene, x: number, y: number): void {
  burstFx(scene, 'ptx-dot', x, y, 22, 700, {
    tint: JUNGLE_HUNT.debris,
    speed: { min: 60, max: 180 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 140,
    rotate: { min: 0, max: 360 },
  });
  const column = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  column.fillStyle(0xc8f0a0, 0.35);
  column.fillEllipse(0, 0, 70, 120);
  scene.tweens.add({
    targets: column,
    scaleX: 0.1,
    alpha: 0,
    duration: 380,
    ease: 'Cubic.easeIn',
    onComplete: () => column.destroy(),
  });
}

/** One rustle of brush where the hidden predator is passing. */
export function fxJungleRustle(scene: GameScene, x: number, y: number): void {
  for (let i = 0; i < 3; i++) {
    const blade = scene.add.graphics({ x: x + (i - 1) * 9 + (Math.random() - 0.5) * 6, y }).setDepth(DEPTH.FX - 1);
    blade.lineStyle(2, i === 1 ? 0xa8d66a : 0x4e8b3a, 0.85);
    blade.lineBetween(0, 0, (i - 1) * 4, -12 - Math.random() * 6);
    blade.setScale(1, 0.2);
    scene.tweens.add({
      targets: blade,
      scaleY: 1,
      rotation: (Math.random() - 0.5) * 0.6,
      duration: 160,
      yoyo: true,
      hold: 120,
      ease: 'Sine.easeOut',
      onComplete: () => blade.destroy(),
    });
  }
  burstFx(scene, 'ptx-dot', x, y - 4, 2, 500, {
    tint: JUNGLE_HUNT.debris,
    speed: { min: 20, max: 60 },
    angle: { min: 220, max: 320 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.8, end: 0 },
    gravityY: 160,
  });
}

/** It breaks cover: the brush explodes outward. */
export function fxJungleEmerge(scene: GameScene, x: number, y: number): void {
  burstFx(scene, 'ptx-dot', x, y, 28, 620, {
    tint: JUNGLE_HUNT.debris,
    speed: { min: 120, max: 280 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.1, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 220,
    rotate: { min: 0, max: 360 },
  });
  const ring = scene.add.graphics({ x, y: y + 20 }).setDepth(DEPTH.FX - 1);
  ring.lineStyle(3, 0x7fbf5a, 0.8);
  ring.strokeEllipse(0, 0, 60, 22);
  scene.tweens.add({
    targets: ring,
    scaleX: 2.6,
    scaleY: 2.6,
    alpha: 0,
    duration: 420,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });
}

// ── AMBUSH ───────────────────────────────────────────────────────────────────

/** The wind-up: sink into a crouch, and the eyes catch the light. */
export function fxAmbushWindup(scene: GameScene, id: string, castMs: number): void {
  const body = scene.state.sprite.get(id);
  if (!body) return;
  tweenPose(scene, id, { sx: 1.16, sy: 0.76, rot: 0 }, Math.max(120, castMs * 0.9), 'Quad.easeOut');
  // Two glints high on the head.
  const h = body.displayHeight;
  for (const side of [-1, 1]) {
    const eye = scene.add
      .graphics({ x: body.x + side * h * 0.09, y: body.y - h * 0.16 })
      .setDepth(DEPTH.FX + 2)
      .setBlendMode(Phaser.BlendModes.ADD);
    eye.fillStyle(EYE, 1);
    eye.fillCircle(0, 0, 3);
    eye.fillStyle(EYE, 0.35);
    eye.fillCircle(0, 0, 8);
    eye.setScale(0.2);
    scene.tweens.add({
      targets: eye,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: Math.max(90, castMs * 0.6),
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => eye.destroy(),
    });
  }
  burstFx(scene, 'ptx-dot', body.x, body.y + h * 0.38, 8, 380, {
    tint: JUNGLE_HUNT.debris,
    speed: { min: 20, max: 70 },
    angle: { min: 180, max: 360 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 0.8, end: 0 },
    gravityY: 200,
  });
}

/**
 * The pounce: a leap into the victim (lift + stretch + afterimages), the payoff
 * where it lands — `maul` rakes three claws across them, `venom` sinks its fangs
 * and splashes venom — then the landing squash and the settle.
 */
export function fxAmbushPounce(
  scene: GameScene,
  id: string,
  targetId: string | undefined,
  from: { x: number; y: number },
  to: { x: number; y: number },
  kind: 'maul' | 'venom',
): void {
  const interp = scene.state.interpolation.get(id);
  const LEAP_MS = 130;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  // Travel most of the way into the victim, then the pose snaps back with the body.
  const reach = Math.min(dist * 0.75, 120);
  if (interp) {
    scene.tweens.killTweensOf(interp.lungeOffset);
    scene.tweens.chain({
      targets: interp.lungeOffset,
      tweens: [
        { x: (dx / dist) * reach, y: (dy / dist) * reach, duration: LEAP_MS, ease: 'Quad.easeIn' },
        { x: 0, y: 0, duration: 260, delay: 90, ease: 'Quad.easeOut' },
      ],
    });
  }
  posePath(scene, id, [
    { sx: 0.8, sy: 1.26, lift: 34, rot: Math.sign(dx || 1) * 0.28, ms: LEAP_MS * 0.6, ease: 'Quad.easeOut' },
    { sx: 0.9, sy: 1.12, lift: 6, rot: Math.sign(dx || 1) * 0.12, ms: LEAP_MS * 0.4, ease: 'Quad.easeIn' },
    { sx: 1.28, sy: 0.74, lift: 0, rot: 0, ms: 70, ease: 'Quad.easeOut' }, // landing squash
    { sx: 1, sy: 1, rot: 0, lift: 0, ms: 320, ease: 'Back.easeOut' },
  ]);
  afterimages(scene, id, {
    count: 4,
    everyMs: 32,
    tint: kind === 'venom' ? VENOM : BLOOD,
    alpha: 0.5,
    fadeMs: 240,
  });

  scene.time.delayedCall(LEAP_MS, () => {
    // Land where the victim is NOW, if they are still drawn.
    const victim = targetId ? scene.state.sprite.get(targetId) : undefined;
    const at = victim ? { x: victim.x, y: victim.y } : to;
    const angle = Math.atan2(dy, dx);
    if (kind === 'maul') drawRake(scene, at.x, at.y, angle);
    else drawVenomBite(scene, at.x, at.y, targetId);
    impact(scene, 'medium', at);
  });
}

/** Three curved claw rakes crossing the victim, white-hot core and blood edge. */
function drawRake(scene: GameScene, x: number, y: number, angle: number): void {
  const across = angle + Math.PI / 2 + 0.35;
  for (let i = 0; i < 3; i++) {
    const off = (i - 1) * 15;
    const g = scene.add
      .graphics({ x: x + Math.cos(angle) * off, y: y + Math.sin(angle) * off })
      .setDepth(DEPTH.FX + 1)
      .setRotation(across);
    // A crescent: a thick blood arc under a thin white arc.
    g.lineStyle(7, BLOOD, 0.9);
    g.beginPath();
    g.arc(0, 18, 46, Math.PI * 1.22, Math.PI * 1.78);
    g.strokePath();
    g.lineStyle(2.5, 0xffffff, 1);
    g.beginPath();
    g.arc(0, 18, 46, Math.PI * 1.26, Math.PI * 1.74);
    g.strokePath();
    g.setScale(0.3, 0.3);
    g.setAlpha(0);
    scene.tweens.add({
      targets: g,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 1,
      duration: 70,
      delay: i * 30,
      ease: 'Quad.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: g,
          alpha: 0,
          duration: 260,
          delay: 80,
          ease: 'Quad.easeIn',
          onComplete: () => g.destroy(),
        });
      },
    });
  }
  burstFx(scene, 'ptx-dot', x, y, 16, 420, {
    tint: [BLOOD, RAKE_EDGE],
    speed: { min: 110, max: 280 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.75, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 260,
  });
  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(4, RAKE_EDGE, 0.8);
  ring.strokeCircle(0, 0, 14);
  scene.tweens.add({
    targets: ring,
    scaleX: 4,
    scaleY: 4,
    alpha: 0,
    duration: 340,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });
}

/** Fangs sink in; venom splashes and keeps dripping off the victim for a moment. */
function drawVenomBite(scene: GameScene, x: number, y: number, targetId: string | undefined): void {
  fxBite(scene, x, y, true, { weight: 1.5, gore: VENOM_DEEP });
  burstFx(scene, 'ptx-dot', x, y, 20, 560, {
    tint: [VENOM, VENOM_DEEP, 0xd4ff7a],
    speed: { min: 80, max: 230 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.85, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 420,
  });
  const puff = scene.add.graphics({ x, y }).setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
  puff.fillStyle(VENOM, 0.45);
  puff.fillCircle(0, 0, 22);
  scene.tweens.add({
    targets: puff,
    scaleX: 2.4,
    scaleY: 2.4,
    alpha: 0,
    duration: 420,
    ease: 'Quad.easeOut',
    onComplete: () => puff.destroy(),
  });
  // The drip: venom running off the victim for about a second.
  for (let i = 1; i <= 6; i++) {
    scene.time.delayedCall(i * 150, () => {
      if (document.hidden) return;
      const victim = targetId ? scene.state.sprite.get(targetId) : undefined;
      const vx = victim?.x ?? x;
      const vy = victim?.y ?? y;
      burstFx(scene, 'ptx-dot', vx + (Math.random() - 0.5) * 18, vy - 6, 2, 520, {
        tint: [VENOM, VENOM_DEEP],
        speed: { min: 5, max: 20 },
        angle: { min: 80, max: 100 },
        scale: { start: 0.55, end: 0.1 },
        alpha: { start: 0.95, end: 0 },
        gravityY: 260,
      });
    });
  }
}

// ── FRENZY ───────────────────────────────────────────────────────────────────

/** Frenzy begins: it rears and roars, and blood streaks burst off it. */
export function fxPredatorFrenzy(scene: GameScene, id: string, x: number, y: number): void {
  posePath(scene, id, [
    { sx: 0.92, sy: 1.14, lift: 6, ms: 120, ease: 'Quad.easeOut' },
    { sx: 1.08, sy: 0.92, lift: 0, ms: 90, ease: 'Quad.easeIn' },
    { sx: 1, sy: 1, lift: 0, ms: 260, ease: 'Back.easeOut' },
  ]);
  for (let i = 0; i < 2; i++) {
    const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    ring.lineStyle(5 - i * 2, i === 0 ? 0xff2a2a : 0xff8a5c, 0.85);
    ring.strokeCircle(0, 0, 26);
    scene.tweens.add({
      targets: ring,
      scaleX: 4.2,
      scaleY: 4.2,
      alpha: 0,
      duration: 480,
      delay: i * 110,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
    const streak = scene.add.graphics({ x, y }).setDepth(DEPTH.FX).setRotation(a);
    streak.fillStyle(i % 2 ? 0xff2a2a : 0x8a0a12, 0.9);
    streak.fillTriangle(24, -3, 70, 0, 24, 3);
    streak.setScale(0.3, 1);
    scene.tweens.add({
      targets: streak,
      scaleX: 1.3,
      alpha: 0,
      duration: 360,
      delay: 60,
      ease: 'Cubic.easeOut',
      onComplete: () => streak.destroy(),
    });
  }
  impact(scene, 'light', { x, y });
}

/** Undo a wind-up pose when a cast is cancelled before it fires. */
export function cancelWindup(scene: GameScene, id: string): void {
  releasePose(scene, id, 240);
}
