/**
 * SLINGER (reload) specializations — the magazine class, so these read the clip,
 * the reload, and what each shot banks. Melter, Sniper and Blunderbuss replace
 * their attack in combatFx; Duelist's last bullet, Dualslinger's odd round, the
 * Bounty hunter's detonation and the Cannoneer's blast keep their own cues there,
 * and the layers here add the build-up those payoffs were missing.
 */
import type { PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../../scenes/GameScene';
import { DEPTH } from '../../render/depth';
import { burstFx } from '../particles';
import { ring } from '../bossKit';
import { buffStacks, fadeOut, targetStacks, type P, type PathTable } from './kit';

const head = (at: P): P => ({ x: at.x, y: at.y - 44 });

/**
 * DUALSLINGER's balance scale over the shooter: gold pan (attack) against blue
 * pan (on-hit), tipped by the real gear split, level when it is even. The pan that
 * just fired flashes. Called for both rounds (the odd one from combatFx's
 * alt-shot branch).
 */
export function fxDualScale(scene: GameScene, player: PlayerView, from: P, fired: 'gold' | 'blue', k = 1): void {
  const atk = Math.max(0, player.attack ?? 0);
  const onHit = Math.max(0, player.onHitDamage ?? 0);
  const tilt = atk + onHit > 0 ? (onHit - atk) / (atk + onHit) : 0; // + tips toward blue (right)
  const at = head(from);
  const g = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX + 1);
  const arm = 16 * k;
  const rot = tilt * 0.45;
  const lx = -Math.cos(rot) * arm;
  const ly = -Math.sin(rot) * arm;
  const rx = Math.cos(rot) * arm;
  const ry = Math.sin(rot) * arm;
  g.lineStyle(1.5, 0xd8d0c0, 1);
  g.lineBetween(0, -6, 0, 4);
  g.lineBetween(lx, ly, rx, ry);
  const pan = (x: number, y: number, color: number, lit: boolean): void => {
    g.lineStyle(1, 0xd8d0c0, 0.9);
    g.lineBetween(x, y, x - 4, y + 6);
    g.lineBetween(x, y, x + 4, y + 6);
    g.fillStyle(color, lit ? 1 : 0.45);
    g.fillEllipse(x, y + 7, lit ? 12 : 10, 4);
  };
  pan(lx, ly, 0xffd24a, fired === 'gold');
  pan(rx, ry, 0x3aa0ff, fired === 'blue');
  if (Math.abs(tilt) < 0.1) {
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(0, -7, 2);
  }
  fadeOut(scene, g, 260, 220);
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
  // Duelist — the last bullet glints in the chamber before it fires (the shot
  // itself is the existing red exploding round).
  'reload-light-t3-a': {
    hit: (h) => {
      if ((h.player.ammoCount ?? 0) !== 1) return;
      const g = h.scene.add.graphics({ x: h.from.x + 10, y: h.from.y - 10 }).setDepth(DEPTH.FX + 1);
      g.fillStyle(0xff3322, 1);
      g.fillCircle(0, 0, 3);
      g.lineStyle(1.5, 0xffe2c0, 1);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        g.lineBetween(Math.cos(a) * 4, Math.sin(a) * 4, Math.cos(a) * 11, Math.sin(a) * 11);
      }
      g.setScale(0.4);
      h.scene.tweens.add({
        targets: g, scaleX: 1.2, scaleY: 1.2, rotation: 0.8, duration: 200, ease: 'Back.easeOut',
        onComplete: () => fadeOut(h.scene, g, 300, 200),
      });
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

  // Dualslinger — the balance scale (even round here; odd from the alt-shot branch).
  'reload-balanced-t3-c': {
    hit: (h) => fxDualScale(h.scene, h.player, h.from, 'gold', h.k),
  },

  // Warmonger — rising fury: a war-drum aura on you beats faster and redder with
  // every shot of the ramp; the reload ends it with a roar.
  'reload-heavy-t3-b': {
    hit: (h) => {
      const ramp = Math.min(20, buffStacks(h.player, 'reload-hair-trigger'));
      const heat = ramp / 20;
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
