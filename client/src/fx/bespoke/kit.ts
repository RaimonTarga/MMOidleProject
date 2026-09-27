/**
 * BESPOKE PATH KIT — shared types and helpers for the per-class bespoke attack
 * modules (striker.ts, squire.ts, slinger.ts, spirit.ts, apprentice.ts).
 *
 * Every specialization's attack SHOWS its own resource, read from data the
 * PlayerView / MonsterView already carries (aura, activeBuffs, combo / ammo /
 * energy fields, the target's status list), so remote players see it too.
 *
 *   attack   replaces the ordinary hit's animation outright (Dualslinger's rounds);
 *   hit      a layer over an ordinary hit (the range attack still draws beneath);
 *   payoff   replaces the whole finisher / execution / discharge animation;
 *   reload   a beat on `player-reload-start` (Slinger paths).
 */
import type { MonsterView, PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../../scenes/GameScene';
import { DEPTH } from '../../render/depth';
import { impact } from '../impactFeel';

export type P = { x: number; y: number };

export interface BespokeHit {
  scene: GameScene;
  player: PlayerView;
  playerId: string;
  targetId: string;
  from: P;
  to: P;
  /** An amplified basic hit (finisher, discharge, last bullet). */
  empowered: boolean;
  /** A cooldown-class execution. */
  execution: boolean;
  /** Ascension-driven size multiplier (AttackFlair.scale). */
  k: number;
}

export interface BespokeReload {
  scene: GameScene;
  player: PlayerView;
  playerId: string;
  at: P;
}

export interface BespokePath {
  attack?(h: BespokeHit): void;
  hit?(h: BespokeHit): void;
  payoff?(h: BespokeHit): void;
  reload?(r: BespokeReload): void;
}

export type PathTable = Record<string, BespokePath>;

export const buffStacks = (p: PlayerView, id: string): number =>
  (p.activeBuffs ?? []).find((b) => b.id === id)?.stacks ?? 0;
export const hasBuff = (p: PlayerView, id: string): boolean =>
  (p.activeBuffs ?? []).some((b) => b.id === id);

export const targetView = (h: BespokeHit): MonsterView | undefined =>
  h.scene.state.view.get(h.targetId) as MonsterView | undefined;
/** Stacks of one status on the target (0 when absent or not mirrored). */
export const targetStacks = (h: BespokeHit, id: string): number =>
  targetView(h)?.targetStatus?.find((s) => s.id === id)?.stacks ?? 0;
export const targetHas = (h: BespokeHit, id: string): boolean =>
  (targetView(h)?.targetStatus ?? []).some((s) => s.id === id);

export const angleOf = (h: { from: P; to: P }): number => Math.atan2(h.to.y - h.from.y, h.to.x - h.from.x);
export const isOwn = (h: { scene: GameScene; playerId: string }): boolean => h.playerId === h.scene.state.ownId;

/** Light shake on your own payoffs, medium at a path's peak (Settings-gated). */
export function feel(h: BespokeHit, peak = false): void {
  if (isOwn(h)) impact(h.scene, peak ? 'medium' : 'light', h.to);
}

export function fadeOut(scene: GameScene, g: Phaser.GameObjects.Graphics, ms: number, delay = 0, grow = 1): void {
  scene.tweens.add({
    targets: g, alpha: 0, scaleX: grow, scaleY: grow, duration: ms, delay,
    onComplete: () => g.destroy(),
  });
}

/** A crescent written on across `ms`: glow under a bright core. */
export function crescent(
  scene: GameScene, at: P, angle: number, radius: number, width: number,
  core: number, glow: number, ms: number, delay = 0,
): void {
  const g = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX).setRotation(angle);
  const t = { p: 0 };
  scene.tweens.add({
    targets: t, p: 1, duration: ms, delay, ease: 'Cubic.easeOut',
    onUpdate: () => {
      g.clear();
      const a0 = -1.2;
      const a1 = a0 + 2.4 * t.p;
      g.lineStyle(width * 2.4, glow, 0.35);
      g.beginPath();
      g.arc(-radius * 0.35, 0, radius, a0, a1);
      g.strokePath();
      g.lineStyle(width, core, 1);
      g.beginPath();
      g.arc(-radius * 0.35, 0, radius, a0, a1);
      g.strokePath();
    },
    onComplete: () => fadeOut(scene, g, 200),
  });
}

/** A jagged bolt between two points, drawn into `g`. */
export function bolt(g: Phaser.GameObjects.Graphics, a: P, b: P, color: number, width: number, jag = 10, segs = 6): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  g.lineStyle(width, color, 1);
  g.beginPath();
  g.moveTo(a.x, a.y);
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const j = (Math.random() - 0.5) * 2 * jag;
    g.lineTo(a.x + dx * t + nx * j, a.y + dy * t + ny * j);
  }
  g.lineTo(b.x, b.y);
  g.strokePath();
}

/** A ring of chain: dashed thick arcs with a lighter inner line (Scrapper's curse). */
export function chainRing(g: Phaser.GameObjects.Graphics, x: number, y: number, rx: number, ry: number, dark: number, light: number, spin = 0): void {
  const links = 14;
  for (let i = 0; i < links; i++) {
    const a0 = spin + (i / links) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2) / links * 0.7;
    const p0 = { x: x + Math.cos(a0) * rx, y: y + Math.sin(a0) * ry };
    const p1 = { x: x + Math.cos(a1) * rx, y: y + Math.sin(a1) * ry };
    g.lineStyle(i % 2 ? 4 : 5, dark, 0.95);
    g.lineBetween(p0.x, p0.y, p1.x, p1.y);
    g.lineStyle(1.5, light, 0.9);
    g.lineBetween(p0.x, p0.y, p1.x, p1.y);
  }
}
