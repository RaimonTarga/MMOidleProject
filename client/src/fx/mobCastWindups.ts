/**
 * MOB CHARGED-ATTACK WIND-UPS — premium pass for mobs, 2026-09-27 (step A1).
 *
 * Twenty-odd mobs carry a charged attack or a cast ability. Until now their wind-up
 * was a cast bar (plus a ground circle for the area ones) while the body stood
 * still, so the one beat the player can answer had nothing to read. Each family
 * now gets the boss grammar at mob weight:
 *   a CLOCK   drawn where the danger is (on the victim, or in the planted circle);
 *   a POSE    on the caster (raise, coil, rear, draw);
 *   a PAYOFF  that hands over to the existing cue (`'continue'`), or owns it;
 *   a CANCEL  when a stun stops the cast.
 *
 * Dispatched from `monster-cast-start` for NON-boss casters only (bosses have their
 * own premium wind-ups), keyed by the cast's fx id plus the caster's definition
 * (the same `strong-kick` id is a ground slam on a Troll and a hop-kick on a Cliff
 * Hopper). A wind-up registers under the id its cast-END carries: for an area
 * charge that is `aoe.impactFx`, not the cast-start `fx`.
 *
 * Budget: one `follow` per cast in progress; bodies off the camera draw nothing and
 * leave the ordinary payoff to play. Shake only when the player's own body is hit.
 */
import { MONSTER_DATABASE, type MonsterDefinition, type MonsterView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { bodyPose, posePath, releasePose, tweenPose } from './bodyPose';
import { drawCracks, drawSigil, inhale, ring } from './bossKit';
import { burstFx } from './particles';
import { impact } from './impactFeel';
import { fxMawWindup } from './trenchBoss';
import { castTargetId, follow, registerWindup, spriteAt, type Pt } from './windups';
import { drawShellDome, shellStyleOf } from './mobStates';

type Sprite = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

interface ClockCtx {
  scene: GameScene;
  id: string;
  castMs: number;
  def: MonsterDefinition;
  victimId: string | undefined;
  /** Where the planted circle is (area casts), else the victim at cast start. */
  plant: Pt;
  radius: number;
  seed: number;
}

interface Frame {
  /** 0..1 through the cast. */
  k: number;
  me: Sprite;
  victim: Pt | undefined;
  plant: Pt;
}

interface ClockSpec {
  /** The caster's wind-up pose (called once). */
  pose?(c: ClockCtx): void;
  /** Per frame, on a fresh graphics layer above the ground. */
  draw?(g: Phaser.GameObjects.Graphics, f: Frame, c: ClockCtx): void;
  /** Per frame, on a layer beneath every sprite (cracks, shadows, rime). */
  ground?(g: Phaser.GameObjects.Graphics, f: Frame, c: ClockCtx): void;
  /** The payoff. Default: a short lunge, and the usual cue still plays. */
  fire?(c: ClockCtx, hit: Pt | undefined): void | 'continue';
  /** Extra teardown on a stopped cast (the layers fade and the pose releases anyway). */
  cancel?(c: ClockCtx, last: Frame | undefined): void;
}

const onCamera = (scene: GameScene, p: Pt): boolean => {
  const v = scene.cameras.main.worldView;
  return p.x > v.x - 160 && p.x < v.right + 160 && p.y > v.y - 160 && p.y < v.bottom + 160;
};

const feet = (s: { x: number; y: number; displayHeight: number }): Pt => ({ x: s.x, y: s.y + s.displayHeight * 0.38 });

/** The telegraph circle this caster just planted, if the client has it yet. */
function plantedZone(scene: GameScene, id: string): { x: number; y: number; radius: number } | undefined {
  for (const z of scene.groundZones.values()) {
    if (z.ownerId === id && z.kind === 'slam-telegraph') return { x: z.x, y: z.y, radius: z.radius };
  }
  return undefined;
}

/** Shake only when the player's own body is inside the payoff. */
function feelIfMine(scene: GameScene, at: Pt, radius: number, weight: 'light' | 'medium'): void {
  const own = scene.state.ownId ? spriteAt(scene, scene.state.ownId) : undefined;
  if (own && Math.hypot(own.x - at.x, own.y - at.y) <= radius) impact(scene, weight, at);
}

function lunge(scene: GameScene, id: string, toward: Pt | undefined): void {
  const me = spriteAt(scene, id);
  const lean = me && toward ? Math.sign(toward.x - me.x || 1) * 0.14 : 0;
  posePath(scene, id, [
    { sx: 1.12, sy: 0.88, lift: 0, rot: lean, ms: 80, ease: 'Quad.easeIn' },
    { sx: 1, sy: 1, rot: 0, ms: 280, ease: 'Back.easeOut' },
  ]);
}

function runClock(ctx: ClockCtx, spec: ClockSpec, resolveFx: string): void {
  const { scene, id, castMs, victimId } = ctx;
  spec.pose?.(ctx);
  const top = scene.add.graphics().setDepth(DEPTH.FX + 1);
  const low = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
  const began = performance.now();
  let last: Frame | undefined;
  let lastVictim: Pt | undefined = spriteAt(scene, victimId);
  const stop = follow(scene, () => {
    const me = scene.state.sprite.get(id);
    if (!me || !top.active) return false;
    const k = Math.min(1, (performance.now() - began) / castMs);
    const victim = spriteAt(scene, victimId) ?? lastVictim;
    lastVictim = victim;
    const zone = plantedZone(scene, id);
    if (zone) {
      ctx.plant = { x: zone.x, y: zone.y };
      ctx.radius = zone.radius;
    }
    last = { k, me, victim, plant: ctx.plant };
    top.clear();
    low.clear();
    spec.draw?.(top, last, ctx);
    spec.ground?.(low, last, ctx);
    return k < 1.6;
  });
  const teardown = (fadeMs: number): void => {
    stop();
    for (const g of [top, low]) {
      if (fadeMs <= 0) g.destroy();
      else scene.tweens.add({ targets: g, alpha: 0, duration: fadeMs, onComplete: () => g.destroy() });
    }
  };
  registerWindup(scene, id, {
    fire: (hit) => {
      teardown(0);
      bodyPose(scene, id).tremble = 0;
      if (spec.fire) return spec.fire(ctx, hit);
      lunge(scene, id, hit ?? lastVictim);
      return 'continue';
    },
    cancel: () => {
      teardown(260);
      bodyPose(scene, id).tremble = 0;
      spec.cancel?.(ctx, last);
      // A stopped cast unwinds: the body wobbles and settles.
      posePath(scene, id, [
        { sx: 1.04, sy: 0.96, lift: 0, rot: 0.1, ms: 90 },
        { rot: -0.06, ms: 110 },
        { sx: 1, sy: 1, rot: 0, ms: 220, ease: 'Back.easeOut' },
      ]);
    },
  }, { fx: resolveFx, ttlMs: castMs + 1500 });
}

// ── The families ─────────────────────────────────────────────────────────────

const ROCK = [0x4a4550, 0x6f6878, 0x9a93a4];
const EARTH = [0x6e6660, 0x9a918a, 0xc8c0b4];
const FROST = [0x6699bb, 0xccffff, 0xffffff];
const EMBER = [0xff5a1a, 0xffa040, 0xffe08a];

/** SLAM: arms raised and trembling while cracks spread through the planted circle. */
function slam(dust: number[], crack: number, glow: number): ClockSpec {
  return {
    pose: (c) =>
      posePath(c.scene, c.id, [
        { sx: 0.9, sy: 1.14, lift: 10, rot: 0, ms: c.castMs * 0.7, ease: 'Quad.easeOut' },
        { sx: 0.88, sy: 1.17, lift: 12, ms: c.castMs * 0.3 },
      ]),
    ground: (g, f, c) => {
      drawCracks(g, f.plant.x, f.plant.y, c.radius * 0.95, 0.15 + 0.85 * f.k, crack, 0.55 + 0.3 * f.k, c.seed, 9);
      drawCracks(g, f.plant.x, f.plant.y, c.radius * 0.95, 0.15 + 0.85 * f.k, glow, 0.2 + 0.4 * f.k, c.seed, 9);
      // Tremble builds over the last third, the "about to come down" beat.
      bodyPose(c.scene, c.id).tremble = f.k > 0.66 ? (f.k - 0.66) * 3 : 0;
      if (f.k > 0.5 && Math.random() < 0.08) {
        burstFx(c.scene, 'ptx-dot', f.plant.x + (Math.random() - 0.5) * c.radius, f.plant.y + (Math.random() - 0.5) * c.radius * 0.5, 2, 380, {
          tint: dust, speed: { min: 10, max: 40 }, angle: { min: 240, max: 300 },
          scale: { start: 0.6, end: 0 }, alpha: { start: 0.8, end: 0 }, gravityY: 300,
        });
      }
    },
    fire: (c, hit) => {
      posePath(c.scene, c.id, [
        { sx: 1.2, sy: 0.78, lift: 0, rot: 0, ms: 80, ease: 'Quad.easeIn' },
        { sx: 1, sy: 1, ms: 320, ease: 'Back.easeOut' },
      ]);
      const me = spriteAt(c.scene, c.id);
      if (me) burstFx(c.scene, 'ptx-dot', me.x, me.y + 20, 10, 420, {
        tint: dust, speed: { min: 60, max: 160 }, angle: { min: 180, max: 360 },
        scale: { start: 0.9, end: 0 }, alpha: { start: 0.8, end: 0 }, gravityY: 320,
      });
      feelIfMine(c.scene, hit ?? c.plant, c.radius, 'light');
      return 'continue';
    },
  };
}

/** RAM: backs up, paws the ground twice, snorts; then the gore. */
const RAM: ClockSpec = {
  pose: (c) => {
    const me = spriteAt(c.scene, c.id);
    const v = spriteAt(c.scene, c.victimId);
    const lean = me && v ? Math.sign(v.x - me.x || 1) : 1;
    tweenPose(c.scene, c.id, { sx: 1.12, sy: 0.9, rot: -lean * 0.1 }, c.castMs * 0.4);
    for (const at of [0.3, 0.6]) {
      c.scene.time.delayedCall(c.castMs * at, () => {
        const s = c.scene.state.sprite.get(c.id);
        if (!s) return;
        const f = feet(s);
        burstFx(c.scene, 'ptx-dot', f.x - lean * 10, f.y, 6, 420, {
          tint: EARTH, speed: { min: 40, max: 110 }, angle: lean > 0 ? { min: 160, max: 220 } : { min: -40, max: 20 },
          scale: { start: 0.8, end: 0.2 }, alpha: { start: 0.8, end: 0 }, gravityY: 300,
        });
      });
    }
  },
  draw: (g, f, c) => {
    // Snort: two warm puffs at the head, quickening.
    if (Math.random() < 0.04 + 0.1 * f.k) {
      const s = f.me;
      burstFx(c.scene, 'ptx-mist', s.x, s.y - s.displayHeight * 0.1, 1, 420, {
        tint: 0xf0ece6, speed: { min: 10, max: 30 }, scale: { start: 0.35, end: 0.8 }, alpha: { start: 0.5, end: 0 },
      });
    }
    // The lane it will take: a scuffed dust line to the victim.
    if (f.victim) {
      g.lineStyle(3, 0xc8c0b4, 0.12 + 0.3 * f.k);
      g.lineBetween(f.me.x, f.me.y + f.me.displayHeight * 0.38, f.victim.x, f.victim.y + 14);
    }
  },
};

/** HOP-KICK: a deep coil that springs into the kick. */
const HOP_KICK: ClockSpec = {
  pose: (c) => tweenPose(c.scene, c.id, { sx: 1.22, sy: 0.74, lift: 0 }, c.castMs * 0.85, 'Quad.easeOut'),
  draw: (g, f, c) => {
    bodyPose(c.scene, c.id).tremble = f.k > 0.5 ? 0.8 : 0;
    if (Math.random() < 0.06) {
      const p = feet(f.me);
      burstFx(c.scene, 'ptx-dot', p.x, p.y, 2, 300, {
        tint: EARTH, speed: { min: 10, max: 40 }, angle: { min: 200, max: 340 },
        scale: { start: 0.6, end: 0 }, alpha: { start: 0.7, end: 0 },
      });
    }
  },
  fire: (c, hit) => {
    posePath(c.scene, c.id, [
      { sx: 0.86, sy: 1.16, lift: 16, rot: 0, ms: 90, ease: 'Quad.easeOut' },
      { sx: 1.1, sy: 0.9, lift: 0, ms: 110, ease: 'Quad.easeIn' },
      { sx: 1, sy: 1, ms: 240, ease: 'Back.easeOut' },
    ]);
    if (hit) feelIfMine(c.scene, hit, 30, 'light');
    return 'continue';
  },
};

/** Two claw arcs over the victim, one each side, closing across the cast. */
function drawPincers(g: Phaser.GameObjects.Graphics, at: Pt, k: number, color: number, edge: number): void {
  const gap = 46 - 34 * k * k;
  for (const side of [-1, 1]) {
    const cx = at.x + side * gap;
    const cy = at.y - 20;
    g.lineStyle(9, edge, 0.55 + 0.3 * k);
    g.beginPath();
    g.arc(cx, cy, 20, side < 0 ? -Math.PI * 0.55 : Math.PI * 1.55, side < 0 ? Math.PI * 0.55 : Math.PI * 0.45, side > 0);
    g.strokePath();
    g.lineStyle(4, color, 0.8 + 0.2 * k);
    g.beginPath();
    g.arc(cx, cy, 20, side < 0 ? -Math.PI * 0.55 : Math.PI * 1.55, side < 0 ? Math.PI * 0.55 : Math.PI * 0.45, side > 0);
    g.strokePath();
  }
}

/** PINCER (Dune Tyrant): the claws open over the victim and close, Trench-jaw style. */
const PINCER: ClockSpec = {
  pose: (c) => tweenPose(c.scene, c.id, { sx: 1.08, sy: 0.94, lift: 4 }, c.castMs * 0.8),
  draw: (g, f) => {
    if (f.victim) drawPincers(g, f.victim, f.k, 0xe8c07a, 0x6a4a28);
  },
  fire: (c, hit) => {
    const at = hit ?? spriteAt(c.scene, c.victimId);
    if (at) {
      const snap = c.scene.add.graphics().setDepth(DEPTH.FX + 1);
      drawPincers(snap, at, 1.15, 0xfff0c0, 0x6a4a28);
      c.scene.tweens.add({ targets: snap, alpha: 0, duration: 240, delay: 60, onComplete: () => snap.destroy() });
      feelIfMine(c.scene, at, 30, 'light');
    }
    lunge(c.scene, c.id, at);
    return 'continue';
  },
  cancel: (c, last) => {
    if (!last?.victim) return;
    // The claws spring apart.
    const g = c.scene.add.graphics().setDepth(DEPTH.FX + 1);
    drawPincers(g, last.victim, 0, 0xe8c07a, 0x6a4a28);
    c.scene.tweens.add({ targets: g, alpha: 0, scaleX: 1.3, duration: 260, onComplete: () => g.destroy() });
  },
};

/** Stone creeping up a body from the feet, `k` of its height. */
function drawStoneCrust(g: Phaser.GameObjects.Graphics, s: { x: number; y: number; displayWidth: number; displayHeight: number }, k: number, alpha: number): void {
  const h = s.displayHeight * 0.8 * k;
  const w = s.displayWidth * 0.62;
  const base = s.y + s.displayHeight * 0.38;
  g.fillStyle(0x8a857c, alpha * 0.55);
  g.fillRect(s.x - w / 2, base - h, w, h);
  g.fillStyle(0x6a655c, alpha * 0.7);
  g.fillEllipse(s.x, base - h, w, 8);
  g.lineStyle(1.5, 0x3a3630, alpha * 0.8);
  for (let i = 0; i < 3; i++) {
    const x = s.x - w / 3 + (i * w) / 3;
    g.lineBetween(x, base, x + 4, base - h * 0.6);
  }
}

/** GAZE (basilisks): the eyes kindle and stone creeps up the victim. */
const GAZE: ClockSpec = {
  pose: (c) => tweenPose(c.scene, c.id, { sx: 0.94, sy: 1.08, lift: 5 }, c.castMs * 0.8),
  draw: (g, f, c) => {
    const eye = { x: f.me.x, y: f.me.y - f.me.displayHeight * 0.22 };
    g.fillStyle(0xffe07a, 0.4 + 0.6 * f.k);
    g.fillCircle(eye.x - 5, eye.y, 2.5 + 2 * f.k);
    g.fillCircle(eye.x + 5, eye.y, 2.5 + 2 * f.k);
    if (f.victim) {
      g.lineStyle(1 + 2 * f.k, 0xffe07a, 0.08 + 0.35 * f.k);
      g.lineBetween(eye.x, eye.y, f.victim.x, f.victim.y - 10);
      const vs = c.scene.state.sprite.get(c.victimId!);
      if (vs) drawStoneCrust(g, vs, f.k, 0.9);
    }
  },
  fire: (c) => {
    // The stone holds for the root, then crumbles off.
    const rootMs = c.def.chargedAttack?.rootMs ?? 0;
    if (c.victimId && rootMs > 0) {
      const g = c.scene.add.graphics();
      const began = performance.now();
      const stop = follow(c.scene, () => {
        const vs = c.scene.state.sprite.get(c.victimId!);
        if (!vs || !g.active || performance.now() - began > rootMs) return false;
        g.clear().setDepth(vs.depth + 0.5);
        drawStoneCrust(g, vs, 0.7, 1);
        return true;
      });
      c.scene.time.delayedCall(rootMs, () => {
        stop();
        const at = spriteAt(c.scene, c.victimId);
        if (at) burstFx(c.scene, 'ptx-dot', at.x, at.y + 6, 12, 480, {
          tint: [0x6a655c, 0x8a857c, 0xb0aa9c], speed: { min: 30, max: 110 }, angle: { min: 180, max: 360 },
          scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 380,
        });
        g.destroy();
      });
    }
    lunge(c.scene, c.id, undefined);
    return 'continue';
  },
  cancel: (c, last) => {
    // The glare snuffs out; the half-formed stone flakes away.
    if (last?.victim) burstFx(c.scene, 'ptx-dot', last.victim.x, last.victim.y + 6, 8, 380, {
      tint: [0x6a655c, 0x8a857c], speed: { min: 20, max: 80 }, angle: { min: 200, max: 340 },
      scale: { start: 0.6, end: 0 }, alpha: { start: 0.9, end: 0 }, gravityY: 300,
    });
  },
};

/** SUNBEAM (Gilded Scarab): a sun disc gathers light above it, the aim line brightens. */
const SUNBEAM: ClockSpec = {
  pose: (c) => {
    tweenPose(c.scene, c.id, { sx: 0.92, sy: 1.1, lift: 8 }, c.castMs * 0.8);
    const me = spriteAt(c.scene, c.id);
    if (me) inhale(c.scene, me.x, me.y - 44, [0xffe07a, 0xfff4c0], 70, c.castMs * 0.8);
  },
  draw: (g, f) => {
    const sun = { x: f.me.x, y: f.me.y - 44 };
    g.fillStyle(0xffc83a, 0.25 + 0.3 * f.k);
    g.fillCircle(sun.x, sun.y, 6 + 10 * f.k);
    g.fillStyle(0xfff4c0, 0.6 + 0.4 * f.k);
    g.fillCircle(sun.x, sun.y, 3 + 5 * f.k);
    if (f.victim) {
      g.lineStyle(1 + 2 * f.k, 0xffe07a, 0.1 + 0.4 * f.k);
      g.lineBetween(sun.x, sun.y, f.victim.x, f.victim.y - 10);
    }
  },
};

/** HEX (Bog Witch, Mire Hexer): a sigil draws itself over the victim. */
function hex(color: number, points: number): ClockSpec {
  return {
    pose: (c) => tweenPose(c.scene, c.id, { sx: 0.94, sy: 1.1, lift: 6, rot: -0.05 }, c.castMs * 0.8),
    draw: (g, f) => {
      if (f.victim) drawSigil(g, f.victim.x, f.victim.y - 54, 14, f.k, color, 0.9, performance.now() / 800, points);
      g.fillStyle(color, 0.3 + 0.4 * f.k);
      g.fillCircle(f.me.x + 16, f.me.y - 26, 4 + 4 * f.k);
    },
  };
}

/** A narrowing aim line with a glint at its tip: a drawn bow, a lance building. */
function aimLine(color: number, gather?: number[]): ClockSpec {
  return {
    pose: (c) => {
      const me = spriteAt(c.scene, c.id);
      const v = spriteAt(c.scene, c.victimId);
      const lean = me && v ? Math.sign(v.x - me.x || 1) : 1;
      tweenPose(c.scene, c.id, { sx: 0.93, sy: 1.06, rot: -lean * 0.12 }, c.castMs * 0.8);
      if (me && gather) inhale(c.scene, me.x, me.y - 10, gather, 60, c.castMs * 0.8);
    },
    draw: (g, f) => {
      if (!f.victim) return;
      const from = { x: f.me.x, y: f.me.y - 12 };
      g.lineStyle(10 - 8 * f.k, color, 0.06 + 0.2 * f.k);
      g.lineBetween(from.x, from.y, f.victim.x, f.victim.y - 8);
      g.lineStyle(1.2, color, 0.25 + 0.6 * f.k);
      g.lineBetween(from.x, from.y, f.victim.x, f.victim.y - 8);
      if (f.k > 0.75) {
        const r = 3 + 6 * (f.k - 0.75) * 4;
        g.lineStyle(2, 0xffffff, 0.9);
        g.lineBetween(from.x - r, from.y, from.x + r, from.y);
        g.lineBetween(from.x, from.y - r, from.x, from.y + r);
      }
    },
  };
}

/** A shadow growing where something will fall, with specks dropping into it. */
function fallingShadow(g: Phaser.GameObjects.Graphics, at: Pt, r: number, k: number): void {
  g.fillStyle(0x000000, 0.1 + 0.28 * k);
  g.fillEllipse(at.x, at.y, r * 2 * (0.4 + 0.6 * k), r * 0.8 * (0.4 + 0.6 * k));
}

/** HEAVY THROW (Boulder Thrower): a boulder hoisted overhead, its landing shadow grows. */
const HEAVE: ClockSpec = {
  pose: (c) => tweenPose(c.scene, c.id, { sx: 0.9, sy: 1.14, lift: 4 }, c.castMs * 0.8),
  draw: (g, f, c) => {
    const lift = 30 + 16 * Math.min(1, f.k * 1.4);
    const bx = f.me.x;
    const by = f.me.y - f.me.displayHeight * 0.4 - lift * 0.5;
    g.fillStyle(0x5a534c, 1);
    g.fillCircle(bx, by, 13);
    g.fillStyle(0x8a837a, 1);
    g.fillCircle(bx - 3, by - 3, 8);
    bodyPose(c.scene, c.id).tremble = f.k > 0.6 ? 0.7 : 0;
  },
  ground: (g, f, c) => fallingShadow(g, f.plant, c.radius, f.k),
};

/** MORTAR (Crag Mortar): smoke puffs as it loads; the shell's shadow grows in the circle. */
const MORTAR: ClockSpec = {
  pose: (c) => tweenPose(c.scene, c.id, { sx: 1.08, sy: 0.92 }, c.castMs * 0.6),
  draw: (g, f, c) => {
    if (Math.random() < 0.05 + 0.08 * f.k) {
      burstFx(c.scene, 'ptx-mist', f.me.x, f.me.y - f.me.displayHeight * 0.35, 1, 600, {
        tint: 0x9a918a, speed: { min: 10, max: 30 }, angle: { min: 250, max: 290 },
        scale: { start: 0.4, end: 1 }, alpha: { start: 0.5, end: 0 }, gravityY: -40,
      });
    }
  },
  ground: (g, f, c) => fallingShadow(g, f.plant, c.radius * 0.8, f.k),
  fire: (c) => {
    posePath(c.scene, c.id, [
      { sx: 0.9, sy: 1.12, lift: 4, ms: 70 },
      { sx: 1, sy: 1, lift: 0, ms: 300, ease: 'Back.easeOut' },
    ]);
    return 'continue';
  },
};

/** DEEP FREEZE AREA (Hoarfrost Yeti): it breathes in cold; ice spikes ring the circle. */
const YETI_FREEZE: ClockSpec = {
  pose: (c) => {
    tweenPose(c.scene, c.id, { sx: 0.92, sy: 1.12, lift: 4 }, c.castMs * 0.8);
    const me = spriteAt(c.scene, c.id);
    if (me) inhale(c.scene, me.x, me.y - 16, FROST, 80, c.castMs * 0.8);
  },
  ground: (g, f, c) => {
    const n = 14;
    const shown = Math.ceil(n * f.k);
    for (let i = 0; i < shown; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = f.plant.x + Math.cos(a) * c.radius;
      const y = f.plant.y + Math.sin(a) * c.radius * 0.45;
      const h = 6 + 10 * f.k;
      g.fillStyle(0xccffff, 0.75);
      g.fillTriangle(x - 4, y, x + 4, y, x, y - h);
      g.lineStyle(1, 0xffffff, 0.8);
      g.lineBetween(x, y, x, y - h);
    }
    g.fillStyle(0x9fdcff, 0.06 + 0.14 * f.k);
    g.fillEllipse(f.plant.x, f.plant.y, c.radius * 2, c.radius * 0.9);
  },
};

/** STALACTITE (Cave Gargoyle): a spike forms high over the victim, trembling loose. */
const STALACTITE: ClockSpec = {
  pose: (c) => tweenPose(c.scene, c.id, { sx: 0.94, sy: 1.1, lift: 4 }, c.castMs * 0.8),
  draw: (g, f, c) => {
    if (!f.victim) return;
    const jitter = f.k > 0.7 ? (Math.random() - 0.5) * 3 : 0;
    const x = f.victim.x + jitter;
    const y = f.victim.y - 130;
    const len = 14 + 26 * f.k;
    g.fillStyle(0x5a5560, 0.95);
    g.fillTriangle(x - 8, y, x + 8, y, x, y + len);
    g.fillStyle(0x9a93a4, 0.9);
    g.fillTriangle(x - 3, y, x + 2, y, x - 1, y + len * 0.7);
    if (Math.random() < 0.1 + 0.2 * f.k) {
      burstFx(c.scene, 'ptx-dot', x, y + len, 1, 600, {
        tint: ROCK, speed: { min: 0, max: 10 }, angle: { min: 80, max: 100 },
        scale: { start: 0.5, end: 0.2 }, alpha: { start: 0.8, end: 0 }, gravityY: 500,
      });
    }
  },
  ground: (g, f) => {
    if (f.victim) fallingShadow(g, { x: f.victim.x, y: f.victim.y + 14 }, 24, f.k);
  },
};

/** ERUPTION (Obsidian Tortoise): the shell glows, vents smoke; heat rises under the victim. */
const ERUPTION: ClockSpec = {
  pose: (c) => tweenPose(c.scene, c.id, { sx: 1.1, sy: 0.9 }, c.castMs * 0.8),
  draw: (g, f, c) => {
    g.fillStyle(0xff7a2a, 0.1 + 0.3 * f.k);
    g.fillEllipse(f.me.x, f.me.y - 4, f.me.displayWidth * 0.7, f.me.displayHeight * 0.5);
    bodyPose(c.scene, c.id).tremble = f.k > 0.6 ? 0.8 : 0;
    if (Math.random() < 0.08) {
      burstFx(c.scene, 'ptx-mist', f.me.x + (Math.random() - 0.5) * 20, f.me.y - 16, 1, 600, {
        tint: 0x5a4a44, speed: { min: 10, max: 30 }, angle: { min: 250, max: 290 },
        scale: { start: 0.4, end: 1 }, alpha: { start: 0.5, end: 0 }, gravityY: -40,
      });
    }
  },
  ground: (g, f) => {
    if (!f.victim) return;
    const at = { x: f.victim.x, y: f.victim.y + 14 };
    g.fillStyle(0xff5a1a, 0.08 + 0.3 * f.k);
    g.fillEllipse(at.x, at.y, 60 * (0.5 + f.k * 0.5), 22 * (0.5 + f.k * 0.5));
    g.lineStyle(2, 0xffa040, 0.2 + 0.6 * f.k);
    g.strokeEllipse(at.x, at.y, 60 * (0.5 + f.k * 0.5), 22 * (0.5 + f.k * 0.5));
  },
  fire: (c, hit) => {
    const at = hit ?? spriteAt(c.scene, c.victimId);
    if (at) {
      burstFx(c.scene, 'ptx-spark', at.x, at.y + 10, 20, 560, {
        tint: EMBER, speed: { min: 80, max: 240 }, angle: { min: 220, max: 320 },
        scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 420,
      });
      ring(c.scene, at.x, at.y + 12, 0xff7a2a, { from: 12, scale: 3, width: 3, ms: 340, flat: true });
      feelIfMine(c.scene, at, 30, 'light');
    }
    lunge(c.scene, c.id, at);
  },
};

/** FROST-TUSK (Rime-Tusk Mastodon): rears up on its hind legs, rime spreads in the circle. */
const FROST_TUSK: ClockSpec = {
  pose: (c) => {
    const me = spriteAt(c.scene, c.id);
    const v = spriteAt(c.scene, c.victimId);
    const lean = me && v ? Math.sign(v.x - me.x || 1) : 1;
    tweenPose(c.scene, c.id, { sx: 0.9, sy: 1.14, lift: 12, rot: -lean * 0.2 }, c.castMs * 0.8);
  },
  ground: (g, f, c) => {
    drawCracks(g, f.plant.x, f.plant.y, c.radius * 0.95, 0.15 + 0.85 * f.k, 0x9fdcff, 0.4 + 0.4 * f.k, c.seed, 8);
    g.fillStyle(0xccffff, 0.05 + 0.12 * f.k);
    g.fillEllipse(f.plant.x, f.plant.y, c.radius * 2, c.radius * 0.9);
  },
  fire: slam(FROST, 0x3a5a78, 0xccffff).fire,
};

/** SHELL UP (Snappers): trembling, it pulls in while the carapace closes over it. */
const SHELL_UP: ClockSpec = {
  pose: (c) => tweenPose(c.scene, c.id, { sx: 1.1, sy: 0.86 }, c.castMs, 'Quad.easeIn'),
  draw: (g, f, c) => {
    bodyPose(c.scene, c.id).tremble = 0.6;
    drawShellDome(g, f.me.x, f.me.y, f.me.displayWidth, f.me.displayHeight, f.k, 0.35 + 0.5 * f.k, shellStyleOf(c.def));
  },
  // The shell aura takes over (the clamp-down and the dome) as `shelled` arrives.
  fire: () => undefined,
};

// ── Dispatch ─────────────────────────────────────────────────────────────────

function specFor(fx: string, def: MonsterDefinition): ClockSpec | 'maw' | undefined {
  const aoe = def.chargedAttack?.aoe;
  switch (fx) {
    case 'strong-kick':
      if (aoe?.impactFx === 'glacial-slam') return slam(FROST, 0x3a5a78, 0xccffff);
      if (aoe) return slam(def.biome === 'cave' ? ROCK : EARTH, 0x241f28, 0xc8b8a0);
      return def.biome === 'desert' ? PINCER : HOP_KICK;
    case 'avalanche-ram': return RAM;
    case 'petrifying-gaze': return GAZE;
    case 'sunbeam': return SUNBEAM;
    case 'wither': return hex(0x9ad65a, 3);
    case 'plague-hex': return hex(0x7fbf3a, 5);
    case 'power-shot':
      if (aoe?.impactFx === 'bombardment') return MORTAR;
      if (aoe?.impactFx === 'deep-freeze-area') return YETI_FREEZE;
      return aimLine(0xfff3ba);
    case 'pressure-lance': return aimLine(0x82c8ff, [0x82c8ff, 0xdff3ff]);
    case 'huge-boulder': return HEAVE;
    case 'stalactite-shot': return STALACTITE;
    case 'savage-maul': return 'maw';
    case 'volcanic-eruption': return ERUPTION;
    case 'frost-tusk-impact': return FROST_TUSK;
    case 'shell-up': return SHELL_UP;
    default: return undefined;
  }
}

/**
 * `monster-cast-start` for an ordinary mob: start its wind-up. Returns true when
 * this module owns the cast (the caller should not also run a boss wind-up).
 */
export function fxMobCastWindup(scene: GameScene, monsterId: string, castMs: number, fx: string): boolean {
  const view = scene.state.view.get(monsterId) as MonsterView | undefined;
  if (!view || view.isBoss) return false;
  const def = MONSTER_DATABASE.get(view.monsterTypeId);
  if (!def) return false;
  const spec = specFor(fx, def);
  if (!spec) return false;
  const me = scene.state.sprite.get(monsterId);
  if (!me || !onCamera(scene, me)) return true;

  if (spec === 'maw') {
    // The Trench jaws the boss made famous, at elite weight.
    const devour = def.chargedAttack?.aoe !== undefined;
    // A Trench elite's bite ENDS as its impact id (`devour`) or as `savage-maul`, not
    // as the boss's `trench-bite`, so the jaws must resolve under that id.
    fxMawWindup(scene, monsterId, castMs, 'bite', {
      width: devour ? 150 : 92,
      feel: devour ? 'light' : undefined,
      resolveFx: def.chargedAttack?.aoe?.impactFx ?? fx,
    });
    return true;
  }

  const victimId = castTargetId(scene, monsterId);
  const victim = spriteAt(scene, victimId);
  const zone = plantedZone(scene, monsterId);
  const aoe = def.chargedAttack?.aoe;
  const ability = def.monsterAbilities?.find((a) => a.fx === fx);
  const abilityArea = ability?.actions.find((a) => a.type === 'area-hit');
  const radius = zone?.radius ?? aoe?.radius ?? (abilityArea && 'radius' in abilityArea ? abilityArea.radius : 60);
  const ctx: ClockCtx = {
    scene, id: monsterId, castMs, def, victimId,
    plant: zone ? { x: zone.x, y: zone.y } : victim ? { x: victim.x, y: victim.y + 14 } : feet(me),
    radius,
    seed: 1 + Math.floor(Math.random() * 1e6),
  };
  // A charged area cast ENDS with its impact id, not the cast-start id.
  runClock(ctx, spec, aoe?.impactFx ?? fx);
  return true;
}
