import { movePlayerWithCollisions } from './playerMotion';
import { moverOverlapsBlockShapes } from '../systems/spatial';
import type { NodeFeatureShape } from '../world/nodeFeatures';

// Reviewer-owned deterministic property checks. Deliberately mix overlapping
// rectangles and curved blockers, rather than testing only individual faces.
let seed = 0x9a10;
function random(): number {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
}
const shapes: NodeFeatureShape[] = [
  { kind: 'rect', x: 180, y: 140, halfW: 28, halfH: 95 },
  { kind: 'rect', x: 225, y: 220, halfW: 75, halfH: 22 },
  { kind: 'ellipse', x: 335, y: 140, halfW: 38, halfH: 70 },
  { kind: 'circle', x: 330, y: 285, radius: 42 },
];
const pad = { x: 22, y: 18 };
let checked = 0;
for (let i = 0; i < 1600; i++) {
  const from = { x: random() * 500, y: random() * 420 };
  const to = { x: from.x + (random() - 0.5) * 1000, y: from.y + (random() - 0.5) * 1000 };
  if (moverOverlapsBlockShapes(from, shapes, pad)) continue;
  const actual = movePlayerWithCollisions(from, to, shapes, pad);
  const reversed = movePlayerWithCollisions(from, to, [...shapes].reverse(), pad);
  const context = JSON.stringify({ from, to, actual, reversed });
  if (!Number.isFinite(actual.x) || !Number.isFinite(actual.y)) throw new Error(`non-finite result: ${context}`);
  if (moverOverlapsBlockShapes(actual, shapes, pad)) throw new Error(`penetration: ${context}`);
  if (Math.hypot(actual.x - from.x, actual.y - from.y) > Math.hypot(to.x - from.x, to.y - from.y) + 1e-6) {
    throw new Error(`speed gain: ${context}`);
  }
  if (Math.hypot(actual.x - reversed.x, actual.y - reversed.y) > 1e-6) {
    throw new Error(`shape-order-dependent movement: ${context}`);
  }
  checked++;
}
if (checked < 800) throw new Error(`too few admissible property cases: ${checked}`);
console.log(`playerMotionProperties: ok (${checked} deterministic clear-start cases)`);
