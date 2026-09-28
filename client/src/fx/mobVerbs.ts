/**
 * MOB VERBS — basic attacks for the creatures that were sharing `poison` and
 * `impact` (premium pass for mobs, 2026-09-27, step B1). A monster's `attackStyle`
 * is its whole basic-attack animation, so fourteen unrelated swamp, desert, cave
 * and graveyard creatures were all drawing the same green puff, and seven more
 * the same generic bloom. Each gets the verb its sprite actually performs:
 *
 *   sting         scorpions      the tail arcs over the back and jabs down
 *   spider-fang   cave spiders   two hooked fangs close from above
 *   charnel-maul  Charnel Brute  a bone club comes down in a necrotic splash
 *   constrict     Constrictor    coils tighten round the victim, then the fangs
 *   ooze-engulf   Mire Ooze      a lobbed glob splashes over the victim
 *   tongue-lash   Mud Toad       a sticky tongue whips out and snaps back
 *   snap          Snappers       a hard beak slams shut
 *   wisp-touch    Tiny Wisp      a mote of light darts in and sparks
 *   hind-kick     hare, goat     hind legs lash out low in the dust
 *   stone-fist    granite golems a boulder fist drops, the ground cracks
 *
 * Each takes `empowered` and draws a heavier variant for amplified beats.
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { drawCracks, ring } from './bossKit';

type P = { x: number; y: number };

const fade = (scene: GameScene, g: Phaser.GameObjects.Graphics, ms: number, delay = 0): void => {
  scene.tweens.add({ targets: g, alpha: 0, duration: ms, delay, onComplete: () => g.destroy() });
};

/** A point on a quadratic bezier. */
const quad = (a: P, c: P, b: P, t: number): P => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});

// ── sting ─────────────────────────────────────────────────────────────────────

export function fxSting(scene: GameScene, from: P, to: P, empowered: boolean): void {
  const start = { x: from.x - Math.sign(to.x - from.x || 1) * 10, y: from.y - 18 };
  const peak = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - (empowered ? 70 : 52) };
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  const obj = { t: 0 };
  scene.tweens.add({
    targets: obj, t: 1, duration: 140, ease: 'Quad.easeIn',
    onUpdate: () => {
      g.clear();
      g.lineStyle(empowered ? 7 : 5, 0x6a4a20, 0.8);
      g.beginPath();
      for (let i = 0; i <= 12; i++) {
        const p = quad(start, peak, to, (i / 12) * obj.t);
        if (i === 0) g.moveTo(p.x, p.y);
        else g.lineTo(p.x, p.y);
      }
      g.strokePath();
      const tip = quad(start, peak, to, obj.t);
      g.fillStyle(0xe0b060, 1);
      g.fillCircle(tip.x, tip.y, empowered ? 5 : 4);
    },
    onComplete: () => {
      fade(scene, g, 200, 40);
      burstFx(scene, 'ptx-spark', to.x, to.y, empowered ? 10 : 6, 260, {
        tint: [0xfff0c0, 0xe0b060], speed: { min: 60, max: 160 }, angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 },
      });
      // A bead of venom left behind.
      burstFx(scene, 'ptx-dot', to.x, to.y, empowered ? 7 : 4, 520, {
        tint: [0x9ad65a, 0x6f9c3a], speed: { min: 10, max: 50 }, angle: { min: 60, max: 120 },
        scale: { start: 0.7, end: 0.2 }, alpha: { start: 0.9, end: 0 }, gravityY: 260,
      });
    },
  });
}

// ── spider-fang ───────────────────────────────────────────────────────────────

export function fxSpiderFang(scene: GameScene, to: P, empowered: boolean): void {
  const w = empowered ? 1.3 : 1;
  for (const side of [-1, 1]) {
    const fang = scene.add.graphics({ x: to.x + side * 22 * w, y: to.y - 26 * w }).setDepth(DEPTH.FX);
    fang.lineStyle(5 * w, 0x2a1e1a, 0.9);
    fang.beginPath();
    fang.arc(-side * 8 * w, 0, 14 * w, side < 0 ? Math.PI * 1.1 : Math.PI * 1.9, side < 0 ? Math.PI * 0.4 : Math.PI * 0.6, side > 0);
    fang.strokePath();
    fang.lineStyle(2, 0xd8d0c0, 1);
    fang.beginPath();
    fang.arc(-side * 8 * w, 0, 14 * w, side < 0 ? Math.PI * 1.1 : Math.PI * 1.9, side < 0 ? Math.PI * 0.4 : Math.PI * 0.6, side > 0);
    fang.strokePath();
    scene.tweens.add({
      targets: fang, x: to.x + side * 7 * w, y: to.y - 6, duration: 110, ease: 'Quad.easeIn',
      onComplete: () => fade(scene, fang, 180, 40),
    });
  }
  scene.time.delayedCall(110, () =>
    burstFx(scene, 'ptx-dot', to.x, to.y, empowered ? 12 : 7, 480, {
      tint: [0x9ad65a, 0x5a8a2a, 0xd8f0a0], speed: { min: 40, max: 120 }, angle: { min: 200, max: 340 },
      scale: { start: 0.6, end: 0.1 }, alpha: { start: 1, end: 0 }, gravityY: 300,
    }));
}

// ── charnel-maul ─────────────────────────────────────────────────────────────

export function fxCharnelMaul(scene: GameScene, from: P, to: P, empowered: boolean): void {
  const side = Math.sign(to.x - from.x || 1);
  const club = scene.add.graphics({ x: to.x - side * 6, y: to.y - 6 }).setDepth(DEPTH.FX);
  const len = empowered ? 46 : 36;
  club.lineStyle(7, 0xd8d0b8, 1);
  club.lineBetween(0, 0, 0, -len);
  club.fillStyle(0xe8e0d0, 1);
  club.fillCircle(0, -len, empowered ? 9 : 7);
  club.fillCircle(-4, -len + 6, 5);
  club.lineStyle(2, 0x6a9a5a, 0.9);
  club.lineBetween(-3, -len * 0.3, 3, -len * 0.6);
  club.setRotation(-side * 1.4);
  scene.tweens.add({
    targets: club, rotation: side * 0.2, duration: 120, ease: 'Quad.easeIn',
    onComplete: () => {
      fade(scene, club, 200, 60);
      burstFx(scene, 'ptx-dot', to.x, to.y, empowered ? 14 : 9, 520, {
        tint: [0xe8e0d0, 0xb8b0a0], speed: { min: 60, max: 180 }, angle: { min: 200, max: 340 },
        scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 420, rotate: { min: 0, max: 360 },
      });
      burstFx(scene, 'ptx-mist', to.x, to.y, empowered ? 5 : 3, 620, {
        tint: [0x6a9a5a, 0x8fe0a0], speed: { min: 20, max: 60 }, angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 1.2 }, alpha: { start: 0.6, end: 0 },
      });
      if (empowered) ring(scene, to.x, to.y + 10, 0x8fe0a0, { from: 12, scale: 3, width: 3, ms: 300, flat: true });
    },
  });
}

// ── constrict ────────────────────────────────────────────────────────────────

export function fxConstrict(scene: GameScene, to: P, empowered: boolean): void {
  const coils = empowered ? 3 : 2;
  for (let i = 0; i < coils; i++) {
    const c = scene.add.graphics({ x: to.x, y: to.y - 4 - i * 12 }).setDepth(DEPTH.FX);
    c.lineStyle(7, 0x1f5a2a, 0.95);
    c.strokeEllipse(0, 0, 44, 16);
    c.lineStyle(2.5, 0x5fc86a, 1);
    c.strokeEllipse(0, -1, 44, 16);
    c.setScale(1.5).setAlpha(0);
    scene.tweens.add({
      targets: c, scaleX: empowered ? 0.72 : 0.82, scaleY: empowered ? 0.72 : 0.82, alpha: 1,
      duration: 150, delay: i * 40, ease: 'Quad.easeIn',
      onComplete: () => fade(scene, c, empowered ? 420 : 240, 80),
    });
  }
  scene.time.delayedCall(170, () =>
    burstFx(scene, 'ptx-spark', to.x, to.y - 12, empowered ? 8 : 4, 260, {
      tint: [0xe8f0c8, 0x9ad65a], speed: { min: 50, max: 140 }, angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 },
    }));
}

// ── ooze-engulf ──────────────────────────────────────────────────────────────

export function fxOozeEngulf(scene: GameScene, from: P, to: P, empowered: boolean): void {
  const blob = scene.add.graphics({ x: from.x, y: from.y }).setDepth(DEPTH.FX);
  const r = empowered ? 10 : 7;
  blob.fillStyle(0x5a6e2a, 0.95);
  blob.fillEllipse(0, 0, r * 2.4, r * 1.8);
  blob.fillStyle(0xa8c060, 0.9);
  blob.fillCircle(-r * 0.4, -r * 0.3, r * 0.4);
  scene.tweens.add({
    targets: blob, x: to.x, y: to.y - 6, duration: 150, ease: 'Quad.easeIn',
    onComplete: () => {
      blob.destroy();
      burstFx(scene, 'ptx-dot', to.x, to.y, empowered ? 16 : 10, 560, {
        tint: [0x5a6e2a, 0x7f8f3a, 0xa8c060], speed: { min: 50, max: 150 }, angle: { min: 180, max: 360 },
        scale: { start: 0.9, end: 0.3 }, alpha: { start: 1, end: 0 }, gravityY: 380,
      });
      const pool = scene.add.graphics({ x: to.x, y: to.y + 12 }).setDepth(DEPTH.SPRITE - 1);
      pool.fillStyle(0x4a5a22, 0.5);
      pool.fillEllipse(0, 0, empowered ? 50 : 36, empowered ? 18 : 13);
      fade(scene, pool, 500, 300);
    },
  });
}

// ── tongue-lash ──────────────────────────────────────────────────────────────

export function fxTongueLash(scene: GameScene, from: P, to: P, empowered: boolean): void {
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  const mouth = { x: from.x + Math.sign(to.x - from.x || 1) * 8, y: from.y - 4 };
  const obj = { t: 0 };
  const draw = (): void => {
    g.clear();
    const tip = { x: mouth.x + (to.x - mouth.x) * obj.t, y: mouth.y + (to.y - 8 - mouth.y) * obj.t };
    g.lineStyle(empowered ? 6 : 4.5, 0xc0506a, 1);
    g.lineBetween(mouth.x, mouth.y, tip.x, tip.y);
    g.fillStyle(0xe07a90, 1);
    g.fillCircle(tip.x, tip.y, empowered ? 6 : 4.5);
  };
  scene.tweens.add({
    targets: obj, t: 1, duration: 90, ease: 'Quad.easeOut', onUpdate: draw,
    onComplete: () => {
      burstFx(scene, 'ptx-dot', to.x, to.y - 6, empowered ? 12 : 7, 480, {
        tint: [0x6a5236, 0x8a6e48, 0x6f9c3a], speed: { min: 40, max: 130 }, angle: { min: 0, max: 360 },
        scale: { start: 0.7, end: 0.2 }, alpha: { start: 1, end: 0 }, gravityY: 320,
      });
      scene.tweens.add({ targets: obj, t: 0, duration: 110, ease: 'Quad.easeIn', onUpdate: draw, onComplete: () => g.destroy() });
    },
  });
}

// ── snap ─────────────────────────────────────────────────────────────────────

export function fxSnap(scene: GameScene, to: P, empowered: boolean): void {
  const w = empowered ? 1.3 : 1;
  for (const dir of [-1, 1]) {
    const beak = scene.add.graphics({ x: to.x, y: to.y - 10 + dir * 16 * w }).setDepth(DEPTH.FX);
    beak.fillStyle(0x3a3a2a, 0.95);
    beak.fillTriangle(-16 * w, 0, 16 * w, 0, 10 * w, -dir * 9 * w);
    beak.lineStyle(2, 0xd8d0a0, 1);
    beak.lineBetween(-16 * w, 0, 16 * w, 0);
    scene.tweens.add({
      targets: beak, y: to.y - 10 + dir * 2, duration: 70, ease: 'Quad.easeIn',
      onComplete: () => fade(scene, beak, 180, 50),
    });
  }
  scene.time.delayedCall(70, () =>
    burstFx(scene, 'ptx-spark', to.x, to.y - 10, empowered ? 10 : 6, 240, {
      tint: [0xfff4d0, 0xd8d0a0], speed: { min: 60, max: 150 }, angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 },
    }));
}

// ── wisp-touch ───────────────────────────────────────────────────────────────

export function fxWispTouch(scene: GameScene, from: P, to: P): void {
  const mote = scene.add.graphics({ x: from.x, y: from.y - 6 }).setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
  mote.fillStyle(0xbfe8ff, 0.8);
  mote.fillCircle(0, 0, 5);
  mote.fillStyle(0xffffff, 1);
  mote.fillCircle(0, 0, 2);
  scene.tweens.add({
    targets: mote, x: to.x, y: to.y - 8, duration: 160, ease: 'Sine.easeInOut',
    onComplete: () => {
      mote.destroy();
      burstFx(scene, 'ptx-spark', to.x, to.y - 8, 6, 320, {
        tint: [0xbfe8ff, 0xffffff], speed: { min: 20, max: 80 }, angle: { min: 0, max: 360 },
        scale: { start: 0.4, end: 0 }, alpha: { start: 1, end: 0 },
      });
    },
  });
}

// ── hind-kick ────────────────────────────────────────────────────────────────

export function fxHindKick(scene: GameScene, from: P, to: P, empowered: boolean): void {
  const side = Math.sign(to.x - from.x || 1);
  for (let i = 0; i < 2; i++) {
    const hoof = scene.add.graphics({ x: to.x - side * 10, y: to.y + 4 + i * 6 }).setDepth(DEPTH.FX);
    hoof.lineStyle(empowered ? 5 : 4, 0xf0e6cc, 0.95);
    // A short sweep up and back, mirrored for the side the kick comes from.
    const a0 = side > 0 ? Math.PI * 0.9 : Math.PI * 0.1;
    const a1 = side > 0 ? Math.PI * 1.6 : -Math.PI * 0.6;
    hoof.beginPath();
    hoof.arc(0, 0, empowered ? 20 : 15, a0, a1, side < 0);
    hoof.strokePath();
    hoof.setScale(0.5).setAlpha(0.9);
    scene.tweens.add({
      targets: hoof, scaleX: 1.2, scaleY: 1.2, x: to.x + side * 6, alpha: 0,
      duration: 200, delay: i * 50, ease: 'Quad.easeOut', onComplete: () => hoof.destroy(),
    });
  }
  burstFx(scene, 'ptx-dot', to.x, to.y + 14, empowered ? 12 : 7, 420, {
    tint: [0xb9a582, 0xd8c8a4], speed: { min: 40, max: 130 },
    angle: side > 0 ? { min: 290, max: 360 } : { min: 180, max: 250 },
    scale: { start: 0.8, end: 0.2 }, alpha: { start: 0.8, end: 0 }, gravityY: 300,
  });
}

// ── stone-fist ───────────────────────────────────────────────────────────────

export interface FistPalette {
  fist: number;
  lit: number;
  crack: number;
  debris: number[];
}

const GRANITE: FistPalette = { fist: 0x5a534c, lit: 0x8a837a, crack: 0x2a2520, debris: [0x5a534c, 0x8a837a, 0xb0a898] };

export function fxStoneFist(scene: GameScene, to: P, empowered: boolean, palette: FistPalette = GRANITE): void {
  const r = empowered ? 16 : 12;
  const fist = scene.add.graphics({ x: to.x, y: to.y - 60 }).setDepth(DEPTH.FX);
  fist.fillStyle(palette.fist, 1);
  fist.fillCircle(0, 0, r);
  fist.fillStyle(palette.lit, 1);
  fist.fillCircle(-r * 0.3, -r * 0.3, r * 0.55);
  fist.lineStyle(2, palette.crack, 1);
  fist.lineBetween(-r * 0.5, r * 0.1, r * 0.4, r * 0.3);
  scene.tweens.add({
    targets: fist, y: to.y - 4, duration: 110, ease: 'Quad.easeIn',
    onComplete: () => {
      fade(scene, fist, 160, 40);
      const cracks = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
      drawCracks(cracks, to.x, to.y + 12, empowered ? 46 : 32, 1, palette.crack, 0.7, 11 + Math.floor(Math.random() * 999), 6);
      fade(scene, cracks, 500, 300);
      burstFx(scene, 'ptx-dot', to.x, to.y + 8, empowered ? 16 : 10, 520, {
        tint: palette.debris, speed: { min: 60, max: 180 }, angle: { min: 190, max: 350 },
        scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 420,
      });
    },
  });
}

