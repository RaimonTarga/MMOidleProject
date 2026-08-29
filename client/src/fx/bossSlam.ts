import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/** Per-element slam palette: [ring/core, bright accent, debris dust]. */
const SLAM_PALETTE: Record<string, [number, number, number]> = {
  // Stone bruisers (mountain/cave/trench impact + the heavy `quake` boss style).
  impact: [0x99aabb, 0xccd6e2, 0xaa9977],
  quake: [0x99aabb, 0xccd6e2, 0xaa9977],
  fire: [0xff5522, 0xffcc44, 0xff8800],
  frost: [0x88ddff, 0xddf4ff, 0xbfe6ff],
  poison: [0x88cc44, 0xccff66, 0x66aa33],
  magic: [0xbb66ff, 0xe0b3ff, 0x9944cc],
  sandblast: [0xeecc66, 0xfff0c0, 0xccaa55],
  slash: [0xdddddd, 0xffffff, 0xaaaaaa],
};

/**
 * Boss ground-slam — a telegraphed AoE shockwave centered on the boss that rolls
 * out to `radius` (world units). Radial ground cracks split outward, two-three
 * shockwave rings expand to the kill radius, and a debris ring kicks up. Tinted by
 * the boss's element so a Magma-Salamander erupts fire while a Rime-Mammoth bursts
 * frost. This is the visual for the `slam` boss action (previously invisible).
 */
export function fxSlam(
  scene: GameScene,
  x: number,
  y: number,
  radius: number,
  element: string | undefined,
): void {
  const [core, accent, dust] = SLAM_PALETTE[element ?? 'impact'] ?? SLAM_PALETTE.impact;

  // Everything below is sized off `radius` — the burst has to land inside the
  // telegraph circle the player just dodged, so a 110px brute slam and a 250px
  // boss slam read as the same effect at two scales rather than one fixed size.

  // Central impact flash — a bright punch at the epicentre. Ends at ~26% of the
  // kill radius, well inside the rim.
  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(accent, 0.85);
  flash.fillCircle(0, 0, radius * 0.12);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.2,
    scaleY: 2.2,
    duration: 200,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Radial ground cracks lancing toward the kill radius.
  const cracks = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  const spokes = 9;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2 + Math.random() * 0.2;
    const len = radius * (0.55 + Math.random() * 0.35);
    const mx = Math.cos(a) * len * 0.6 + Math.cos(a + 0.3) * 6;
    const my = Math.sin(a) * len * 0.6 + Math.sin(a + 0.3) * 6;
    cracks.lineStyle(Math.max(2, radius * 0.025), core, 0.9);
    cracks.beginPath();
    cracks.moveTo(0, 0);
    cracks.lineTo(mx, my);
    cracks.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    cracks.strokePath();
  }
  scene.tweens.add({
    targets: cracks,
    alpha: 0,
    duration: 520,
    delay: 120,
    ease: 'Quad.easeIn',
    onComplete: () => cracks.destroy(),
  });

  // Two shockwave rings rolling out to the kill radius. The circle is stroked at
  // its FINAL size and scaled UP INTO it from a point, so the ring stops exactly
  // on the rim. (Stroking a unit circle and scaling by `radius` also multiplies
  // the line width by `radius` — a 5px stroke became 550px wide on a 110px slam,
  // painting far outside the telegraph the player had just stepped out of.)
  for (let i = 0; i < 2; i++) {
    const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    ring.lineStyle(i === 0 ? 5 : 3, i === 0 ? accent : core, 0.9);
    ring.strokeCircle(0, 0, radius);
    ring.setScale(0.1);
    scene.tweens.add({
      targets: ring,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: 380 + i * 120,
      delay: i * 60,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  // Debris kicked up at the epicentre and flung along the shockwave. Speeds are
  // derived from the radius and the lifetime so the fastest motes land near the
  // rim instead of overshooting a small circle.
  const debrisSpeed = radius / 0.56; // px/s that just reaches the rim in 560ms
  burstFx(scene, 'ptx-dot', x, y, 22, 560, {
    tint: dust,
    speed: { min: debrisSpeed * 0.35, max: debrisSpeed },
    angle: { min: 0, max: 360 },
    scale: { start: 1.4, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 140,
  });
  burstFx(scene, 'ptx-spark', x, y, 14, 420, {
    tint: accent,
    speed: { min: debrisSpeed * 0.5, max: debrisSpeed * 1.1 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.0, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
