/**
 * GROUND-ZONE GEOMETRY — the one authoritative shape a runtime combat zone has.
 *
 * Executive decision #3 of the boss encounter redesign: ONE serialized geometry
 * instance drives rendering, hit resolution, Step Back, dynamic avoidance and
 * telemetry. Before this module every consumer re-derived its own circle maths
 * from `pos`/`radius`, which is exactly the duplication that made a committed
 * rectangular charge impossible to add without three subtly different answers to
 * "am I standing in it?".
 *
 * Pure functions only: no world, no time, no randomness. `shared/` owns the shape
 * so the client renders precisely the region the server damages.
 *
 * A corridor is stored as start/end + halfWidth rather than angle/length because a
 * committed charge travels along the exact segment the client painted. Deriving an
 * endpoint from an angle on both sides re-introduces the drift this exists to stop.
 */

import { distanceSq, type Vec2 } from '../systems/spatial';

export type GroundZoneGeometry =
  | { kind: 'circle'; center: Vec2; radius: number }
  /** Capsule: the swept disc of a committed charge from `start` to `end`. */
  | { kind: 'corridor'; start: Vec2; end: Vec2; halfWidth: number }
  /** A chain of equal-radius circles resolving as one hit (fault lines). */
  | { kind: 'linked-circles'; points: Vec2[]; radius: number };

export interface GroundZoneCircle {
  pos: Vec2;
  radius: number;
}

export interface GroundZoneBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function circleGeometry(center: Vec2, radius: number): GroundZoneGeometry {
  return { kind: 'circle', center: { ...center }, radius };
}

export function corridorGeometry(start: Vec2, end: Vec2, halfWidth: number): GroundZoneGeometry {
  return { kind: 'corridor', start: { ...start }, end: { ...end }, halfWidth };
}

export function linkedCirclesGeometry(points: readonly Vec2[], radius: number): GroundZoneGeometry {
  return { kind: 'linked-circles', points: points.map(point => ({ ...point })), radius };
}

/** Squared distance from `point` to the segment a→b. Degenerate segments fall back to `a`. */
function distanceSqToSegment(point: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= 1e-9) return distanceSq(point, a);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq));
  return distanceSq(point, { x: a.x + dx * t, y: a.y + dy * t });
}

/** The point on the shape's spine nearest `point` — the centre a push-out aims away from. */
export function nearestSpinePoint(geometry: GroundZoneGeometry, point: Vec2): Vec2 {
  switch (geometry.kind) {
    case 'circle':
      return { ...geometry.center };
    case 'corridor': {
      const { start, end } = geometry;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const lengthSq = dx * dx + dy * dy;
      if (lengthSq <= 1e-9) return { ...start };
      const t = Math.max(
        0,
        Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq),
      );
      return { x: start.x + dx * t, y: start.y + dy * t };
    }
    case 'linked-circles': {
      let best = geometry.points[0] ?? point;
      let bestSq = Infinity;
      for (const candidate of geometry.points) {
        const d = distanceSq(point, candidate);
        if (d < bestSq) {
          bestSq = d;
          best = candidate;
        }
      }
      return { ...best };
    }
  }
}

/** How far the surface sits from the spine. Uniform for every kind we have. */
export function geometryHalfWidth(geometry: GroundZoneGeometry): number {
  switch (geometry.kind) {
    case 'circle':
      return geometry.radius;
    case 'corridor':
      return geometry.halfWidth;
    case 'linked-circles':
      return geometry.radius;
  }
}

/**
 * Containment, optionally grown by `clearance`. Every consumer that asks "is this
 * position inside the danger?" — damage resolution, Step Back, hazard avoidance,
 * telemetry — comes through here rather than comparing radii itself.
 */
export function geometryContains(
  geometry: GroundZoneGeometry,
  point: Vec2,
  clearance = 0,
): boolean {
  switch (geometry.kind) {
    case 'circle': {
      const radius = geometry.radius + clearance;
      return distanceSq(point, geometry.center) <= radius * radius;
    }
    case 'corridor': {
      const halfWidth = geometry.halfWidth + clearance;
      return distanceSqToSegment(point, geometry.start, geometry.end) <= halfWidth * halfWidth;
    }
    case 'linked-circles': {
      const radius = geometry.radius + clearance;
      return geometry.points.some(centre => distanceSq(point, centre) <= radius * radius);
    }
  }
}

/**
 * Decompose into overlapping circles covering the shape, for consumers that can
 * only reason in circles — chiefly the `bodiesInCircle` broad phase.
 *
 * The union is guaranteed to be a SUPERSET of the real geometry, never a subset:
 * a coarse filter that over-reports is harmless because `geometryContains` makes
 * the real decision afterwards, whereas one that under-reports silently drops
 * victims from an attack that visibly covered them.
 */
export function geometryCoveringCircles(geometry: GroundZoneGeometry): GroundZoneCircle[] {
  switch (geometry.kind) {
    case 'circle':
      return [{ pos: { ...geometry.center }, radius: geometry.radius }];
    case 'linked-circles':
      return geometry.points.map(point => ({ pos: { ...point }, radius: geometry.radius }));
    case 'corridor': {
      const { start, end, halfWidth } = geometry;
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      const spacing = Math.max(1, halfWidth);
      const segments = Math.max(1, Math.ceil(length / spacing));
      // Radius EXCEEDS the half-width on purpose. A point at the capsule's very
      // edge, sitting exactly between two sample centres, is
      // hypot(spacing/2, halfWidth) away from each — further than halfWidth — so
      // discs of the lane's own width leave diagonal holes along the flanks.
      // sqrt(2) clears that worst case with room to spare. Over-covering costs a
      // few extra broad-phase candidates; under-covering silently drops victims,
      // which is why this errs outward.
      const radius = halfWidth * Math.SQRT2;
      const circles: GroundZoneCircle[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        circles.push({
          pos: { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t },
          radius,
        });
      }
      return circles;
    }
  }
}

/** Axis-aligned bounds, grown by `clearance`. */
export function geometryBounds(geometry: GroundZoneGeometry, clearance = 0): GroundZoneBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const circle of geometryCoveringCircles(geometry)) {
    const r = circle.radius + clearance;
    minX = Math.min(minX, circle.pos.x - r);
    minY = Math.min(minY, circle.pos.y - r);
    maxX = Math.max(maxX, circle.pos.x + r);
    maxY = Math.max(maxY, circle.pos.y + r);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * The shortest push straight out of the shape, `clearance` past its surface.
 *
 * A SEED for an escape search, not the answer: callers still have to check the
 * destination is standable and clear of every OTHER live zone. Returns null when
 * `from` was never inside, so "already safe" stays distinguishable from "trapped".
 */
export function nearestGeometryExit(
  geometry: GroundZoneGeometry,
  from: Vec2,
  clearance = 0,
): Vec2 | null {
  if (!geometryContains(geometry, from, clearance)) return null;
  const spine = nearestSpinePoint(geometry, from);
  const distance = Math.hypot(from.x - spine.x, from.y - spine.y);
  const target = geometryHalfWidth(geometry) + clearance;
  // Dead centre: no natural exit direction, so pick one deterministically instead
  // of dividing by zero. Callers sample many angles around this seed anyway.
  if (distance <= 1e-6) return { x: from.x + target, y: from.y };
  const scale = target / distance;
  return {
    x: spine.x + (from.x - spine.x) * scale,
    y: spine.y + (from.y - spine.y) * scale,
  };
}

/** Clamp `end` so the segment never runs longer than `maxLength` from `start`. */
export function clampSegmentLength(start: Vec2, end: Vec2, maxLength: number): Vec2 {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= maxLength || length <= 1e-9) return { ...end };
  const scale = maxLength / length;
  return { x: start.x + dx * scale, y: start.y + dy * scale };
}

/** Extend start→towards to exactly `length`, so a charge overshoots its target. */
export function extendSegment(start: Vec2, towards: Vec2, length: number): Vec2 {
  const dx = towards.x - start.x;
  const dy = towards.y - start.y;
  const current = Math.hypot(dx, dy);
  if (current <= 1e-9) return { x: start.x + length, y: start.y };
  const scale = length / current;
  return { x: start.x + dx * scale, y: start.y + dy * scale };
}
