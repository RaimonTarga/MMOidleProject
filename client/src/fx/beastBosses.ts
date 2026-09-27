/**
 * PLAINS + FOREST + WASTELAND bosses, animated (premium pass, 2026-09-27).
 *
 * PLAINS — the herd.
 *   ROAR       it rears and stamps while it draws breath, then bellows (the rallied
 *              adds carry the `rallied` aura). Call the Herd is a shorter bellow.
 *   STAMPEDE   stamping and tremors while dust plumes rise around the arena — the
 *              herd is coming — then the bellow that calls it in.
 * FOREST — the bear.
 *   FRENZY     chest beats that build to the Bestial Frenzy burst; its stacks are
 *              the `bestial-frenzy` aura.
 *   SWIPE      the Timberclaw raises its paw, claws glinting, and swings.
 * WASTELAND — the charnel king (redesign pending; these carry over).
 *   RAISE      a necrotic sigil draws itself under the boss while wisps rise; it
 *              flares as the dead get up. A stun breaks the sigil.
 *   HARVEST    a soul is torn out of a risen and drawn into the boss.
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { bodyPose, posePath, releasePose, tweenPose } from './bodyPose';
import { impact } from './impactFeel';
import { follow, registerWindup, spriteAt, suppressBossFx, type Pt } from './windups';
import { dustCloud, drawSigil, inhale, ring } from './bossKit';
import { fxBestialFrenzy, fxBossRoar } from './bossCues';

const DUST = [0xc9a86a, 0xa88a55, 0xe0c890];
const RAGE = 0xd8541e;
const NECRO = 0x8fe0a0;
const NECRO_DEEP = 0x6a4a9e;

/** Stamping in place: a squash and a dust ring, `count` times across `ms`. */
function stamps(scene: GameScene, id: string, ms: number, count: number, heavy: boolean): void {
  for (let i = 0; i < count; i++) {
    scene.time.delayedCall((i + 0.5) * (ms / count), () => {
      const p = spriteAt(scene, id);
      if (!p) return;
      const pose = bodyPose(scene, id);
      const base = { sx: pose.sx, sy: pose.sy, lift: pose.lift };
      posePath(scene, id, [
        { sx: base.sx * 1.1, sy: base.sy * 0.88, lift: 0, ms: 70, ease: 'Quad.easeIn' },
        { ...base, ms: 160, ease: 'Quad.easeOut' },
      ]);
      ring(scene, p.x, p.y + 40, 0xe8d6a8, { from: 26, scale: 2.4, flat: true, width: 3, ms: 360 });
      dustCloud(scene, p.x, p.y + 40, DUST, 0.6);
      if (heavy) impact(scene, 'light', p);
    });
  }
}

/** Roar / Call the Herd wind-up: it rears, stamps, draws breath; then bellows. */
export function fxRoarWindup(scene: GameScene, id: string, castMs: number, small: boolean): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  suppressBossFx(scene, id, 'roar');
  tweenPose(scene, id, { sx: 0.92, sy: 1.14, lift: 8, rot: -0.06 }, Math.min(600, castMs * 0.4), 'Quad.easeOut');
  stamps(scene, id, castMs * 0.8, small ? 1 : 3, false);
  inhale(scene, me.x, me.y - 30, [0xffffff, 0xf0e2c0], 120, castMs * 0.8);
  registerWindup(scene, id, {
    fire: () => {
      const p = spriteAt(scene, id) ?? me;
      posePath(scene, id, [
        { sx: 1.12, sy: 0.9, lift: 0, rot: 0.06, ms: 90, ease: 'Quad.easeIn' },
        { sx: 1, sy: 1, rot: 0, ms: 380, ease: 'Back.easeOut' },
      ]);
      fxBossRoar(scene, p.x, p.y, small ? 200 : 320);
      impact(scene, 'light', p);
    },
    cancel: () => releasePose(scene, id),
  }, { fx: small ? 'herd-call' : 'roar' });
}

/** Stampede wind-up: stamping, tremors, and dust rising where the herd is coming. */
export function fxStampedeWindup(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  suppressBossFx(scene, id, 'roar');
  tweenPose(scene, id, { sx: 0.92, sy: 1.12, lift: 6 }, 400, 'Quad.easeOut');
  stamps(scene, id, castMs * 0.9, 4, true);
  for (let i = 0; i < 6; i++) {
    scene.time.delayedCall(i * (castMs / 6), () => {
      const a = Math.random() * Math.PI * 2;
      const d = 280 + Math.random() * 220;
      dustCloud(scene, me.x + Math.cos(a) * d, me.y + Math.sin(a) * d * 0.7, DUST, 1.6);
    });
  }
  registerWindup(scene, id, {
    fire: () => {
      const p = spriteAt(scene, id) ?? me;
      posePath(scene, id, [
        { sx: 1.14, sy: 0.88, lift: 0, ms: 90, ease: 'Quad.easeIn' },
        { sx: 1, sy: 1, ms: 380, ease: 'Back.easeOut' },
      ]);
      fxBossRoar(scene, p.x, p.y, 380);
      ring(scene, p.x, p.y + 40, 0xe8d6a8, { from: 40, scale: 8, flat: true, width: 6, ms: 700 });
      impact(scene, 'medium', p);
    },
    cancel: () => releasePose(scene, id),
  }, { fx: 'stampede' });
}

/** Bestial Frenzy wind-up: three chest beats building to the burst. */
export function fxBearFrenzyWindup(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  suppressBossFx(scene, id, 'frenzy');
  const beats = 3;
  const keys: Array<{ sx: number; sy: number; lift: number; ms: number; ease?: string }> = [];
  for (let i = 0; i < beats; i++) {
    const k = (i + 1) / beats;
    keys.push({ sx: 0.94, sy: 1.1 + k * 0.05, lift: 6 + k * 4, ms: castMs / beats * 0.55, ease: 'Quad.easeOut' });
    keys.push({ sx: 1.08, sy: 0.94, lift: 2, ms: castMs / beats * 0.45, ease: 'Quad.easeIn' });
  }
  posePath(scene, id, keys);
  for (let i = 0; i < beats; i++) {
    scene.time.delayedCall((i + 1) * (castMs / beats) - 60, () => {
      const p = spriteAt(scene, id);
      if (!p) return;
      ring(scene, p.x, p.y - 10, RAGE, { from: 24, scale: 2.2 + i * 0.5, width: 4, ms: 320 });
    });
  }
  registerWindup(scene, id, {
    fire: () => {
      const p = spriteAt(scene, id) ?? me;
      fxBestialFrenzy(scene, p.x, p.y);
      posePath(scene, id, [
        { sx: 0.9, sy: 1.18, lift: 10, ms: 100, ease: 'Quad.easeOut' },
        { sx: 1, sy: 1, lift: 0, ms: 360, ease: 'Back.easeOut' },
      ]);
      impact(scene, 'light', p);
    },
    cancel: () => releasePose(scene, id),
  }, { fx: 'frenzy' });
}

/** Stunning Swipe wind-up: the paw goes up, claws glinting; the swing is the payoff. */
export function fxPawRaise(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  tweenPose(scene, id, { sx: 0.94, sy: 1.1, lift: 6, rot: -0.22 }, castMs * 0.85, 'Quad.easeOut');
  for (let i = 0; i < 3; i++) {
    const glint = scene.add
      .graphics({ x: me.x + 18 + i * 6, y: me.y - 46 + i * 3 })
      .setDepth(DEPTH.FX + 2)
      .setBlendMode(Phaser.BlendModes.ADD);
    glint.lineStyle(2, 0xffffff, 1);
    glint.lineBetween(0, 0, 4, -10);
    glint.setAlpha(0);
    scene.tweens.add({ targets: glint, alpha: 1, delay: castMs * 0.4 + i * 40, duration: 120, yoyo: true, hold: castMs * 0.3, onComplete: () => glint.destroy() });
  }
  registerWindup(scene, id, {
    fire: (at) => {
      posePath(scene, id, [
        { sx: 1.14, sy: 0.9, lift: 0, rot: 0.32, ms: 90, ease: 'Quad.easeIn' },
        { sx: 1, sy: 1, rot: 0, ms: 340, ease: 'Back.easeOut' },
      ]);
      impact(scene, 'medium', at ?? spriteAt(scene, id));
      return 'continue';
    },
    cancel: () => releasePose(scene, id),
  }, { fx: 'timberclaw-swipe' });
}

// ── WASTELAND ────────────────────────────────────────────────────────────────

/** Raise Dead / Mass Resurrection: a necrotic sigil draws itself under the boss. */
export function fxRaiseWindup(scene: GameScene, id: string, castMs: number, fx: string): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  suppressBossFx(scene, id, 'roar');
  tweenPose(scene, id, { sx: 0.94, sy: 1.12, lift: 6 }, castMs * 0.7, 'Quad.easeOut');
  const g = scene.add.graphics().setDepth(DEPTH.BG_DECOR + 0.4);
  const began = performance.now();
  const big = fx === 'mass-raise';
  let nextWisp = began;
  const stop = follow(scene, () => {
    const p = spriteAt(scene, id);
    if (!p) return false;
    const now = performance.now();
    const k = Math.min(1, (now - began) / castMs);
    g.clear();
    const r = big ? 130 : 95;
    drawSigil(g, p.x, p.y + 40, r, k, NECRO, 0.85, now / 1600, 5, 0.42);
    drawSigil(g, p.x, p.y + 40, r * 0.6, Math.max(0, k * 1.2 - 0.2), NECRO_DEEP, 0.7, -now / 1100, 5, 0.42);
    if (now >= nextWisp) {
      nextWisp = now + 90;
      const a = Math.random() * Math.PI * 2;
      burstFx(scene, 'ptx-dot', p.x + Math.cos(a) * r * 0.9, p.y + 40 + Math.sin(a) * r * 0.38, 1, 900, {
        tint: [NECRO, NECRO_DEEP],
        speed: { min: 20, max: 50 },
        angle: { min: 260, max: 280 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.9, end: 0 },
        gravityY: -60,
      });
    }
    return true;
  });
  registerWindup(scene, id, {
    fire: () => {
      stop();
      const p = spriteAt(scene, id) ?? me;
      scene.tweens.add({ targets: g, alpha: 0, duration: 500, onComplete: () => g.destroy() });
      ring(scene, p.x, p.y + 40, NECRO, { from: big ? 120 : 90, scale: 1.6, flat: true, width: 5, ms: 500 });
      posePath(scene, id, [
        { sx: 0.9, sy: 1.18, lift: 10, ms: 110, ease: 'Quad.easeOut' },
        { sx: 1, sy: 1, lift: 0, ms: 380, ease: 'Back.easeOut' },
      ]);
      if (big) impact(scene, 'medium', p);
      return 'continue';
    },
    cancel: () => {
      stop();
      const p = spriteAt(scene, id) ?? me;
      burstFx(scene, 'ptx-dot', p.x, p.y + 40, 18, 520, {
        tint: [NECRO, NECRO_DEEP],
        speed: { min: 60, max: 180 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 1, end: 0 },
      });
      g.destroy();
      releasePose(scene, id);
    },
  }, { fx });
}

/** A risen clawing out of its grave. */
export function fxRisenEmerge(scene: GameScene, x: number, y: number): void {
  const column = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  column.fillStyle(NECRO, 0.45);
  column.fillEllipse(0, -30, 34, 80);
  column.setScale(0.5, 0.1);
  scene.tweens.add({
    targets: column, scaleX: 1, scaleY: 1, duration: 160, ease: 'Quad.easeOut',
    onComplete: () => scene.tweens.add({ targets: column, alpha: 0, duration: 420, onComplete: () => column.destroy() }),
  });
  burstFx(scene, 'ptx-dot', x, y, 14, 600, {
    tint: [0xe8e0d0, 0x8a7a6a, NECRO],
    speed: { min: 60, max: 170 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 420,
  });
}

/** HARVEST: a soul torn out of a risen and drawn into the boss. */
export function fxHarvest(scene: GameScene, bossId: string, from: Pt): void {
  const to = spriteAt(scene, bossId);
  fxRisenEmerge(scene, from.x, from.y);
  if (!to) return;
  const soul = scene.add.graphics().setDepth(DEPTH.FX + 1).setBlendMode(Phaser.BlendModes.ADD);
  soul.fillStyle(NECRO, 0.9);
  soul.fillCircle(0, 0, 7);
  soul.fillStyle(0xffffff, 0.8);
  soul.fillCircle(0, 0, 3);
  const p = { t: 0 };
  const bend = (Math.random() - 0.5) * 160;
  scene.tweens.add({
    targets: p,
    t: 1,
    duration: 520,
    ease: 'Quad.easeIn',
    onUpdate: () => {
      const target = spriteAt(scene, bossId) ?? to;
      const x = from.x + (target.x - from.x) * p.t + Math.sin(p.t * Math.PI) * bend;
      const y = from.y + (target.y - from.y) * p.t - Math.sin(p.t * Math.PI) * 60;
      soul.setPosition(x, y);
      burstFx(scene, 'ptx-dot', x, y, 1, 380, {
        tint: NECRO, speed: { min: 0, max: 10 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.7, end: 0 },
      });
    },
    onComplete: () => {
      soul.destroy();
      const target = spriteAt(scene, bossId) ?? to;
      ring(scene, target.x, target.y, NECRO, { from: 20, scale: 3, width: 4, ms: 380 });
      posePath(scene, bossId, [
        { sx: 1.12, sy: 1.12, ms: 120, ease: 'Quad.easeOut' },
        { sx: 1, sy: 1, ms: 320, ease: 'Back.easeOut' },
      ]);
    },
  });
}
