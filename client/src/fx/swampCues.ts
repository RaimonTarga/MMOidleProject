import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * SWAMP ability cues.
 *
 * Two hexers (Bog Witch's Wither, Mire Hexer's Plague Hex) were drawing the Ridge
 * Ambusher's arrow tracer, and — the worse case — all three Swamp bosses' pool-spawn
 * signature was landing as `strong-kick`, whose own source comment describes pale
 * STONE dust and flying chips. The lineage's entire identity is turning ground into
 * hazard, and it looked like a rock impact.
 *
 * Shared grammar: sickly green, and everything SETTLES rather than detonating. The
 * swamp accumulates; it does not spike.
 *
 * Deathroll uses small ripples and a narrow wake to keep the crocodile visible.
 */

const ROT = 0x6f9e3c;
const ROT_DARK = 0x3d5a24;
const BILE = 0xb8d44a;

/** A slow curdling bolt that arcs to the target, for the hex casters. */
function hexBolt(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  core: number,
  glow: number,
): void {
  const bolt = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  bolt.fillStyle(glow, 0.45);
  bolt.fillCircle(0, 0, 11);
  bolt.fillStyle(core, 0.9);
  bolt.fillCircle(0, 0, 6);

  // Lobbed, not fired: rises then falls onto the target, which is why it uses a
  // two-stage tween rather than a straight line.
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 42;
  scene.tweens.add({
    targets: bolt,
    x: midX,
    y: midY,
    duration: 150,
    ease: 'Quad.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: bolt,
        x: toX,
        y: toY,
        duration: 150,
        ease: 'Quad.easeIn',
        onComplete: () => {
          bolt.destroy();
          const splat = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
          splat.fillStyle(core, 0.5);
          splat.fillCircle(0, 0, 14);
          scene.tweens.add({
            targets: splat,
            alpha: 0,
            scaleX: 2.3,
            scaleY: 1.7,
            duration: 420,
            ease: 'Sine.easeOut',
            onComplete: () => splat.destroy(),
          });
          burstFx(scene, 'ptx-dot', toX, toY, 11, 560, {
            tint: core,
            speed: { min: 30, max: 110 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.7, end: 0 },
            alpha: { start: 0.9, end: 0 },
            gravityY: 90,
          });
        },
      });
    },
  });
}

/**
 * WITHER — the Bog Witch's anti-recovery hex. Grey-green and draining: motes are
 * pulled INWARD off the victim, because this cue's job is to say "your healing is
 * being taken away", not "you took a hit".
 */
export function fxWither(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  hexBolt(scene, fromX, fromY, toX, toY, 0x8a9a72, ROT_DARK);

  // Draining rings: contract onto the target after the bolt lands.
  scene.time.delayedCall(300, () => {
    for (let i = 0; i < 2; i++) {
      const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      ring.lineStyle(2.5, 0x8a9a72, 0.8);
      ring.strokeCircle(0, 0, 38);
      scene.tweens.add({
        targets: ring,
        scaleX: 0.2,
        scaleY: 0.2,
        alpha: 0,
        delay: i * 130,
        duration: 420,
        ease: 'Cubic.easeIn',
        onComplete: () => ring.destroy(),
      });
    }
  });
}

/** PLAGUE HEX — the Mire Hexer's poison-extending curse. Brighter and more toxic. */
export function fxPlagueHex(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  hexBolt(scene, fromX, fromY, toX, toY, BILE, ROT);

  // Bubbles rising off the landing — the swamp answering.
  scene.time.delayedCall(300, () => {
    burstFx(scene, 'ptx-dot', toX, toY, 9, 700, {
      tint: BILE,
      speed: { min: 15, max: 50 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.85, end: 0 },
      gravityY: -60,
    });
  });
}

/**
 * POOL SPAWN — the impact cue for the Swamp bosses' hazard-creating charged attacks
 * (Grave Toadeater's Bile Pool, Mire-Gorged Behemoth's Corrosive Pool, Rot-Spore
 * Croc-Behemoth's Spore Pool).
 *
 * Anchored on the PLANTED point, so it must read as "this ground is now bad" rather
 * than "something was struck here". The pool itself is a separate server-authoritative
 * ground zone; this is only the moment of its creation. So: no impact flash and no
 * shockwave — the surface swells, breaks, and settles into the footprint.
 */
export function fxPoolSpawn(scene: GameScene, x: number, y: number, radius: number): void {
  // The swell: one dome rising and flattening into the pool's real footprint, so the
  // cue's size teaches the hazard's size.
  const dome = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  dome.fillStyle(ROT, 0.55);
  dome.fillCircle(0, 0, radius * 0.45);
  dome.setScale(0.3, 0.2);
  scene.tweens.add({
    targets: dome,
    scaleX: 2.2,
    scaleY: 1.1,
    alpha: 0,
    duration: 620,
    ease: 'Sine.easeOut',
    onComplete: () => dome.destroy(),
  });

  // Rim creeping outward to the true radius — slow, so it reads as spreading liquid.
  const rim = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  rim.lineStyle(4, BILE, 0.8);
  rim.strokeEllipse(0, 0, radius * 1.4, radius * 0.7);
  rim.setScale(0.25);
  scene.tweens.add({
    targets: rim,
    scaleX: 1,
    scaleY: 1,
    alpha: 0,
    duration: 700,
    ease: 'Cubic.easeOut',
    onComplete: () => rim.destroy(),
  });

  // Gas breaking the surface: rises and lingers, unlike a spark spray.
  burstFx(scene, 'ptx-dot', x, y, 22, 900, {
    tint: BILE,
    speed: { min: 20, max: 90 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.1, end: 0 },
    alpha: { start: 0.8, end: 0 },
    gravityY: -70,
  });
  burstFx(scene, 'ptx-dot', x, y, 14, 700, {
    tint: ROT_DARK,
    speed: { min: 40, max: 140 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 40,
  });
}

/** Quiet surface tension during the ambush wind-up. */
export function fxDeathrollCoil(scene: GameScene, x: number, y: number): void {
  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(2, ROT, 0.5);
  ring.strokeEllipse(0, 0, 76, 34);
  scene.tweens.add({
    targets: ring, scaleX: 0.45, scaleY: 0.45, alpha: 0, duration: 900,
    ease: 'Sine.easeIn', onComplete: () => ring.destroy(),
  });
}

/** A narrow water trail follows the pounce; no impact burst or oversized jaws. */
export function fxDeathrollLunge(
  scene: GameScene, fromX: number, fromY: number, toX: number, toY: number,
): void {
  const wake = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  wake.lineStyle(3, ROT_DARK, 0.35);
  wake.lineBetween(0, 0, toX - fromX, toY - fromY);
  scene.tweens.add({
    targets: wake, alpha: 0, duration: 220,
    onComplete: () => wake.destroy(),
  });
  fxDragWake(scene, toX, toY);
}

/** Small ripples at the victim's feet during the haul. */
export function fxDragWake(scene: GameScene, x: number, y: number): void {
  const ripple = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ripple.lineStyle(2, ROT_DARK, 0.35);
  ripple.strokeEllipse(0, 6, 32, 12);
  scene.tweens.add({
    targets: ripple, scaleX: 1.2, alpha: 0, duration: 350,
    onComplete: () => ripple.destroy(),
  });
}

/** A modest marker at the shallow-water stopping point. */
export function fxDragDestination(
  scene: GameScene, x: number, y: number, durationMs: number,
): void {
  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(2, ROT, 0.4);
  ring.strokeEllipse(0, 0, 48, 22);
  scene.tweens.add({
    targets: ring, alpha: 0, duration: Math.min(700, Math.max(200, durationMs)),
    onComplete: () => ring.destroy(),
  });
}

// ── MIRE LASH (Swamp T2/T3 boss pull; also the Volcanic Magma Shove) ─────────
//
// The pull used to borrow the Trench's current pulse — a small ring on the boss —
// and the player simply snapped to where the drag left them. Nothing read as
// "grabbed and hauled". Three beats now, each doing one job:
//   1. WIND-UP (the cast bar): the throat swells in tightening pulses, so the grab
//      is readable from the whole cast, not only when it lands;
//   2. THE LASH: a thick tongue shoots out to the victim and slaps with a mud burst;
//   3. THE HAUL: it retracts toward the boss, trailing mud, while the victim's sprite
//      slides along the drag (see the `player-knockback` pull branch in combatFx).

export interface LashPalette {
  tongue: number;
  edge: number;
  splat: number[];
}

export const MIRE_LASH_PALETTE: LashPalette = {
  tongue: 0x9c4a6a,
  edge: 0x3a1a2a,
  splat: [0x4a3a28, 0x6b5236, ROT_DARK, ROT],
};

export const MAGMA_SHOVE_PALETTE: LashPalette = {
  tongue: 0xff7a2a,
  edge: 0x5a1a08,
  splat: [0xff9a3a, 0xc2410c, 0x3a2a22, 0xffd27a],
};

/** The throat swelling over the cast: rings that tighten and speed up. */
export function fxMireLashWindup(
  scene: GameScene, x: number, y: number, castMs: number, palette: LashPalette = MIRE_LASH_PALETTE,
): void {
  const pulses = Math.max(2, Math.min(5, Math.round(castMs / 300)));
  for (let i = 0; i < pulses; i++) {
    const at = (castMs * i) / pulses;
    scene.time.delayedCall(at, () => {
      const ring = scene.add.graphics({ x, y: y - 18 }).setDepth(DEPTH.FX);
      ring.lineStyle(4, palette.tongue, 0.85);
      ring.strokeCircle(0, 0, 58 - i * 6);
      ring.fillStyle(palette.edge, 0.25);
      ring.fillCircle(0, 0, 16 + i * 4);
      scene.tweens.add({
        targets: ring, scale: 0.35, alpha: 0, duration: 260,
        onComplete: () => ring.destroy(),
      });
    });
  }
}

/** The tongue out, the slap, and the haul back. */
export function fxMireLash(
  scene: GameScene, fromX: number, fromY: number, toX: number, toY: number,
  palette: LashPalette = MIRE_LASH_PALETTE,
): void {
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  const mouth = { x: fromX, y: fromY - 18 };
  const draw = (tipX: number, tipY: number, thickness: number) => {
    g.clear();
    g.lineStyle(thickness + 6, palette.edge, 0.9);
    g.lineBetween(mouth.x, mouth.y, tipX, tipY);
    g.lineStyle(thickness, palette.tongue, 1);
    g.lineBetween(mouth.x, mouth.y, tipX, tipY);
    g.fillStyle(palette.edge, 0.95);
    g.fillCircle(tipX, tipY, thickness * 0.9 + 3);
    g.fillStyle(palette.tongue, 1);
    g.fillCircle(tipX, tipY, thickness * 0.9);
  };
  const shoot = { t: 0 };
  scene.tweens.add({
    targets: shoot, t: 1, duration: 120, ease: 'Quad.easeOut',
    onUpdate: () => draw(mouth.x + (toX - mouth.x) * shoot.t, mouth.y + (toY - mouth.y) * shoot.t, 11),
    onComplete: () => {
      // THE SLAP.
      burstFx(scene, 'ptx-dot', toX, toY, 26, 520, {
        speed: { min: 60, max: 220 }, angle: { min: 0, max: 360 }, gravityY: 280,
        scale: { start: 1.3, end: 0.1 }, alpha: { start: 0.95, end: 0 }, tint: palette.splat,
      });
      const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      ring.lineStyle(4, palette.tongue, 0.9);
      ring.strokeCircle(0, 0, 22);
      scene.tweens.add({
        targets: ring, scale: 2.2, alpha: 0, duration: 320,
        onComplete: () => ring.destroy(),
      });
      // THE HAUL: the tip rides back toward the boss, shedding mud as it goes.
      const haul = { t: 0 };
      let lastDrop = 0;
      scene.tweens.add({
        targets: haul, t: 1, duration: 420, ease: 'Quad.easeIn',
        onUpdate: () => {
          const x = toX + (mouth.x - toX) * haul.t;
          const y = toY + (mouth.y - toY) * haul.t;
          draw(x, y, 11 - 5 * haul.t);
          if (haul.t - lastDrop > 0.12) {
            lastDrop = haul.t;
            burstFx(scene, 'ptx-dot', x, y + 14, 5, 480, {
              speed: { min: 10, max: 50 }, angle: { min: 200, max: 340 }, gravityY: 200,
              scale: { start: 0.9, end: 0.1 }, alpha: { start: 0.85, end: 0 }, tint: palette.splat,
            });
          }
        },
        onComplete: () => g.destroy(),
      });
    },
  });
}
