/**
 * SLINGER (reload) specializations — the magazine class, so these read the clip,
 * the reload, and what each shot banks. Melter, Sniper and Blunderbuss replace
 * their attack in combatFx; Dualslinger's odd round, the Bounty hunter's
 * detonation and the Cannoneer's blast keep their own cues there, and the layers
 * here add the build-up those payoffs were missing.
 */
import type { PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../../scenes/GameScene';
import { DEPTH } from '../../render/depth';
import { burstFx } from '../particles';
import { drawSigil, ring } from '../bossKit';
import { bolt, buffStacks, fadeOut, targetStacks, type P, type PathTable } from './kit';

const head = (at: P): P => ({ x: at.x, y: at.y - 44 });

/** The Artillerist ramp's fill, 0..1: the `reload-frame-ramp` tile reports it as `durationPct`. */
function rampFill(player: PlayerView): number {
  const ramp = (player.activeBuffs ?? []).find((b) => (b.id as string) === 'reload-frame-ramp');
  return ramp ? Math.max(0, Math.min(1, (ramp.durationPct ?? 0) / 100)) : 0;
}

/**
 * DUALSLINGER's two rounds, drawn as opposites so the alternation reads at a glance:
 *   GOLD (even, 2x attack): a heavy kinetic slug, straight and hard, a brass casing
 *     kicked out and a gold shockwave where it lands;
 *   BLUE (odd, 2x on-hit): a spiralling arcane round that pops a rune and crackles
 *     on impact, because it is the round that fires the procs.
 * The gold one replaces the plain gunshot via the `attack` hook; the blue one is
 * called from combatFx's alt-shot branch.
 */
export function fxDualGoldRound(scene: GameScene, from: P, to: P, k = 1): void {
  const a = Math.atan2(to.y - from.y, to.x - from.x);
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  g.lineStyle(9 * k, 0xffb020, 0.3);
  g.lineBetween(from.x, from.y, to.x, to.y);
  g.lineStyle(4 * k, 0xffd24a, 1);
  g.lineBetween(from.x, from.y, to.x, to.y);
  g.lineStyle(1.5, 0xffffff, 1);
  g.lineBetween(from.x, from.y, to.x, to.y);
  fadeOut(scene, g, 130);
  // Muzzle: a hard cone of gold sparks and a flash.
  const deg = (a * 180) / Math.PI;
  burstFx(scene, 'ptx-spark', from.x, from.y, 8, 200, {
    tint: [0xffd24a, 0xffffff], speed: { min: 120, max: 260 }, angle: { min: deg - 18, max: deg + 18 },
    scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 },
  });
  const flash = scene.add.graphics({ x: from.x, y: from.y }).setDepth(DEPTH.FX);
  flash.fillStyle(0xffe07a, 0.9);
  flash.fillCircle(0, 0, 8 * k);
  fadeOut(scene, flash, 110, 0, 2);
  // Brass casing kicked out the side.
  const side = Math.cos(a) >= 0 ? -1 : 1;
  const c = scene.add.graphics({ x: from.x, y: from.y - 6 }).setDepth(DEPTH.FX);
  c.fillStyle(0xd8a040, 1);
  c.fillRect(-3, -1.5, 6, 3);
  scene.tweens.add({
    targets: c, x: c.x + side * 22, y: c.y + 14, rotation: 7, alpha: 0, duration: 420,
    ease: 'Quad.easeOut', onComplete: () => c.destroy(),
  });
  // Impact: a gold shockwave and a heavy spray thrown on through the target.
  ring(scene, to.x, to.y, 0xffd24a, { from: 8, scale: 3.4 * k, width: 3, ms: 260 });
  burstFx(scene, 'ptx-spark', to.x, to.y, 12, 320, {
    tint: [0xffd24a, 0xffb020, 0xffffff], speed: { min: 120, max: 300 }, angle: { min: deg - 35, max: deg + 35 },
    scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 }, rotate: { min: 0, max: 360 },
  });
}

export function fxDualBlueRound(scene: GameScene, from: P, to: P, k = 1): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const g = scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
  g.lineStyle(6 * k, 0x3aa0ff, 0.25);
  g.lineBetween(from.x, from.y, to.x, to.y);
  // Two strands spiralling round the path (a helix, drawn flat).
  for (const phase of [0, Math.PI]) {
    g.lineStyle(2, phase ? 0x9fe0ff : 0x3aa0ff, 1);
    g.beginPath();
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const w = Math.sin(t * Math.PI * 4 + phase) * 6 * k;
      const x = from.x + dx * t + nx * w;
      const y = from.y + dy * t + ny * w;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
  }
  fadeOut(scene, g, 200);
  // Impact: a rune pops open on the target, and the procs crackle out of it.
  const rune = scene.add.graphics({ x: to.x, y: to.y }).setDepth(DEPTH.FX + 1);
  drawSigil(rune, 0, 0, 12 * k, 1, 0x3aa0ff, 0.95, Math.random() * Math.PI, 6);
  rune.setScale(0.4);
  scene.tweens.add({
    targets: rune, scaleX: 1.3, scaleY: 1.3, rotation: 1.2, alpha: 0, duration: 340, ease: 'Quad.easeOut',
    onComplete: () => rune.destroy(),
  });
  const arcs = scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
  for (let i = 0; i < 4; i++) {
    const a = Math.random() * Math.PI * 2;
    bolt(arcs, to, { x: to.x + Math.cos(a) * 24 * k, y: to.y + Math.sin(a) * 24 * k }, i % 2 ? 0xffffff : 0x9fe0ff, 1.5, 5, 3);
  }
  fadeOut(scene, arcs, 180, 40);
  burstFx(scene, 'ptx-spark', to.x, to.y, 8, 380, {
    tint: [0x3aa0ff, 0x9fe0ff, 0xffffff], speed: { min: 40, max: 140 }, angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 },
  });
}

/** A revolver cylinder: six chambers, `lit` of them loaded with momentum. */
function cylinder(scene: GameScene, at: P, lit: number, spin: number, k: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX + 1);
  g.lineStyle(2, 0xd8c080, 0.95);
  g.strokeCircle(0, 0, 11 * k);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.fillStyle(i < lit ? 0xffc040 : 0x3a3020, i < lit ? 1 : 0.7);
    g.fillCircle(Math.cos(a) * 6.5 * k, Math.sin(a) * 6.5 * k, 2.4 * k);
  }
  g.setRotation(0);
  scene.tweens.add({ targets: g, rotation: spin, duration: 360, ease: 'Cubic.easeOut' });
  return g;
}

export const SLINGER_PATHS: PathTable = {
  // Duelist — Kill chain (design §22.5): every kill loads one round past the
  // clip until the next reload. On the kill a brass round slides up into the
  // chamber beside the gun with a click, and the rounds riding past the clip show
  // as a row of brass pips (the HUD's ammo counter reads "+N"). Mid-reload the
  // round is owed rather than loaded, so nothing chambers.
  'reload-light-t3-a': {
    kill: (k) => {
      if ((k.player.reloadRemainingMs ?? 0) > 0) return;
      const brass = 0xd8a040;
      const at = { x: k.at.x + 16, y: k.at.y - 18 };
      const round = k.scene.add.graphics({ x: at.x, y: at.y + 16 }).setDepth(DEPTH.FX + 1);
      round.fillStyle(brass, 1);
      round.fillRect(-2.5, -4, 5, 9);
      round.fillStyle(0xffe0a0, 1);
      round.fillTriangle(-2.5, -4, 2.5, -4, 0, -9);
      round.setAlpha(0);
      k.scene.tweens.add({
        targets: round, y: at.y, alpha: 1, duration: 150, ease: 'Cubic.easeOut',
        onComplete: () => {
          // The click: a glint where it seats.
          const click = k.scene.add.graphics({ x: at.x, y: at.y - 4 }).setDepth(DEPTH.FX + 1);
          click.lineStyle(1.5, 0xffffff, 1);
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            click.lineBetween(Math.cos(a) * 3, Math.sin(a) * 3, Math.cos(a) * 8, Math.sin(a) * 8);
          }
          fadeOut(k.scene, click, 200, 0, 1.4);
          fadeOut(k.scene, round, 260, 160);
        },
      });
      const past = Math.max(1, Math.min(6, (k.player.ammoCount ?? 0) - (k.player.ammoMax ?? 0)));
      const pips = k.scene.add.graphics({ x: at.x + 9, y: at.y - 2 }).setDepth(DEPTH.FX + 1);
      for (let i = 0; i < past; i++) {
        pips.fillStyle(i === past - 1 ? 0xffe0a0 : brass, 1);
        pips.fillCircle(i * 5, 0, 1.8);
      }
      pips.setAlpha(0);
      k.scene.tweens.add({ targets: pips, alpha: 1, duration: 120, delay: 150 });
      fadeOut(k.scene, pips, 260, 520);
    },
  },

  // Desperado — a revolver cylinder over you, one chamber lit per Momentum
  // stack, spinning faster as it fills; every reload spins it with a flourish.
  'reload-light-t3-b': {
    hit: (h) => {
      const m = Math.min(5, buffStacks(h.player, 'reload-momentum'));
      if (m <= 0) return;
      const g = cylinder(h.scene, head(h.from), m, 0.6 + m * 0.35, h.k);
      fadeOut(h.scene, g, 260, 240);
    },
    reload: (r) => {
      const m = Math.min(5, buffStacks(r.player, 'reload-momentum'));
      const g = cylinder(r.scene, head(r.at), m, Math.PI * (2 + m), 1.1);
      fadeOut(r.scene, g, 300, 360);
      burstFx(r.scene, 'ptx-spark', r.at.x, r.at.y - 44, 4 + m * 2, 360, {
        tint: [0xffc040, 0xfff0c0], speed: { min: 40, max: 120 }, angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 },
      });
    },
  },

  // Bounty hunter — a skull mark per Death Mark stack over the target, filling
  // toward the reload that detonates them (fxDeathMarkBlast).
  'reload-balanced-t3-a': {
    hit: (h) => {
      const marks = Math.min(10, targetStacks(h, 'death-mark'));
      if (marks <= 0) return;
      const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y - 42 }).setDepth(DEPTH.FX + 1);
      const w = 7;
      for (let i = 0; i < marks; i++) {
        const x = (i - (marks - 1) / 2) * w;
        const y = i === marks - 1 ? -3 : 0;
        g.fillStyle(marks >= 8 ? 0xff5a3a : 0xff8833, 1);
        g.fillCircle(x, y, 2.6);
        g.fillRect(x - 1.8, y + 1.5, 3.6, 2);
        g.fillStyle(0x1a0a06, 1);
        g.fillCircle(x - 1, y - 0.4, 0.7);
        g.fillCircle(x + 1, y - 0.4, 0.7);
      }
      fadeOut(h.scene, g, 300, 300);
    },
  },

  // Dualslinger — the gold (attack) round replaces the plain shot; the blue
  // (on-hit) round is drawn from combatFx's alt-shot branch.
  'reload-balanced-t3-c': {
    attack: (h) => fxDualGoldRound(h.scene, h.from, h.to, h.k),
  },

  // Warmonger — rising fury: a war-drum aura on you beats faster and redder as
  // the Artillerist ramp climbs; the reload roars, and half the ramp carries
  // through it (design §22.5), so the drum picks up where the carry left it.
  'reload-heavy-t3-b': {
    hit: (h) => {
      // The ramp's FILL, as the server projects it on the tile — never a fixed
      // stack count. The fill is one clip (40 stacks on Warmonger's 40-round clip),
      // the same top the damage and the barrel glow read (design §22.12), so the
      // drum runs red-hot exactly when the top damage is reached; past it only the
      // attack speed climbs, and the drum shows that by beating faster (one beat
      // per hit) rather than by any more heat.
      const heat = rampFill(h.player);
      const g = h.scene.add.graphics({ x: h.from.x, y: h.from.y + 14 }).setDepth(DEPTH.SPRITE - 1);
      g.fillStyle(0xff3b2f, 0.08 + 0.22 * heat);
      g.fillEllipse(0, 0, (30 + 20 * heat) * h.k, (12 + 8 * heat) * h.k);
      g.lineStyle(1.5 + heat * 2, heat > 0.6 ? 0xffe0a0 : 0xff5a3a, 0.4 + 0.5 * heat);
      g.strokeEllipse(0, 0, (30 + 20 * heat) * h.k, (12 + 8 * heat) * h.k);
      fadeOut(h.scene, g, 160 + (1 - heat) * 200, 0, 1.2 + heat * 0.4);
    },
    reload: (r) => {
      // The roar: sound-wave arcs thrown both ways and a red shockwave.
      for (let i = 0; i < 3; i++) {
        ring(r.scene, r.at.x, r.at.y, i % 2 ? 0xffa040 : 0xff3b2f, {
          from: 14 + i * 6, scale: 3.4, width: 3 - i * 0.6, ms: 420, delay: i * 70,
        });
      }
      for (const side of [-1, 1]) {
        const g = r.scene.add.graphics({ x: r.at.x, y: r.at.y - 10 }).setDepth(DEPTH.FX);
        for (let i = 0; i < 3; i++) {
          g.lineStyle(2, 0xff5a3a, 0.9 - i * 0.25);
          g.beginPath();
          g.arc(0, 0, 14 + i * 8, side > 0 ? -0.6 : Math.PI - 0.6, side > 0 ? 0.6 : Math.PI + 0.6);
          g.strokePath();
        }
        r.scene.tweens.add({
          targets: g, x: r.at.x + side * 30, alpha: 0, duration: 360, onComplete: () => g.destroy(),
        });
      }
    },
  },

  // Cannoneer — a powder gauge over you fills with the banked pool; the reload
  // fires it (fxCannonBlast).
  'reload-heavy-t3-c': {
    hit: (h) => {
      const stored = buffStacks(h.player, 'reload-cannon');
      if (stored <= 0) return;
      const fill = Math.min(1, Math.log10(stored + 1) / 4);
      const at = head(h.from);
      const g = h.scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX + 1);
      g.fillStyle(0x2a2420, 0.9);
      g.fillCircle(0, 0, 9 * h.k);
      g.fillStyle(fill > 0.75 ? 0xffe0a0 : 0xff8a3a, 0.95);
      g.slice(0, 0, 7 * h.k, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fill, false);
      g.fillPath();
      g.lineStyle(1.5, 0xb0a090, 1);
      g.strokeCircle(0, 0, 9 * h.k);
      fadeOut(h.scene, g, 280, 260);
    },
  },
};
