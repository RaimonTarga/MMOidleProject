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

/** Max reach from entity center to outer hitbox edge (for range ring drawing). */
export function outerReachHalfW(rects: HitboxRect[]): number {
  let max = 0;
  for (const r of rects) {
    max = Math.max(max, Math.abs(r.offsetX) + r.halfW, Math.abs(r.offsetY) + r.halfW);
  }
  return max;
}

