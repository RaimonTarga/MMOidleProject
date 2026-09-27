/**
 * TUNDRA bosses, animated (premium pass, 2026-09-27) — the cold closing in.
 *
 *   DEEP FREEZE  ice shards close in around the victim as the clock while the
 *                mammoth rears; it stamps and the victim locks (the ice block is
 *                the `frozen` aura). A broken cast scatters the shards.
 *   SHATTER      it rears high over the cracked victim and slams down.
 *   FROST        Frost Burst / Frost Nova circles grow ice spikes (zone renderer).
 *   ENCASE       frost is drawn into the body; the shell is the `ice-armor` aura.
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { bodyPose, posePath, releasePose, tweenPose } from './bodyPose';
import { impact } from './impactFeel';
import { castTargetId, follow, registerWindup, spriteAt, type Pt } from './windups';
import { inhale, ring } from './bossKit';

const ICE = 0xcff0ff;
const ICE_LIT = 0xffffff;
const ICE_DEEP = 0x6fb8e8;

/** Deep Freeze / Frost Spikes wind-up: shards converge on the victim. */
export function fxFreezeWindup(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  const targetId = castTargetId(scene, id);
  tweenPose(scene, id, { sx: 0.92, sy: 1.12, lift: 8 }, castMs * 0.8, 'Quad.easeOut');
  const g = scene.add.graphics().setDepth(DEPTH.FX + 1);
  const floor = scene.add.graphics().setDepth(DEPTH.BG_DECOR + 0.35);
  const began = performance.now();
  let last: Pt = spriteAt(scene, targetId) ?? me;
  const shards = 7;
  const stop = follow(scene, () => {
    const at = spriteAt(scene, targetId) ?? last;
    last = at;
    const k = Math.min(1, (performance.now() - began) / castMs);
    g.clear();
    floor.clear();
    floor.fillStyle(ICE, 0.12 + 0.18 * k);
    floor.fillEllipse(at.x, at.y + 24, 60 + 50 * k, 22 + 18 * k);
    const r = 80 * (1 - k) + 16;
    for (let i = 0; i < shards; i++) {
      const a = (i / shards) * Math.PI * 2 + k * 0.6;
      const x = at.x + Math.cos(a) * r;
      const y = at.y + Math.sin(a) * r * 0.75;
      const tipX = at.x + Math.cos(a) * (r - 16);
      const tipY = at.y + Math.sin(a) * (r - 16) * 0.75;
      const px = Math.cos(a + Math.PI / 2) * 4;
      const py = Math.sin(a + Math.PI / 2) * 4;
      g.fillStyle(i % 2 ? ICE : ICE_DEEP, 0.4 + 0.55 * k);
      g.fillTriangle(x + px, y + py, x - px, y - py, tipX, tipY);
    }
    return true;
  });
  const clear = (): void => {
    stop();
    g.destroy();
    scene.tweens.add({ targets: floor, alpha: 0, duration: 400, onComplete: () => floor.destroy() });
  };
  registerWindup(scene, id, {
    fire: () => {
      clear();
      // The stamp.
      posePath(scene, id, [
        { sx: 1.16, sy: 0.84, lift: 0, ms: 90, ease: 'Quad.easeIn' },
        { sx: 1, sy: 1, ms: 320, ease: 'Back.easeOut' },
      ]);
      const p = spriteAt(scene, id) ?? me;
      ring(scene, p.x, p.y + 36, ICE, { from: 30, scale: 3, flat: true, width: 4 });
      impact(scene, 'medium', last);
      return 'continue';
    },
    cancel: () => {
      clear();
      burstFx(scene, 'ptx-dot', last.x, last.y, 14, 480, {
        tint: [ICE, ICE_LIT, ICE_DEEP],
        speed: { min: 80, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 300,
      });
      releasePose(scene, id);
    },
  }, { fx: 'frostbind' });
}

/** The Shatter wind-up: it rears high over the cracked victim, then slams. */
export function fxShatterWindup(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  tweenPose(scene, id, { sx: 0.88, sy: 1.22, lift: 16, rot: -0.06 }, castMs * 0.9, 'Sine.easeOut');
  bodyPose(scene, id).tremble = 0.5;
  // Frost gathering on the tusks.
  inhale(scene, me.x, me.y - 20, [ICE, ICE_LIT], 90, castMs * 0.9);
  registerWindup(scene, id, {
    fire: (at) => {
      bodyPose(scene, id).tremble = 0;
      posePath(scene, id, [
        { sx: 1.24, sy: 0.78, lift: 0, rot: 0, ms: 80, ease: 'Quad.easeIn' },
        { sx: 1, sy: 1, ms: 360, ease: 'Back.easeOut' },
      ]);
      const p = at ?? spriteAt(scene, id) ?? me;
      impact(scene, 'heavy', p);
      return 'continue';
    },
    cancel: () => {
      bodyPose(scene, id).tremble = 0;
      releasePose(scene, id);
    },
  }, { fx: 'shatter' });
}

/** Encase wind-up: frost drawn in from all around, the body bracing. */
export function fxEncaseWindup(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  tweenPose(scene, id, { sx: 1.08, sy: 0.92 }, castMs * 0.8, 'Quad.easeOut');
  inhale(scene, me.x, me.y, [ICE, ICE_LIT, ICE_DEEP], 130, castMs);
  scene.time.delayedCall(castMs, () => releasePose(scene, id, 360));
}

/** Frost circle telegraph: ice spikes pushing up inside it as it builds. */
export function drawFrostTelegraph(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  progress: number,
  seed: number,
): void {
  const n = Math.max(6, Math.round(radius / 18));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed;
    const d = radius * (0.35 + ((i * 37) % 10) / 16);
    const px = x + Math.cos(a) * Math.min(d, radius * 0.9);
    const py = y + Math.sin(a) * Math.min(d, radius * 0.9) * 0.55;
    const h = 18 * Math.min(1, progress * 1.3) * (0.6 + ((i * 13) % 7) / 10);
    g.fillStyle(i % 2 ? ICE : ICE_DEEP, 0.55 + 0.35 * progress);
    g.fillTriangle(px - 5, py, px + 5, py, px, py - h);
  }
}
