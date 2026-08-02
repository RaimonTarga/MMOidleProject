import type { NodeFeatureShape } from '../world/nodeFeatures';

// ─── Vector primitives ────────────────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function zeroVec2(): Vec2 {
  return { x: 0, y: 0 };
}

export function zeroVec3(): Vec3 {
  return { x: 0, y: 0, z: 0 };
}

/** Squared Euclidean distance between two points — cheaper than `distance` when
 *  only a comparison is needed. */
export function distanceSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** True if `b` is within `range` pixels of `a`. Uses squared distance for speed. */
export function isWithinRange(a: Vec2, b: Vec2, range: number): boolean {
  return distanceSq(a, b) <= range * range;
}

/**
 * A directional motion vector — used by the server ECS to express remaining
 * movement without storing target coordinates directly. `targetX` / `targetY`
 * are computed only at wire-projection time via `pointFromMotion`.
 */
export interface MotionVector {
  /** Normalized movement direction. `{ x: 0, y: 0 }` means stationary. */
  direction: Vec2;
  /** Remaining distance in pixels along `direction`. */
  magnitude: number;
}

/** Stationary motion sentinel — direction zero, magnitude zero. */
export function zeroMotion(): MotionVector {
  return { direction: { x: 0, y: 0 }, magnitude: 0 };
}

/** Return a unit-length copy of `v`. Zero-length input returns the zero vector. */
export function normalize(v: Vec2): Vec2 {
  const mag = Math.hypot(v.x, v.y);
  return mag > 0 ? { x: v.x / mag, y: v.y / mag } : { x: 0, y: 0 };
}

/**
 * Build a motion vector from `from` toward `to`. The magnitude is the
 * distance between the two points; the direction is unit-length. A zero
 * distance produces the zero motion vector.
 */
export function vectorTo(from: Vec2, to: Vec2): MotionVector {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const magnitude = Math.hypot(dx, dy);
  return {
    direction: magnitude > 0 ? { x: dx / magnitude, y: dy / magnitude } : { x: 0, y: 0 },
    magnitude,
  };
}

/**
 * Project the endpoint of a motion vector. Equivalent to "where would the
 * entity end up if it travelled the full remaining distance".
 */
export function pointFromMotion(origin: Vec2, motion: MotionVector): Vec2 {
  return {
    x: origin.x + motion.direction.x * motion.magnitude,
    y: origin.y + motion.direction.y * motion.magnitude,
  };
}

/**
 * Advance a position along its motion vector by up to `distance` pixels.
 * Never overshoots: if `distance >= motion.magnitude`, the endpoint is
 * exactly the projected target and the returned motion is `zeroMotion()`.
 */
export function advanceMotion(
  position: Vec2,
  motion: MotionVector,
  distance: number,
): { position: Vec2; motion: MotionVector } {
  const step = Math.min(distance, motion.magnitude);
  const nextPosition: Vec2 = {
    x: position.x + motion.direction.x * step,
    y: position.y + motion.direction.y * step,
  };
  const nextMagnitude = Math.max(0, motion.magnitude - step);
  return {
    position: nextPosition,
    motion: nextMagnitude > 0
      ? { direction: motion.direction, magnitude: nextMagnitude }
      : zeroMotion(),
  };
}

// ─── Hitbox / attack-range gap math ───────────────────────────────────────────

import type { HasHitbox, HitboxRect } from '../hitbox/types';
import type { HasPosition } from '../components/core/networkedSlices';
import { FALLBACK_PLAYER_AABB } from '../hitbox/constants';

export interface PosHitbox {
  pos: Vec2;
  rects: HitboxRect[];
}

/** Closest separation between two axis-aligned boxes (0 when overlapping). */
export function rectGap(
  aPos: Vec2,
  a: HitboxRect,
  bPos: Vec2,
  b: HitboxRect,
): number {
  const ax = aPos.x + a.offsetX;
  const ay = aPos.y + a.offsetY;
  const bx = bPos.x + b.offsetX;
  const by = bPos.y + b.offsetY;
  const dx = Math.max(0, Math.abs(ax - bx) - (a.halfW + b.halfW));
  const dy = Math.max(0, Math.abs(ay - by) - (a.halfH + b.halfH));
  return Math.hypot(dx, dy);
}

/** Minimum gap between any rect pair in two hitboxes. */
export function hitboxGap(a: PosHitbox, b: PosHitbox): number {
  if (a.rects.length === 0 || b.rects.length === 0) return Infinity;
  let best = Infinity;
  for (const ar of a.rects) {
    for (const br of b.rects) {
      best = Math.min(best, rectGap(a.pos, ar, b.pos, br));
    }
  }
  return best;
}

/** True when edge-to-edge gap between hitboxes is within weapon reach. */
export function inAttackRange(a: PosHitbox, b: PosHitbox, range: number): boolean {
  return hitboxGap(a, b) <= range;
}

/**
 * Margin (px) an approacher keeps inside its own reach when settling on a melee
 * target. The resting gap is the larger of `attackRange - MELEE_CONTACT_MARGIN`
 * and `attackRange * MELEE_STANDOFF_FRAC` — so short-reach melee settles around
 * half its reach, while long-reach (ranged) movers barely change their standoff.
 */
export const MELEE_CONTACT_MARGIN = 8;
export const MELEE_STANDOFF_FRAC = 0.5;

/**
 * Destination for an approacher closing on an attack target. Returns a point a
 * fixed standoff *inside* reach rather than the target's center.
 *
 * Steering at the exact center makes fast movers tunnel straight through the
 * target at large `dt`: each side overshoots to where the other just was, they
 * swap places, and the narrow edge-to-edge reach band is never satisfied at a
 * tick boundary (so no hit lands and kite speed ramps forever). Because
 * `advanceMotion` never overshoots its destination, aiming at the standoff point
 * makes the approacher stop cleanly in range no matter how large its per-tick
 * step is. The standoff also leaves a margin so small per-tick drift doesn't
 * immediately drop the approacher back out of range.
 *
 * POSTCONDITION: when a reachable standoff exists, `hitboxGap(dest, toPH)` is
 * `<= attackRange`. Callers rely on this to decide whether a target is
 * *engageable at all*, not just to steer — see `pathEndsInAttackRange`.
 *
 * That postcondition used to hold only for axis-aligned approaches. The advance
 * was `gap - desiredGap` measured along the CENTRE-to-centre ray, but `gap` is
 * the EDGE-to-edge hitbox gap; for rectangles those shrink at the same rate only
 * when the approach runs along an axis. Off-axis the destination landed short —
 * 17.2 px against a 12 px melee range at 30° — so `pathEndsInAttackRange` was
 * false for every candidate and `nearestEngageableMonster` reported a node full
 * of reachable monsters as having none, freezing auto-combat permanently. The
 * existing tests only ever approached at 0°, so they passed throughout.
 * Fixed 2026-08-02; see the off-axis cases below it in `spatialHitbox.test.ts`.
 */
export function approachPoint(
  from: Vec2,
  fromPH: PosHitbox,
  to: Vec2,
  toPH: PosHitbox,
  attackRange: number,
): { inRange: boolean; dest: Vec2 } {
  const gap = hitboxGap(fromPH, toPH);
  if (gap <= attackRange) return { inRange: true, dest: from };

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { inRange: false, dest: from };

  const desiredGap = Math.max(
    attackRange - MELEE_CONTACT_MARGIN,
    attackRange * MELEE_STANDOFF_FRAC,
  );

  const ux = dx / dist;
  const uy = dy / dist;
  const gapAfter = (advance: number): number =>
    hitboxGap(
      { pos: { x: from.x + ux * advance, y: from.y + uy * advance }, rects: fromPH.rects },
      toPH,
    );

  // The straight-line estimate is exact on-axis and short otherwise, so it is a
  // safe lower bound to start from.
  let lo = Math.max(0, Math.min(gap - desiredGap, dist));
  if (gapAfter(lo) <= desiredGap) {
    return { inRange: false, dest: { x: from.x + ux * lo, y: from.y + uy * lo } };
  }

  // Walk forward to an advance that overshoots the standoff, capped at the
  // target centre (never step past it — that is the tunnelling this avoids).
  let hi = dist;
  if (gapAfter(hi) > desiredGap) {
    // Cannot satisfy the standoff even at the centre (targets whose hitboxes
    // cannot overlap enough); return the closest legal point.
    return { inRange: false, dest: { x: from.x + ux * hi, y: from.y + uy * hi } };
  }

  // Bisect for the SMALLEST advance meeting the standoff: closing further than
  // necessary is what tunnels. Hitbox gap is monotonic along the ray, so ~24
  // halvings resolve any node-sized distance to well under a pixel.
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (gapAfter(mid) <= desiredGap) hi = mid;
    else lo = mid;
  }

  return { inRange: false, dest: { x: from.x + ux * hi, y: from.y + uy * hi } };
}

/** True when `point` lies inside any rect of `ph`. */
export function pointInHitbox(point: Vec2, ph: PosHitbox): boolean {
  for (const rect of ph.rects) {
    const cx = ph.pos.x + rect.offsetX;
    const cy = ph.pos.y + rect.offsetY;
    if (
      point.x >= cx - rect.halfW &&
      point.x <= cx + rect.halfW &&
      point.y >= cy - rect.halfH &&
      point.y <= cy + rect.halfH
    ) {
      return true;
    }
  }
  return false;
}

export function posHitboxFromEntity(entity: {
  hasPosition: HasPosition;
  hasHitbox?: HasHitbox;
}): PosHitbox {
  return {
    pos: entity.hasPosition.current,
    rects: entity.hasHitbox?.rects ?? [FALLBACK_PLAYER_AABB],
  };
}

/** True if `pos` is inside a circle (inclusive of boundary). */
export function pointInCircle(
  pos: Vec2,
  cx: number,
  cy: number,
  radius: number,
): boolean {
  const dx = pos.x - cx;
  const dy = pos.y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/** True if `pos` is inside an axis-aligned rectangle centered at (x, y). */
export function pointInRect(
  pos: Vec2,
  x: number,
  y: number,
  halfW: number,
  halfH: number,
): boolean {
  return (
    pos.x >= x - halfW &&
    pos.x <= x + halfW &&
    pos.y >= y - halfH &&
    pos.y <= y + halfH
  );
}

/** True if `pos` is inside an axis-aligned ellipse centered at (x, y). */
export function pointInEllipse(
  pos: Vec2,
  x: number,
  y: number,
  halfW: number,
  halfH: number,
): boolean {
  const dx = pos.x - x;
  const dy = pos.y - y;
  return (dx * dx) / (halfW * halfW) + (dy * dy) / (halfH * halfH) <= 1;
}

export function pointInNodeFeatureShape(pos: Vec2, shape: NodeFeatureShape): boolean {
  switch (shape.kind) {
    case 'circle':
      return pointInCircle(pos, shape.x, shape.y, shape.radius);
    case 'ellipse':
      return pointInEllipse(pos, shape.x, shape.y, shape.halfW, shape.halfH);
    case 'rect':
      return pointInRect(pos, shape.x, shape.y, shape.halfW, shape.halfH);
  }
}

/** Distance in px from `pos` to the nearest point on the shape perimeter. */
export function distanceToNodeFeatureShapeEdge(
  pos: Vec2,
  shape: NodeFeatureShape,
): number {
  switch (shape.kind) {
    case 'circle': {
      const dist = Math.hypot(pos.x - shape.x, pos.y - shape.y);
      return Math.abs(dist - shape.radius);
    }
    case 'ellipse': {
      const dx = pos.x - shape.x;
      const dy = pos.y - shape.y;
      const norm = Math.sqrt(
        (dx * dx) / (shape.halfW * shape.halfW) +
          (dy * dy) / (shape.halfH * shape.halfH),
      );
      const scale = Math.min(shape.halfW, shape.halfH);
      return Math.abs(norm - 1) * scale;
    }
    case 'rect': {
      const dx = Math.abs(pos.x - shape.x);
      const dy = Math.abs(pos.y - shape.y);
      if (dx <= shape.halfW && dy <= shape.halfH) {
        return Math.min(shape.halfW - dx, shape.halfH - dy);
      }
      const ox = Math.max(0, dx - shape.halfW);
      const oy = Math.max(0, dy - shape.halfH);
      return Math.hypot(ox, oy);
    }
  }
}

/** True when `pos` is within `bandPx` of the shape boundary (inside or outside). */
export function pointNearNodeFeatureShapeEdge(
  pos: Vec2,
  shape: NodeFeatureShape,
  bandPx: number,
): boolean {
  return distanceToNodeFeatureShapeEdge(pos, shape) <= bandPx;
}

/** Uniform random point inside a circle, ellipse, or axis-aligned rectangle. */
export function randomPointInShape(shape: NodeFeatureShape): Vec2 {
  switch (shape.kind) {
    case 'circle': {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * shape.radius;
      return {
        x: shape.x + Math.cos(angle) * dist,
        y: shape.y + Math.sin(angle) * dist,
      };
    }
    case 'ellipse': {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random());
      return {
        x: shape.x + Math.cos(angle) * dist * shape.halfW,
        y: shape.y + Math.sin(angle) * dist * shape.halfH,
      };
    }
    case 'rect':
      return {
        x: shape.x + (Math.random() * 2 - 1) * shape.halfW,
        y: shape.y + (Math.random() * 2 - 1) * shape.halfH,
      };
  }
}

/** Uniform random point on the perimeter of a circle, ellipse, or axis-aligned rectangle. */
export function randomPointOnShapeEdge(shape: NodeFeatureShape): Vec2 {
  switch (shape.kind) {
    case 'circle': {
      const angle = Math.random() * Math.PI * 2;
      return {
        x: shape.x + Math.cos(angle) * shape.radius,
        y: shape.y + Math.sin(angle) * shape.radius,
      };
    }
    case 'ellipse': {
      const angle = Math.random() * Math.PI * 2;
      return {
        x: shape.x + Math.cos(angle) * shape.halfW,
        y: shape.y + Math.sin(angle) * shape.halfH,
      };
    }
    case 'rect': {
      const w = shape.halfW * 2;
      const h = shape.halfH * 2;
      const perimeter = 2 * (w + h);
      let t = Math.random() * perimeter;
      if (t < w) {
        return { x: shape.x - shape.halfW + t, y: shape.y - shape.halfH };
      }
      t -= w;
      if (t < h) {
        return { x: shape.x + shape.halfW, y: shape.y - shape.halfH + t };
      }
      t -= h;
      if (t < w) {
        return { x: shape.x + shape.halfW - t, y: shape.y + shape.halfH };
      }
      t -= w;
      return { x: shape.x - shape.halfW, y: shape.y + shape.halfH - t };
    }
  }
}

/**
 * Parametric entry point (t in [0,1]) where the segment `from`→`to` first crosses
 * into `shape`, assuming `from` is outside the shape. Returns null if the segment
 * never enters the shape (or starts inside).
 */
function segmentEntryT(from: Vec2, to: Vec2, shape: NodeFeatureShape): number | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return null;

  if (shape.kind === 'circle') {
    const fx = from.x - shape.x;
    const fy = from.y - shape.y;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - shape.radius * shape.radius;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const t = (-b - Math.sqrt(disc)) / (2 * a);
    return t >= 0 && t <= 1 ? t : null;
  }

  if (shape.kind === 'ellipse') {
    const fx = from.x - shape.x;
    const fy = from.y - shape.y;
    const invA2 = 1 / (shape.halfW * shape.halfW);
    const invB2 = 1 / (shape.halfH * shape.halfH);
    const A = dx * dx * invA2 + dy * dy * invB2;
    const B = 2 * (fx * dx * invA2 + fy * dy * invB2);
    const C = fx * fx * invA2 + fy * fy * invB2 - 1;
    const disc = B * B - 4 * A * C;
    if (disc < 0) return null;
    const t = (-B - Math.sqrt(disc)) / (2 * A);
    return t >= 0 && t <= 1 ? t : null;
  }

  // Rect: Liang–Barsky slab clip; tMin is the entry parameter.
  const minX = shape.x - shape.halfW;
  const maxX = shape.x + shape.halfW;
  const minY = shape.y - shape.halfH;
  const maxY = shape.y + shape.halfH;
  let tMin = 0;
  let tMax = 1;
  const edges: Array<[number, number]> = [
    [-dx, from.x - minX],
    [dx, maxX - from.x],
    [-dy, from.y - minY],
    [dy, maxY - from.y],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > tMax) return null;
      if (r > tMin) tMin = r;
    } else {
      if (r < tMin) return null;
      if (r < tMax) tMax = r;
    }
  }
  return tMin > 0 && tMin <= 1 ? tMin : null;
}

/** Axis-aligned half-extents of a hitbox around its anchor (for box-vs-box pad). */
export function aabbHalfExtents(rects: HitboxRect[]): Vec2 {
  let x = 0;
  let y = 0;
  for (const r of rects) {
    x = Math.max(x, Math.abs(r.offsetX) + r.halfW);
    y = Math.max(y, Math.abs(r.offsetY) + r.halfH);
  }
  return { x, y };
}

/**
 * Grow a block shape by the mover's half-extents (Minkowski sum) so a point test
 * on the mover's center is equivalent to a box-vs-shape overlap test — the
 * mover's body then never intersects the shape instead of its center slipping to
 * the edge. Circles widen by the larger half-extent to stay fully enclosing.
 */
function inflateShape(shape: NodeFeatureShape, pad: Vec2): NodeFeatureShape {
  switch (shape.kind) {
    case 'circle':
      return {
        kind: 'circle',
        x: shape.x,
        y: shape.y,
        radius: shape.radius + Math.max(pad.x, pad.y),
      };
    case 'ellipse':
      return {
        kind: 'ellipse',
        x: shape.x,
        y: shape.y,
        halfW: shape.halfW + pad.x,
        halfH: shape.halfH + pad.y,
      };
    case 'rect':
      return {
        kind: 'rect',
        x: shape.x,
        y: shape.y,
        halfW: shape.halfW + pad.x,
        halfH: shape.halfH + pad.y,
      };
  }
}

function projectPointOutOfShape(pos: Vec2, shape: NodeFeatureShape): Vec2 | null {
  if (!pointInNodeFeatureShape(pos, shape)) return null;
  const epsilon = 0.75;

  switch (shape.kind) {
    case 'circle': {
      const dx = pos.x - shape.x;
      const dy = pos.y - shape.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1e-6) return { x: shape.x + shape.radius + epsilon, y: shape.y };
      const reach = shape.radius + epsilon;
      return {
        x: shape.x + (dx / dist) * reach,
        y: shape.y + (dy / dist) * reach,
      };
    }
    case 'ellipse': {
      const dx = pos.x - shape.x;
      const dy = pos.y - shape.y;
      const norm = Math.sqrt(
        (dx * dx) / (shape.halfW * shape.halfW) +
          (dy * dy) / (shape.halfH * shape.halfH),
      );
      if (norm < 1e-6) return { x: shape.x + shape.halfW + epsilon, y: shape.y };
      const scale = (1 + epsilon / Math.min(shape.halfW, shape.halfH)) / norm;
      return {
        x: shape.x + dx * scale,
        y: shape.y + dy * scale,
      };
    }
    case 'rect': {
      const minX = shape.x - shape.halfW;
      const maxX = shape.x + shape.halfW;
      const minY = shape.y - shape.halfH;
      const maxY = shape.y + shape.halfH;
      const distances = [
        { axis: 'x' as const, value: minX - epsilon, distance: pos.x - minX },
        { axis: 'x' as const, value: maxX + epsilon, distance: maxX - pos.x },
        { axis: 'y' as const, value: minY - epsilon, distance: pos.y - minY },
        { axis: 'y' as const, value: maxY + epsilon, distance: maxY - pos.y },
      ];
      distances.sort((a, b) => a.distance - b.distance);
      const nearest = distances[0];
      return nearest.axis === 'x'
        ? { x: nearest.value, y: pos.y }
        : { x: pos.x, y: nearest.value };
    }
  }
}

/**
 * Push a mover center out of inflated block shapes if it has penetrated terrain.
 * Normal movement should prevent penetration; this is an authoritative failsafe.
 */
export function projectOutOfBlockShapes(
  pos: Vec2,
  shapes: NodeFeatureShape[],
  pad: Vec2 = { x: 0, y: 0 },
): Vec2 | null {
  if (shapes.length === 0) return null;
  const padded = pad.x !== 0 || pad.y !== 0;
  let current = { x: pos.x, y: pos.y };
  let moved = false;

  for (let i = 0; i < 12; i++) {
    let projectedThisPass = false;
    for (const shape of shapes) {
      const s = padded ? inflateShape(shape, pad) : shape;
      const projected = projectPointOutOfShape(current, s);
      if (!projected) continue;
      current = projected;
      moved = true;
      projectedThisPass = true;
    }
    if (!projectedThisPass) break;
  }

  if (moved && !moverOverlapsBlockShapes(current, shapes, pad)) return current;

  // Complex multi-rect terrain can make axis projections bounce between pieces.
  // As a final failsafe, search outward from the original point and pick the
  // first nearby non-overlapping center. This keeps future terrain authoring
  // mistakes from becoming permanent wedged states.
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: Math.SQRT1_2, y: Math.SQRT1_2 },
    { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
    { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
    { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
  ];
  for (let radius = 4; radius <= 256; radius *= 2) {
    for (const dir of directions) {
      const candidate = {
        x: pos.x + dir.x * radius,
        y: pos.y + dir.y * radius,
      };
      if (!moverOverlapsBlockShapes(candidate, shapes, pad)) return candidate;
    }
  }

  return null;
}

/**
 * Clamp the segment `from`→`to` so it stops just before entering any of `shapes`.
 * Shapes that already contain `from` are ignored (the mover is already inside, so
 * it may move freely until it exits). Returns the original `to` reference when the
 * path is unobstructed, so callers can detect truncation via identity.
 *
 * When `pad` is non-zero each shape is inflated by those half-extents, turning the
 * center-point test into a box-vs-shape test so the mover's body — not just its
 * center — stays out of the obstacle.
 */
export function clampSegmentBeforeShapes(
  from: Vec2,
  to: Vec2,
  shapes: NodeFeatureShape[],
  pad: Vec2 = { x: 0, y: 0 },
): Vec2 {
  const padded = pad.x !== 0 || pad.y !== 0;
  let minT = 1;
  for (const shape of shapes) {
    const s = padded ? inflateShape(shape, pad) : shape;
    if (pointInNodeFeatureShape(from, s)) continue;
    const t = segmentEntryT(from, to, s);
    if (t !== null && t < minT) minT = t;
  }
  if (minT >= 1) return to;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: from.x, y: from.y };
  const gap = 0.5; // stop a hair short of the boundary
  const reach = Math.max(0, minT * len - gap);
  return {
    x: from.x + (dx / len) * reach,
    y: from.y + (dy / len) * reach,
  };
}

/** True when the mover's padded bounding box overlaps any block shape. */
export function moverOverlapsBlockShapes(
  pos: Vec2,
  shapes: NodeFeatureShape[],
  pad: Vec2 = { x: 0, y: 0 },
): boolean {
  const padded = pad.x !== 0 || pad.y !== 0;
  for (const shape of shapes) {
    const s = padded ? inflateShape(shape, pad) : shape;
    if (pointInNodeFeatureShape(pos, s)) return true;
  }
  return false;
}

/**
 * Resolve a move target so the mover's bounding box never overlaps block shapes.
 * Extends {@link clampSegmentBeforeShapes} with a destination overlap check so
 * movers that already touch a blocker cannot path deeper into it.
 */
export function resolveMoveAgainstBlocks(
  from: Vec2,
  to: Vec2,
  shapes: NodeFeatureShape[],
  pad: Vec2 = { x: 0, y: 0 },
): Vec2 {
  if (shapes.length === 0) return to;

  if (moverOverlapsBlockShapes(from, shapes, pad)) {
    if (!moverOverlapsBlockShapes(to, shapes, pad)) return to;
    return projectOutOfBlockShapes(from, shapes, pad) ?? { x: from.x, y: from.y };
  }

  const candidate = clampSegmentBeforeShapes(from, to, shapes, pad);
  if (!moverOverlapsBlockShapes(candidate, shapes, pad)) return candidate;

  const dx = candidate.x - from.x;
  const dy = candidate.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return { x: from.x, y: from.y };

  // Walk back along the segment to the furthest non-overlapping point.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    const probe = { x: from.x + (dx / len) * (mid * len), y: from.y + (dy / len) * (mid * len) };
    if (moverOverlapsBlockShapes(probe, shapes, pad)) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  const reach = Math.max(0, lo * len - 0.5);
  return {
    x: from.x + (dx / len) * reach,
    y: from.y + (dy / len) * reach,
  };
}

/** Max reach from entity center to outer hitbox edge (for range ring drawing). */
export function outerReachHalfW(rects: HitboxRect[]): number {
  let max = 0;
  for (const r of rects) {
    max = Math.max(max, Math.abs(r.offsetX) + r.halfW, Math.abs(r.offsetY) + r.halfW);
  }
  return max;
}

