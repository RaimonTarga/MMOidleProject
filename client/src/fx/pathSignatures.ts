/**
 * PATH SIGNATURES — the stage-3 layer of the attack progression (attackFlair.ts):
 * once a player picks a tier-3 specialization, every basic hit carries that path's
 * own mark on top of the class/range attack (2026-09-27).
 *
 * Before this, ~23 of the 45 specializations looked exactly like their range pick,
 * so the most important choice in the tree was invisible. Each row below names a
 * motif (a small renderer) and the path's colour. Specializations that already
 * REPLACE their whole attack (Melter's laser, Sniper's shell, Stormdancer's dagger,
 * Equinox, Swiftblade, Duelist, Dualslinger's alt round, Blunderbuss pellets, ...)
 * never reach this layer: it is only called from the ordinary attack branch. Paths
 * with a full stateful attack (Berserker, Juggernaut, Justicar, Venomslinger) live
 * in bespokePaths.ts instead.
 *
 * Empowered hits draw the motif bigger; from ascension T3 they also ring out in the
 * path colour. Summoner paths are absent by design (the formation is the attack).
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { drawSigil, ring } from './bossKit';
import { flairCount, type AttackFlair } from './attackFlair';

type P = { x: number; y: number };

interface Hit {
  scene: GameScene;
  from: P;
  to: P;
  empowered: boolean;
  flair: AttackFlair;
  /** Size multiplier: flair scale, and bigger on an empowered hit. */
  k: number;
  color: number;
  accent: number;
  /** A per-path detail (sigil points, direction, ...). */
  n?: number;
}

type Motif = (h: Hit) => void;

const fadeOut = (scene: GameScene, g: Phaser.GameObjects.Graphics, ms: number, grow = 1): void => {
  scene.tweens.add({
    targets: g, alpha: 0, scaleX: grow, scaleY: grow, duration: ms, ease: 'Quad.easeOut',
    onComplete: () => g.destroy(),
  });
};
const angleOf = (h: Hit): number => Math.atan2(h.to.y - h.from.y, h.to.x - h.from.x);

// ── Motifs ────────────────────────────────────────────────────────────────────

/** Two delayed ghost arcs trailing the hit: rhythm (Maestro), reverberation. */
const echo: Motif = (h) => {
  const a = angleOf(h) + Math.PI / 2;
  for (let i = 1; i <= 2; i++) {
    h.scene.time.delayedCall(i * 70, () => {
      const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setRotation(a);
      g.lineStyle(3 - i * 0.8, h.color, 0.75 - i * 0.2);
      g.beginPath();
      g.arc(-10 * i, 0, 30 * h.k, -0.9, 0.9);
      g.strokePath();
      fadeOut(h.scene, g, 220, 1.2);
    });
  }
};

/** A water crescent rolling through the target, throwing droplets (Wavecrest). */
const wave: Motif = (h) => {
  const a = angleOf(h);
  const g = h.scene.add.graphics({ x: h.to.x - Math.cos(a) * 26, y: h.to.y - Math.sin(a) * 26 })
    .setDepth(DEPTH.FX).setRotation(a);
  g.lineStyle(7 * h.k, h.color, 0.55);
  g.beginPath();
  g.arc(0, 0, 26 * h.k, -1.1, 1.1);
  g.strokePath();
  g.lineStyle(2.5, h.accent, 0.95);
  g.beginPath();
  g.arc(2, 0, 26 * h.k, -1.0, 1.0);
  g.strokePath();
  h.scene.tweens.add({
    targets: g, x: h.to.x + Math.cos(a) * 20, y: h.to.y + Math.sin(a) * 20, alpha: 0,
    duration: 280, ease: 'Quad.easeOut', onComplete: () => g.destroy(),
  });
  burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y, flairCount(8, h.flair), 460, {
    tint: [h.color, h.accent], speed: { min: 50, max: 150 }, angle: { min: 200, max: 340 },
    scale: { start: 0.6, end: 0.1 }, alpha: { start: 1, end: 0 }, gravityY: 380,
  });
};

/** A sigil stamped over the target and sinking into it (Justicar, Cultist, ...). */
const sigil: Motif = (h) => {
  const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y - 34 }).setDepth(DEPTH.FX + 1);
  drawSigil(g, 0, 0, 11 * h.k, 1, h.color, 0.95, Math.random() * Math.PI, h.n ?? 5);
  g.setScale(1.4).setAlpha(0);
  h.scene.tweens.add({
    targets: g, scaleX: 1, scaleY: 1, alpha: 1, duration: 90, ease: 'Quad.easeOut',
    onComplete: () => h.scene.tweens.add({
      targets: g, y: h.to.y - 8, scaleX: 0.4, scaleY: 0.4, alpha: 0, duration: 220, delay: 60,
      ease: 'Quad.easeIn', onComplete: () => g.destroy(),
    }),
  });
};

/** Embers rising off the wound, a heat ring under it (Berserker, Pyromancer, ...). */
const embers: Motif = (h) => {
  burstFx(h.scene, 'ptx-spark', h.to.x, h.to.y, flairCount(10, h.flair), 620, {
    tint: [h.color, h.accent], speed: { min: 30, max: 110 }, angle: { min: 240, max: 300 },
    scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: -140,
  });
  const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y + 10 }).setDepth(DEPTH.SPRITE - 1);
  g.lineStyle(2, h.color, 0.6);
  g.strokeEllipse(0, 0, 36 * h.k, 13 * h.k);
  fadeOut(h.scene, g, 320, 1.6);
};

/** A crimson spray and a thin wound line (Hemomancer, Assassin-adjacent). */
const blood: Motif = (h) => {
  const a = angleOf(h) + Math.PI / 2 + 0.5;
  const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setRotation(a);
  g.lineStyle(2.5, h.color, 0.95);
  g.lineBetween(-18 * h.k, 0, 18 * h.k, 0);
  fadeOut(h.scene, g, 300);
  burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y, flairCount(10, h.flair), 480, {
    tint: [h.color, h.accent], speed: { min: 60, max: 170 },
    angle: { min: (angleOf(h) * 180) / Math.PI - 40, max: (angleOf(h) * 180) / Math.PI + 40 },
    scale: { start: 0.6, end: 0.1 }, alpha: { start: 1, end: 0 }, gravityY: 420,
  });
};

/** Rubble kicked up in a ring on the ground (Juggernaut, Destroyer). */
const quake: Motif = (h) => {
  const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y + 12 }).setDepth(DEPTH.SPRITE - 1);
  g.lineStyle(3, h.color, 0.7);
  g.strokeEllipse(0, 0, 30 * h.k, 11 * h.k);
  fadeOut(h.scene, g, 360, 2.2);
  burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y + 10, flairCount(12, h.flair), 520, {
    tint: [h.color, h.accent], speed: { min: 60, max: 170 }, angle: { min: 210, max: 330 },
    scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 460,
  });
};

/** Short forked crackles jumping around the target (Shockblade, Dynamo, Surge, ...). */
const shock: Motif = (h) => {
  const g = h.scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
  const arcs = h.empowered ? 4 : 3;
  for (let i = 0; i < arcs; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (18 + Math.random() * 14) * h.k;
    let x = h.to.x;
    let y = h.to.y;
    g.lineStyle(1.8, i % 2 ? h.accent : h.color, 1);
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 1; s <= 3; s++) {
      x = h.to.x + Math.cos(a) * r * (s / 3) + (Math.random() - 0.5) * 8;
      y = h.to.y + Math.sin(a) * r * (s / 3) + (Math.random() - 0.5) * 8;
      g.lineTo(x, y);
    }
    g.strokePath();
  }
  fadeOut(h.scene, g, 160);
};

/** A burst of jagged scrap sparks thrown one way (Scrapper, Sunderer). */
const rend: Motif = (h) => {
  const deg = (angleOf(h) * 180) / Math.PI;
  burstFx(h.scene, 'ptx-spark', h.to.x, h.to.y, flairCount(12, h.flair), 300, {
    tint: [h.color, h.accent], speed: { min: 140, max: 320 }, angle: { min: deg - 25, max: deg + 25 },
    scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 }, rotate: { min: 0, max: 360 },
  });
  const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setRotation(angleOf(h));
  g.lineStyle(2, h.accent, 0.9);
  for (const off of [-6, 0, 6]) g.lineBetween(-14 * h.k, off, 14 * h.k, off * 0.4);
  fadeOut(h.scene, g, 200);
};

/** Concentric rings reverberating out of the target (Reverb). */
const rings: Motif = (h) => {
  for (let i = 0; i < 3; i++) {
    ring(h.scene, h.to.x, h.to.y, i % 2 ? h.accent : h.color, {
      from: 10 * h.k, scale: 2.6, width: 2, ms: 300, alpha: 0.75, delay: i * 70,
    });
  }
};

/** A hexagonal ward glinting over the attacker (Stalwart). */
const aegis: Motif = (h) => {
  const g = h.scene.add.graphics({ x: h.from.x, y: h.from.y - 4 }).setDepth(DEPTH.FX);
  g.lineStyle(2, h.color, 0.9);
  g.beginPath();
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * 20 * h.k;
    const y = Math.sin(a) * 24 * h.k;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.strokePath();
  g.fillStyle(h.color, 0.12);
  g.fillCircle(0, 0, 18 * h.k);
  fadeOut(h.scene, g, 300, 1.15);
};

/** A ring of holy light coming down over the target (Devout Priest, Channeler). */
const halo: Motif = (h) => {
  const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y - 40 }).setDepth(DEPTH.FX);
  g.lineStyle(2.5, h.color, 0.95);
  g.strokeEllipse(0, 0, 30 * h.k, 10 * h.k);
  h.scene.tweens.add({
    targets: g, y: h.to.y + 6, alpha: 0, duration: 300, ease: 'Quad.easeIn', onComplete: () => g.destroy(),
  });
  burstFx(h.scene, 'ptx-spark', h.to.x, h.to.y, flairCount(6, h.flair), 420, {
    tint: [h.color, 0xffffff], speed: { min: 20, max: 60 }, angle: { min: 250, max: 290 },
    scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: -60,
  });
};

/** A dark after-slash and a puff of smoke (Assassin). */
const shadow: Motif = (h) => {
  const a = angleOf(h) - Math.PI / 2 + 0.6;
  h.scene.time.delayedCall(60, () => {
    const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX).setRotation(a);
    g.lineStyle(4 * h.k, h.color, 0.85);
    g.lineBetween(-22 * h.k, 0, 22 * h.k, 0);
    g.lineStyle(1.5, h.accent, 0.9);
    g.lineBetween(-20 * h.k, 0, 20 * h.k, 0);
    fadeOut(h.scene, g, 220);
  });
  burstFx(h.scene, 'ptx-mist', h.to.x, h.to.y, 2, 520, {
    tint: [h.color], speed: { min: 10, max: 40 }, scale: { start: 0.5, end: 1.1 }, alpha: { start: 0.5, end: 0 },
  });
};

/** Motes of light spiralling up (Transcendant) or in (Invoker, Aetherist: n = -1). */
const motes: Motif = (h) => {
  const inward = (h.n ?? 1) < 0;
  const count = flairCount(8, h.flair);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = 30 * h.k;
    const m = h.scene.add.graphics({
      x: h.to.x + (inward ? Math.cos(a) * r : 0), y: h.to.y + (inward ? Math.sin(a) * r * 0.6 : 0),
    }).setDepth(DEPTH.FX);
    m.fillStyle(i % 2 ? h.accent : h.color, 1);
    m.fillCircle(0, 0, 2.2);
    h.scene.tweens.add({
      targets: m,
      x: inward ? h.to.x : h.to.x + Math.cos(a) * r * 0.7,
      y: inward ? h.to.y : h.to.y - 26 + Math.sin(a) * 6,
      alpha: 0, duration: 360, ease: inward ? 'Quad.easeIn' : 'Sine.easeOut',
      onComplete: () => m.destroy(),
    });
  }
};

/** Ice shards bursting out (Icebreaker) or closing in (Winter Warden: n = -1). */
const shards: Motif = (h) => {
  const inward = (h.n ?? 1) < 0;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
    const far = 30 * h.k;
    const s = h.scene.add.graphics({
      x: h.to.x + (inward ? Math.cos(a) * far : 0), y: h.to.y + (inward ? Math.sin(a) * far : 0),
    }).setDepth(DEPTH.FX).setRotation(a);
    s.fillStyle(i % 2 ? h.accent : h.color, 0.95);
    s.fillTriangle(-3, -2, -3, 2, 7, 0);
    h.scene.tweens.add({
      targets: s,
      x: inward ? h.to.x : h.to.x + Math.cos(a) * far,
      y: inward ? h.to.y : h.to.y + Math.sin(a) * far,
      alpha: 0, duration: 260, ease: inward ? 'Quad.easeIn' : 'Quad.easeOut',
      onComplete: () => s.destroy(),
    });
  }
};

/** A gust curling round the target (Wind Spirit, Tempest). */
const wind: Motif = (h) => {
  const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX);
  for (let i = 0; i < 2; i++) {
    g.lineStyle(2 - i * 0.6, i ? h.accent : h.color, 0.85);
    g.beginPath();
    g.arc(0, 0, (18 + i * 10) * h.k, i * 2, i * 2 + 3.6);
    g.strokePath();
  }
  h.scene.tweens.add({
    targets: g, rotation: 2.4, alpha: 0, scaleX: 1.4, scaleY: 1.4, duration: 340,
    ease: 'Quad.easeOut', onComplete: () => g.destroy(),
  });
};

/** Venom droplets and a small bubbling splash (Venomslinger). */
const venom: Motif = (h) => {
  burstFx(h.scene, 'ptx-dot', h.to.x, h.to.y, flairCount(9, h.flair), 520, {
    tint: [h.color, h.accent], speed: { min: 40, max: 130 }, angle: { min: 200, max: 340 },
    scale: { start: 0.7, end: 0.2 }, alpha: { start: 1, end: 0 }, gravityY: 360,
  });
  for (let i = 0; i < 3; i++) {
    const b = h.scene.add.graphics({ x: h.to.x + (Math.random() - 0.5) * 20, y: h.to.y + 8 }).setDepth(DEPTH.FX);
    b.lineStyle(1.5, h.accent, 0.9);
    b.strokeCircle(0, 0, 3 + Math.random() * 2);
    h.scene.tweens.add({
      targets: b, y: b.y - 18, alpha: 0, duration: 420, delay: i * 60, onComplete: () => b.destroy(),
    });
  }
};

/** A void implosion: dark ring snapping inward (Voidwalker). */
const voidPull: Motif = (h) => {
  const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX);
  g.lineStyle(3, h.color, 0.9);
  g.strokeCircle(0, 0, 26 * h.k);
  g.fillStyle(0x10061c, 0.5);
  g.fillCircle(0, 0, 8 * h.k);
  h.scene.tweens.add({
    targets: g, scaleX: 0.2, scaleY: 0.2, alpha: 0.2, duration: 200, ease: 'Quad.easeIn',
    onComplete: () => g.destroy(),
  });
  motes({ ...h, n: -1, color: h.accent });
};

/** A crosshair snapping onto the target (Bounty hunter). */
const reticle: Motif = (h) => {
  const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX + 1);
  const r = 14 * h.k;
  g.lineStyle(1.8, h.color, 1);
  g.strokeCircle(0, 0, r);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    g.lineBetween(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5);
  }
  g.setScale(1.8).setRotation(0.6);
  h.scene.tweens.add({
    targets: g, scaleX: 1, scaleY: 1, rotation: 0, duration: 110, ease: 'Quad.easeOut',
    onComplete: () => fadeOut(h.scene, g, 200),
  });
};

/** Muzzle smoke and an ejected casing at the shooter (Warmonger, Desperado, ...). */
const smoke: Motif = (h) => {
  const a = angleOf(h);
  const mx = h.from.x + Math.cos(a) * 14;
  const my = h.from.y + Math.sin(a) * 14 - 4;
  burstFx(h.scene, 'ptx-mist', mx, my, h.empowered ? 3 : 2, 560, {
    tint: [0xb0aaa0, h.accent], speed: { min: 10, max: 40 }, angle: { min: 240, max: 300 },
    scale: { start: 0.35, end: 0.9 * h.k }, alpha: { start: 0.5, end: 0 }, gravityY: -40,
  });
  const c = h.scene.add.graphics({ x: h.from.x, y: h.from.y - 6 }).setDepth(DEPTH.FX);
  c.fillStyle(h.color, 1);
  c.fillRect(-2, -1, 4, 2);
  const side = Math.cos(a) >= 0 ? -1 : 1;
  h.scene.tweens.add({
    targets: c, x: c.x + side * 18, y: c.y + 12, rotation: 6, alpha: 0, duration: 380,
    ease: 'Quad.easeOut', onComplete: () => c.destroy(),
  });
};

// ── The table: every tier-3 path that keeps the ordinary attack ─────────────

interface Signature {
  motif: Motif;
  color: number;
  accent: number;
  n?: number;
}

const SIGNATURES: Record<string, Signature> = {
  // Striker
  // Squire
  'cooldown-heavy-t3-c': { motif: halo, color: 0xfff0a0, accent: 0xffffff }, // Devout Priest
  // Apprentice
  'dot-balanced-t3-a': { motif: embers, color: 0xff8a3a, accent: 0xffe08a }, // Pyromancer
  'dot-balanced-t3-b': { motif: sigil, color: 0xff6a1a, accent: 0xffd08a, n: 3 }, // Firebrand
  'dot-balanced-t3-c': { motif: embers, color: 0xff4a1a, accent: 0x5a4a44 }, // Cinder Lord
  'dot-heavy-t3-a': { motif: shards, color: 0xbfe8ff, accent: 0xffffff, n: 1 }, // Icebreaker
  'dot-heavy-t3-b': { motif: shards, color: 0x9fdcff, accent: 0xe8f8ff, n: -1 }, // Winter Warden
  'dot-heavy-t3-c': { motif: wind, color: 0xd8f0ff, accent: 0x9fdcff }, // Wind Spirit
  'dot-light-t3-b': { motif: sigil, color: 0x8a5ad0, accent: 0xd0b0ff, n: 5 }, // Cultist
  'dot-light-t3-c': { motif: sigil, color: 0xd0e060, accent: 0xffffff, n: 8 }, // Zealot
  // Spirit (Equinox and Stormdancer replace their attack)
  'energy-balanced-t3-b': { motif: shock, color: 0xa0c8ff, accent: 0xffffff }, // Stormbringer
  'energy-balanced-t3-c': { motif: motes, color: 0xc8a0ff, accent: 0xffffff, n: -1 }, // Aetherist
  'energy-heavy-t3-a': { motif: voidPull, color: 0x8a5ad0, accent: 0xd0b0ff }, // Voidwalker
  'energy-heavy-t3-b': { motif: motes, color: 0xff9ad0, accent: 0xfff0ff, n: -1 }, // Invoker
  'energy-heavy-t3-c': { motif: wind, color: 0x7fb0ff, accent: 0xffffff }, // Tempest
  'energy-light-t3-b': { motif: shock, color: 0xfff07a, accent: 0xffffff }, // Surge
  'energy-light-t3-c': { motif: halo, color: 0xfff0a0, accent: 0xffffff }, // Channeler
  // Slinger (Melter, Sniper, Blunderbuss replace their attack)
  'reload-balanced-t3-a': { motif: reticle, color: 0xff8833, accent: 0xffffff }, // Bounty hunter
  'reload-balanced-t3-c': { motif: smoke, color: 0xd8c080, accent: 0x8ab0ff }, // Dualslinger
  'reload-heavy-t3-b': { motif: smoke, color: 0xd8a040, accent: 0xff6a3a }, // Warmonger
  'reload-heavy-t3-c': { motif: smoke, color: 0xb0a090, accent: 0x6a6258 }, // Cannoneer
  'reload-light-t3-a': { motif: smoke, color: 0xd8c080, accent: 0xff4433 }, // Duelist
  'reload-light-t3-b': { motif: smoke, color: 0xffc040, accent: 0xffe0a0 }, // Desperado
};

/** Whether this specialization has a signature layer. */
export const hasPathSignature = (specId: string | undefined): boolean =>
  specId !== undefined && specId in SIGNATURES;

/**
 * Draw the specialization's signature over an ordinary basic hit. A no-op below
 * stage 3 and for paths without a row.
 */
export function playPathSignature(
  scene: GameScene,
  flair: AttackFlair | undefined,
  from: P,
  to: P,
  empowered: boolean,
): void {
  if (!flair || flair.stage < 3 || !flair.specId) return;
  const sig = SIGNATURES[flair.specId];
  if (!sig) return;
  const k = flair.scale * (empowered ? 1.35 : 1);
  sig.motif({ scene, from, to, empowered, flair, k, color: sig.color, accent: sig.accent, n: sig.n });
  // Ascended empowered hits ring out in the path's colour.
  if (empowered && flair.ascension >= 3) {
    ring(scene, to.x, to.y, sig.color, { from: 14, scale: 3.4 + 0.4 * (flair.ascension - 3), width: 3, ms: 360, alpha: 0.85 });
  }
}
