/**
 * Every persistent state look, one row each (engine: bossAuras.ts). Grouped by
 * lineage; player marks at the end.
 */
import { MONSTER_DATABASE, type MonsterView } from '@mmo-idle/shared';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { impact } from './impactFeel';
import { chargeBeat, chargeKickoff, chargeSkid, drawChargeStreaks, rushPaletteOf } from './chargeRush';
import {
  barrierIntegrity, barrierStyleOf, defOf, drawBarrier, drawPrimedGlint, drawQuills, drawShellDome,
  primedAccentOf, shellStyleOf,
} from './mobStates';
import { bodyPose, posePath, releasePose, tweenPose } from './bodyPose';
import { drawLoadGather, fallingDrop, laneColor, shackleGeometry } from './lineagePayloadFx';
import { lastingActive, lastingRecord, noteLastingPos } from './lineagePayloadStates';
import { dustCloud, ring } from './bossKit';
import {
  bossEffectStacks,
  hasBossEffect,
  hasPlayerBuff,
  hasTargetStatus,
  targetStatusStacks,
  type AnyView,
  type AuraContext,
  type AuraDef,
} from './auraTypes';

const biomeOf = (view: AnyView): string | undefined =>
  MONSTER_DATABASE.get((view as MonsterView).monsterTypeId)?.biome;

const PLATE_IDS = ['barrier:stoneplate', 'barrier:hornplate', 'barrier:titanplate'];

const hasteId = (v: AnyView): string | undefined => (v as MonsterView).hastedBy?.effectId;
/** Last drawn barrier integrity per monster: a pool that ran dry SHATTERS, one that expired fades. */
const lastIntegrity = new Map<string, number>();

/** Shards thrown out from (or falling off) a body. */
function shards(c: AuraContext, colors: number[], burst: boolean): void {
  burstFx(c.scene, 'ptx-dot', c.x, c.y, burst ? 26 : 14, burst ? 620 : 700, {
    tint: colors,
    speed: burst ? { min: 140, max: 320 } : { min: 20, max: 70 },
    angle: burst ? { min: 0, max: 360 } : { min: 60, max: 120 },
    scale: { start: burst ? 1.1 : 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: burst ? 380 : 420,
    rotate: { min: 0, max: 360 },
  });
}

/** Pieces flying IN to assemble around the body (a plate, an ice shell). */
function assemble(c: AuraContext, color: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const r = c.h * 0.9;
    const piece = c.scene.add
      .graphics({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r * 0.7 })
      .setDepth(DEPTH.FX);
    piece.fillStyle(color, 0.95);
    piece.fillTriangle(-6, 4, 6, 4, 0, -8);
    piece.setRotation(a);
    c.scene.tweens.add({
      targets: piece,
      x: c.x + Math.cos(a) * c.w * 0.18,
      y: c.y + Math.sin(a) * c.h * 0.14,
      rotation: a + Math.PI,
      alpha: 0.2,
      duration: 380 + i * 12,
      ease: 'Cubic.easeIn',
      onComplete: () => piece.destroy(),
    });
  }
}


// ── Lineage payloads (course-correction W2-C) ────────────────────────────────
//
// The lasting looks a T1 payload leaves (lineagePayloadFx.ts draws the one-shots).
// Their state is the payload's own events, kept by lineagePayloadStates.ts, because
// a monster's status list is broadcast only while somebody targets it; each row
// ends on the server's applied clock or the server's early end, and draws a
// visible end of its own (a shackle breaking, a body getting up).

const SHACKLE_DARK = 0x2b3346;
const SHACKLE_STEEL = 0xc9d6ee;

/** Chain links along part of a ground ellipse (a = 0 at the right, clockwise). */
function chainArc(
  g: Phaser.GameObjects.Graphics, x: number, y: number, rx: number, ry: number,
  a0: number, a1: number, light: number, alpha: number,
): void {
  const links = 10;
  for (let i = 0; i < links; i++) {
    const s0 = a0 + ((a1 - a0) * i) / links;
    const s1 = s0 + ((a1 - a0) / links) * 0.74;
    const p0 = { x: x + Math.cos(s0) * rx, y: y + Math.sin(s0) * ry };
    const p1 = { x: x + Math.cos(s1) * rx, y: y + Math.sin(s1) * ry };
    g.lineStyle(i % 2 ? 6 : 7, SHACKLE_DARK, 0.95 * alpha);
    g.lineBetween(p0.x, p0.y, p1.x, p1.y);
    g.lineStyle(2.2, light, 0.95 * alpha);
    g.lineBetween(p0.x, p0.y, p1.x, p1.y);
  }
}

/** The shackle round the feet: the back half under the body, the front over it. */
function drawShackle(g: Phaser.GameObjects.Graphics, c: AuraContext, half: 'back' | 'front'): void {
  const record = lastingRecord(c.id, 'shackle');
  const left = record ? record.endsAt - performance.now() : 0;
  // The last 400 ms: the links strain and flicker before they give.
  const strain = left < 400 ? 0.55 + 0.45 * Math.abs(Math.sin(performance.now() / 45)) : 1;
  const alpha = c.s * strain;
  const { x, y, rx, ry } = shackleGeometry(c.x, c.y, c.w, c.h);
  const light = laneColor('control');
  if (half === 'back') {
    // A cold glow on the ground the body is pinned to, pulsing.
    g.fillStyle(light, (0.16 + 0.08 * c.pulse) * c.s);
    g.fillEllipse(x, y, rx * 2.5, ry * 2.5);
    chainArc(g, x, y, rx, ry, Math.PI, Math.PI * 2, SHACKLE_STEEL, alpha);
    // Two pegs driven into the ground, a chain run out to each.
    for (const side of [-1, 1]) {
      const px = x + side * rx * 1.6;
      const py = y + ry * 0.5;
      g.lineStyle(4, SHACKLE_DARK, 0.95 * alpha);
      g.lineBetween(x + side * rx, y, px, py);
      g.lineStyle(1.5, SHACKLE_STEEL, 0.9 * alpha);
      g.lineBetween(x + side * rx, y, px, py);
      g.fillStyle(SHACKLE_DARK, 0.95 * alpha);
      g.fillRect(px - 3.5, py - 12, 7, 15);
      g.fillStyle(light, 0.95 * alpha);
      g.fillRect(px - 3.5, py - 12, 7, 3);
    }
    return;
  }
  chainArc(g, x, y, rx, ry, 0, Math.PI, light, alpha);
  // The cuffs, at the front where the eye lands.
  for (const a of [Math.PI * 0.32, Math.PI * 0.68]) {
    const cx = x + Math.cos(a) * rx;
    const cy = y + Math.sin(a) * ry;
    g.fillStyle(SHACKLE_DARK, 0.95 * alpha);
    g.fillRect(cx - 5, cy - 4, 10, 8);
    g.lineStyle(1.5, light, 0.95 * alpha);
    g.strokeRect(cx - 5, cy - 4, 10, 8);
  }
  noteLastingPos(c.id, 'shackle', c.x, c.y, c.w, c.h);
}

/** The shackle giving way: links thrown off the feet, a ring where it was. */
export function shackleBreak(scene: AuraContext['scene'], bodyX: number, bodyY: number, w: number, h: number): void {
  const light = laneColor('control');
  const { x, y, rx } = shackleGeometry(bodyX, bodyY, w, h);
  burstFx(scene, 'ptx-dot', x, y, 18, 640, {
    tint: [SHACKLE_DARK, SHACKLE_STEEL, light],
    speed: { min: 120, max: 260 }, angle: { min: 190, max: 350 },
    scale: { start: 1.1, end: 0.1 }, alpha: { start: 1, end: 0 }, gravityY: 520, rotate: { min: 0, max: 360 },
  });
  ring(scene, x, y, light, { from: rx, scale: 1.8, width: 3, ms: 320, flat: true });
}

/**
 * Lying down: how far the body tips, how flat it is pressed, how low it settles.
 * A tilt plus a squash rather than a quarter turn: these are side-view sprites, and
 * a quadruped turned 70° reads as rearing up, not as knocked off its feet.
 */
function downPose(
  c: AuraContext,
  side = lastingRecord(c.id, 'knockdown')?.side ?? 1,
): { rot: number; sx: number; sy: number; lift: number } {
  const view = c.scene.state.view.get(c.id) as MonsterView | undefined;
  return view?.isBoss
    ? { rot: side * 0.3, sx: 1.08, sy: 0.84, lift: 0 }
    : { rot: side * 0.55, sx: 1.14, sy: 0.72, lift: -c.h * 0.04 };
}

/** The fall itself: knocked up off the feet, then down onto its side. */
const KNOCKDOWN_FALL_MS = 260;

export const AURA_DEFS: AuraDef[] = [
  // ── Jungle ───────────────────────────────────────────────────────────────
  {
    id: 'predator-frenzy',
    active: (v) => hasTargetStatus(v, 'boss-frenzy'),
    pulseMs: 420,
    ground: { color: 0xff2a2a, scale: 1.15 },
    body: { color: 0xff2a2a, alpha: [0.12, 0.42] },
    tremblePx: 1.2,
    beat: {
      everyMs: 150,
      draw: (c) =>
        burstFx(c.scene, 'ptx-spark', c.x + (Math.random() - 0.5) * c.h * 0.5, c.y + c.h * 0.3, 2, 520, {
          tint: [0xff3b2f, 0xff8a5c],
          speed: { min: 40, max: 110 },
          angle: { min: 250, max: 290 },
          scale: { start: 0.55, end: 0 },
          alpha: { start: 0.9, end: 0 },
          gravityY: -120,
        }),
    },
  },
  {
    id: 'cornered',
    active: (v) => hasBossEffect(v, 'cornered'),
    pulseMs: 900,
    ground: { color: 0xb3121f, scale: 1.3 },
    body: { color: 0xb3121f, alpha: [0.08, 0.28] },
    tremblePx: 0.6,
    beat: {
      everyMs: 260,
      draw: (c) =>
        burstFx(c.scene, 'ptx-dot', c.x + (Math.random() - 0.5) * c.h * 0.6, c.y + c.h * 0.35, 1, 900, {
          tint: 0x7a0c14,
          speed: { min: 15, max: 40 },
          angle: { min: 255, max: 285 },
          scale: { start: 0.9, end: 0 },
          alpha: { start: 0.7, end: 0 },
          gravityY: -40,
        }),
    },
  },

  // ── Forest: Bestial Frenzy, stronger with every stack ───────────────────────
  {
    id: 'bestial-frenzy',
    active: (v) => hasBossEffect(v, 'bestial-frenzy'),
    stacks: (v) => bossEffectStacks(v, 'bestial-frenzy'),
    pulseMs: 600,
    ground: { color: 0xd8541e, scale: 1.1, alpha: 0.14 },
    tremblePx: 0.5,
    overhead: (g, c) => {
      // Rage marks orbiting the head, one per stack (capped so it stays readable).
      const n = Math.min(8, c.stacks);
      const t = c.age / 1000;
      for (let i = 0; i < n; i++) {
        const a = t * 2.2 + (i / n) * Math.PI * 2;
        const x = c.x + Math.cos(a) * c.w * 0.36;
        const y = c.y - c.h * 0.42 + Math.sin(a) * c.h * 0.08;
        g.fillStyle(0xff7a2a, 0.85 * c.s);
        g.fillTriangle(x - 3, y + 3, x + 3, y + 3, x, y - 6);
      }
    },
    beat: {
      everyMs: 220,
      draw: (c) =>
        burstFx(c.scene, 'ptx-spark', c.x + (Math.random() - 0.5) * c.w * 0.5, c.y + c.h * 0.3,
          Math.min(4, 1 + Math.floor(c.stacks / 2)), 480, {
            tint: [0xff7a2a, 0xffb84a],
            speed: { min: 30, max: 90 },
            angle: { min: 250, max: 290 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.9, end: 0 },
            gravityY: -90,
          }),
    },
  },

  // ── Mountain: the plate ─────────────────────────────────────────────────────
  {
    id: 'stone-plate',
    active: (v) => PLATE_IDS.some((id) => hasTargetStatus(v, id)),
    pulseMs: 1400,
    ground: { color: 0x8c96a3, scale: 1.2, alpha: 0.12 },
    body: { color: 0xb8c2cc, alpha: [0.18, 0.32] },
    overhead: (g, c) => {
      // Stone plates hanging in a slow orbit around the body.
      const t = c.age / 1000;
      for (let i = 0; i < 5; i++) {
        const a = t * 0.9 + (i / 5) * Math.PI * 2;
        const x = c.x + Math.cos(a) * c.w * 0.5;
        const y = c.y + Math.sin(a) * c.h * 0.18;
        const front = Math.sin(a) > 0;
        g.fillStyle(front ? 0x9aa5b1 : 0x5d6773, (front ? 0.95 : 0.6) * c.s);
        g.fillRect(x - 7, y - 5, 14, 10);
        g.lineStyle(1, 0x2e353d, 0.8 * c.s);
        g.strokeRect(x - 7, y - 5, 14, 10);
      }
    },
    onStart: (c) => assemble(c, 0x9aa5b1, 10),
    onEnd: (c, view) => {
      // Broken (the boss is staggered) explodes; dropped on its own terms crumbles.
      const broken = hasBossEffect(view, 'boss-stunned');
      shards(c, [0x9aa5b1, 0x5d6773, 0xd6dde4], broken);
      if (broken) impact(c.scene, 'medium', { x: c.x, y: c.y });
    },
  },
  {
    // A charge in motion: dust torn up behind the body.
    id: 'rush',
    active: (v) => {
      const b = biomeOf(v);
      return (b === 'mountain' || b === 'plains') && (v as MonsterView).speed >= 380;
    },
    beat: {
      everyMs: 70,
      draw: (c) =>
        burstFx(c.scene, 'ptx-dot', c.x, c.y + c.h * 0.4, 4, 600, {
          tint: [0x9b8a6e, 0x7d6d55, 0xc2b294],
          speed: { min: 20, max: 80 },
          angle: { min: 200, max: 340 },
          scale: { start: 1.1, end: 0.2 },
          alpha: { start: 0.75, end: 0 },
          gravityY: -20,
        }),
    },
    tremblePx: 1.4,
  },

  // ── Speed phases (Relentless, Crag Rush, Earthshaker Rush): streaks ────────
  {
    id: 'haste',
    active: (v) =>
      hasBossEffect(v, 'relentless-pursuit') || hasBossEffect(v, 'crag-rush') || hasBossEffect(v, 'earthshaker-rush'),
    pulseMs: 500,
    ground: { color: 0xe8c070, scale: 1, alpha: 0.08 },
    beat: {
      everyMs: 180,
      draw: (c) => {
        const g = c.scene.add.graphics().setDepth(DEPTH.FX - 1);
        const y = c.y + (Math.random() - 0.3) * c.h * 0.6;
        g.lineStyle(2, 0xf3dca0, 0.6);
        g.lineBetween(c.x - c.w * 0.5, y, c.x - c.w * 0.1, y);
        c.scene.tweens.add({ targets: g, alpha: 0, x: -24, duration: 260, onComplete: () => g.destroy() });
      },
    },
  },

  // ── Swamp: the Rising Mire / spore enrage ───────────────────────────────────
  {
    id: 'rising-mire',
    active: (v) => hasBossEffect(v, 'enrage') && biomeOf(v) === 'swamp',
    pulseMs: 1100,
    ground: { color: 0x6f9e2a, scale: 1.4, alpha: 0.18 },
    body: { color: 0x7fbf3a, alpha: [0.05, 0.18] },
    beat: {
      everyMs: 240,
      draw: (c) => {
        // Bubbles rising and popping around the body.
        const x = c.x + (Math.random() - 0.5) * c.w * 0.9;
        const y = c.y + c.h * 0.38;
        const b = c.scene.add.graphics({ x, y }).setDepth(DEPTH.FX - 1);
        b.lineStyle(2, 0xa8d66a, 0.8);
        b.strokeCircle(0, 0, 4 + Math.random() * 4);
        c.scene.tweens.add({
          targets: b, y: y - 14, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 520,
          ease: 'Quad.easeOut', onComplete: () => b.destroy(),
        });
      },
    },
  },

  // ── Tundra: Ice Armor ───────────────────────────────────────────────────────
  {
    id: 'ice-armor',
    active: (v) => hasTargetStatus(v, 'barrier:ice-armor'),
    pulseMs: 1600,
    ground: { color: 0x9fdcff, scale: 1.3, alpha: 0.16 },
    body: { color: 0xcff0ff, alpha: [0.28, 0.45] },
    overhead: (g, c) => {
      // A faceted shell outline around the body.
      const rx = c.w * 0.5;
      const ry = c.h * 0.5;
      g.lineStyle(2, 0xe6f7ff, (0.5 + 0.3 * c.pulse) * c.s);
      g.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const k = i % 2 === 0 ? 1 : 0.86;
        const x = c.x + Math.cos(a) * rx * k;
        const y = c.y + Math.sin(a) * ry * k;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    },
    beat: {
      everyMs: 200,
      draw: (c) =>
        burstFx(c.scene, 'ptx-dot', c.x + (Math.random() - 0.5) * c.w, c.y + c.h * 0.35, 2, 900, {
          tint: [0xe6f7ff, 0xbfe6ff],
          speed: { min: 5, max: 20 },
          angle: { min: 250, max: 290 },
          scale: { start: 0.9, end: 0.2 },
          alpha: { start: 0.5, end: 0 },
          gravityY: -15,
        }),
    },
    onStart: (c) => assemble(c, 0xcff0ff, 12),
    onEnd: (c, view) => {
      const broken = hasBossEffect(view, 'boss-stunned');
      shards(c, [0xe6f7ff, 0x9fdcff, 0xffffff], broken);
      if (broken) impact(c.scene, 'medium', { x: c.x, y: c.y });
    },
  },

  // ── Volcanic: charging the final strike ─────────────────────────────────────
  {
    id: 'final-charge',
    active: (v) => hasBossEffect(v, 'final-eruption') || hasBossEffect(v, 'cataclysm'),
    pulseMs: 700,
    ground: { color: 0xff5a1f, scale: 1.5, alpha: 0.2 },
    body: { color: 0xff7a1a, alpha: [0.15, 0.5] },
    tremblePx: 1.1,
    beat: {
      everyMs: 160,
      draw: (c) =>
        burstFx(c.scene, 'ptx-spark', c.x + (Math.random() - 0.5) * c.w * 0.7, c.y + c.h * 0.2, 2, 700, {
          tint: [0xfff1c0, 0xff7a1a],
          speed: { min: 30, max: 90 },
          angle: { min: 250, max: 290 },
          scale: { start: 0.6, end: 0 },
          alpha: { start: 0.9, end: 0 },
          gravityY: -110,
        }),
    },
  },

  // ── Wasteland: Bone Tithe — a bone ring, one shard per risen ────────────────
  {
    id: 'bone-tithe',
    active: (v) => hasTargetStatus(v, 'bone-tithe'),
    stacks: (v) => targetStatusStacks(v, 'bone-tithe'),
    pulseMs: 1300,
    ground: { color: 0x9e8fb8, scale: 1.2, alpha: 0.12 },
    overhead: (g, c) => {
      const n = Math.min(8, c.stacks);
      const t = c.age / 1000;
      for (let i = 0; i < n; i++) {
        const a = -t * 1.3 + (i / n) * Math.PI * 2;
        const x = c.x + Math.cos(a) * c.w * 0.55;
        const y = c.y + c.h * 0.05 + Math.sin(a) * c.h * 0.2;
        g.fillStyle(0xe8e0d0, 0.9 * c.s);
        g.fillEllipse(x, y, 5, 14);
        g.fillStyle(0xb6a8d6, 0.5 * c.s);
        g.fillCircle(x, y - 7, 3);
      }
    },
  },

  // ── Wasteland: the Harvest — it grows as it feeds ───────────────────────────
  {
    id: 'harvest-wrath',
    active: (v) => hasBossEffect(v, 'harvest'),
    stacks: (v) => bossEffectStacks(v, 'harvest'),
    pulseMs: 900,
    ground: { color: 0x3fa060, scale: 1.4, alpha: 0.18 },
    body: { color: 0x8fe0a0, alpha: [0.1, 0.32] },
    tremblePx: 0.5,
    beat: {
      everyMs: 180,
      draw: (c) =>
        burstFx(c.scene, 'ptx-dot', c.x + (Math.random() - 0.5) * c.w * 0.6, c.y + c.h * 0.3,
          Math.min(4, 1 + Math.floor(c.stacks / 2)), 800, {
            tint: [0x8fe0a0, 0x6a4a9e],
            speed: { min: 20, max: 60 },
            angle: { min: 255, max: 285 },
            scale: { start: 0.7, end: 0 },
            alpha: { start: 0.8, end: 0 },
            gravityY: -70,
          }),
    },
  },

  // ── Adds: rallied / roar-hasted (Plains) ────────────────────────────────────
  {
    id: 'rallied',
    on: 'monster',
    // The mirrored haste reaches the client for every add, not only the targeted one.
    active: (v) =>
      hasTargetStatus(v, 'boss-rallied') || hasTargetStatus(v, 'boss-roar-haste') ||
      hasteId(v) === 'boss-rallied' || hasteId(v) === 'boss-roar-haste',
    stacks: (v) => Math.max(targetStatusStacks(v, 'boss-rallied'), 1),
    pulseMs: 700,
    ground: { color: 0xffb02e, scale: 1.1, alpha: 0.14 },
    body: { color: 0xffc04a, alpha: [0.06, 0.2] },
  },

  // ── Mobs: charge-on-aggro burst (chargeRush.ts) ────────────────────────────
  {
    id: 'charge-rush',
    on: ['monster', 'boss'],
    active: (v) => (v as MonsterView).charging === true,
    under: (g, c) => drawChargeStreaks(g, c, rushPaletteOf(c)),
    beat: { everyMs: 110, draw: (c) => chargeBeat(c, rushPaletteOf(c)) },
    onStart: (c) => chargeKickoff(c, rushPaletteOf(c)),
    onEnd: (c) => chargeSkid(c, rushPaletteOf(c)),
  },

  // ── Mobs: shields and wards (mobStates.ts) ─────────────────────────────────
  {
    // Sunshield Scarab, the bears, the stone wards, Molten Guard / Obsidian Shell /
    // Carapace Renewal: a bubble that dims and cracks as its pool drains.
    id: 'mob-barrier',
    on: 'monster',
    active: (v) => ((v as MonsterView).enemyBarrier?.amount ?? 0) > 0,
    pulseMs: 900,
    overhead: (g, c) => {
      lastIntegrity.set(c.id, barrierIntegrity(c));
      drawBarrier(g, c, barrierStyleOf(defOf(c)));
    },
    onStart: (c) => {
      const style = barrierStyleOf(defOf(c));
      assemble(c, style.edge, 10);
      ring(c.scene, c.x, c.y, style.edge, { from: c.w * 0.4, scale: 1.6, width: 2, ms: 320, alpha: 0.6 });
    },
    onEnd: (c, v) => {
      const style = barrierStyleOf(defOf(c));
      const broken = (lastIntegrity.get(c.id) ?? 1) < 0.35 ||
        ((v as MonsterView).enemyBarrier?.rechargeRemainingMs ?? 0) > 0;
      lastIntegrity.delete(c.id);
      shards(c, style.shards, broken);
      if (broken) ring(c.scene, c.x, c.y, style.edge, { from: c.w * 0.5, scale: 2.2, width: 3, ms: 300 });
    },
  },

  // ── Mobs: Snapper shell ────────────────────────────────────────────────────
  {
    id: 'mob-shell',
    on: 'monster',
    active: (v) => (v as MonsterView).shelled === true,
    pulseMs: 1400,
    ground: { color: 0x1a2414, scale: 1.1, alpha: 0.14 },
    overhead: (g, c) => drawShellDome(g, c.x, c.y, c.w, c.h, 1, c.s, shellStyleOf(defOf(c))),
    beat: {
      everyMs: 700,
      draw: (c) =>
        burstFx(c.scene, 'ptx-dot', c.x + (Math.random() - 0.5) * c.w * 0.6, c.y, 2, 700, {
          tint: shellStyleOf(defOf(c)).motes,
          speed: { min: 5, max: 20 }, angle: { min: 60, max: 120 },
          scale: { start: 0.6, end: 0 }, alpha: { start: 0.8, end: 0 }, gravityY: 120,
        }),
    },
    onStart: (c) => {
      // It clamps down: the body pulls in under the carapace.
      tweenPose(c.scene, c.id, { sx: 1.14, sy: 0.8, lift: 0, rot: 0 }, 140, 'Quad.easeIn');
      ring(c.scene, c.x, c.y + c.h * 0.3, shellStyleOf(defOf(c)).rim, { from: c.w * 0.3, scale: 1.8, width: 2, ms: 260, flat: true });
    },
    onEnd: (c) => {
      posePath(c.scene, c.id, [
        { sx: 0.92, sy: 1.12, lift: 6, ms: 110, ease: 'Quad.easeOut' },
        { sx: 1, sy: 1, lift: 0, ms: 280, ease: 'Back.easeOut' },
      ]);
      const style = shellStyleOf(defOf(c));
      shards(c, [style.shell, style.plate, style.rim], true);
    },
  },

  // ── Mobs: primed empowered hit (the finisher / opener tell) ────────────────
  {
    // Granite Mammoth, Emerald Constrictor, Charnel Brute, Cragback Rhino, the
    // Jungle ambushers, the Crystal Gargoyle: their NEXT attack is the big one.
    id: 'mob-primed',
    on: 'monster',
    active: (v) => (v as MonsterView).primed === true,
    pulseMs: 380,
    ground: { color: 0xffffff, scale: 0.95, alpha: 0.08 },
    tremblePx: 0.5,
    overhead: (g, c) => drawPrimedGlint(g, c, primedAccentOf(defOf(c))),
    onStart: (c) => {
      // It sets itself: a small crouch, and the light gathers in.
      tweenPose(c.scene, c.id, { sx: 1.06, sy: 0.94 }, 220, 'Quad.easeOut');
      burstFx(c.scene, 'ptx-spark', c.x + c.w * 0.18, c.y - c.h * 0.28, 6, 360, {
        tint: [primedAccentOf(defOf(c)), 0xffffff], speed: { min: 20, max: 60 }, angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 }, alpha: { start: 0.9, end: 0 },
      });
    },
    // The empowered hit draws its own payoff; the crouch just lets go.
    onEnd: (c) => releasePose(c.scene, c.id, 200),
  },

  // ── Mobs: casted hastes (Howl, Chest Beat, Barrage, Screech) ───────────────
  {
    // Dire Wolf's Howl, on every wolf it reached: red ferocity, eyes lit.
    id: 'mob-howl',
    on: 'monster',
    active: (v) => hasteId(v) === 'monster-howl-haste',
    pulseMs: 500,
    ground: { color: 0xff3b2f, scale: 1.05, alpha: 0.12 },
    body: { color: 0xff3b2f, alpha: [0.04, 0.16] },
    tremblePx: 0.4,
    overhead: (g, c) => {
      const y = c.y - c.h * 0.22;
      g.fillStyle(0xff4a3a, (0.6 + 0.4 * c.pulse) * c.s);
      g.fillCircle(c.x - 5, y, 2.2);
      g.fillCircle(c.x + 5, y, 2.2);
    },
  },
  {
    // Ape Chest Beat: gold fury, sparks rising off the shoulders.
    id: 'mob-chestbeat',
    on: 'monster',
    active: (v) => hasteId(v) === 'monster-ape-chestbeat',
    pulseMs: 420,
    ground: { color: 0xffa62e, scale: 1.1, alpha: 0.13 },
    body: { color: 0xffb040, alpha: [0.05, 0.2] },
    beat: {
      everyMs: 200,
      draw: (c) =>
        burstFx(c.scene, 'ptx-spark', c.x + (Math.random() - 0.5) * c.w * 0.5, c.y - c.h * 0.1, 2, 480, {
          tint: [0xffc04a, 0xfff0a0], speed: { min: 30, max: 90 }, angle: { min: 250, max: 290 },
          scale: { start: 0.5, end: 0 }, alpha: { start: 0.9, end: 0 }, gravityY: -100,
        }),
    },
  },
  {
    // Barrage (Thorn Spitter, the Chameleons): one quill per empowered shot left.
    id: 'mob-barrage',
    on: 'monster',
    active: (v) => hasteId(v)?.endsWith('-barrage') === true,
    stacks: (v) => (v as MonsterView).hastedBy?.stacks ?? 1,
    pulseMs: 600,
    ground: { color: 0x9ad65a, scale: 0.95, alpha: 0.1 },
    overhead: (g, c) => drawQuills(g, c, c.stacks, 0x9ad65a),
  },
  {
    // Carrion Vulture's Necrotic Screech on the undead it reached.
    id: 'mob-screech',
    on: 'monster',
    active: (v) => hasteId(v) === 'carrion-screech-haste',
    pulseMs: 700,
    ground: { color: 0x6a9a5a, scale: 1.05, alpha: 0.13 },
    body: { color: 0x8fe0a0, alpha: [0.04, 0.16] },
    beat: {
      everyMs: 240,
      draw: (c) =>
        burstFx(c.scene, 'ptx-dot', c.x + (Math.random() - 0.5) * c.w * 0.5, c.y + c.h * 0.2, 2, 800, {
          tint: [0x8fe0a0, 0x6a4a9e], speed: { min: 15, max: 50 }, angle: { min: 255, max: 285 },
          scale: { start: 0.7, end: 0 }, alpha: { start: 0.8, end: 0 }, gravityY: -70,
        }),
    },
  },

  // ── Player marks ────────────────────────────────────────────────────────────
  {
    // Desert Death Sting: the sun sigil the Execution will cash in.
    id: 'sun-mark',
    on: 'player',
    active: (v) => hasPlayerBuff(v, 'debuff-sun-mark'),
    pulseMs: 500,
    ground: { color: 0xffc83a, scale: 1.2, alpha: 0.14 },
    overhead: (g, c) => {
      const x = c.x;
      const y = c.y - c.h * 0.7;
      const r = 11 + c.pulse * 2;
      const spin = c.age / 600;
      g.fillStyle(0xffe07a, 0.9 * c.s);
      g.fillCircle(x, y, r * 0.45);
      g.lineStyle(2, 0xffc83a, 0.95 * c.s);
      g.strokeCircle(x, y, r);
      for (let i = 0; i < 8; i++) {
        const a = spin + (i / 8) * Math.PI * 2;
        g.lineBetween(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2, x + Math.cos(a) * r * 1.7, y + Math.sin(a) * r * 1.7);
      }
    },
  },
  {
    // Wasteland Hex of Ruin: a cracked purple sigil hanging over the hexed.
    id: 'hex-of-ruin',
    on: 'player',
    active: (v) => hasPlayerBuff(v, 'debuff-boss', 'hex-of-ruin'),
    pulseMs: 800,
    ground: { color: 0x7a4ab0, scale: 1.1, alpha: 0.14 },
    overhead: (g, c) => {
      const x = c.x;
      const y = c.y - c.h * 0.7;
      const r = 10 + c.pulse * 1.5;
      const spin = c.age / 900;
      g.lineStyle(2, 0xa76ae0, 0.95 * c.s);
      g.strokeCircle(x, y, r);
      g.beginPath();
      for (let i = 0; i <= 5; i++) {
        const a = spin + ((i * 2) / 5) * Math.PI * 2;
        const px = x + Math.cos(a) * r * 0.85;
        const py = y + Math.sin(a) * r * 0.85;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.strokePath();
    },
  },
  {
    // Tundra Deep Freeze: an ice block around the frozen player.
    id: 'frozen',
    on: 'player',
    active: (v) => hasPlayerBuff(v, 'debuff-frozen'),
    pulseMs: 1400,
    body: { color: 0xcff0ff, alpha: [0.35, 0.5] },
    overhead: (g, c) => {
      const w = c.w * 0.62;
      const h = c.h * 0.78;
      g.fillStyle(0xbfe6ff, 0.22 * c.s);
      g.fillRoundedRect(c.x - w / 2, c.y - h / 2, w, h, 6);
      g.lineStyle(2, 0xe6f7ff, 0.9 * c.s);
      g.strokeRoundedRect(c.x - w / 2, c.y - h / 2, w, h, 6);
      g.lineStyle(1.5, 0xffffff, 0.7 * c.s);
      g.lineBetween(c.x - w * 0.3, c.y - h * 0.35, c.x - w * 0.1, c.y - h * 0.1);
      g.lineBetween(c.x + w * 0.2, c.y + h * 0.05, c.x + w * 0.35, c.y + h * 0.3);
    },
    onEnd: (c) => shards(c, [0xe6f7ff, 0x9fdcff, 0xffffff], true),
  },
  {
    // Brittle: cracks of light across the body, the Shatter is coming.
    id: 'brittle',
    on: 'player',
    active: (v) => hasPlayerBuff(v, 'debuff-boss', 'boss-brittle'),
    pulseMs: 300,
    overhead: (g, c) => {
      g.lineStyle(2, 0xffffff, (0.5 + 0.5 * c.pulse) * c.s);
      const x = c.x;
      const y = c.y;
      g.beginPath();
      g.moveTo(x - 10, y - 18);
      g.lineTo(x - 2, y - 6);
      g.lineTo(x - 8, y + 4);
      g.lineTo(x + 2, y + 16);
      g.moveTo(x - 2, y - 6);
      g.lineTo(x + 9, y - 10);
      g.strokePath();
    },
  },
  {
    // Frostbite: frost creeping over the body, deeper per stack.
    id: 'frostbite',
    on: 'player',
    active: (v) => hasPlayerBuff(v, 'debuff-boss', 'frostbite'),
    pulseMs: 1600,
    body: { color: 0xbfe6ff, alpha: [0.12, 0.22] },
    ground: { color: 0xbfe6ff, scale: 1, alpha: 0.1 },
  },
  {
    // Eroded: the ground crumbling under you.
    id: 'eroded',
    on: 'player',
    active: (v) => hasPlayerBuff(v, 'debuff-boss', 'eroded'),
    pulseMs: 900,
    ground: { color: 0x8a6b46, scale: 1.2, alpha: 0.2 },
    beat: {
      everyMs: 260,
      draw: (c) =>
        burstFx(c.scene, 'ptx-dot', c.x + (Math.random() - 0.5) * c.w * 0.6, c.y + c.h * 0.45, 2, 500, {
          tint: [0x8a6b46, 0x6b5236],
          speed: { min: 5, max: 20 },
          angle: { min: 80, max: 100 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.8, end: 0 },
          gravityY: 120,
        }),
    },
  },
  {
    // Depth: the dark pressing in around you.
    id: 'depth',
    on: 'player',
    active: (v) => hasPlayerBuff(v, 'debuff-boss', 'depth'),
    pulseMs: 2200,
    ground: { color: 0x0b2a4a, scale: 1.5, alpha: 0.28 },
  },
  // ── Lineage payloads (course-correction W2-C) ─────────────────────────────
  {
    // Control's root (the shackle): the feet locked for the root's applied clock.
    id: 'lineage-shackle',
    on: ['monster', 'boss'],
    active: (v) => lastingActive(v.id, 'shackle', v, performance.now()),
    pulseMs: 700,
    tremblePx: 0.6,
    under: (g, c) => drawShackle(g, c, 'back'),
    overhead: (g, c) => drawShackle(g, c, 'front'),
    onEnd: (c) => shackleBreak(c.scene, c.x, c.y, c.w, c.h),
  },
  {
    // Control's pure stun (the knockdown): off its feet, down, and back up.
    id: 'lineage-knockdown',
    on: ['monster', 'boss'],
    active: (v) => lastingActive(v.id, 'knockdown', v, performance.now()),
    pulseMs: 900,
    onStart: (c) => {
      const down = downPose(c);
      posePath(c.scene, c.id, [
        { rot: down.rot * 0.3, sx: 0.94, sy: 1.08, lift: 8, ms: 100, ease: 'Quad.easeOut' },
        { ...down, ms: KNOCKDOWN_FALL_MS - 100, ease: 'Quad.easeIn' },
      ]);
    },
    under: (g, c) => {
      // The body's smear on the ground where it lies.
      g.fillStyle(0x1a140c, 0.28 * c.s);
      g.fillEllipse(c.x, c.y + c.h * 0.42, c.w * 1.1, c.h * 0.22);
    },
    overhead: (_g, c) => {
      // Hold it down: anything else that touched the pose (a wind-up let go) is
      // overruled while the knockdown lasts.
      const pose = bodyPose(c.scene, c.id);
      if (c.age > KNOCKDOWN_FALL_MS && !c.scene.tweens.isTweening(pose)) Object.assign(pose, downPose(c));
      noteLastingPos(c.id, 'knockdown', c.x, c.y);
    },
    beat: {
      everyMs: 420,
      draw: (c) => burstFx(c.scene, 'ptx-dot', c.x + (Math.random() - 0.5) * c.w * 0.6, c.y + c.h * 0.4, 2, 600, {
        tint: [0x9a8a70, 0x7a6e58], speed: { min: 6, max: 22 }, angle: { min: 240, max: 300 },
        scale: { start: 0.7, end: 1.4 }, alpha: { start: 0.5, end: 0 },
      }),
    },
    onEnd: (c) => {
      // The get-up: rolls back upright with a small hop, dust off the ground. The
      // record is gone by now, so the side it fell to is read off the pose.
      const down = downPose(c, Math.sign(bodyPose(c.scene, c.id).rot) || 1);
      posePath(c.scene, c.id, [
        { rot: down.rot * 0.35, sx: 0.95, sy: 1.08, lift: 6, ms: 170, ease: 'Quad.easeOut' },
        { rot: 0, sx: 1, sy: 1, lift: 0, ms: 240, ease: 'Back.easeOut' },
      ]);
      dustCloud(c.scene, c.x, c.y + c.h * 0.42, [0x9a8a70, 0x7a6e58], 0.6);
    },
  },
  {
    // Affliction's heavy dose: heavy drops off the body while the bleed runs.
    id: 'lineage-drip',
    on: ['monster', 'boss'],
    active: (v) => lastingActive(v.id, 'drip', v, performance.now()),
    pulseMs: 1100,
    under: (g, c) => {
      const venom = laneColor('affliction');
      const grow = Math.min(1, c.age / 1500);
      g.fillStyle(venom, 0.24 * c.s);
      g.fillEllipse(c.x, c.y + c.h * 0.42, c.w * (0.4 + 0.45 * grow), c.h * (0.1 + 0.08 * grow));
      g.fillStyle(0x1d3a12, 0.22 * c.s);
      g.fillEllipse(c.x, c.y + c.h * 0.42, c.w * (0.22 + 0.25 * grow), c.h * (0.06 + 0.04 * grow));
    },
    overhead: (_g, c) => noteLastingPos(c.id, 'drip', c.x, c.y),
    beat: {
      everyMs: 230,
      draw: (c) => {
        const heavy = (lastingRecord(c.id, 'drip')?.intensity ?? 1) > 1;
        for (let i = 0; i < (heavy ? 2 : 1); i++) {
          fallingDrop(
            c.scene, c.x + (Math.random() - 0.5) * c.w * 0.5, c.y - c.h * (0.05 + Math.random() * 0.2),
            c.y + c.h * 0.46, laneColor('affliction'), heavy ? 5.2 : 4.4,
          );
        }
      },
    },
  },
  {
    // Kill chain's load: the weapon glowing between the kill that armed it and the
    // hit that spends it (both ends are server beats: lineage-load, card-fx).
    id: 'lineage-loaded',
    on: 'player',
    active: (v) => lastingActive(v.id, 'loaded', v, performance.now()),
    pulseMs: 420,
    ground: { color: laneColor('kill-chain'), scale: 0.85, alpha: 0.1 },
    overhead: (g, c) => {
      const violet = laneColor('kill-chain');
      const sprite = c.scene.state.sprite.get(c.id);
      const side = sprite && 'flipX' in sprite && sprite.flipX ? -1 : 1;
      const x = c.x + side * c.w * 0.22;
      const y = c.y - c.h * 0.04;
      const r = (4.5 + 2 * c.pulse) * c.s;
      g.fillStyle(violet, 0.22 * c.s);
      g.fillCircle(x, y, r * 2.6);
      g.fillStyle(violet, 0.75 * c.s);
      g.fillCircle(x, y, r * 1.4);
      g.fillStyle(0xffffff, 0.9 * c.s);
      g.fillCircle(x, y, r * 0.6);
      for (let i = 0; i < 3; i++) {
        const a = c.age / 180 + (i / 3) * Math.PI * 2;
        g.fillStyle(0xe8d4ff, 0.9 * c.s);
        g.fillCircle(x + Math.cos(a) * r * 2.4, y + Math.sin(a) * r * 1.2, 1.6);
      }
    },
    onStart: (c) => drawLoadGather(c.scene, c.id),
  },
];
