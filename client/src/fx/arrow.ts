import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const SHAFT = 0xc9a36b; // wooden shaft
const HEAD = 0xe8edf2; // pale steel head
const FLETCH = 0xdd4433; // red fletching

/**
 * Arrow shot — a real arrow that flies from the shooter to the target on a fast,
 * nearly-flat trajectory, then thuds home. A bowstring twang puffs at the origin
 * and a small wood/feather impact bursts at the target. Used by bow/thorn-volley
 * mobs (Ridge Ambusher, Thorn Spitter, Canopy Chameleon) — visually distinct from the
 * gunshot tracer (a traveling object, not an instant beam) and the lobbed boulder.
 */
export function fxArrow(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  empowered: boolean,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const len = empowered ? 26 : 20;

  // Bowstring twang at the origin — a brief spark puff.
  burstFx(scene, 'ptx-spark', fromX, fromY, 5, 200, {
    tint: HEAD,
    speed: { min: 40, max: 120 },
    angle: { min: (angle * 180) / Math.PI - 30, max: (angle * 180) / Math.PI + 30 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 0.9, end: 0 },
    rotate: { min: 0, max: 360 },
  });

  // The arrow itself: shaft + steel head + fletching, drawn pointing +x then
  // rotated to the travel angle so it flies nose-first.
  const arrow = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  const w = empowered ? 2.5 : 2;
  arrow.lineStyle(w, SHAFT, 1);
  arrow.lineBetween(-len, 0, len * 0.6, 0); // shaft
  arrow.fillStyle(HEAD, 1);
  arrow.fillTriangle(len, 0, len * 0.6, -w - 1.5, len * 0.6, w + 1.5); // head
  arrow.lineStyle(w, FLETCH, 1);
  arrow.lineBetween(-len, 0, -len - 5, -4); // fletching
  arrow.lineBetween(-len, 0, -len - 5, 4);
  arrow.setRotation(angle);

  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy);
  // Fast and flat — only a slight arc so it still reads as an arrow, not a lob.
  const arcHeight = Math.min(22, dist * 0.1);
  const travelMs = Math.min(360, Math.max(140, dist * 0.8));

  const t = { v: 0 };
  scene.tweens.add({
    targets: t,
    v: 1,
    duration: travelMs,
    ease: 'Linear',
    onUpdate: () => {
      arrow.x = fromX + dx * t.v;
      arrow.y = fromY + dy * t.v - arcHeight * Math.sin(t.v * Math.PI);
      // Aim along the instantaneous flight tangent so the nose dips as it arcs.
      const tangentY = dy - arcHeight * Math.PI * Math.cos(t.v * Math.PI);
      arrow.setRotation(Math.atan2(tangentY, dx));
    },
    onComplete: () => {
      arrow.destroy();
      spawnArrowImpact(scene, toX, toY, empowered);
    },
  });
}

function spawnArrowImpact(scene: GameScene, x: number, y: number, empowered: boolean): void {
  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(HEAD, 0.85);
  flash.fillCircle(0, 0, empowered ? 9 : 6);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2,
    scaleY: 2,
    duration: 160,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Wood splinters / feather chips kicked off the hit.
  burstFx(scene, 'ptx-spark', x, y, empowered ? 9 : 6, 280, {
    tint: SHAFT,
    speed: { min: 70, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
