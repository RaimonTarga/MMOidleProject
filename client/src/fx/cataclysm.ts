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
 * Uninterruptible, **radius 2000**, `oncePerLife` (and, since the boss-lineage
 * redesign, a 22-26 second cast shared with the T3 Final Eruption). It is the single
 * largest attack in the game, and it was casting with `fx: 'frenzy'` — the Gnarled
 * Greatbear's bear-rage aura — and landing with `fx: 'strong-kick'`, a boot stomp.
 * Its own bestiary line promises something "deliberately impossible to mistake for an
 * ordinary attack".
 *
 * Two exports because the ability has two distinct beats, and the cast is by far the
 * more important: the impact is unavoidable at that radius, so the eight seconds of
 * wind-up are the only thing the player can actually act on.
 */

/** The original eight-second wind-up, now the last beat of a longer cast. */
const CRESCENDO_MS = 8000;

/**
 * The wind-up. The redesign made the final strike a 22-26 second DPS race (it was
 * 8 seconds when this effect was authored), so the cast is now two beats:
 *
 *   1. PULSE LOOP — until the last eight seconds, the original's inward-sweeping
 *      rings and ember intake repeat as a pulse whose cadence quickens and whose
 *      embers thicken, so the loop itself reads as time running out.
 *   2. CRESCENDO — the original eight-second wind-up, unchanged: the rings sweep in
 *      one last time and the embers accelerate into the detonation.
 *
 * A core swells across the WHOLE cast. Everything follows the caster and is torn
 * down the moment it is gone: killing the boss mid-cast is the intended way to win
 * the race, and a 20-second effect outliving its caster would read as a bug.
 */
export function fxCataclysmCast(
  scene: GameScene,
  monsterId: string,
  x: number,
  y: number,
  castMs: number,
): void {
  const owned: Phaser.GameObjects.Graphics[] = [];
  const startedAt = scene.time.now;
  const loopMs = Math.max(0, castMs - CRESCENDO_MS);
  const casterPos = (): { x: number; y: number } => {
    const sprite = scene.state.sprite.get(monsterId);
    return sprite ? { x: sprite.x, y: sprite.y } : { x, y };
  };
  const alive = (): boolean => scene.state.sprite.has(monsterId);
  let done = false;

  // A core that swells the entire time — the charge visibly accumulating.
  const core = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  owned.push(core);
  core.fillStyle(MAGMA_CORE, 0.85);
  core.fillCircle(0, 0, 16);
  core.fillStyle(MAGMA, 0.4);
  core.fillCircle(0, 0, 30);
  core.setScale(0.25);
  scene.tweens.add({ targets: core, scaleX: 2.8, scaleY: 2.8, duration: castMs, ease: 'Quad.easeIn' });

  const cleanup = (): void => {
    if (done) return;
    done = true;
    watchdog.remove();
    for (const obj of owned) {
      if (!obj.active) continue;
      scene.tweens.killTweensOf(obj);
      obj.destroy();
    }
    owned.length = 0;
  };

  // Follow the caster, and tear everything down when it is gone or the cast is over.
  const watchdog = scene.time.addEvent({
    delay: 100,
    loop: true,
    callback: () => {
      if (!alive() || scene.time.now - startedAt > castMs + 400) {
        cleanup();
        return;
      }
      const at = casterPos();
      core.setPosition(at.x, at.y);
    },
  });

  const ring = (radius: number, width: number, color: number, alpha: number, sweepMs: number, delay: number): void => {
    const at = casterPos();
    const g = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX);
    owned.push(g);
    g.lineStyle(width, color, alpha);
    g.strokeCircle(0, 0, radius);
    scene.tweens.add({ targets: g, scaleX: 0.12, scaleY: 0.12, duration: sweepMs, delay, ease: 'Quad.easeIn' });
    scene.tweens.add({
      targets: g,
      alpha: 0,
      delay: delay + sweepMs - 300,
      duration: 300,
      onComplete: () => g.destroy(),
    });
  };

  // 1. PULSE LOOP.
  const pulse = (): void => {
    if (done || !alive()) return;
    const elapsed = scene.time.now - startedAt;
    if (elapsed >= loopMs) return;
    const k = loopMs > 0 ? elapsed / loopMs : 1;
    const cycleMs = 2600 - 1300 * k;
    // Never queue tweens into a hidden tab; just keep the clock.
    if (!document.hidden) {
      ring(170 + 40 * k, 4, MAGMA_CORE, 0.6 + 0.3 * k, cycleMs, 0);
      ring(230 + 50 * k, 3, MAGMA, 0.45 + 0.3 * k, cycleMs, 180);
      const at = casterPos();
      burstFx(scene, 'ptx-spark', at.x, at.y, 6 + Math.round(10 * k), 900, {
        tint: MAGMA,
        speed: { min: 30 + 40 * k, max: 90 + 90 * k },
        angle: { min: 0, max: 360 },
        scale: { start: 0.7 + 0.4 * k, end: 0 },
        alpha: { start: 0.85, end: 0 },
        gravityY: -50,
      });
    }
    scene.time.delayedCall(cycleMs, pulse);
  };
  pulse();

  // 2. CRESCENDO — the original wind-up, for the last eight seconds.
  scene.time.delayedCall(loopMs, () => {
    if (done || !alive() || document.hidden) return;
    const crescendoMs = Math.min(CRESCENDO_MS, castMs);
    for (let i = 0; i < 3; i++) {
      ring(150 + i * 60, 5 - i, i === 0 ? MAGMA_CORE : MAGMA, 0.9 - i * 0.2, crescendoMs - i * 260, i * 260);
    }
    for (let beat = 0; beat < 8; beat++) {
      scene.time.delayedCall(beat * (crescendoMs / 8.4), () => {
        if (done || !alive()) return;
        const at = casterPos();
        burstFx(scene, 'ptx-spark', at.x, at.y, 10 + beat * 3, 900, {
          tint: MAGMA,
          speed: { min: 30 + beat * 12, max: 90 + beat * 22 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.8 + beat * 0.07, end: 0 },
          alpha: { start: 0.9, end: 0 },
          gravityY: -50,
        });
      });
    }
  });
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
