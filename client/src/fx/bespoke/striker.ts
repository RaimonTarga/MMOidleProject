/**
 * STRIKER (cadence) specializations — the combo class, so most of these read the
 * build-up toward the finisher (`cadenceCount` / `cadenceThreshold`) or a buff the
 * finisher leaves behind. Swiftblade replaces its attack in combatFx and is absent.
 */
import type { PlayerView } from '@mmo-idle/shared';
import { DEPTH } from '../../render/depth';
import { burstFx } from '../particles';
import { drawCracks, ring } from '../bossKit';
import {
  angleOf, bolt, buffStacks, chainRing, crescent, fadeOut, feel, targetHas, targetView,
  type BespokeHit, type PathTable,
} from './kit';

// ── Maestro: a note per build-up hit, resolved into a chord ─────────────────

const NOTE_HUES = [0xffd27a, 0xffb86a, 0xff9ad0, 0xb8a8ff, 0x8ad0ff, 0x9cffc0];

function note(h: BespokeHit, x: number, y: number, color: number, scale = 1): Phaser.GameObjects.Graphics {
  const g = h.scene.add.graphics({ x, y }).setDepth(DEPTH.FX + 1);
  g.fillStyle(color, 1);
  g.fillEllipse(0, 0, 9 * scale, 7 * scale);
  g.lineStyle(2 * scale, color, 1);
  g.lineBetween(4 * scale, 0, 4 * scale, -16 * scale);
  g.lineBetween(4 * scale, -16 * scale, 10 * scale, -11 * scale);
  return g;
}

const buildup = (p: PlayerView): { n: number; of: number } =>
  ({ n: p.cadenceCount ?? 0, of: Math.max(2, p.cadenceThreshold ?? 4) });

// ── Berserker / Juggernaut / Justicar helpers ─────────────────────────────────

const rampageStage = (p: PlayerView): number => {
  const m = /^rampage-(\d)$/.exec(p.aura ?? '');
  return m ? Number(m[1]) : 0;
};
const crescendoTier = (p: PlayerView): number => {
  const pct = buffStacks(p, 'cadence-crescendo');
  return pct >= 100 ? 3 : pct >= 50 ? 2 : pct >= 20 ? 1 : 0;
};
function verdictRatio(h: BespokeHit): number {
  const stored = buffStacks(h.player, 'cadence-verdict');
  const hp = targetView(h)?.hp ?? 0;
  return stored <= 0 || hp <= 0 ? 0 : Math.min(1, stored / hp);
}

export const STRIKER_PATHS: PathTable = {
  // Maestro — each build-up hit sounds a note, higher each time; the finisher
  // resolves them all into one chord.
  'cadence-balanced-t3-a': {
    hit: (h) => {
      const { n } = buildup(h.player);
      const g = note(h, h.to.x + 10, h.to.y - 24, NOTE_HUES[n % NOTE_HUES.length], h.k);
      h.scene.tweens.add({
        targets: g, y: g.y - 18 - n * 4, alpha: 0, duration: 520, ease: 'Sine.easeOut',
        onComplete: () => g.destroy(),
      });
    },
    payoff: (h) => {
      const count = Math.max(3, buildup(h.player).of - 1);
      for (let i = 0; i < count; i++) {
        const a = Math.PI + (i / (count - 1)) * Math.PI;
        const g = note(h, h.to.x + Math.cos(a) * 48, h.to.y - 20 + Math.sin(a) * 30, NOTE_HUES[i % NOTE_HUES.length], 1.1 * h.k);
        h.scene.tweens.add({
          targets: g, x: h.to.x, y: h.to.y - 6, alpha: 0.2, duration: 200, ease: 'Quad.easeIn',
          onComplete: () => g.destroy(),
        });
      }
      h.scene.time.delayedCall(180, () => {
        crescent(h.scene, h.to, angleOf(h), 52 * h.k, 8 * h.k, 0xffffff, 0xffd27a, 240);
        for (let i = 0; i < 3; i++) {
          ring(h.scene, h.to.x, h.to.y, NOTE_HUES[i * 2], { from: 12, scale: 3 + i * 0.6, width: 2, ms: 360, delay: i * 60 });
        }
        feel(h);
      });
    },
  },

  // Wavecrest — the wave swells behind the target as the build-up climbs, then
  // crashes through; the three echo hits after it throw spray.
  'cadence-balanced-t3-b': {
    hit: (h) => {
      const echo = buffStacks(h.player, 'cadence-echo') > 0;
      if (echo) {
        burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y, 10, 480, {
          tint: [0x3aa8c8, 0xbff4ff, 0xffffff], speed: { min: 60, max: 180 }, angle: { min: 200, max: 340 },
          scale: { start: 0.7, end: 0.1 }, alpha: { start: 1, end: 0 }, gravityY: 400,
        });
        return;
      }
      const { n, of } = buildup(h.player);
      const swell = Math.min(1, (n + 1) / of);
      const a = angleOf(h);
      const g = h.scene.add.graphics({ x: h.to.x + Math.cos(a) * 20, y: h.to.y + Math.sin(a) * 20 })
        .setDepth(DEPTH.FX).setRotation(a);
      g.lineStyle(4 + swell * 6, 0x3aa8c8, 0.55);
      g.beginPath();
      g.arc(0, 0, (14 + swell * 22) * h.k, -1.3, 1.3);
      g.strokePath();
      g.lineStyle(2, 0xbff4ff, 0.95);
      g.beginPath();
      g.arc(2, 0, (14 + swell * 22) * h.k, -1.1, 0.4);
      g.strokePath();
      fadeOut(h.scene, g, 300, 80);
    },
    payoff: (h) => {
      const a = angleOf(h);
      const g = h.scene.add.graphics({ x: h.to.x - Math.cos(a) * 40, y: h.to.y - Math.sin(a) * 40 })
        .setDepth(DEPTH.FX).setRotation(a);
      g.lineStyle(14 * h.k, 0x2a88b0, 0.6);
      g.beginPath();
      g.arc(0, 0, 40 * h.k, -1.3, 1.3);
      g.strokePath();
      g.lineStyle(4, 0xe8fbff, 1);
      g.beginPath();
      g.arc(4, 0, 40 * h.k, -1.2, 1.2);
      g.strokePath();
      h.scene.tweens.add({
        targets: g, x: h.to.x + Math.cos(a) * 30, y: h.to.y + Math.sin(a) * 30, alpha: 0,
        duration: 320, ease: 'Quad.easeOut', onComplete: () => g.destroy(),
      });
      burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y, 22, 600, {
        tint: [0x3aa8c8, 0xbff4ff, 0xffffff], speed: { min: 90, max: 260 }, angle: { min: 180, max: 360 },
        scale: { start: 0.9, end: 0.1 }, alpha: { start: 1, end: 0 }, gravityY: 420,
      });
      ring(h.scene, h.to.x, h.to.y + 10, 0xbff4ff, { from: 16, scale: 3.4, width: 3, ms: 380, flat: true });
      feel(h);
    },
  },

  // Shockblade — the finisher charges the blade; the next three hits discharge
  // it as twin forks.
  'cadence-light-t3-a': {
    hit: (h) => {
      if (buffStacks(h.player, 'cadence-aftershock') <= 0) return;
      const g = h.scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
      bolt(g, h.from, h.to, 0x7fd4ff, 2.5, 12);
      bolt(g, h.from, h.to, 0xffffff, 1.5, 16);
      fadeOut(h.scene, g, 170);
      burstFx(h.scene, 'ptx-spark', h.to.x, h.to.y, 8, 260, {
        tint: [0x7fd4ff, 0xffffff], speed: { min: 80, max: 200 }, angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 },
      });
    },
    payoff: (h) => {
      crescent(h.scene, h.to, angleOf(h), 48 * h.k, 7 * h.k, 0xffffff, 0x3aa0ff, 240);
      // The blade takes the charge: arcs crawl over the Striker.
      const g = h.scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        bolt(g, h.from, { x: h.from.x + Math.cos(a) * 26, y: h.from.y + Math.sin(a) * 26 }, 0x7fd4ff, 1.8, 6, 3);
      }
      fadeOut(h.scene, g, 300, 60);
      ring(h.scene, h.from.x, h.from.y, 0x7fd4ff, { from: 10, scale: 2.4, width: 2, ms: 300 });
      feel(h);
    },
  },

  // Scrapper — rusted chains: the finisher snaps them tight round the target and
  // strips plating; while the curse holds, hits rattle the chain.
  'cadence-light-t3-b': {
    hit: (h) => {
      if (!targetHas(h, 'vulnerability')) return;
      const g = h.scene.add.graphics().setDepth(DEPTH.FX);
      chainRing(g, h.to.x, h.to.y + 2, 22 * h.k, 10 * h.k, 0x5a3a24, 0xb87a4a, Math.random());
      fadeOut(h.scene, g, 260, 60);
      burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y, 4, 420, {
        tint: [0x8a5a34, 0xb87a4a], speed: { min: 30, max: 90 }, angle: { min: 200, max: 340 },
        scale: { start: 0.5, end: 0.1 }, alpha: { start: 1, end: 0 }, gravityY: 400,
      });
    },
    payoff: (h) => {
      for (let i = 0; i < 3; i++) {
        const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y - 12 + i * 12 }).setDepth(DEPTH.FX);
        chainRing(g, 0, 0, 34 * h.k, 13 * h.k, 0x4a2e1c, 0xc88a5a, i);
        g.setScale(1.6).setAlpha(0);
        h.scene.tweens.add({
          targets: g, scaleX: 0.85, scaleY: 0.85, alpha: 1, duration: 150, delay: i * 50, ease: 'Quad.easeIn',
          onComplete: () => fadeOut(h.scene, g, 360, 260),
        });
      }
      h.scene.time.delayedCall(200, () => {
        // Plating torn off: grey shards thrown outward.
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const s = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setRotation(a);
          s.fillStyle(i % 2 ? 0x8a8a90 : 0xb8b8c0, 1);
          s.fillTriangle(-4, -3, 5, 0, -4, 3);
          h.scene.tweens.add({
            targets: s, x: h.to.x + Math.cos(a) * 40, y: h.to.y + Math.sin(a) * 26 + 20, rotation: a + 4,
            alpha: 0, duration: 460, ease: 'Quad.easeOut', onComplete: () => s.destroy(),
          });
        }
        feel(h);
      });
    },
  },

  // Hemomancer — the finisher already opens the wound (fxBleedOpen); while it
  // bleeds, every hit makes it pulse and drip.
  'cadence-heavy-t3-b': {
    hit: (h) => {
      if (!targetHas(h, 'cadence-hemorrhage')) return;
      const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setRotation(0.5);
      g.lineStyle(3, 0xc41e1e, 1);
      g.lineBetween(-14 * h.k, 0, 14 * h.k, 0);
      g.lineStyle(7, 0xc41e1e, 0.3);
      g.lineBetween(-14 * h.k, 0, 14 * h.k, 0);
      fadeOut(h.scene, g, 300, 60, 1.3);
      burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y + 4, 6, 600, {
        tint: [0xc41e1e, 0x7a0a10], speed: { min: 10, max: 40 }, angle: { min: 70, max: 110 },
        scale: { start: 0.6, end: 0.3 }, alpha: { start: 1, end: 0 }, gravityY: 360,
      });
    },
  },

  // Berserker — claw streaks per Rampage stage; Rampage Cleave finisher.
  'cadence-heavy-t3-a': {
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
    payoff: (h) => {
      const s = rampageStage(h.player);
      const size = h.k * (1 + 0.15 * s);
      const a = angleOf(h);
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
      feel(h, s >= 3);
    },
  },

  // Juggernaut — momentum ring at the feet by Crescendo; Crescendo Blow.
  'cadence-heavy-t3-c': {
    hit: (h) => {
      const t = crescendoTier(h.player);
      if (t === 0) return;
      const g = h.scene.add.graphics({ x: h.from.x, y: h.from.y + 16 }).setDepth(DEPTH.SPRITE - 1);
      g.lineStyle(1.5 + t, 0xff8800, 0.5 + 0.15 * t);
      g.strokeEllipse(0, 0, (26 + t * 10) * h.k, (10 + t * 4) * h.k);
      fadeOut(h.scene, g, 360, 0, 1.3);
      burstFx(h.scene, 'ptx-dot', h.from.x, h.from.y + 16, t * 2, 420, {
        tint: [0xc8b89a, 0xff8800], speed: { min: 20, max: 60 }, angle: { min: 200, max: 340 },
        scale: { start: 0.6, end: 0 }, alpha: { start: 0.8, end: 0 }, gravityY: 260,
      });
    },
    payoff: (h) => {
      const t = crescendoTier(h.player);
      const size = h.k * (1 + 0.12 * t);
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
        feel(h, t >= 3);
      });
    },
  },

  // Justicar — judgement gauge of Verdict vs target HP; Sentence finisher.
  'cadence-balanced-t3-c': {
    hit: (h) => {
      const r = verdictRatio(h);
      if (r <= 0) return;
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
    payoff: (h) => {
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
          feel(h);
        },
      });
    },
  },
};
