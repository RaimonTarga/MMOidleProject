/**
 * SWAMP bosses, animated (premium pass, 2026-09-27) — the rot arena.
 *
 *   BILE POOL  it swells up, gurgling, then spews a stream of bile onto the circle
 *              (the ordinary pool splash then plays where it lands).
 *   MIRE SPIT  it rears back and lobs a glob that lands as the circle resolves.
 *   BILE RAIN  it heaves, throwing globs skyward; each falls on its circle (drawn by
 *              the zone renderer) and splats into a pool.
 *   LASH       it lunges into the tongue grab (the tongue itself is swampCues).
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { bodyPose, posePath, releasePose, tweenPose } from './bodyPose';
import { impact } from './impactFeel';
import { registerWindup, spriteAt, type Pt } from './windups';
import { dirTo, lob, ring } from './bossKit';

const BILE = 0x8ec43a;
const BILE_DEEP = 0x4f7a1c;
const BILE_LIT = 0xd4f07a;

function drawGlob(g: Phaser.GameObjects.Graphics, color = BILE, size = 1): void {
  g.fillStyle(BILE_DEEP, 0.95);
  g.fillCircle(0, 0, 8 * size);
  g.fillStyle(color, 1);
  g.fillCircle(-1.5 * size, -1.5 * size, 6 * size);
  g.fillStyle(BILE_LIT, 0.9);
  g.fillCircle(-3 * size, -3 * size, 2 * size);
}

/** Bile Pool wind-up: the body swells, bubbles at the mouth. Resolves on the pool. */
export function fxBileSpewWindup(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  tweenPose(scene, id, { sx: 1.16, sy: 1.12, lift: 4 }, castMs * 0.9, 'Sine.easeOut');
  bodyPose(scene, id).tremble = 0.5;
  const beats = Math.max(2, Math.floor(castMs / 180));
  for (let i = 0; i < beats; i++) {
    scene.time.delayedCall(i * (castMs / beats), () => {
      const p = spriteAt(scene, id);
      if (!p) return;
      burstFx(scene, 'ptx-dot', p.x + (Math.random() - 0.5) * 20, p.y - 14, 3, 420, {
        tint: [BILE, BILE_LIT],
        speed: { min: 10, max: 40 },
        angle: { min: 240, max: 300 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.9, end: 0 },
        gravityY: 60,
      });
    });
  }
  registerWindup(scene, id, {
    fire: (at) => {
      bodyPose(scene, id).tremble = 0;
      const p = spriteAt(scene, id) ?? me;
      const to = at ?? p;
      const d = dirTo(p, to);
      posePath(scene, id, [
        { sx: 0.9, sy: 0.9, lift: 0, rot: Math.sign(d.x || 1) * 0.12, ms: 90, ease: 'Quad.easeIn' },
        { sx: 1, sy: 1, rot: 0, ms: 320, ease: 'Back.easeOut' },
      ]);
      // A quick stream of globs from the mouth to the circle.
      for (let i = 0; i < 4; i++) {
        scene.time.delayedCall(i * 30, () =>
          lob(scene, { x: p.x + d.x * 20, y: p.y - 10 }, {
            x: to.x + (Math.random() - 0.5) * 30, y: to.y + (Math.random() - 0.5) * 20,
          }, 170, 40, (g) => drawGlob(g, BILE, 0.8)),
        );
      }
      return 'continue';
    },
    cancel: () => {
      bodyPose(scene, id).tremble = 0;
      releasePose(scene, id);
    },
  }, { fx: 'pool-spawn' });
}

/** Mire / Spore Spit wind-up: it rears back; the glob lands as the circle resolves. */
export function fxSpitWindup(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  tweenPose(scene, id, { sx: 0.92, sy: 1.12, lift: 6 }, Math.min(400, castMs * 0.5), 'Quad.easeOut');
  // The glob leaves at once and flies for the whole telegraph.
  scene.time.delayedCall(Math.min(400, castMs * 0.5), () => {
    posePath(scene, id, [
      { sx: 1.12, sy: 0.9, lift: 0, ms: 90, ease: 'Quad.easeIn' },
      { sx: 1, sy: 1, ms: 300, ease: 'Back.easeOut' },
    ]);
  });
  registerWindup(scene, id, {
    fire: () => 'continue',
    cancel: () => releasePose(scene, id),
  }, { fx: 'pool-spawn', ttlMs: castMs + 400 });
}

/** The spat glob, lobbed onto the victim's spot for the length of the telegraph. */
export function fxSpitGlob(scene: GameScene, id: string, to: Pt, flightMs: number, spore: boolean): void {
  const from = spriteAt(scene, id);
  if (!from) return;
  lob(scene, { x: from.x, y: from.y - 16 }, to, Math.max(250, flightMs), 120,
    (g) => drawGlob(g, spore ? 0xe0d24a : BILE, 1.2));
}

/** Bile Rain wind-up: it heaves, flinging globs skyward. */
export function fxBileHeave(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  posePath(scene, id, [
    { sx: 1.14, sy: 0.84, ms: castMs * 0.45, ease: 'Quad.easeOut' },
    { sx: 0.86, sy: 1.26, lift: 10, ms: 110, ease: 'Quad.easeOut' },
    { sx: 1, sy: 1, lift: 0, ms: 340, ease: 'Back.easeOut' },
  ]);
  scene.time.delayedCall(castMs * 0.45 + 60, () => {
    const p = spriteAt(scene, id) ?? me;
    for (let i = 0; i < 7; i++) {
      const glob = scene.add.graphics({ x: p.x + (Math.random() - 0.5) * 30, y: p.y - 20 }).setDepth(DEPTH.FX + 1);
      drawGlob(glob, BILE, 1);
      scene.tweens.add({
        targets: glob,
        x: glob.x + (Math.random() - 0.5) * 160,
        y: glob.y - 260 - Math.random() * 120,
        alpha: 0,
        duration: 520,
        ease: 'Quad.easeOut',
        onComplete: () => glob.destroy(),
      });
    }
    ring(scene, p.x, p.y + 30, BILE, { from: 30, scale: 3, flat: true, ms: 420 });
  });
}

/** A falling glob of Bile Rain hitting the ground: splat. */
export function fxBileSplat(scene: GameScene, x: number, y: number, radius: number): void {
  burstFx(scene, 'ptx-dot', x, y, 18, 560, {
    tint: [BILE, BILE_DEEP, BILE_LIT],
    speed: { min: 80, max: 220 },
    angle: { min: 190, max: 350 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 520,
  });
  ring(scene, x, y, BILE_LIT, { from: radius * 0.4, scale: 2.2, flat: true, width: 3, ms: 380 });
  impact(scene, 'light', { x, y });
}

/** The lunge behind a Mire / Spore Lash (and the Volcanic shove). */
export function fxLashLunge(scene: GameScene, id: string, target: Pt | undefined): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  const d = target ? dirTo(me, target) : { x: 1, y: 0 };
  posePath(scene, id, [
    { sx: 0.88, sy: 1.14, rot: Math.sign(d.x || 1) * 0.18, ms: 90, ease: 'Quad.easeOut' },
    { sx: 1.14, sy: 0.9, rot: -Math.sign(d.x || 1) * 0.1, ms: 260, ease: 'Quad.easeIn' },
    { sx: 1, sy: 1, rot: 0, ms: 300, ease: 'Back.easeOut' },
  ]);
}
