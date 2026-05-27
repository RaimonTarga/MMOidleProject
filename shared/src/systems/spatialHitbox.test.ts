import { hitboxGap, inAttackRange, rectGap } from './spatial';
import { FALLBACK_MONSTER_AABB } from '../hitbox/constants';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

// overlapping → gap 0
assert(
  rectGap(
    { x: 0, y: 0 },
    { offsetX: 0, offsetY: 0, halfW: 32, halfH: 32 },
    { x: 50, y: 0 },
    { offsetX: 0, offsetY: 0, halfW: 28, halfH: 28 },
  ) === 0,
  'overlap',
);

// separated on X: centers 100 apart, halfW 32+28 → gap 40
assert(
  rectGap(
    { x: 0, y: 0 },
    { offsetX: 0, offsetY: 0, halfW: 32, halfH: 32 },
    { x: 100, y: 0 },
    FALLBACK_MONSTER_AABB,
  ) === 40,
  'x-sep',
);

// multi-rect: two rects on attacker, min gap wins
const gap = hitboxGap(
  {
    pos: { x: 0, y: 0 },
    rects: [
      { offsetX: -20, offsetY: 0, halfW: 10, halfH: 10 },
      { offsetX: 20, offsetY: 0, halfW: 10, halfH: 10 },
    ],
  },
  {
    pos: { x: 50, y: 0 },
    rects: [{ offsetX: 0, offsetY: 0, halfW: 10, halfH: 10 }],
  },
);
assert(gap === 10, `multi-rect min gap expected 10 got ${gap}`);

// boundary: gap === range → in range
assert(
  inAttackRange(
    { pos: { x: 0, y: 0 }, rects: [{ offsetX: 0, offsetY: 0, halfW: 32, halfH: 32 }] },
    { pos: { x: 100, y: 0 }, rects: [FALLBACK_MONSTER_AABB] },
    40,
  ),
  'boundary in',
);

assert(
  !inAttackRange(
    { pos: { x: 0, y: 0 }, rects: [{ offsetX: 0, offsetY: 0, halfW: 32, halfH: 32 }] },
    { pos: { x: 100, y: 0 }, rects: [FALLBACK_MONSTER_AABB] },
    39,
  ),
  'boundary out',
);

console.log('spatialHitbox.test.ts: ok');
