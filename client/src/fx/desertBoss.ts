/**
 * DESERT bosses, animated (premium pass, 2026-09-27) — the scorpion's sentence.
 *
 *   STINGS     it rears, the stinger glints above it; a Death Sting draws the sun
 *              sigil over the victim as the clock (the lasting mark is the
 *              `sun-mark` aura), then the tail strikes.
 *   EXECUTION  a golden ring contracts over the marked victim while the scorpion
 *              coils; it lunges and the sentence lands. A stun breaks the ring.
 *   DASHES     share the hunt bolt (jungleBoss, sand palette).
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { bodyPose, posePath, releasePose, tweenPose } from './bodyPose';
import { impact } from './impactFeel';
import { castTargetId, follow, registerWindup, spriteAt, type Pt } from './windups';
import { dirTo, drawSigil, ring } from './bossKit';
import { burstFx } from './particles';

const SUN = 0xffc83a;
const SUN_LIT = 0xfff0a8;
const NUMB = 0x7fd4ff;

/** A glint on the raised stinger, above the body. */
function stingerGlint(scene: GameScene, x: number, y: number, color: number, ms: number): void {
  const g = scene.add.graphics({ x, y }).setDepth(DEPTH.FX + 2).setBlendMode(Phaser.BlendModes.ADD);
  g.fillStyle(color, 1);
  g.fillTriangle(-3, 0, 3, 0, 0, -12);
  g.fillStyle(color, 0.35);
  g.fillCircle(0, -4, 10);
  g.setScale(0.2);
  scene.tweens.add({ targets: g, scaleX: 1.3, scaleY: 1.3, duration: ms * 0.8, ease: 'Quad.easeOut' });
  scene.tweens.add({ targets: g, alpha: 0, delay: ms * 0.8, duration: 200, onComplete: () => g.destroy() });
}

/** The tail strike itself: a bright streak from the raised stinger to the victim. */
function tailStrike(scene: GameScene, from: Pt, to: Pt, color: number): void {
  const g = scene.add.graphics().setDepth(DEPTH.FX + 1);
  g.lineStyle(6, color, 0.4);
  g.lineBetween(from.x, from.y - 34, to.x, to.y);
  g.lineStyle(2.5, 0xffffff, 0.95);
  g.lineBetween(from.x, from.y - 34, to.x, to.y);
  scene.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
}

/** Death / Numbing Sting wind-up. Death Sting also draws its sigil over the victim. */
export function fxStingWindup(scene: GameScene, id: string, castMs: number, kind: 'death' | 'numbing'): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  const color = kind === 'death' ? SUN : NUMB;
  tweenPose(scene, id, { sx: 0.92, sy: 1.12, lift: 8, rot: -0.08 }, castMs * 0.8, 'Quad.easeOut');
  stingerGlint(scene, me.x, me.y - 40, color, castMs);
  const targetId = castTargetId(scene, id);
  let stop = (): void => undefined;
  let sigil: Phaser.GameObjects.Graphics | undefined;
  if (kind === 'death') {
    sigil = scene.add.graphics().setDepth(DEPTH.FX + 1);
    const began = performance.now();
    stop = follow(scene, () => {
      const at = spriteAt(scene, targetId);
      if (!at || !sigil) return false;
      const k = Math.min(1, (performance.now() - began) / castMs);
      sigil.clear();
      drawSigil(sigil, at.x, at.y - 52, 16, k, SUN, 0.95, performance.now() / 900, 8);
      return true;
    });
  }
  registerWindup(scene, id, {
    fire: (at) => {
      stop();
      sigil?.destroy();
      const from = spriteAt(scene, id) ?? me;
      const to = at ?? spriteAt(scene, targetId);
      posePath(scene, id, [
        { sx: 1.1, sy: 0.9, lift: 0, rot: 0.12 * Math.sign((to?.x ?? from.x + 1) - from.x || 1), ms: 80, ease: 'Quad.easeIn' },
        { sx: 1, sy: 1, rot: 0, ms: 300, ease: 'Back.easeOut' },
      ]);
      if (to) tailStrike(scene, from, to, color);
      return 'continue';
    },
    cancel: () => {
      stop();
      if (sigil) {
        const s = sigil;
        scene.tweens.add({ targets: s, alpha: 0, scaleX: 1.4, scaleY: 1.4, duration: 220, onComplete: () => s.destroy() });
      }
      releasePose(scene, id);
    },
  }, { fx: kind === 'death' ? 'death-sting' : 'numbing-sting' });
}

/** Execution wind-up: the ring contracts over the victim while the scorpion coils. */
export function fxExecutionWindup(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  const targetId = castTargetId(scene, id);
  tweenPose(scene, id, { sx: 1.16, sy: 0.84 }, castMs * 0.85, 'Quad.easeOut');
  bodyPose(scene, id).tremble = 0.6;
  const g = scene.add.graphics().setDepth(DEPTH.FX + 1);
  const began = performance.now();
  let last: Pt = spriteAt(scene, targetId) ?? me;
  const stop = follow(scene, () => {
    const at = spriteAt(scene, targetId) ?? last;
    last = at;
    const k = Math.min(1, (performance.now() - began) / castMs);
    g.clear();
    const r = 90 - 66 * k;
    g.lineStyle(3 + k * 3, SUN, 0.5 + 0.5 * k);
    g.strokeCircle(at.x, at.y, r);
    // Rays converging on the victim.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + k * 0.8;
      g.lineStyle(2, SUN_LIT, 0.35 + 0.5 * k);
      g.lineBetween(at.x + Math.cos(a) * (r + 18), at.y + Math.sin(a) * (r + 18), at.x + Math.cos(a) * (r + 6), at.y + Math.sin(a) * (r + 6));
    }
    return true;
  });
  registerWindup(scene, id, {
    fire: (hit) => {
      stop();
      g.destroy();
      bodyPose(scene, id).tremble = 0;
      const at = hit ?? last;
      const from = spriteAt(scene, id) ?? me;
      const d = dirTo(from, at);
      // The lunge that delivers the sentence.
      const interp = scene.state.interpolation.get(id);
      if (interp) {
        scene.tweens.killTweensOf(interp.lungeOffset);
        scene.tweens.chain({
          targets: interp.lungeOffset,
          tweens: [
            { x: d.x * 70, y: d.y * 70, duration: 90, ease: 'Quad.easeIn' },
            { x: 0, y: 0, duration: 280, delay: 60, ease: 'Quad.easeOut' },
          ],
        });
      }
      posePath(scene, id, [
        { sx: 0.84, sy: 1.18, rot: Math.sign(d.x || 1) * 0.2, ms: 90, ease: 'Quad.easeIn' },
        { sx: 1, sy: 1, rot: 0, ms: 340, ease: 'Back.easeOut' },
      ]);
      tailStrike(scene, from, at, SUN);
      ring(scene, at.x, at.y, SUN_LIT, { from: 24, scale: 3.4, width: 5, ms: 320 });
      impact(scene, 'medium', at);
      return 'continue';
    },
    cancel: () => {
      stop();
      bodyPose(scene, id).tremble = 0;
      // The ring breaks apart.
      burstFx(scene, 'ptx-spark', last.x, last.y, 16, 420, {
        tint: [SUN, SUN_LIT],
        speed: { min: 60, max: 160 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
      });
      g.destroy();
      releasePose(scene, id);
    },
  }, { fx: 'execution' });
}
