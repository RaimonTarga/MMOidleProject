/**
 * CONDUIT PATHS — the nine Conduit specializations (2026-09-28), the summoner half
 * of the bespoke path pass (fx/bespoke/ covers the 45 combat paths).
 *
 * A Conduit fights through its formation, so each path is drawn ON THE SUMMONS'
 * strikes (minions.ts, from the summon's snapshot) and reads what the path keeps:
 * the summon's own type names its path (`conduit-summon-<path>`), the target's
 * mirrored statuses carry Inquisitor marks and Chorister voices, the owner's
 * `summonSlots` carry Ritualist charges and the Iconoclast mark, the owner's buff
 * carries Champion's bond, and `lastAttackEmpowered` flags a specialization beat
 * (Marshal opener / coordinated strike, ritual-charged hit, linked strike).
 *
 *   Inquisitor   an accusing eye over the target, one pip per marking summon
 *   Kilnmaster   ember-trailed strikes from the larger, hotter batch
 *   Iconoclast   the marked summon cracks and glows, then shatters (summon-shatter)
 *   Marshal      a gold pennant and drilled strike on every opener / coordinated beat
 *   Chorister    sound-wave voices; notes orbit the target, one per voice
 *   Ritualist    rune pips on charged summons; a rune burst when a charge is spent
 *   Covenanter   red offense twin cuts; blue defense twin shield-bashes
 *   Champion     a tether to the bonded summon, brighter with bond progress; a gold
 *                chain on the linked strike (the Conduit's own blows draw too)
 *   Idolwright   the colossus stomps: ground ring and rubble on every blow
 */
import {
  SUMMONER_CHORUS_EFFECT_ID,
  SUMMONER_HARRIER_EFFECT_ID,
  SUMMONER_SPECIALIZATION_TUNING,
  type MinionView,
  type MonsterView,
  type PlayerView,
} from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { drawCracks, drawSigil, ring } from './bossKit';
import { bolt, crescent, fadeOut } from './bespoke/kit';
import { shouldRunClientFx } from './guard';

type P = { x: number; y: number };

interface SummonStrike {
  scene: GameScene;
  minion: MinionView;
  owner: PlayerView | undefined;
  from: P;
  to: P;
  empowered: boolean;
}

const targetStatus = (s: SummonStrike, id: string): number => {
  const view = s.scene.state.view.get(s.minion.attackTargetId ?? '') as MonsterView | undefined;
  return (view?.targetStatus ?? []).filter((t) => t.id === id).reduce((n, t) => Math.max(n, t.stacks), 0);
};
const slotOf = (s: SummonStrike) => s.owner?.summonSlots?.[s.minion.slot];
const pathOf = (minion: MinionView): string => minion.monsterTypeId.replace(/^conduit-summon-/, '');

type StrikeFx = (s: SummonStrike) => void;

const STRIKES: Record<string, StrikeFx> = {
  inquisitor: (s) => {
    const marks = Math.max(1, targetStatus(s, SUMMONER_HARRIER_EFFECT_ID));
    const of = Math.max(marks, s.owner?.summonsMinions ?? 6);
    const g = s.scene.add.graphics().setDepth(DEPTH.FX);
    g.lineStyle(1.5, 0xff8a5a, 0.8);
    g.lineBetween(s.from.x, s.from.y - 6, s.to.x, s.to.y - 30);
    fadeOut(s.scene, g, 160);
    const eye = s.scene.add.graphics({ x: s.to.x, y: s.to.y - 40 }).setDepth(DEPTH.FX + 1);
    eye.lineStyle(1.5, 0xffd08a, 1);
    eye.strokeEllipse(0, 0, 18, 9);
    eye.fillStyle(0xff5a3a, 1);
    eye.fillCircle(0, 0, 2.6);
    for (let i = 0; i < of; i++) {
      const a = Math.PI + (i / Math.max(1, of - 1)) * Math.PI;
      eye.fillStyle(i < marks ? 0xff8a5a : 0x3a2a24, i < marks ? 1 : 0.6);
      eye.fillCircle(Math.cos(a) * 14, Math.sin(a) * 9 - 2, 1.8);
    }
    fadeOut(s.scene, eye, 260, 200);
  },

  kilnmaster: (s) => {
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      burstFx(s.scene, 'ptx-spark', s.from.x + (s.to.x - s.from.x) * t, s.from.y + (s.to.y - s.from.y) * t, 1, 360, {
        tint: [0xff8a3a, 0xffd08a], speed: { min: 10, max: 40 }, angle: { min: 240, max: 300 },
        scale: { start: 0.45, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: -80,
      });
    }
    const f = s.scene.add.graphics({ x: s.to.x, y: s.to.y }).setDepth(DEPTH.FX);
    f.fillStyle(0xff8a3a, 0.5);
    f.fillCircle(0, 0, 7);
    fadeOut(s.scene, f, 160, 0, 1.8);
  },

  iconoclast: (s) => {
    burstFx(s.scene, 'ptx-dot', s.to.x, s.to.y, 4, 360, {
      tint: [0x9a93a4, 0xd0c8e0], speed: { min: 40, max: 120 }, angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 240, rotate: { min: 0, max: 360 },
    });
  },

  marshal: (s) => {
    if (!s.empowered) return;
    // The drilled strike: a gold pennant over the summon and a hard ring.
    const p = s.scene.add.graphics({ x: s.from.x, y: s.from.y - 30 }).setDepth(DEPTH.FX + 1);
    p.lineStyle(1.5, 0xd8c080, 1);
    p.lineBetween(0, 0, 0, -16);
    p.fillStyle(0xffd24a, 1);
    p.fillTriangle(0, -16, 12, -12, 0, -8);
    fadeOut(s.scene, p, 260, 240);
    ring(s.scene, s.to.x, s.to.y, 0xffd24a, { from: 8, scale: 2.8, width: 2.5, ms: 280 });
    burstFx(s.scene, 'ptx-spark', s.to.x, s.to.y, 8, 300, {
      tint: [0xffd24a, 0xffffff], speed: { min: 80, max: 200 }, angle: { min: 0, max: 360 },
      scale: { start: 0.55, end: 0 }, alpha: { start: 1, end: 0 },
    });
  },

  chorister: (s) => {
    const dx = s.to.x - s.from.x;
    const dy = s.to.y - s.from.y;
    const a = Math.atan2(dy, dx);
    for (let i = 0; i < 3; i++) {
      const g = s.scene.add.graphics({ x: s.from.x, y: s.from.y - 4 }).setDepth(DEPTH.FX).setRotation(a);
      g.lineStyle(2 - i * 0.4, 0xc8a0ff, 0.9);
      g.beginPath();
      g.arc(0, 0, 8 + i * 3, -0.7, 0.7);
      g.strokePath();
      s.scene.tweens.add({
        targets: g, x: s.to.x, y: s.to.y - 4, alpha: 0.2, duration: 260, delay: i * 60, onComplete: () => g.destroy(),
      });
    }
    const voices = targetStatus(s, SUMMONER_CHORUS_EFFECT_ID);
    for (let i = 0; i < voices; i++) {
      const ang = (i / Math.max(1, voices)) * Math.PI * 2 + Math.random();
      const n = s.scene.add.graphics({ x: s.to.x + Math.cos(ang) * 24, y: s.to.y - 10 + Math.sin(ang) * 12 }).setDepth(DEPTH.FX + 1);
      n.fillStyle(0xd8c0ff, 1);
      n.fillEllipse(0, 0, 5, 4);
      n.lineStyle(1.2, 0xd8c0ff, 1);
      n.lineBetween(2, 0, 2, -8);
      s.scene.tweens.add({ targets: n, y: n.y - 10, alpha: 0, duration: 420, onComplete: () => n.destroy() });
    }
  },

  ritualist: (s) => {
    const charges = slotOf(s)?.ritualCharges ?? 0;
    if (charges > 0) {
      const g = s.scene.add.graphics({ x: s.from.x, y: s.from.y }).setDepth(DEPTH.FX);
      for (let i = 0; i < charges; i++) {
        const a = (i / charges) * Math.PI * 2;
        g.fillStyle(0xffb86a, 1);
        g.fillCircle(Math.cos(a) * 14, Math.sin(a) * 8 - 6, 2.4);
      }
      s.scene.tweens.add({ targets: g, rotation: 1.2, alpha: 0, duration: 360, onComplete: () => g.destroy() });
    }
    if (!s.empowered) return;
    const rune = s.scene.add.graphics({ x: s.to.x, y: s.to.y }).setDepth(DEPTH.FX + 1);
    drawSigil(rune, 0, 0, 14, 1, 0xffb86a, 0.95, Math.random() * Math.PI, 5);
    rune.setScale(0.5);
    s.scene.tweens.add({
      targets: rune, scaleX: 1.3, scaleY: 1.3, alpha: 0, rotation: 1, duration: 320, onComplete: () => rune.destroy(),
    });
    ring(s.scene, s.to.x, s.to.y, 0xffb86a, { from: 10, scale: 2.6, width: 2, ms: 280 });
  },

  'covenanter-offense': (s) => {
    crescent(s.scene, s.to, Math.atan2(s.to.y - s.from.y, s.to.x - s.from.x), 26, 4, 0xfff0e0, 0xff3b2f, 200);
  },
  'covenanter-defense': (s) => {
    const g = s.scene.add.graphics({ x: s.to.x, y: s.to.y }).setDepth(DEPTH.FX);
    g.lineStyle(2.5, 0x9fd0ff, 1);
    g.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      if (i === 0) g.moveTo(Math.cos(a) * 14, Math.sin(a) * 16);
      else g.lineTo(Math.cos(a) * 14, Math.sin(a) * 16);
    }
    g.strokePath();
    fadeOut(s.scene, g, 240, 40, 1.5);
  },

  champion: (s) => {
    const owner = s.owner ? s.scene.state.sprite.get(s.minion.ownerPlayerId) : undefined;
    if (!owner) return;
    championTether(s.scene, s.owner!, { x: owner.x, y: owner.y }, s.from, s.to, s.empowered);
  },

  idolwright: (s) => {
    const g = s.scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
    drawCracks(g, s.to.x, s.to.y + 14, 36, 1, 0x3a2e24, 0.75, 1 + Math.floor(Math.random() * 999), 6);
    fadeOut(s.scene, g, 420, 260);
    ring(s.scene, s.to.x, s.to.y + 14, 0xb58a58, { from: 14, scale: 3, width: 3, ms: 380, flat: true });
    burstFx(s.scene, 'ptx-dot', s.to.x, s.to.y + 10, 10, 520, {
      tint: [0xb58a58, 0x6a5238], speed: { min: 70, max: 200 }, angle: { min: 200, max: 340 },
      scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 460,
    });
  },
};

/**
 * CHAMPION's tether between the Conduit and its bonded summon, brighter with bond
 * progress toward the linked strike; the linked strike chains gold through both
 * bodies into the target. Drawn from either side's blow.
 */
export function championTether(scene: GameScene, owner: PlayerView, ownerAt: P, summonAt: P, to: P, linked: boolean): void {
  const progress = (owner.activeBuffs ?? []).find((b) => b.id === 'summoner-battle-bond')?.stacks ?? 0;
  const frac = Math.min(1, progress / SUMMONER_SPECIALIZATION_TUNING.battleBond.threshold);
  const g = scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
  g.lineStyle(1 + frac * 3, 0xf0d878, 0.25 + 0.6 * frac);
  g.lineBetween(ownerAt.x, ownerAt.y - 6, summonAt.x, summonAt.y - 6);
  fadeOut(scene, g, 220, 60);
  if (!linked) return;
  const c = scene.add.graphics().setDepth(DEPTH.FX + 1).setBlendMode(Phaser.BlendModes.ADD);
  bolt(c, ownerAt, summonAt, 0xf0d878, 2.5, 8);
  bolt(c, summonAt, to, 0xfff4c0, 2.5, 8);
  fadeOut(scene, c, 260, 60);
  ring(scene, to.x, to.y, 0xf0d878, { from: 12, scale: 3.4, width: 3, ms: 340 });
  ring(scene, ownerAt.x, ownerAt.y, 0xf0d878, { from: 10, scale: 2.2, width: 2, ms: 300 });
}

/** A summon's strike landed: draw its path's layer (minions.ts). */
export function playConduitStrike(
  scene: GameScene, minion: MinionView, owner: PlayerView | undefined, from: P, to: P, empowered: boolean,
): void {
  if (!shouldRunClientFx()) return;
  STRIKES[pathOf(minion)]?.({ scene, minion, owner, from, to, empowered });
}

/** Per snapshot: the Iconoclast's marked summon cracks and glows before it shatters. */
export function playIconoclastMark(scene: GameScene, minion: MinionView, owner: PlayerView | undefined): void {
  if (!shouldRunClientFx() || pathOf(minion) !== 'iconoclast') return;
  if (!owner?.summonSlots?.[minion.slot]?.marked) return;
  const s = scene.state.sprite.get(minion.id);
  if (!s) return;
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  drawCracks(g, s.x, s.y, s.displayWidth * 0.5, 1, 0xc8a0ff, 0.9, 11 + minion.slot, 5);
  g.fillStyle(0xb080ff, 0.18);
  g.fillCircle(s.x, s.y, s.displayWidth * 0.5);
  fadeOut(scene, g, 200);
}

/** `summon-shatter`: an Iconoclast summon bursts (deliberate blasts are bigger). */
export function fxSummonShatter(scene: GameScene, at: P, radius: number, deliberate: boolean): void {
  if (!shouldRunClientFx()) return;
  const r = deliberate ? radius : radius * 0.65;
  ring(scene, at.x, at.y, 0xc8a0ff, { from: 10, scale: r / 10, width: deliberate ? 4 : 2, ms: 360 });
  for (let i = 0; i < (deliberate ? 12 : 7); i++) {
    const a = (i / (deliberate ? 12 : 7)) * Math.PI * 2 + Math.random() * 0.3;
    const sh = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX).setRotation(a);
    sh.fillStyle(i % 2 ? 0xd0c8e0 : 0x8a6ab0, 1);
    sh.fillTriangle(-4, -3, 7, 0, -4, 3);
    scene.tweens.add({
      targets: sh, x: at.x + Math.cos(a) * r, y: at.y + Math.sin(a) * r * 0.7, rotation: a + 5, alpha: 0,
      duration: 420, ease: 'Quad.easeOut', onComplete: () => sh.destroy(),
    });
  }
  const flash = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX);
  flash.fillStyle(0xffffff, 0.7);
  flash.fillCircle(0, 0, deliberate ? 18 : 10);
  fadeOut(scene, flash, 180, 0, 2);
}
