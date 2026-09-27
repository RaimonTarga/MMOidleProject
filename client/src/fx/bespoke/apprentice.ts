/**
 * APPRENTICE (dot) specializations — the affliction class, so these read the
 * stacks building on the TARGET (its mirrored status list) rather than the caster:
 * burn / poison / frost / doom stacks all live on the shared `dot` status, with
 * `dot-conf` (Conflagration), `dot-chill`, `dot-frozen` and `dot-frostbite` beside
 * it. Their existing threshold cues (max-stack burst, rimeshatter, frozen, poison
 * explosion) still fire from combatFx; these layers show the build-up to them.
 */
import { DEPTH } from '../../render/depth';
import { burstFx } from '../particles';
import { drawSigil, ring } from '../bossKit';
import {
  fadeOut, hasBuff, targetHas, targetStacks,
  type BespokeHit, type P, type PathTable,
} from './kit';

const VENOM_PIPS = 10;
const BURN_MAX = 6;
const FROST_MAX = 3;
const CHILL_MAX = 9;
const FROSTBITE_MAX = 10;

/** A small flame: teardrop body, bright core, rising and fading. */
function flame(h: BespokeHit, at: P, size: number, color = 0xff6a1a, delay = 0): void {
  const g = h.scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX);
  g.fillStyle(color, 0.9);
  g.fillTriangle(-5 * size, 0, 5 * size, 0, 0, -16 * size);
  g.fillCircle(0, 0, 5 * size);
  g.fillStyle(0xffe08a, 0.95);
  g.fillCircle(0, 1, 2.4 * size);
  g.setScale(0.4).setAlpha(0);
  h.scene.tweens.add({
    targets: g, scaleX: 1, scaleY: 1, alpha: 1, y: at.y - 6, duration: 120, delay,
    onComplete: () => h.scene.tweens.add({
      targets: g, y: at.y - 18, alpha: 0, scaleY: 1.3, duration: 320, onComplete: () => g.destroy(),
    }),
  });
}

/** A crystal of ice (a tall diamond). */
function crystal(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number, lit: boolean): void {
  g.fillStyle(lit ? 0xbfe8ff : 0x2a3a4a, lit ? 0.95 : 0.5);
  g.fillTriangle(x - 4 * s, y, x + 4 * s, y, x, y - 12 * s);
  g.fillTriangle(x - 4 * s, y, x + 4 * s, y, x, y + 5 * s);
  if (lit) {
    g.lineStyle(1, 0xffffff, 0.9);
    g.lineBetween(x, y - 11 * s, x, y + 4 * s);
  }
}

export const APPRENTICE_PATHS: PathTable = {
  // Venomslinger — ten venom pips filled by the target's poison stacks; the
  // 10-stack detonation keeps its own burst (fxPoisonExplosion).
  'dot-light-t3-a': {
    hit: (h) => {
      const stacks = targetStacks(h, 'dot');
      if (stacks <= 0) return;
      const n = Math.min(VENOM_PIPS, stacks);
      const hot = n >= VENOM_PIPS - 2;
      const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX);
      const r = 26 * h.k;
      for (let i = 0; i < VENOM_PIPS; i++) {
        const a = -Math.PI / 2 + (i / VENOM_PIPS) * Math.PI * 2;
        const lit = i < n;
        g.fillStyle(lit ? (hot ? 0xd8ff6a : 0x9ad65a) : 0x2a3a1a, lit ? 1 : 0.5);
        g.fillCircle(Math.cos(a) * r, Math.sin(a) * r * 0.7, i === n - 1 ? 4 : 3);
      }
      g.setScale(hot ? 1.1 : 1);
      h.scene.tweens.add({
        targets: g, alpha: 0, scaleX: hot ? 1.25 : 1.05, scaleY: hot ? 1.25 : 1.05,
        duration: 420, delay: 160, onComplete: () => g.destroy(),
      });
      if (hot) ring(h.scene, h.to.x, h.to.y, 0xd8ff6a, { from: r * 0.9, scale: 1.4, width: 2, ms: 240, alpha: 0.7 });
    },
  },

  // Pyromancer — every hit lays two flame licks (the double stack); at max
  // stacks they flare white-hot for the bonus blow.
  'dot-balanced-t3-a': {
    hit: (h) => {
      const full = targetStacks(h, 'dot') >= BURN_MAX;
      flame(h, { x: h.to.x - 7, y: h.to.y + 4 }, full ? 1.3 : 0.9, full ? 0xffc040 : 0xff6a1a);
      flame(h, { x: h.to.x + 7, y: h.to.y + 2 }, full ? 1.3 : 0.9, full ? 0xffe08a : 0xff8a3a, 60);
      if (full) ring(h.scene, h.to.x, h.to.y, 0xffe08a, { from: 10, scale: 2.6, width: 2, ms: 260 });
    },
  },

  // Firebrand — the brand sears on; once the target is fully branded, hits
  // land as solid fire slugs while the brand glows.
  'dot-balanced-t3-b': {
    hit: (h) => {
      const branded = targetStacks(h, 'dot') >= BURN_MAX;
      const mark = h.scene.add.graphics({ x: h.to.x, y: h.to.y - 30 }).setDepth(DEPTH.FX + 1);
      drawSigil(mark, 0, 0, 9 * h.k, 1, branded ? 0xffd08a : 0xff6a1a, 0.95, 0.3, 3);
      fadeOut(h.scene, mark, 260, 200);
      if (!branded) return;
      const g = h.scene.add.graphics().setDepth(DEPTH.FX);
      g.lineStyle(7, 0xff6a1a, 0.4);
      g.lineBetween(h.from.x, h.from.y, h.to.x, h.to.y);
      g.lineStyle(3, 0xffe08a, 1);
      g.lineBetween(h.from.x, h.from.y, h.to.x, h.to.y);
      fadeOut(h.scene, g, 140);
      burstFx(h.scene, 'ptx-spark', h.to.x, h.to.y, 8, 300, {
        tint: [0xff6a1a, 0xffe08a], speed: { min: 80, max: 200 }, angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 },
      });
    },
  },

  // Cinder Lord — a row of flames per burn stack; once Conflagration takes the
  // stacks, the target burns as a pyre.
  'dot-balanced-t3-c': {
    hit: (h) => {
      if (targetHas(h, 'dot-conf')) {
        for (let i = 0; i < 5; i++) {
          flame(h, { x: h.to.x + (i - 2) * 8, y: h.to.y + 10 - Math.abs(i - 2) * 3 }, 1.4 + (i === 2 ? 0.5 : 0), i % 2 ? 0xff4a1a : 0xff8a3a, i * 30);
        }
        burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y - 20, 5, 700, {
          tint: [0x5a4a44, 0x3a302c], speed: { min: 10, max: 40 }, angle: { min: 250, max: 290 },
          scale: { start: 0.6, end: 1.2 }, alpha: { start: 0.6, end: 0 }, gravityY: -60,
        });
        return;
      }
      const n = Math.min(BURN_MAX, targetStacks(h, 'dot'));
      for (let i = 0; i < n; i++) {
        flame(h, { x: h.to.x + (i - (n - 1) / 2) * 7, y: h.to.y - 26 }, 0.55, 0xff4a1a, i * 20);
      }
    },
  },

  // Icebreaker — frost crystals build to three around the target; at three,
  // hits land as ice-shattering blows.
  'dot-heavy-t3-a': {
    hit: (h) => {
      const n = Math.min(FROST_MAX, targetStacks(h, 'dot'));
      const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX);
      for (let i = 0; i < FROST_MAX; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.7;
        crystal(g, Math.cos(a) * 26 * h.k, Math.sin(a) * 18 * h.k, h.k, i < n);
      }
      fadeOut(h.scene, g, 280, 200);
      if (n < FROST_MAX) return;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const s = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setRotation(a);
        s.fillStyle(i % 2 ? 0xffffff : 0xbfe8ff, 1);
        s.fillTriangle(-3, -2, -3, 2, 9, 0);
        h.scene.tweens.add({
          targets: s, x: h.to.x + Math.cos(a) * 40, y: h.to.y + Math.sin(a) * 30, alpha: 0,
          duration: 300, ease: 'Quad.easeOut', onComplete: () => s.destroy(),
        });
      }
      ring(h.scene, h.to.x, h.to.y, 0xffffff, { from: 10, scale: 3, width: 2, ms: 260 });
    },
  },

  // Winter Warden — chill frosting creeps up the target, one step per stack;
  // Frozen encases it in an ice block.
  'dot-heavy-t3-b': {
    hit: (h) => {
      const vs = h.scene.state.sprite.get(h.targetId);
      if (!vs) return;
      const g = h.scene.add.graphics().setDepth(vs.depth + 0.5);
      const w = vs.displayWidth * 0.66;
      const base = vs.y + vs.displayHeight * 0.38;
      if (targetHas(h, 'dot-frozen')) {
        const hgt = vs.displayHeight * 0.9;
        g.fillStyle(0x9fdcff, 0.35);
        g.fillRect(vs.x - w / 2 - 4, base - hgt, w + 8, hgt);
        g.lineStyle(2, 0xe8f8ff, 0.9);
        g.strokeRect(vs.x - w / 2 - 4, base - hgt, w + 8, hgt);
        g.lineBetween(vs.x - w / 2, base - hgt + 6, vs.x - w / 4, base - hgt * 0.4);
        fadeOut(h.scene, g, 300, 260);
        return;
      }
      const chill = Math.min(CHILL_MAX, targetStacks(h, 'dot-chill'));
      if (chill <= 0) { g.destroy(); return; }
      const hgt = vs.displayHeight * 0.8 * (chill / CHILL_MAX);
      g.fillStyle(0xbfe8ff, 0.3);
      g.fillRect(vs.x - w / 2, base - hgt, w, hgt);
      g.lineStyle(1.5, 0xffffff, 0.8);
      for (let i = 0; i < 4; i++) {
        const x = vs.x - w / 2 + (i + 0.5) * (w / 4);
        g.lineBetween(x, base - hgt, x + 3, base - hgt - 5);
      }
      fadeOut(h.scene, g, 300, 220);
    },
  },

  // Wind Spirit — a blizzard vortex spins round the target, growing and
  // thickening with each Frostbite stack.
  'dot-heavy-t3-c': {
    hit: (h) => {
      const bite = Math.min(FROSTBITE_MAX, targetStacks(h, 'dot-frostbite'));
      const k = 0.5 + bite / FROSTBITE_MAX;
      const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX);
      const arms = 2 + Math.floor(bite / 3);
      for (let i = 0; i < arms; i++) {
        const a0 = (i / arms) * Math.PI * 2;
        g.lineStyle(2 + bite * 0.15, i % 2 ? 0xffffff : 0xd8f0ff, 0.85);
        g.beginPath();
        g.arc(0, 0, (14 + 14 * k) * h.k, a0, a0 + 1.6);
        g.strokePath();
      }
      h.scene.tweens.add({
        targets: g, rotation: 2.6, alpha: 0, scaleX: 1.2, scaleY: 1.2, duration: 460, onComplete: () => g.destroy(),
      });
      burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y, 3 + bite, 600, {
        tint: [0xffffff, 0xd8f0ff], speed: { min: 30, max: 90 + bite * 8 }, angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 40,
      });
    },
  },

  // Cultist — a doom sigil over the target that grows with the uncapped stacks
  // and gains a ring for every 8 past the first 8.
  'dot-light-t3-b': {
    hit: (h) => {
      const n = targetStacks(h, 'dot');
      if (n <= 0) return;
      const rings = n > 8 ? Math.min(4, 1 + Math.floor((n - 8) / 8)) : 0;
      const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y - 44 }).setDepth(DEPTH.FX + 1);
      const r = (8 + Math.min(n, 40) * 0.25) * h.k;
      drawSigil(g, 0, 0, r, 1, 0x8a5ad0, 0.95, Math.random(), 5);
      for (let i = 0; i < rings; i++) {
        g.lineStyle(1.5, 0xd0b0ff, 0.8 - i * 0.15);
        g.strokeCircle(0, 0, r + 4 + i * 4);
      }
      h.scene.tweens.add({ targets: g, rotation: 0.6, alpha: 0, duration: 420, delay: 160, onComplete: () => g.destroy() });
    },
  },

  // Zealot — while Frenzy burns, a crown of green flame rides your head.
  'dot-light-t3-c': {
    hit: (h) => {
      if (!hasBuff(h.player, 'dot-frenzy')) return;
      for (let i = 0; i < 5; i++) {
        const a = Math.PI + (i / 4) * Math.PI;
        flame(h, { x: h.from.x + Math.cos(a) * 12, y: h.from.y - 34 + Math.sin(a) * 4 }, 0.6, i % 2 ? 0x9ad65a : 0xd8ff6a, i * 20);
      }
    },
  },
};
