import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const BARK = 0x6f4a2a;
const CLAW = 0xd8ffb0;
const RIND = 0x8fd45a;
const CONCUSS = 0xfff2b8;

/**
 * Stunning Swipe — the Apex Timberclaw's signature charged beat (Forest T2).
 *
 * The circle it plants is a SWEEP, not a slam, so the payoff is drawn as one: four
 * claw arcs rip across the whole telegraph on a single axis, riding the same
 * left-to-right stroke rather than erupting from the middle. That is the read the
 * generic shockwave could not give — this ability denies a swathe of ground and
 * rattles everyone standing in it, and it has to look different from the Mountain
 * slams and the Trench bites that share the AoE-charge primitive.
 *
 * The concussion beat (flash + hard ring + stars) is deliberately the SAME visual
 * language as the player's Stunning Strike, because it applies the same status:
 * a player who has learned "spinning stars = I am about to lose control" should
 * read it here without being taught twice.
 */
export function fxTimberclawSwipe(
  scene: GameScene,
  x: number,
  y: number,
  radius: number,
): void {
  // One committed stroke shared by every claw, tilted slightly off horizontal so
  // the sweep has a direction instead of reading as a symmetrical burst.
  const angle = -0.28;
  const perp = angle + Math.PI / 2;
  const reach = radius * 1.05;

  // Bark dust kicked up along the swept ground, under the claws.
  const ground = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ground.fillStyle(BARK, 0.34);
  ground.fillEllipse(0, 0, radius * 2, radius * 0.9);
  scene.tweens.add({
    targets: ground,
    alpha: 0,
    scaleX: 1.18,
    scaleY: 0.72,
    duration: 340,
    ease: 'Quad.easeOut',
    onComplete: () => ground.destroy(),
  });

  // Four claw arcs. Each is a curve bowed along the stroke; they are written head
  // first and dissolved tail first so the whole rake sweeps in one direction.
  const claws = [-0.62, -0.21, 0.21, 0.62].map(spread => ({
    offset: spread * radius * 0.78,
    bow: (0.16 + Math.abs(spread) * 0.1) * radius,
    len: reach * (1 - Math.abs(spread) * 0.22),
  }));

  const rake = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  const sweep = { progress: 0 };
  const SEGMENTS = 14;
  const draw = (): void => {
    const head = Math.min(1, sweep.progress / 0.5);
    const tail = Math.max(0, (sweep.progress - 0.42) / 0.58);
    rake.clear();
    for (const claw of claws) {
      // Sample the bowed stroke between `tail` and `head` and stroke it as a
      // polyline — Graphics has no curve primitive that tweens cleanly here.
      const points: Array<[number, number]> = [];
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = tail + ((head - tail) * i) / SEGMENTS;
        const along = (t * 2 - 1) * claw.len;
        const bow = Math.cos(t * Math.PI - Math.PI / 2) * claw.bow;
        const ox = along + Math.cos(perp) * 0;
        const oy = bow;
        points.push([
          Math.cos(angle) * ox - Math.sin(angle) * (oy + claw.offset),
          Math.sin(angle) * ox + Math.cos(angle) * (oy + claw.offset),
        ]);
      }
      if (points.length < 2) continue;
      for (const [width, color, alpha] of [
        [7, RIND, 0.45],
        [3, CLAW, 1],
      ] as const) {
        rake.lineStyle(width, color, alpha);
        rake.beginPath();
        rake.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) rake.lineTo(points[i][0], points[i][1]);
        rake.strokePath();
      }
    }
  };
  scene.tweens.add({
    targets: sweep,
    progress: 1,
    duration: 380,
    ease: 'Cubic.easeOut',
    onUpdate: draw,
    onComplete: () => rake.destroy(),
  });

  // The concussion: one hard ring at the swipe's own radius, so the circle the
  // player was asked to leave is exactly the circle that pays off.
  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(4, CONCUSS, 0.9);
  ring.strokeCircle(0, 0, radius * 0.55);
  scene.tweens.add({
    targets: ring,
    scaleX: 1 / 0.55,
    scaleY: 1 / 0.55,
    alpha: 0,
    duration: 300,
    ease: 'Expo.easeOut',
    onComplete: () => ring.destroy(),
  });

  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(CONCUSS, 0.8);
  flash.fillCircle(0, 0, radius * 0.3);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.1,
    scaleY: 2.1,
    duration: 220,
    ease: 'Expo.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Three stars over the impact — the STUN, in the same glyph the player's own
  // Stunning Strike uses, so the status reads instantly.
  for (let i = 0; i < 3; i++) {
    const phase = (Math.PI * 2 * i) / 3;
    const s = scene.add.graphics({ x, y: y - 26 }).setDepth(DEPTH.FX);
    s.fillStyle(CONCUSS, 1);
    s.beginPath();
    s.moveTo(0, -7);
    s.lineTo(2, -2);
    s.lineTo(7, 0);
    s.lineTo(2, 2);
    s.lineTo(0, 7);
    s.lineTo(-2, 2);
    s.lineTo(-7, 0);
    s.lineTo(-2, -2);
    s.closePath();
    s.fillPath();
    const spin = { t: 0 };
    scene.tweens.add({
      targets: spin,
      t: Math.PI * 2.2,
      duration: 820,
      delay: 120,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        s.x = x + Math.cos(spin.t + phase) * 24;
        s.y = y - 26 + Math.sin(spin.t + phase) * 8;
      },
      onComplete: () => s.destroy(),
    });
    scene.tweens.add({ targets: s, alpha: 0, delay: 620, duration: 300 });
  }

  burstFx(scene, 'ptx-spark', x, y, 26, 460, {
    tint: CLAW,
    speed: { min: 120, max: 300 },
    angle: { min: -40, max: 40 },
    scale: { start: 1.1, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
  burstFx(scene, 'ptx-dot', x, y, 14, 420, {
    tint: BARK,
    speed: { min: 70, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 200,
  });
}
