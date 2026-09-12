import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const MAGMA_CORE = 0xfff1c0;
const MAGMA = 0xff7a1a;
const MAGMA_DEEP = 0xa32000;
const ASH = 0x3a2a24;

/**
 * CATACLYSM — Caldera Sovereign's once-per-life ultimate.
 *
 * Eight seconds, uninterruptible, **radius 2000**, `oncePerLife`. It is the single
 * largest attack in the game, and it was casting with `fx: 'frenzy'` — the Gnarled
 * Greatbear's bear-rage aura — and landing with `fx: 'strong-kick'`, a boot stomp.
 * Its own bestiary line promises something "deliberately impossible to mistake for an
 * ordinary attack".
 *
 * Two exports because the ability has two distinct beats, and the cast is by far the
 * more important: the impact is unavoidable at that radius, so the eight seconds of
 * wind-up are the only thing the player can actually act on.
 */

/**
 * The 8-second wind-up. Escalates continuously across the whole cast so a glance at
 * any moment tells you how much time is left — a single flash at the start would be
 * invisible by second six. Ash falls INWARD to the caster, gathering.
 */
export function fxCataclysmCast(scene: GameScene, x: number, y: number): void {
  const CAST_MS = 8000;

  // Three nested rings, each sweeping inward on its own slow cycle and tightening as
  // the cast runs. This is the clock.
  for (let i = 0; i < 3; i++) {
    const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    ring.lineStyle(5 - i, i === 0 ? MAGMA_CORE : MAGMA, 0.9 - i * 0.2);
    ring.strokeCircle(0, 0, 150 + i * 60);
    scene.tweens.add({
      targets: ring,
      scaleX: 0.12,
      scaleY: 0.12,
      duration: CAST_MS,
      delay: i * 260,
      ease: 'Quad.easeIn',
      onComplete: () => ring.destroy(),
    });
    scene.tweens.add({
      targets: ring,
      alpha: 0,
      delay: CAST_MS - 400 + i * 100,
      duration: 400,
    });
  }

  // A core that swells the entire time — the charge visibly accumulating.
  const core = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  core.fillStyle(MAGMA_CORE, 0.85);
  core.fillCircle(0, 0, 16);
  core.fillStyle(MAGMA, 0.4);
  core.fillCircle(0, 0, 30);
  core.setScale(0.25);
  scene.tweens.add({
    targets: core,
    scaleX: 2.8,
    scaleY: 2.8,
    duration: CAST_MS,
    ease: 'Quad.easeIn',
  });
  scene.tweens.add({
    targets: core,
    alpha: 0,
    delay: CAST_MS - 300,
    duration: 300,
    onComplete: () => core.destroy(),
  });

  // Repeating ember intake, accelerating. Eight bursts over the cast rather than one
  // emitter, so the cadence itself communicates the ramp.
  for (let beat = 0; beat < 8; beat++) {
    scene.time.delayedCall(beat * 950, () => {
      burstFx(scene, 'ptx-spark', x, y, 10 + beat * 3, 900, {
        tint: MAGMA,
        speed: { min: 30 + beat * 12, max: 90 + beat * 22 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8 + beat * 0.07, end: 0 },
        alpha: { start: 0.9, end: 0 },
        gravityY: -50,
      });
    });
  }
}

/**
 * The detonation. At radius 2000 this covers effectively the whole arena, so the cue
 * is authored to read as the ARENA changing rather than as a located hit: a white
 * core, a wall of fire thrown outward, and a long ash fall settling afterwards.
 */
export function fxCataclysmImpact(scene: GameScene, x: number, y: number, radius: number): void {
  // Hard white core — brief, so it punctuates instead of blinding.
  const core = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  core.fillStyle(0xffffff, 1);
  core.fillCircle(0, 0, 60);
  scene.tweens.add({
    targets: core,
    alpha: 0,
    scaleX: 4,
    scaleY: 4,
    duration: 420,
    ease: 'Quad.easeOut',
    onComplete: () => core.destroy(),
  });

  // Four expanding fronts at staggered delays: one ring at this radius would read as
  // a thin line, four read as a wall passing through.
  for (let i = 0; i < 4; i++) {
    const front = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    front.lineStyle(22 - i * 4, i === 0 ? MAGMA_CORE : i < 3 ? MAGMA : MAGMA_DEEP, 0.85 - i * 0.15);
    front.strokeCircle(0, 0, radius * 0.12);
    scene.tweens.add({
      targets: front,
      scaleX: 8.5,
      scaleY: 8.5,
      alpha: 0,
      delay: i * 150,
      duration: 1100,
      ease: 'Cubic.easeOut',
      onComplete: () => front.destroy(),
    });
  }

  // Fire lashes thrown outward along the ground.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const lash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    lash.fillStyle(MAGMA, 0.9);
    lash.fillTriangle(0, -9, 150, 0, 0, 9);
    lash.setScale(0.2, 0.5);
    lash.setRotation(a);
    scene.tweens.add({
      targets: lash,
      scaleX: 3.2,
      alpha: 0,
      duration: 780,
      delay: i * 18,
      ease: 'Cubic.easeOut',
      onComplete: () => lash.destroy(),
    });
  }

  burstFx(scene, 'ptx-spark', x, y, 60, 1400, {
    tint: MAGMA_CORE,
    speed: { min: 260, max: 700 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.6, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -40,
  });

  // The aftermath: ash settling for over a second, so the arena feels changed rather
  // than merely flashed at.
  for (let wave = 0; wave < 3; wave++) {
    scene.time.delayedCall(500 + wave * 350, () => {
      burstFx(scene, 'ptx-dot', x, y, 34, 1800, {
        tint: ASH,
        speed: { min: 60, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.2, end: 0 },
        alpha: { start: 0.75, end: 0 },
        gravityY: 70,
      });
    });
  }
}
