/**
 * BESPOKE PATHS — specializations whose attack SHOWS their mechanic (2026-09-27),
 * the step above the one-motif signatures in pathSignatures.ts.
 *
 * Ordinary hits keep the range pick's weapon shape and add a STATEFUL layer that
 * reads the path's own resource off the view; the finisher (the empowered hit) is
 * replaced by a full bespoke animation. Everything is read from data every
 * PlayerView / MonsterView already carries, so remote players see it too:
 *
 *   Berserker    aura `rampage-1..3`          claw streaks per stage / Rampage Cleave
 *   Juggernaut   buff `cadence-crescendo` (%)  momentum ring / Crescendo Blow
 *   Justicar     buff `cadence-verdict` (HP)   judgement gauge vs target HP / Sentence
 *   Venomslinger target `dot` stacks           ten venom pips (detonation has its own cue)
 */
import type { MonsterView, PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { drawCracks, ring } from './bossKit';
import { impact } from './impactFeel';

type P = { x: number; y: number };

export interface BespokeHit {
  scene: GameScene;
  player: PlayerView;
  playerId: string;
  targetId: string;
  from: P;
  to: P;
  empowered: boolean;
  /** Ascension-driven size multiplier (AttackFlair.scale). */
  k: number;
}

interface BespokePath {
  /** Layer over an ordinary hit (the range attack still draws underneath). */
  hit(h: BespokeHit): void;
  /** Replaces the whole finisher animation, when the path has one. */
  finisher?(h: BespokeHit): void;
}

const buffStacks = (p: PlayerView, id: string): number =>
  (p.activeBuffs ?? []).find((b) => b.id === id)?.stacks ?? 0;
const targetView = (h: BespokeHit): MonsterView | undefined =>
  h.scene.state.view.get(h.targetId) as MonsterView | undefined;
const angleOf = (h: BespokeHit): number => Math.atan2(h.to.y - h.from.y, h.to.x - h.from.x);
const isOwn = (h: BespokeHit): boolean => h.playerId === h.scene.state.ownId;

const fadeOut = (scene: GameScene, g: Phaser.GameObjects.Graphics, ms: number, delay = 0): void => {
  scene.tweens.add({ targets: g, alpha: 0, duration: ms, delay, onComplete: () => g.destroy() });
};

/** A crescent written on across `ms`: glow under a bright core. */
function crescent(
  scene: GameScene, at: P, angle: number, radius: number, width: number,
  core: number, glow: number, ms: number, delay = 0,
): void {
  const g = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX).setRotation(angle);
  const t = { p: 0 };
  scene.tweens.add({
    targets: t, p: 1, duration: ms, delay, ease: 'Cubic.easeOut',
    onUpdate: () => {
      g.clear();
      const a0 = -1.2;
      const a1 = a0 + 2.4 * t.p;
      g.lineStyle(width * 2.4, glow, 0.35);
      g.beginPath();
      g.arc(-radius * 0.35, 0, radius, a0, a1);
      g.strokePath();
      g.lineStyle(width, core, 1);
      g.beginPath();
      g.arc(-radius * 0.35, 0, radius, a0, a1);
      g.strokePath();
    },
    onComplete: () => fadeOut(scene, g, 200),
  });
}

// ── Berserker ─────────────────────────────────────────────────────────────────

const rampageStage = (p: PlayerView): number => {
  const m = /^rampage-(\d)$/.exec(p.aura ?? '');
  return m ? Number(m[1]) : 0;
};

const BERSERKER: BespokePath = {
  hit: (h) => {
    const s = rampageStage(h.player);
    const a = angleOf(h) + Math.PI / 2 + 0.6;
    const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setRotation(a);
    for (let i = 0; i <= s; i++) {
      const off = (i - s / 2) * 7;
      g.lineStyle(2.5, i === 0 ? 0xffb080 : 0xff3b2f, 0.95);
      g.lineBetween(-16 * h.k, off, 16 * h.k, off + 3);
    }
    fadeOut(h.scene, g, 220, 40);
    burstFx(h.scene, 'ptx-spark', h.to.x, h.to.y, 3 + s * 3, 520, {
      tint: [0xff3b2f, 0xffa040], speed: { min: 30, max: 90 + s * 30 }, angle: { min: 230, max: 310 },
      scale: { start: 0.55, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: -120,
    });
  },
  finisher: (h) => {
    const s = rampageStage(h.player);
    const size = h.k * (1 + 0.15 * s);
    const a = angleOf(h);
    // The cleave, and its echoes following it through.
    crescent(h.scene, h.to, a, 50 * size, 9 * size, 0xfff0e0, 0xff2a1a, 240);
    for (let i = 1; i <= 1 + Math.min(2, s); i++) {
      crescent(h.scene, { x: h.to.x - Math.cos(a) * 8 * i, y: h.to.y - Math.sin(a) * 8 * i },
        a, (50 - i * 6) * size, 3, 0xff6a4a, 0xff2a1a, 220, i * 55);
    }
    ring(h.scene, h.to.x, h.to.y, 0xff3b2f, { from: 14, scale: 4 + s * 0.6, width: 3 + s, ms: 380 });
    burstFx(h.scene, 'ptx-spark', h.to.x, h.to.y, 14 + s * 6, 560, {
      tint: [0xff3b2f, 0xffa040, 0xfff0e0], speed: { min: 120, max: 320 + s * 40 }, angle: { min: 0, max: 360 },
      scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 }, rotate: { min: 0, max: 360 },
    });
    if (isOwn(h)) impact(h.scene, s >= 3 ? 'medium' : 'light', h.to);
  },
};

// ── Juggernaut ────────────────────────────────────────────────────────────────

const crescendoTier = (p: PlayerView): number => {
  const pct = buffStacks(p, 'cadence-crescendo');
  return pct >= 100 ? 3 : pct >= 50 ? 2 : pct >= 20 ? 1 : 0;
};

const JUGGERNAUT: BespokePath = {
  hit: (h) => {
    const t = crescendoTier(h.player);
    if (t === 0) return;
    // The build-up lives on the ATTACKER: a momentum ring at their feet.
    const g = h.scene.add.graphics({ x: h.from.x, y: h.from.y + 16 }).setDepth(DEPTH.SPRITE - 1);
    g.lineStyle(1.5 + t, 0xff8800, 0.5 + 0.15 * t);
    g.strokeEllipse(0, 0, (26 + t * 10) * h.k, (10 + t * 4) * h.k);
    h.scene.tweens.add({
      targets: g, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 360, onComplete: () => g.destroy(),
    });
    burstFx(h.scene, 'ptx-dot', h.from.x, h.from.y + 16, t * 2, 420, {
      tint: [0xc8b89a, 0xff8800], speed: { min: 20, max: 60 }, angle: { min: 200, max: 340 },
      scale: { start: 0.6, end: 0 }, alpha: { start: 0.8, end: 0 }, gravityY: 260,
    });
  },
  finisher: (h) => {
    const t = crescendoTier(h.player);
    const size = h.k * (1 + 0.12 * t);
    // The blow comes DOWN: a crescent swung vertically onto the target.
    crescent(h.scene, { x: h.to.x, y: h.to.y - 6 }, Math.PI / 2, 44 * size, 10 * size, 0xfff4e0, 0xff8800, 200);
    h.scene.time.delayedCall(150, () => {
      const cracks = h.scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
      drawCracks(cracks, h.to.x, h.to.y + 14, (40 + t * 14) * size, 1, 0x2a2018, 0.8, 7 + Math.floor(Math.random() * 999), 7);
      fadeOut(h.scene, cracks, 600, 400);
      for (let i = 0; i <= t; i++) {
        ring(h.scene, h.to.x, h.to.y + 14, i % 2 ? 0xffc080 : 0xff8800, {
          from: 16, scale: 3 + i * 0.9, width: 3, ms: 420, alpha: 0.8, flat: true, delay: i * 80,
        });
      }
      burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y + 10, 12 + t * 5, 600, {
        tint: [0xc8b89a, 0x8a7a60, 0xff8800], speed: { min: 80, max: 220 + t * 30 }, angle: { min: 200, max: 340 },
        scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 480,
      });
      if (isOwn(h)) impact(h.scene, t >= 2 ? 'medium' : 'light', h.to);
    });
  },
};

// ── Justicar ──────────────────────────────────────────────────────────────────

/** Verdict ÷ the target's remaining HP, 0..1 (1 = the next finisher executes). */
function verdictRatio(h: BespokeHit): number {
  const stored = buffStacks(h.player, 'cadence-verdict');
  const hp = targetView(h)?.hp ?? 0;
  if (stored <= 0 || hp <= 0) return 0;
  return Math.min(1, stored / hp);
}

const JUSTICAR: BespokePath = {
  hit: (h) => {
    const r = verdictRatio(h);
    if (r <= 0) return;
    // A judgement gauge over the target: a gold arc filled to Verdict / HP.
    const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y - 44 }).setDepth(DEPTH.FX + 1);
    const ready = r >= 1;
    g.lineStyle(4, 0x4a3a10, 0.7);
    g.beginPath();
    g.arc(0, 12, 16, Math.PI, Math.PI * 2);
    g.strokePath();
    g.lineStyle(4, ready ? 0xffffff : 0xffd24a, 1);
    g.beginPath();
    g.arc(0, 12, 16, Math.PI, Math.PI + Math.PI * r);
    g.strokePath();
    g.fillStyle(ready ? 0xffffff : 0xffe07a, 1);
    g.fillTriangle(-4, -6, 4, -6, 0, 2);
    if (ready) ring(h.scene, h.to.x, h.to.y - 32, 0xffe07a, { from: 10, scale: 2.4, width: 2, ms: 260 });
    fadeOut(h.scene, g, 260, 200);
  },
  finisher: (h) => {
    // SENTENCE: a golden blade falls on the target, and the banked share of the
    // blow flows back to the Justicar as motes.
    const blade = h.scene.add.graphics({ x: h.to.x, y: h.to.y - 120 }).setDepth(DEPTH.FX + 1);
    const L = 44 * h.k;
    blade.fillStyle(0xffd24a, 0.35);
    blade.fillRect(-7, -L, 14, L);
    blade.fillStyle(0xfff4c0, 1);
    blade.fillTriangle(-4, -L, 4, -L, 0, 10);
    blade.fillStyle(0xb8860b, 1);
    blade.fillRect(-12, -L - 4, 24, 4);
    h.scene.tweens.add({
      targets: blade, y: h.to.y - 4, duration: 140, ease: 'Quad.easeIn',
      onComplete: () => {
        fadeOut(h.scene, blade, 220, 60);
        ring(h.scene, h.to.x, h.to.y, 0xffd24a, { from: 12, scale: 3.6, width: 3, ms: 360 });
        burstFx(h.scene, 'ptx-spark', h.to.x, h.to.y, 14, 420, {
          tint: [0xffd24a, 0xffffff], speed: { min: 100, max: 260 }, angle: { min: 0, max: 360 },
          scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 },
        });
        for (let i = 0; i < 6; i++) {
          const m = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX);
          m.fillStyle(0xffe07a, 1);
          m.fillCircle(0, 0, 2.5);
          h.scene.tweens.add({
            targets: m, x: h.from.x + (Math.random() - 0.5) * 12, y: h.from.y - 10,
            duration: 320 + i * 40, delay: 120, ease: 'Sine.easeIn', onComplete: () => m.destroy(),
          });
        }
        if (isOwn(h)) impact(h.scene, 'light', h.to);
      },
    });
  },
};

// ── Venomslinger ─────────────────────────────────────────────────────────────

const VENOM_PIPS = 10;

const VENOMSLINGER: BespokePath = {
  hit: (h) => {
    const view = targetView(h);
    const stacks = view?.targetStatus?.find((s) => s.id === 'dot')?.stacks ?? 0;
    if (stacks <= 0) return;
    const n = Math.min(VENOM_PIPS, stacks);
    const hot = n >= VENOM_PIPS - 2;
    const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX);
    const r = 26 * h.k;
    for (let i = 0; i < VENOM_PIPS; i++) {
      const a = -Math.PI / 2 + (i / VENOM_PIPS) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * 0.7;
      const lit = i < n;
      g.fillStyle(lit ? (hot ? 0xd8ff6a : 0x9ad65a) : 0x2a3a1a, lit ? 1 : 0.5);
      g.fillCircle(x, y, i === n - 1 ? 4 : 3);
    }
    g.setScale(hot ? 1.1 : 1);
    h.scene.tweens.add({
      targets: g, alpha: 0, scaleX: hot ? 1.25 : 1.05, scaleY: hot ? 1.25 : 1.05,
      duration: 420, delay: 160, onComplete: () => g.destroy(),
    });
    if (hot) ring(h.scene, h.to.x, h.to.y, 0xd8ff6a, { from: r * 0.9, scale: 1.4, width: 2, ms: 240, alpha: 0.7 });
  },
};

/** Tier-3 node id → its bespoke attack. */
const BESPOKE_PATHS: Record<string, BespokePath> = {
  'cadence-heavy-t3-a': BERSERKER,
  'cadence-heavy-t3-c': JUGGERNAUT,
  'cadence-balanced-t3-c': JUSTICAR,
  'dot-light-t3-a': VENOMSLINGER,
};

export const bespokePathFor = (specId: string | undefined): BespokePath | undefined =>
  specId ? BESPOKE_PATHS[specId] : undefined;
