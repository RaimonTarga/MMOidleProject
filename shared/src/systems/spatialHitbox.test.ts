import {
  approachPoint,
  hitboxGap,
  inAttackRange,
  moverOverlapsBlockShapes,
  projectOutOfBlockShapes,
  rectGap,
  resolveMoveAgainstBlocks,
  type PosHitbox,
} from './spatial';
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

// ─── approachPoint (anti-tunnel melee standoff) ──────────────────────────────

const smallBox = (pos: { x: number; y: number }): PosHitbox => ({
  pos,
  rects: [{ offsetX: 0, offsetY: 0, halfW: 10, halfH: 10 }],
});

// Already within reach → no movement, flagged in range.
{
  const from = { x: 0, y: 0 };
  const r = approachPoint(from, smallBox(from), { x: 25, y: 0 }, smallBox({ x: 25, y: 0 }), 12);
  assert(r.inRange === true, 'approach: in range short-circuits');
  assert(r.dest === from, 'approach: in range keeps position');
}

// Out of reach short-range melee → destination stops INSIDE reach, never at the
// target center (the tunnel bug). gap here is 80, attackRange 12.
{
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 0 };
  const r = approachPoint(from, smallBox(from), to, smallBox(to), 12);
  assert(r.inRange === false, 'approach: out of range');
  const newGap = hitboxGap(smallBox(r.dest), smallBox(to));
  // desiredGap = max(12-8, 12*0.5) = 6 → settles in range with a margin, and
  // strictly short of the target center (dest.x well below 100).
  assert(Math.abs(newGap - 6) < 1e-6, `approach: melee standoff gap ~6 got ${newGap}`);
  assert(r.dest.x < to.x - 10, 'approach: never targets the center');
}

// Long-reach (ranged) mover barely changes its standoff: desiredGap = range-8.
{
  const from = { x: 0, y: 0 };
  const to = { x: 400, y: 0 };
  const r = approachPoint(from, smallBox(from), to, smallBox(to), 200);
  const newGap = hitboxGap(smallBox(r.dest), smallBox(to));
  assert(Math.abs(newGap - 192) < 1e-6, `approach: ranged standoff gap ~192 got ${newGap}`);
}

// Terrain depenetration: a player wedged into the top-right corner of an inflated
// rect should be projected just outside the blocker.
{
  const shapes = [{ kind: 'rect' as const, x: 100, y: 100, halfW: 20, halfH: 20 }];
  const pad = { x: 32, y: 32 };
  const pos = { x: 151.5, y: 49 };
  assert(moverOverlapsBlockShapes(pos, shapes, pad), 'project: starts inside inflated rect');
  const projected = projectOutOfBlockShapes(pos, shapes, pad);
  assert(projected !== null, 'project: finds rect escape');
  assert(
    projected !== null && !moverOverlapsBlockShapes(projected, shapes, pad),
    'project: rect escape is outside terrain',
  );
}

// Multi-rect terrain depenetration iterates until the body is clear of every
// overlapping piece, which is the shape model used by tree trunks and roots.
{
  const shapes = [
    { kind: 'rect' as const, x: 100, y: 100, halfW: 20, halfH: 30 },
    { kind: 'rect' as const, x: 135, y: 75, halfW: 25, halfH: 15 },
  ];
  const pad = { x: 16, y: 16 };
  const pos = { x: 124, y: 82 };
  assert(moverOverlapsBlockShapes(pos, shapes, pad), 'project: starts inside multi-rect terrain');
  const projected = projectOutOfBlockShapes(pos, shapes, pad);
  assert(projected !== null, 'project: finds multi-rect escape');
  assert(
    projected !== null && !moverOverlapsBlockShapes(projected, shapes, pad),
    'project: multi-rect escape is outside terrain',
  );
}

// If movement starts inside terrain and the next tiny movement step is still
// inside, the resolver must not return the same wedged point forever.
{
  const shapes = [{ kind: 'rect' as const, x: 100, y: 100, halfW: 20, halfH: 20 }];
  const pad = { x: 32, y: 32 };
  const from = { x: 100, y: 151 };
  const tinyStepStillInside = { x: 101, y: 151 };
  assert(
    moverOverlapsBlockShapes(from, shapes, pad) &&
      moverOverlapsBlockShapes(tinyStepStillInside, shapes, pad),
    'resolve: tiny step starts and ends inside inflated rect',
  );
  const resolved = resolveMoveAgainstBlocks(from, tinyStepStillInside, shapes, pad);
  assert(
    !moverOverlapsBlockShapes(resolved, shapes, pad),
    'resolve: tiny inside step escapes terrain',
  );
}

console.log('spatialHitbox.test.ts: ok');
