/**
 * MOUNTAIN + CAVE bosses, animated (premium pass, 2026-09-27).
 *
 * MOUNTAIN — the plated charger.
 *   PLATE    it braces while stone gathers and the ground cracks under it; the plate
 *            itself is the `stone-plate` aura (orbiting slabs; shatters on a break).
 *   CHARGE   head down toward its victim, pawing the ground and snorting, trembling
 *            harder as the lane locks; a root or stun on the wind-up = it stumbles.
 *            In motion the `rush` aura tears up dust; connecting lands heavy.
 *   ROCKS    drawn in groundZones (falling boulder over a growing shadow) and
 *            paid off here (`fxRockImpact`).
 * CAVE — the burrower.
 *   BURROW   it digs in (a fast shudder spraying dirt); underground its path cracks
 *            and throws clods; it bursts back up with a stretch.
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { bodyPose, posePath, releasePose, tweenPose } from './bodyPose';
import { impact } from './impactFeel';
import { castTargetId, follow, registerWindup, spriteAt } from './windups';
import { debrisKick, deg, dirTo, drawCracks, dustCloud, inhale, ring } from './bossKit';

const STONE = [0x8c96a3, 0x5d6773, 0xb8c2cc];
const DIRT = [0x6b5236, 0x8a6b46, 0x4a3a28, 0x9c8158];
const DUST = [0x9b8a6e, 0x7d6d55, 0xc2b294];

// ── MOUNTAIN ─────────────────────────────────────────────────────────────────

/** The plate is coming: it braces, stone dust gathers, the ground cracks. */
export function fxPlateWindup(scene: GameScene, id: string, castMs: number): void {
  const at = spriteAt(scene, id);
  if (!at) return;
  tweenPose(scene, id, { sx: 1.1, sy: 0.9 }, castMs * 0.6, 'Quad.easeOut');
  bodyPose(scene, id).tremble = 0.8;
  inhale(scene, at.x, at.y, STONE, 110, castMs * 0.9);
  const g = scene.add.graphics().setDepth(DEPTH.BG_DECOR + 0.35);
  const began = performance.now();
  const seed = Math.floor(Math.random() * 1e6);
  const stop = follow(scene, () => {
    const p = spriteAt(scene, id);
    if (!p) return false;
    const k = Math.min(1, (performance.now() - began) / castMs);
    g.clear();
    drawCracks(g, p.x, p.y + 50, 70, k, 0x2e353d, 0.7, seed);
    return k < 1;
  });
  registerWindup(scene, id, {
    fire: () => undefined,
    cancel: () => {
      stop();
      g.destroy();
      bodyPose(scene, id).tremble = 0;
      releasePose(scene, id);
      dustCloud(scene, at.x, at.y + 40, DUST, 0.8);
    },
    expire: () => {
      stop();
      scene.tweens.add({ targets: g, alpha: 0, duration: 500, onComplete: () => g.destroy() });
      bodyPose(scene, id).tremble = 0;
      releasePose(scene, id, 360);
    },
  }, { ttlMs: castMs + 60 });
}

/** The charge wind-up: head down at the victim, pawing, snorting, trembling. */
export function fxChargeWindup(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  const targetId = castTargetId(scene, id);
  const aim = (): { x: number; y: number } => dirTo(spriteAt(scene, id) ?? me, spriteAt(scene, targetId) ?? me);
  const lean = Math.sign(aim().x || 1) * 0.16;
  tweenPose(scene, id, { sx: 1.16, sy: 0.84, rot: lean }, Math.min(500, castMs * 0.3), 'Quad.easeOut');
  const began = performance.now();
  let nextPaw = began;
  let nextSnort = began + 250;
  let side = 1;
  const stop = follow(scene, () => {
    const p = spriteAt(scene, id);
    if (!p) return false;
    const now = performance.now();
    const k = Math.min(1, (now - began) / castMs);
    const d = aim();
    const pose = bodyPose(scene, id);
    pose.tremble = 0.4 + k * 1.6;
    if (now >= nextPaw) {
      // Pawing: dirt thrown BACK, away from the victim, alternating feet.
      nextPaw = now + 300 - k * 140;
      side = -side;
      const back = deg({ x: -d.x, y: -d.y });
      debrisKick(scene, p.x + side * 14, p.y + 44, back, DUST, 5, 30, 150);
    }
    if (now >= nextSnort) {
      nextSnort = now + 700;
      const hx = p.x + d.x * 40;
      const hy = p.y - 10;
      burstFx(scene, 'ptx-dot', hx, hy, 5, 520, {
        tint: 0xeeeeee,
        speed: { min: 20, max: 60 },
        angle: { min: deg(d) - 25, max: deg(d) + 25 },
        scale: { start: 0.7, end: 1.6 },
        alpha: { start: 0.5, end: 0 },
      });
    }
    return k < 1;
  });
  registerWindup(scene, id, {
    fire: () => undefined,
    cancel: () => {
      // STUMBLED: it lurches and loses its footing.
      stop();
      bodyPose(scene, id).tremble = 0;
      const p = spriteAt(scene, id) ?? me;
      posePath(scene, id, [
        { rot: -lean * 1.4, sx: 0.94, sy: 1.08, ms: 110, ease: 'Quad.easeOut' },
        { rot: lean * 0.6, sx: 1.1, sy: 0.9, ms: 140, ease: 'Quad.easeIn' },
        { rot: 0, sx: 1, sy: 1, ms: 300, ease: 'Back.easeOut' },
      ]);
      dustCloud(scene, p.x, p.y + 40, DUST, 1);
    },
    expire: () => {
      // It sets off: hold a forward lean into the run, then settle.
      stop();
      bodyPose(scene, id).tremble = 0;
      posePath(scene, id, [
        { rot: lean * 1.2, sx: 1.06, sy: 0.95, ms: 90, ease: 'Quad.easeOut' },
        { rot: lean * 1.2, sx: 1.06, sy: 0.95, ms: 900 },
        { rot: 0, sx: 1, sy: 1, ms: 320, ease: 'Back.easeOut' },
      ]);
      const p = spriteAt(scene, id) ?? me;
      debrisKick(scene, p.x, p.y + 44, deg({ x: -aim().x, y: -aim().y }), DUST, 16, 35, 240);
    },
  }, { ttlMs: castMs + 40 });
}

/** A charge connecting: the body lands on someone. */
export function fxChargeImpact(scene: GameScene, x: number, y: number): void {
  dustCloud(scene, x, y + 10, DUST, 1.4);
  debrisKick(scene, x, y, 270, STONE, 16, 70, 260);
  ring(scene, x, y, 0xf0e2c0, { from: 20, scale: 4.5, width: 5, ms: 380 });
  impact(scene, 'heavy', { x, y });
}

/** A Rockfall rock landing (its falling shadow is drawn by the zone). */
export function fxRockImpact(scene: GameScene, x: number, y: number, radius: number): void {
  debrisKick(scene, x, y, 270, STONE, 14, 80, 220);
  dustCloud(scene, x, y + 6, DUST, radius / 90);
  ring(scene, x, y, 0xd8cdb4, { from: radius * 0.5, scale: 2, width: 3, ms: 360, flat: true });
  impact(scene, 'light', { x, y });
}

// ── CAVE ─────────────────────────────────────────────────────────────────────

/** Digging in: a fast shudder spraying dirt, before the dust cloud takes it under. */
export function fxBurrowWindup(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  const beats = Math.max(2, Math.floor(castMs / 120));
  const keys: Array<{ sx: number; sy: number; ms: number; ease?: string }> = [];
  for (let i = 0; i < beats; i++) {
    const dig = i / beats;
    keys.push({ sx: 1.14 + dig * 0.1, sy: 0.86 - dig * 0.12, ms: castMs / beats / 2 });
    keys.push({ sx: 1.02, sy: 0.96 - dig * 0.12, ms: castMs / beats / 2 });
  }
  posePath(scene, id, keys);
  for (let i = 0; i < beats; i++) {
    scene.time.delayedCall(i * (castMs / beats), () => {
      const p = spriteAt(scene, id);
      if (!p) return;
      debrisKick(scene, p.x + (i % 2 ? 20 : -20), p.y + 40, i % 2 ? 300 : 240, DIRT, 6, 30, 200);
    });
  }
  // The body goes under behind the dirt cloud; the pose is reset when it surfaces.
  scene.time.delayedCall(castMs + 400, () => releasePose(scene, id, 200));
}

/** Underground: the ground cracks and throws clods where the mound passes. */
export function fxBurrowTrail(scene: GameScene, x: number, y: number): void {
  debrisKick(scene, x, y + 30, 270, DIRT, 4, 50, 90);
  const g = scene.add.graphics().setDepth(DEPTH.BG_DECOR + 0.35);
  drawCracks(g, x, y + 40, 26, 1, 0x2a1f14, 0.6, Math.floor(x * 7 + y), 4);
  scene.tweens.add({ targets: g, alpha: 0, duration: 1400, delay: 300, onComplete: () => g.destroy() });
}

/** Surfacing: it bursts up out of the ground and settles. */
export function fxBurrowSurface(scene: GameScene, id: string): void {
  posePath(scene, id, [
    { sx: 0.82, sy: 1.3, lift: 14, ms: 110, ease: 'Quad.easeOut' },
    { sx: 1.18, sy: 0.84, lift: 0, ms: 110, ease: 'Quad.easeIn' },
    { sx: 1, sy: 1, lift: 0, ms: 320, ease: 'Back.easeOut' },
  ]);
  const p = spriteAt(scene, id);
  if (p) impact(scene, 'light', p);
}

/**
 * The eruption telegraph overlay: cracks racing out under the circle and pebbles
 * jumping as it builds. Drawn from the zone renderer each frame.
 */
export function drawEruptionTelegraph(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  progress: number,
  seed: number,
): void {
  drawCracks(g, x, y, radius * 0.95, Math.min(1, progress * 1.15), 0x2a1f14, 0.75, seed, 9);
  if (progress > 0.55) {
    const shake = (progress - 0.55) / 0.45;
    g.fillStyle(0x6b5236, 0.8);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + seed;
      const jump = Math.abs(Math.sin(performance.now() / 60 + i)) * 6 * shake;
      g.fillCircle(x + Math.cos(a) * radius * 0.5, y + Math.sin(a) * radius * 0.28 - jump, 2.5);
    }
  }
}
