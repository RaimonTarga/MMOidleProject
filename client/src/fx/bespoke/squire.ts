/**
 * SQUIRE (cooldown) specializations — the execution class, so each path shows
 * what it is charging between executions and then spends it. Every payoff keeps
 * the Squire's own execution slam underneath, so an execution still reads as one.
 * Devout Priest keeps its holy channel (combatFx) and its signature halo.
 */
import type { PlayerView } from '@mmo-idle/shared';
import { DEPTH } from '../../render/depth';
import { burstFx } from '../particles';
import { drawCracks, ring } from '../bossKit';
import { afterimages } from '../bodyPose';
import { fxSquireSlam } from '../squireSlam';
import {
  angleOf, bolt, buffStacks, crescent, fadeOut, feel, hasBuff,
  type BespokeHit, type P, type PathTable,
} from './kit';

const slam = (h: BespokeHit): void => fxSquireSlam(h.scene, h.to.x, h.to.y, true);

/** Light wings unfolding behind a body, `open` 0..1 (Transcendant). */
function wings(h: BespokeHit, at: P, open: number, alpha: number, ms: number): void {
  const g = h.scene.add.graphics({ x: at.x, y: at.y - 6 }).setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
  const span = (18 + 26 * open) * h.k;
  for (const side of [-1, 1]) {
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI / 2 + side * (0.35 + f * 0.24 * (0.5 + open));
      const len = span * (1 - f * 0.12);
      g.lineStyle(3 - f * 0.4, f % 2 ? 0xfff4c0 : 0xe0f0ff, alpha * (1 - f * 0.12));
      // `a` already fans left or right from straight up by `side`.
      g.lineBetween(side * 4, 0, side * 4 + Math.cos(a) * len, Math.sin(a) * len);
    }
  }
  fadeOut(h.scene, g, ms, 60);
}

const batteryCells = (p: PlayerView): number => Math.min(8, buffStacks(p, 'cooldown-battery'));

export const SQUIRE_PATHS: PathTable = {
  // Reverb — hits leave echo rings that linger; the execution rings them all back.
  'cooldown-balanced-t3-a': {
    hit: (h) => {
      const pct = buffStacks(h.player, 'cooldown-reverb');
      const echoes = Math.min(4, 1 + Math.floor(pct / 25));
      for (let i = 0; i < echoes; i++) {
        ring(h.scene, h.to.x, h.to.y, i % 2 ? 0xe0d8ff : 0xb8a8ff, {
          from: 10 + i * 6, scale: 1.6, width: 1.5, ms: 520, alpha: 0.55, delay: i * 90,
        });
      }
    },
    payoff: (h) => {
      slam(h);
      const pct = buffStacks(h.player, 'cooldown-reverb');
      const echoes = Math.min(6, 2 + Math.floor(pct / 20));
      for (let i = 0; i < echoes; i++) {
        // Inward first (the stored hits come back), then out as one peal.
        const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX);
        g.lineStyle(2, i % 2 ? 0xffffff : 0xb8a8ff, 0.9);
        g.strokeCircle(0, 0, 70 + i * 8);
        h.scene.tweens.add({
          targets: g, scaleX: 0.15, scaleY: 0.15, duration: 220, delay: i * 40, ease: 'Quad.easeIn',
          onComplete: () => g.destroy(),
        });
      }
      h.scene.time.delayedCall(220 + echoes * 40, () => {
        ring(h.scene, h.to.x, h.to.y, 0xb8a8ff, { from: 12, scale: 5, width: 4, ms: 420 });
        feel(h, echoes >= 6);
      });
    },
  },

  // Dynamo — a battery at your side charges each second; the execution
  // discharges it as a lightning hammer, one bolt per cell.
  'cooldown-balanced-t3-b': {
    hit: (h) => {
      const cells = batteryCells(h.player);
      if (cells <= 0) return;
      const g = h.scene.add.graphics({ x: h.from.x - 22, y: h.from.y - 10 }).setDepth(DEPTH.FX + 1);
      g.lineStyle(1.5, 0xfff4c0, 0.9);
      g.strokeRect(-4, -18, 8, 20);
      for (let i = 0; i < 8; i++) {
        g.fillStyle(i < cells ? 0xffe066 : 0x3a3420, i < cells ? 1 : 0.6);
        g.fillRect(-3, 0 - (i + 1) * 2.4, 6, 1.8);
      }
      fadeOut(h.scene, g, 300, 260);
    },
    payoff: (h) => {
      slam(h);
      const cells = Math.max(2, batteryCells(h.player));
      const g = h.scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
      for (let i = 0; i < cells; i++) {
        const x = h.to.x + (Math.random() - 0.5) * 50;
        bolt(g, { x, y: h.to.y - 140 }, { x: h.to.x + (Math.random() - 0.5) * 14, y: h.to.y }, i % 2 ? 0xffffff : 0xffe066, 2.2, 14, 7);
      }
      fadeOut(h.scene, g, 220);
      burstFx(h.scene, 'ptx-spark', h.to.x, h.to.y, 8 + cells * 2, 360, {
        tint: [0xffe066, 0xffffff], speed: { min: 100, max: 280 }, angle: { min: 0, max: 360 },
        scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 },
      });
      feel(h, cells >= 7);
    },
  },

  // Stalwart — a guard glow on you brightens as the cooldown runs unbroken;
  // the execution is a shield-bash sized by how patient you were.
  'cooldown-balanced-t3-c': {
    hit: (h) => {
      const pct = Math.max(0, Math.min(100, h.player.executionCooldownPct ?? 0)) / 100;
      if (pct < 0.15) return;
      const g = h.scene.add.graphics({ x: h.from.x, y: h.from.y }).setDepth(DEPTH.FX);
      g.lineStyle(1.5 + pct * 2, 0x9fd0ff, 0.25 + 0.6 * pct);
      g.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const x = Math.cos(a) * 20 * h.k;
        const y = Math.sin(a) * 24 * h.k;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
      fadeOut(h.scene, g, 320, 60);
    },
    payoff: (h) => {
      slam(h);
      const a = angleOf(h);
      const shield = h.scene.add.graphics({ x: h.from.x, y: h.from.y }).setDepth(DEPTH.FX).setRotation(a);
      shield.fillStyle(0x9fd0ff, 0.35);
      shield.fillEllipse(0, 0, 14, 40 * h.k);
      shield.lineStyle(3, 0xe8f6ff, 1);
      shield.strokeEllipse(0, 0, 14, 40 * h.k);
      h.scene.tweens.add({
        targets: shield, x: h.to.x - Math.cos(a) * 10, y: h.to.y - Math.sin(a) * 10, duration: 120, ease: 'Quad.easeIn',
        onComplete: () => {
          fadeOut(h.scene, shield, 200, 40, 1.4);
          ring(h.scene, h.to.x, h.to.y, 0x9fd0ff, { from: 14, scale: 3.8, width: 3, ms: 380 });
          feel(h);
        },
      });
    },
  },

  // Avenger — damage you take gathers as red wisps around you; the execution
  // sends them all into the target.
  'cooldown-heavy-t3-a': {
    hit: (h) => {
      const stored = buffStacks(h.player, 'cooldown-vengeance');
      if (stored <= 0) return;
      const count = Math.min(6, 1 + Math.floor(Math.log10(stored + 1) * 2));
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const m = h.scene.add.graphics({ x: h.from.x + Math.cos(a) * 26, y: h.from.y + Math.sin(a) * 18 }).setDepth(DEPTH.FX);
        m.fillStyle(i % 2 ? 0xff7a4a : 0xc41e1e, 0.9);
        m.fillCircle(0, 0, 3);
        h.scene.tweens.add({
          targets: m, x: h.from.x + Math.cos(a + 1.2) * 18, y: h.from.y - 16 + Math.sin(a + 1.2) * 10,
          alpha: 0, duration: 520, ease: 'Sine.easeInOut', onComplete: () => m.destroy(),
        });
      }
    },
    payoff: (h) => {
      const count = 10;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const m = h.scene.add.graphics({ x: h.from.x + Math.cos(a) * 30, y: h.from.y + Math.sin(a) * 20 }).setDepth(DEPTH.FX);
        m.fillStyle(i % 2 ? 0xff7a4a : 0xff2a1a, 1);
        m.fillCircle(0, 0, 3.5);
        h.scene.tweens.add({
          targets: m, x: h.to.x, y: h.to.y, duration: 200 + i * 12, ease: 'Quad.easeIn', onComplete: () => m.destroy(),
        });
      }
      h.scene.time.delayedCall(220, () => {
        slam(h);
        crescent(h.scene, h.to, angleOf(h), 46 * h.k, 8 * h.k, 0xffe0d0, 0xff2a1a, 220);
        ring(h.scene, h.to.x, h.to.y, 0xff3b2f, { from: 14, scale: 4, width: 4, ms: 400 });
        feel(h, true);
      });
    },
  },

  // Destroyer — ordinary hits are dead taps (fxHollowStrike, combatFx); the
  // execution is everything the taps held back.
  'cooldown-heavy-t3-b': {
    payoff: (h) => {
      slam(h);
      const cracks = h.scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
      drawCracks(cracks, h.to.x, h.to.y + 14, 80 * h.k, 1, 0x1a1410, 0.85, 3 + Math.floor(Math.random() * 999), 9);
      fadeOut(h.scene, cracks, 700, 500);
      for (let i = 0; i < 3; i++) {
        ring(h.scene, h.to.x, h.to.y + 12, i === 1 ? 0xffb066 : 0x8a6a5a, {
          from: 18, scale: 3.4 + i, width: 4 - i, ms: 460, flat: true, delay: i * 70,
        });
      }
      burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y + 8, 28, 700, {
        tint: [0x8a6a5a, 0x4a3a30, 0xffb066], speed: { min: 120, max: 320 }, angle: { min: 200, max: 340 },
        scale: { start: 1.1, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 520,
      });
      feel(h, true);
    },
  },

  // Assassin — the execution is a shadow-step and a flurry; during the burst
  // after it, hits leave dark after-slashes.
  'cooldown-light-t3-a': {
    hit: (h) => {
      if (!hasBuff(h.player, 'cooldown-overdrive')) return;
      for (let i = 0; i < 2; i++) {
        const a = angleOf(h) + Math.PI / 2 + (i ? -0.7 : 0.7);
        const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setRotation(a);
        g.lineStyle(3, 0x4a2a6e, 0.9);
        g.lineBetween(-18 * h.k, 0, 18 * h.k, 0);
        g.lineStyle(1.2, 0xd0b0ff, 1);
        g.lineBetween(-16 * h.k, 0, 16 * h.k, 0);
        fadeOut(h.scene, g, 200, 40 + i * 50);
      }
    },
    payoff: (h) => {
      afterimages(h.scene, h.playerId, { count: 3, everyMs: 40, tint: 0x4a2a6e, alpha: 0.5, fadeMs: 300 });
      const streak = h.scene.add.graphics().setDepth(DEPTH.FX);
      streak.lineStyle(6, 0x2a1440, 0.6);
      streak.lineBetween(h.from.x, h.from.y, h.to.x, h.to.y);
      fadeOut(h.scene, streak, 220);
      for (let i = 0; i < 4; i++) {
        h.scene.time.delayedCall(60 + i * 55, () => {
          const a = Math.random() * Math.PI;
          const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setRotation(a);
          g.lineStyle(4, 0x4a2a6e, 0.9);
          g.lineBetween(-24 * h.k, 0, 24 * h.k, 0);
          g.lineStyle(1.5, 0xffffff, 1);
          g.lineBetween(-22 * h.k, 0, 22 * h.k, 0);
          fadeOut(h.scene, g, 180, 20);
        });
      }
      burstFx(h.scene, 'ptx-mist', h.to.x, h.to.y, 3, 600, {
        tint: [0x2a1440], speed: { min: 10, max: 40 }, scale: { start: 0.6, end: 1.3 }, alpha: { start: 0.5, end: 0 },
      });
      h.scene.time.delayedCall(280, () => { slam(h); feel(h); });
    },
  },

  // Transcendant — light wings unfold behind you as stacks bank; the execution
  // is a winged dive onto the target.
  'cooldown-light-t3-b': {
    hit: (h) => {
      const stacks = buffStacks(h.player, 'cooldown-eternal-charge');
      if (stacks <= 0) return;
      wings(h, h.from, Math.min(1, stacks / 20), 0.35 + Math.min(0.5, stacks / 40), 320);
    },
    payoff: (h) => {
      wings(h, h.from, 1, 0.95, 260);
      afterimages(h.scene, h.playerId, { count: 3, everyMs: 45, tint: 0xfff4c0, alpha: 0.45, fadeMs: 280 });
      h.scene.time.delayedCall(140, () => {
        slam(h);
        wings(h, h.to, 1.2, 0.9, 380);
        const pillar = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
        pillar.fillStyle(0xfff4c0, 0.45);
        pillar.fillRect(-10, -120, 20, 126);
        fadeOut(h.scene, pillar, 380, 40);
        burstFx(h.scene, 'ptx-spark', h.to.x, h.to.y, 16, 520, {
          tint: [0xfff4c0, 0xe0f0ff], speed: { min: 60, max: 200 }, angle: { min: 200, max: 340 },
          scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: -80,
        });
        feel(h);
      });
    },
  },

  // Sunderer — during the rupture window hits crack the target's plating; the
  // execution blows the armour off.
  'cooldown-light-t3-c': {
    hit: (h) => {
      if (!hasBuff(h.player, 'cooldown-rupture')) return;
      const g = h.scene.add.graphics().setDepth(DEPTH.FX);
      drawCracks(g, h.to.x, h.to.y, 20 * h.k, 1, 0xd8e0e8, 0.9, 5 + Math.floor(Math.random() * 999), 5);
      fadeOut(h.scene, g, 260, 80);
    },
    payoff: (h) => {
      slam(h);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
        const s = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setRotation(a);
        s.fillStyle(i % 2 ? 0x9aa4ae : 0xd8e0e8, 1);
        s.fillRect(-6, -4, 12, 8);
        s.lineStyle(1, 0x5a646e, 1);
        s.strokeRect(-6, -4, 12, 8);
        h.scene.tweens.add({
          targets: s, x: h.to.x + Math.cos(a) * 54, y: h.to.y + Math.sin(a) * 36 + 16, rotation: a + 5, alpha: 0,
          duration: 520, ease: 'Quad.easeOut', onComplete: () => s.destroy(),
        });
      }
      ring(h.scene, h.to.x, h.to.y, 0xffffff, { from: 10, scale: 3.4, width: 3, ms: 320 });
      feel(h);
    },
  },
};
