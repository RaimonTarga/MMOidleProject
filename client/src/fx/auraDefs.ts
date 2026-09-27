/**
 * Every persistent state look, one row each (engine: bossAuras.ts). Grouped by
 * lineage; player marks at the end.
 */
import { MONSTER_DATABASE, type MonsterView } from '@mmo-idle/shared';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { impact } from './impactFeel';
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

  // ── Adds: rallied / roar-hasted (Plains) ────────────────────────────────────
  {
    id: 'rallied',
    on: 'monster',
    active: (v) => hasTargetStatus(v, 'boss-rallied') || hasTargetStatus(v, 'boss-roar-haste'),
    stacks: (v) => Math.max(targetStatusStacks(v, 'boss-rallied'), 1),
    pulseMs: 700,
    ground: { color: 0xffb02e, scale: 1.1, alpha: 0.14 },
    body: { color: 0xffc04a, alpha: [0.06, 0.2] },
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
];
