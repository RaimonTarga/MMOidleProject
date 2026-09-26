import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import type { GameScene } from '../scenes/GameScene';
import type { AttackTint } from './elementTint';

/**
 * Attack FX for the Conduit's summons. Range picks the style in
 * `spawn.ts` (resolveMinionType's sibling), so the formation's fighting
 * distance is legible from what its summons throw:
 *
 *   Vigil (close)      -> fxConduitStrike, a small red nick at the target's edge
 *   Procession (mid)   -> fxConduitBolt, a fast red travelling orb
 *   Harrier (far)      -> fxConduitBeam, a short-lived red beam
 *
 * Both ranged styles use one red ramp on purpose: shape separates them far more
 * legibly than hue at these sizes, and a single Conduit red keeps the summons'
 * output tied to the deep-red robe rather than to their own bone bodies.
 *
 * Distinct from `fx/laser.ts`, which is the Slinger's PERSISTENT beam driven by
 * render state across snapshots. These are one-shot, fire-and-forget.
 *
 * The Conduit red is overridable by an elemental `tint`, because the Conduit's
 * WEAPON is what sets its summons' damage and cadence — so a venom blade should
 * show up in what the formation throws. The near-white hot core stays put either
 * way, which is what keeps beam-vs-bolt readable by shape.
 */

/**
 * Vigil / unchosen melee: deliberately low-key. A formation lands up to six of
 * these on one target per volley, so the shared `impact` bloom (16px flash, two
 * rings scaling to ~5x, 8 debris) stacked into noise. The summon's lunge already
 * sells the hit; this only confirms contact.
 *
 * The nick sits on the target's edge FACING the attacker rather than on its
 * centre, so a surrounding formation reads as a ring of small cuts around the
 * target instead of one pile of overlapping blooms. A little angle jitter keeps
 * repeat hits from the same summon from stamping an identical mark.
 */
export function fxConduitStrike(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  tint?: AttackTint,
): void {
  const body = tint?.glow ?? 0xff4455;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Pull the contact point back toward the attacker, but never past it.
  const inset = Math.min(8, len * 0.5);
  const cx = toX - ux * inset;
  const cy = toY - uy * inset;

  // Short stroke across the approach direction, tilted a little off-perpendicular.
  const angle = Math.atan2(uy, ux) + Math.PI / 2 + (Math.random() - 0.5) * 0.9;
  const half = 5;
  const ox = Math.cos(angle) * half;
  const oy = Math.sin(angle) * half;

  const g = scene.add.graphics({ x: cx, y: cy }).setDepth(DEPTH.FX);
  g.lineStyle(3, body, 0.45);
  g.lineBetween(-ox, -oy, ox, oy);
  g.lineStyle(1.25, 0xffe8e6, 0.9);
  g.lineBetween(-ox * 0.8, -oy * 0.8, ox * 0.8, oy * 0.8);

  scene.tweens.add({
    targets: g,
    alpha: 0,
    scaleX: 1.35,
    scaleY: 1.35,
    duration: 130,
    ease: 'Quad.easeOut',
    onComplete: () => g.destroy(),
  });

  // Two flecks carried on through the target, not an omnidirectional burst.
  const deg = (Math.atan2(uy, ux) * 180) / Math.PI;
  burstFx(scene, 'ptx-dot', cx, cy, 2, 160, {
    tint: tint?.particles ?? 0xff4455,
    speed: { min: 30, max: 80 },
    angle: { min: deg - 35, max: deg + 35 },
    scale: { start: 0.3, end: 0 },
    alpha: { start: 0.9, end: 0 },
  });
}

/** Harrier: a beam that snaps on and fades inside ~140ms. */
export function fxConduitBeam(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  tint?: AttackTint,
): void {
  const halo = tint?.glow ?? 0x992430;
  const body = tint?.glow ?? 0xff4455;
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  // Three stacked strokes: wide soft glow, mid body, hot core. Shares the
  // bolt's red ramp — the two read apart by SHAPE (instant line vs travelling
  // orb), so they do not also need separate hues.
  g.lineStyle(7, halo, 0.20);
  g.lineBetween(fromX, fromY, toX, toY);
  g.lineStyle(3.5, body, 0.55);
  g.lineBetween(fromX, fromY, toX, toY);
  g.lineStyle(1.5, 0xffe8e6, 0.95);
  g.lineBetween(fromX, fromY, toX, toY);
  g.fillStyle(0xffe8e6, 0.8);
  g.fillCircle(toX, toY, 3.5);
  g.fillStyle(body, 0.28);
  g.fillCircle(toX, toY, 8);

  scene.tweens.add({
    targets: g,
    alpha: 0,
    duration: 140,
    ease: 'Quad.easeOut',
    onComplete: () => g.destroy(),
  });

  burstFx(scene, 'ptx-dot', toX, toY, 5, 200, {
    tint: tint?.particles ?? 0xff4455,
    speed: { min: 40, max: 130 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 1, end: 0 },
  });
}

/**
 * Procession: the same travelling-orb shape as `fxMagic`, but red and roughly
 * 40% faster (120ms vs 200ms) so a mid-range formation reads as a quicker,
 * closer-quarters cadence than the Harrier's beam.
 */
export function fxConduitBolt(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  tint?: AttackTint,
): void {
  const body = tint?.glow ?? 0xff3344;
  const orb = scene.add.circle(fromX, fromY, 5, body).setDepth(DEPTH.FX);

  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(i * 28, () => {
      const trail = scene.add
        .circle(orb.x, orb.y, 2.5 - i * 0.5, 0xff8899, 0.75)
        .setDepth(DEPTH.FX);
      scene.tweens.add({
        targets: trail,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 140,
        onComplete: () => trail.destroy(),
      });
    });
  }

  scene.tweens.add({
    targets: orb,
    x: toX,
    y: toY,
    duration: 120,
    ease: 'Quad.easeIn',
    onComplete: () => {
      orb.destroy();
      const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      ring.lineStyle(2.5, 0xff8899, 1);
      ring.strokeCircle(0, 0, 5);
      scene.tweens.add({
        targets: ring,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 200,
        onComplete: () => ring.destroy(),
      });

      burstFx(scene, 'ptx-dot', toX, toY, 8, 240, {
        tint: tint?.particles ?? 0xff3344,
        speed: { min: 50, max: 170 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
      });
    },
  });
}
