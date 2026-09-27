/**
 * SPIRIT (energy) specializations — the discharge class, so these read the
 * energy bar and the state a discharge leaves behind (aura, buffs, the target's
 * storm brand). Each discharge payoff keeps the Spirit's own discharge bolt
 * underneath. Equinox and Stormdancer replace their attack in combatFx;
 * Voidwalker's discharge keeps fxVoidDischarge there.
 */
import type { PlayerView } from '@mmo-idle/shared';
import { DEPTH } from '../../render/depth';
import { burstFx } from '../particles';
import { drawSigil, ring } from '../bossKit';
import { fxLightning } from '../lightning';
import {
  bolt, buffStacks, fadeOut, feel, targetView,
  type BespokeHit, type P, type PathTable,
} from './kit';

const energyFrac = (p: PlayerView): number =>
  Math.max(0, Math.min(1, (p.energyCount ?? 0) / Math.max(1, p.energyMax ?? 100)));
const head = (at: P): P => ({ x: at.x, y: at.y - 44 });
const discharge = (h: BespokeHit): void => fxLightning(h.scene, h.from.x, h.from.y, h.to.x, h.to.y, true);

/** A sine-wave stream between two points (Channeler's flow). */
function stream(g: Phaser.GameObjects.Graphics, a: P, b: P, width: number, color: number, phase: number): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  g.lineStyle(width, color, 0.85);
  g.beginPath();
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const w = Math.sin(t * Math.PI * 3 + phase) * 6 * Math.sin(t * Math.PI);
    const x = a.x + dx * t + nx * w;
    const y = a.y + dy * t + ny * w;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.strokePath();
}

/** A storm cloud of grey puffs over a point. */
function cloud(h: BespokeHit, at: P, size: number): void {
  for (let i = 0; i < 5; i++) {
    const c = h.scene.add.graphics({ x: at.x + (i - 2) * 9 * size, y: at.y + (i % 2) * 4 }).setDepth(DEPTH.FX + 1);
    c.fillStyle(i % 2 ? 0x5a6478 : 0x7a8498, 0.9);
    c.fillCircle(0, 0, (9 + (i === 2 ? 4 : 0)) * size);
    c.setAlpha(0);
    h.scene.tweens.add({
      targets: c, alpha: 1, duration: 90, onComplete: () => fadeOut(h.scene, c, 360, 260),
    });
  }
}

export const SPIRIT_PATHS: PathTable = {
  // Surge — the discharge ignites Overdrive; while it burns, every hit trails
  // an afterburner that thins as the energy drains.
  'energy-light-t3-b': {
    hit: (h) => {
      if (h.player.aura !== 'surge') return;
      const e = energyFrac(h.player);
      const g = h.scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
      g.lineStyle(4 + 6 * e, 0xffe066, 0.25 + 0.3 * e);
      g.lineBetween(h.from.x, h.from.y, h.to.x, h.to.y);
      fadeOut(h.scene, g, 200);
      burstFx(h.scene, 'ptx-spark', h.from.x, h.from.y + 10, 2 + Math.round(4 * e), 360, {
        tint: [0xffe066, 0xff8a3a], speed: { min: 30, max: 90 }, angle: { min: 60, max: 120 },
        scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 160,
      });
    },
    payoff: (h) => {
      discharge(h);
      ring(h.scene, h.from.x, h.from.y, 0xffe066, { from: 12, scale: 3.4, width: 3, ms: 320 });
      burstFx(h.scene, 'ptx-spark', h.from.x, h.from.y, 18, 460, {
        tint: [0xffe066, 0xffffff, 0xff8a3a], speed: { min: 80, max: 240 }, angle: { min: 0, max: 360 },
        scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 },
      });
      feel(h);
    },
  },

  // Channeler — Flow as a stream from you to the target, thickening with each
  // channel stage.
  'energy-light-t3-c': {
    hit: (h) => {
      const m = /^channel-(\d)$/.exec(h.player.aura ?? '');
      if (!m) return;
      const stage = Number(m[1]);
      const g = h.scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
      const phase = Math.random() * Math.PI * 2;
      stream(g, h.from, h.to, 2 + stage * 1.5, 0x9fe0ff, phase);
      stream(g, h.from, h.to, 1, 0xffffff, phase + 0.3);
      fadeOut(h.scene, g, 240);
      for (let i = 0; i < stage + 1; i++) {
        const m2 = h.scene.add.graphics({ x: h.from.x, y: h.from.y }).setDepth(DEPTH.FX);
        m2.fillStyle(0xe8f8ff, 1);
        m2.fillCircle(0, 0, 2.2);
        h.scene.tweens.add({
          targets: m2, x: h.to.x, y: h.to.y, duration: 220, delay: i * 50, onComplete: () => m2.destroy(),
        });
      }
    },
  },

  // Stormbringer — a storm cloud gathers over the target; each of the four
  // empowered strikes is a bolt out of it.
  'energy-balanced-t3-b': {
    payoff: (h) => {
      const charges = buffStacks(h.player, 'energy-storm');
      const top = { x: h.to.x, y: h.to.y - 90 };
      cloud(h, top, 1 + 0.12 * charges);
      const g = h.scene.add.graphics().setDepth(DEPTH.FX + 1).setBlendMode(Phaser.BlendModes.ADD);
      bolt(g, top, h.to, 0xa0c8ff, 3, 12, 7);
      bolt(g, top, h.to, 0xffffff, 1.5, 8, 7);
      fadeOut(h.scene, g, 220, 40);
      ring(h.scene, h.to.x, h.to.y, 0xa0c8ff, { from: 10, scale: 3, width: 3, ms: 300 });
      burstFx(h.scene, 'ptx-spark', h.to.x, h.to.y, 12, 320, {
        tint: [0xa0c8ff, 0xffffff], speed: { min: 90, max: 240 }, angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 },
      });
      feel(h);
    },
  },

  // Aetherist — a sun over you whose size and fire follow the oscillating power
  // (0.5x empty, 2x full); the discharge is a solar flare at the peak.
  'energy-balanced-t3-c': {
    hit: (h) => {
      const e = energyFrac(h.player);
      const power = e < 0.5 ? 0.5 + e : 1 + (e - 0.5) * 2;
      const at = head(h.from);
      const g = h.scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX + 1).setBlendMode(Phaser.BlendModes.ADD);
      const color = power >= 1.5 ? 0xfff0a0 : power >= 1 ? 0xffc040 : 0xff6a3a;
      g.fillStyle(color, 0.35);
      g.fillCircle(0, 0, 8 * power * h.k);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(0, 0, 3 * power * h.k);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.lineStyle(1.5, color, 0.8);
        g.lineBetween(Math.cos(a) * 9 * power, Math.sin(a) * 9 * power, Math.cos(a) * 14 * power, Math.sin(a) * 14 * power);
      }
      fadeOut(h.scene, g, 260, 200);
    },
    payoff: (h) => {
      discharge(h);
      const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
      g.fillStyle(0xfff0a0, 0.6);
      g.fillCircle(0, 0, 24 * h.k);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.lineStyle(2.5, 0xffc040, 0.9);
        g.lineBetween(Math.cos(a) * 26, Math.sin(a) * 26, Math.cos(a) * 52 * h.k, Math.sin(a) * 52 * h.k);
      }
      fadeOut(h.scene, g, 360, 60, 1.4);
      feel(h, true);
    },
  },

  // Voidwalker — a void orb over you filling with the doubled energy pool; the
  // early discharge keeps fxVoidDischarge.
  'energy-heavy-t3-a': {
    hit: (h) => {
      const e = energyFrac(h.player);
      const at = head(h.from);
      const g = h.scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX + 1);
      g.fillStyle(0x10061c, 0.85);
      g.fillCircle(0, 0, 10 * h.k);
      g.fillStyle(0x8a5ad0, 0.9);
      g.fillCircle(0, 0, 9 * e * h.k);
      g.lineStyle(1.5, 0xd0b0ff, 0.9);
      g.strokeCircle(0, 0, 10 * h.k);
      fadeOut(h.scene, g, 280, 240);
    },
  },

  // Invoker — critical-mass sigils (1-3) spin around you; the discharge splits
  // into one extra bolt per stack.
  'energy-heavy-t3-b': {
    hit: (h) => {
      const stacks = Math.min(3, buffStacks(h.player, 'energy-critical-mass'));
      if (stacks <= 0) return;
      const g = h.scene.add.graphics({ x: h.from.x, y: h.from.y }).setDepth(DEPTH.FX);
      for (let i = 0; i < stacks; i++) {
        const a = (i / stacks) * Math.PI * 2 + Math.random();
        drawSigil(g, Math.cos(a) * 26, Math.sin(a) * 16 - 6, 6, 1, 0xff9ad0, 0.9, a, 5);
      }
      h.scene.tweens.add({ targets: g, rotation: 1.2, alpha: 0, duration: 420, onComplete: () => g.destroy() });
    },
    payoff: (h) => {
      discharge(h);
      const stacks = Math.min(3, buffStacks(h.player, 'energy-critical-mass'));
      const g = h.scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
      for (let i = 0; i < stacks; i++) {
        bolt(g, h.from, { x: h.to.x + (i - 1) * 10, y: h.to.y + (i % 2 ? 6 : -6) }, i % 2 ? 0xffffff : 0xff9ad0, 2, 18, 7);
      }
      fadeOut(h.scene, g, 240, 40);
      ring(h.scene, h.to.x, h.to.y, 0xff9ad0, { from: 12, scale: 3 + stacks * 0.5, width: 3, ms: 360 });
      feel(h, stacks >= 3);
    },
  },

  // Tempest — the discharge brands a storm on the target; every hit shows the
  // brand's clock ring, which each hit extends.
  'energy-heavy-t3-c': {
    hit: (h) => {
      const storm = targetView(h)?.targetStatus?.find((s) => s.id === 'energy-storm');
      if (!storm) return;
      const frac = Math.max(0.05, Math.min(1, storm.remainingMs / 7500));
      const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX);
      g.lineStyle(3, 0x2a2450, 0.7);
      g.strokeCircle(0, 0, 22 * h.k);
      g.lineStyle(3, 0x7fb0ff, 1);
      g.beginPath();
      g.arc(0, 0, 22 * h.k, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      g.strokePath();
      const b = h.scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
      bolt(b, { x: h.to.x + 20, y: h.to.y - 18 }, { x: h.to.x - 6, y: h.to.y + 8 }, 0xc8e0ff, 1.5, 5, 4);
      fadeOut(h.scene, b, 140);
      fadeOut(h.scene, g, 260, 220);
    },
    payoff: (h) => {
      discharge(h);
      cloud(h, { x: h.to.x, y: h.to.y - 70 }, 1);
      const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX);
      for (let i = 0; i < 3; i++) {
        g.lineStyle(2.5 - i * 0.6, i ? 0xc8e0ff : 0x7fb0ff, 0.9);
        g.beginPath();
        g.arc(0, 0, (16 + i * 9) * h.k, i * 2, i * 2 + 4.2);
        g.strokePath();
      }
      h.scene.tweens.add({ targets: g, rotation: 3, alpha: 0, duration: 520, onComplete: () => g.destroy() });
      feel(h);
    },
  },
};
