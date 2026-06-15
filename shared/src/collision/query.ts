import {
  hitboxGap,
  inAttackRange,
  isWithinRange,
  pointInNodeFeatureShape,
  type PosHitbox,
  type Vec2,
} from '../systems/spatial';
import type { CollisionRegion } from './types';

/** True when edge-to-edge gap between hitboxes is within weapon reach. */
export function withinReach(a: PosHitbox, b: PosHitbox, range: number): boolean {
  return inAttackRange(a, b, range);
}

/** Minimum edge-to-edge gap between two hitboxes. */
export function reachGap(a: PosHitbox, b: PosHitbox): number {
  return hitboxGap(a, b);
}

export function regionsContainingPoint(
  regions: CollisionRegion[],
  point: Vec2,
): CollisionRegion[] {
  return regions.filter(region =>
    pointInNodeFeatureShape(point, region.shape),
  );
}

export function pointInAnyRegion(
  regions: CollisionRegion[],
  point: Vec2,
): boolean {
  return regions.some(region => pointInNodeFeatureShape(point, region.shape));
}

/** Center-point radius check over entities with `hasPosition.current`. */
export function entitiesInCircle<T extends { hasPosition: { current: Vec2 } }>(
  candidates: Iterable<T>,
  center: Vec2,
  radius: number,
): T[] {
  const out: T[] = [];
  for (const entity of candidates) {
    if (isWithinRange(entity.hasPosition.current, center, radius)) {
      out.push(entity);
    }
  }
  return out;
}
