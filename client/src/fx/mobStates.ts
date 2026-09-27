/**
 * MOB STATES — drawing helpers for the persistent looks of lasting mob states
 * (premium pass for mobs, 2026-09-27, step A2). The rows that use them live in
 * `auraDefs.ts`; these draw the parts too big to inline there:
 *   BARRIER  a shield / ward bubble that visibly DEPLETES: its rim dims and cracks
 *            spread as the absorb pool drains (`enemyBarrier` on the view);
 *   SHELL    a Snapper's carapace dome closed over its body (`shelled`);
 *   QUILLS   a Barrage's remaining empowered shots, one quill per charge
 *            (`hastedBy.stacks`), spent one by one.
 */
import { MONSTER_DATABASE, type MonsterDefinition, type MonsterView } from '@mmo-idle/shared';
import type { AuraContext } from './auraTypes';
import { drawCracks } from './bossKit';

export interface BarrierStyle {
  fill: number;
  edge: number;
  crack: number;
  shards: number[];
}

const STONE: BarrierStyle = { fill: 0x8a857c, edge: 0xd8d0c0, crack: 0x3a3630, shards: [0x6a655c, 0x8a857c, 0xb0aa9c] };
const SUN: BarrierStyle = { fill: 0xffd060, edge: 0xfff0b0, crack: 0x8a5a10, shards: [0xffd060, 0xfff0b0, 0xe0a030] };
const ICE: BarrierStyle = { fill: 0x9fdcff, edge: 0xe8f8ff, crack: 0x3a6a8a, shards: [0x9fdcff, 0xe8f8ff, 0xffffff] };
const MOLTEN: BarrierStyle = { fill: 0xff7a2a, edge: 0xffc080, crack: 0x3a1a0a, shards: [0xff5a1a, 0xffa040, 0x3a2a24] };
const OBSIDIAN: BarrierStyle = { fill: 0x4a3a5a, edge: 0xb89ae0, crack: 0x1a1024, shards: [0x2a2030, 0x5a4a6a, 0xb89ae0] };
const TRENCH: BarrierStyle = { fill: 0x2f7f9e, edge: 0x9fe8ff, crack: 0x0a2a3a, shards: [0x2f7f9e, 0x9fe8ff, 0xdff3ff] };
const ARCANE: BarrierStyle = { fill: 0x9fb8ff, edge: 0xe0e8ff, crack: 0x2a3a6a, shards: [0x9fb8ff, 0xe0e8ff] };

export const defOf = (c: AuraContext): MonsterDefinition | undefined => {
  const view = c.scene.state.view.get(c.id) as MonsterView | undefined;
  return view ? MONSTER_DATABASE.get(view.monsterTypeId) : undefined;
};

/** Which barrier this mob raises: a low-HP stone ward, a cast shield, or its biome's shield. */
export function barrierStyleOf(def: MonsterDefinition | undefined): BarrierStyle {
  if (!def) return ARCANE;
  const shieldFx = def.monsterAbilities?.find((a) => a.actions.some((x) => x.type === 'shield'))?.fx;
  if (shieldFx === 'volcanic-guard') return MOLTEN;
  if (shieldFx === 'volcanic-shell') return OBSIDIAN;
  if (shieldFx === 'trench-carapace') return TRENCH;
  if (def.lowHealthWard) return STONE;
  if (def.biome === 'desert') return SUN;
  if (def.biome === 'tundra') return ICE;
  return ARCANE;
}

/** 0..1 of the absorb pool left (0 when broken or absent). */
export function barrierIntegrity(c: AuraContext): number {
  const b = (c.scene.state.view.get(c.id) as MonsterView | undefined)?.enemyBarrier;
  return b && b.maxAmount > 0 ? Math.max(0, Math.min(1, b.amount / b.maxAmount)) : 0;
}

const seedOf = (id: string): number => {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 2147483647;
  return 1 + h;
};

/** The bubble: faceted, a glint running round its rim, cracking as it drains. */
export function drawBarrier(g: Phaser.GameObjects.Graphics, c: AuraContext, style: BarrierStyle): void {
  const integrity = barrierIntegrity(c);
  const cx = c.x;
  const cy = c.y - c.h * 0.05;
  const rx = c.w * 0.62;
  const ry = c.h * 0.6;
  const s = c.s;
  g.fillStyle(style.fill, (0.06 + 0.06 * c.pulse) * s);
  g.fillEllipse(cx, cy, rx * 2, ry * 2);
  g.lineStyle(2, style.edge, (0.25 + 0.5 * integrity) * s);
  g.strokeEllipse(cx, cy, rx * 2, ry * 2);
  // Facets: a faint hexagon inside the rim, so it reads as a made thing.
  g.lineStyle(1, style.edge, 0.18 * s * (0.4 + 0.6 * integrity));
  g.beginPath();
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const px = cx + Math.cos(a) * rx * 0.8;
    const py = cy + Math.sin(a) * ry * 0.8;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.strokePath();
  // A glint travelling round the rim.
  const a0 = c.age / 520;
  g.lineStyle(3, 0xffffff, 0.5 * s * (0.3 + 0.7 * integrity));
  g.beginPath();
  g.arc(cx, cy, rx, a0, a0 + 0.5);
  g.strokePath();
  // Damage shows: cracks spread from the top as the pool drains.
  if (integrity < 0.85) {
    drawCracks(g, cx, cy - ry * 0.3, rx, Math.min(1, (1 - integrity) * 1.2), style.crack, 0.7 * s, seedOf(c.id), 6);
  }
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export interface ShellStyle {
  shell: number;
  plate: number;
  rim: number;
  motes: number[];
}

export const MOSS_SHELL: ShellStyle = { shell: 0x3f5530, plate: 0x6f8a4a, rim: 0xa8c078, motes: [0x6f8a4a, 0xa8c078] };
export const PLAGUE_SHELL: ShellStyle = { shell: 0x3a2e48, plate: 0x6a5282, rim: 0x9ad65a, motes: [0x9ad65a, 0x6a9a3a] };

export const shellStyleOf = (def: MonsterDefinition | undefined): ShellStyle =>
  def?.id === 'plague-hydra' ? PLAGUE_SHELL : MOSS_SHELL;

/** A carapace dome over the body; `k` 0..1 is how far it has closed (for the wind-up). */
export function drawShellDome(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  k: number,
  alpha: number,
  style: ShellStyle,
): void {
  const base = y + h * 0.3;
  const rx = w * 0.58;
  const ry = h * 0.62 * k;
  if (ry < 1) return;
  const pts: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI;
    pts.push({ x: x + Math.cos(a) * rx, y: base + Math.sin(a) * ry });
  }
  g.fillStyle(style.shell, 0.92 * alpha);
  g.fillPoints(pts, true);
  // Plates: two ridges and a keel.
  g.lineStyle(2, style.plate, 0.9 * alpha);
  for (const f of [0.45, 0.8]) {
    g.beginPath();
    g.arc(x, base, rx * f, Math.PI * 1.08, Math.PI * 1.92);
    g.strokePath();
  }
  g.lineBetween(x, base, x, base - ry);
  g.lineStyle(2, style.rim, 0.85 * alpha);
  g.lineBetween(x - rx, base, x + rx, base);
}

// ── Barrage quills ───────────────────────────────────────────────────────────

/** One glowing quill per remaining empowered shot, in a small arc over the head. */
export function drawQuills(g: Phaser.GameObjects.Graphics, c: AuraContext, count: number, color: number): void {
  const n = Math.min(6, count);
  const cy = c.y - c.h * 0.62;
  for (let i = 0; i < n; i++) {
    const spread = n === 1 ? 0 : (i / (n - 1) - 0.5) * 0.9;
    const a = -Math.PI / 2 + spread;
    const bob = Math.sin(c.age / 180 + i) * 1.5;
    const px = c.x + Math.cos(a) * 14;
    const py = cy + Math.sin(a) * 6 + bob;
    g.lineStyle(4, color, 0.3 * c.s);
    g.lineBetween(px, py + 6, px, py - 7);
    g.lineStyle(2, 0xf4ffd8, 0.95 * c.s);
    g.lineBetween(px, py + 5, px, py - 6);
  }
}

// ── Primed (the tell before an empowered hit) ────────────────────────────────

/** Accent of the coming empowered hit, by what the mob hits with. */
export function primedAccentOf(def: MonsterDefinition | undefined): number {
  switch (def?.attackStyle) {
    case 'gore': return 0xfff0d0; // horn / tusk
    case 'poison':
    case 'bite-venom': return 0x9ad65a; // venom
    case 'slash':
    case 'claws-light': return 0xff5a4a; // claws
    case 'stonespit': return 0xbfa8ff; // crystal
    case 'bite-trench': return 0x9fe8ff;
    default: return 0xffd060;
  }
}

/**
 * A star-glint gathering at the head, spinning and swelling: "the next one is
 * big". Four long rays and four short, like a blade catching the light.
 */
export function drawPrimedGlint(g: Phaser.GameObjects.Graphics, c: AuraContext, color: number): void {
  const x = c.x + c.w * 0.18;
  const y = c.y - c.h * 0.28;
  const grow = Math.min(1, c.age / 500);
  const r = (6 + 5 * c.pulse) * grow;
  const spin = c.age / 400;
  g.fillStyle(color, 0.35 * c.s);
  g.fillCircle(x, y, r * 0.9);
  for (let i = 0; i < 8; i++) {
    const a = spin + (i / 8) * Math.PI * 2;
    const len = i % 2 === 0 ? r * 2.2 : r * 1.1;
    g.lineStyle(i % 2 === 0 ? 2 : 1.2, i % 2 === 0 ? 0xffffff : color, 0.9 * c.s);
    g.lineBetween(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
  }
  g.fillStyle(0xffffff, 0.95 * c.s);
  g.fillCircle(x, y, 2);
}
