import {
  inflateShape,
  moverOverlapsBlockShapes,
  resolveMoveAgainstBlocks,
  segmentEntryT,
  type Vec2,
} from '../systems/spatial';
import type { NodeFeatureShape } from '../world/nodeFeatures';

/** Bound direct movement to the current node until authority confirms a crossing. */
export function clampPlayerStepToNode(to: Vec2, width: number, height: number): Vec2 {
  return { x: Math.max(0, Math.min(width, to.x)), y: Math.max(0, Math.min(height, to.y)) };
}

const WAYPOINT_TOLERANCE = 0.01;
const CONTACT_EPSILON = 1e-7;
const CONTACT_DOT_EPSILON = 1e-9;
const MAX_CONTACT_ITERATIONS = 4;

interface Contact {
  t: number;
  normals: Vec2[];
}

function finiteVec2(value: Vec2): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y);
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function addInwardNormal(normals: Vec2[], normal: Vec2, movement: Vec2): void {
  const length = Math.hypot(normal.x, normal.y);
  if (length < CONTACT_EPSILON) return;
  const unit = { x: normal.x / length, y: normal.y / length };
  // A tangent or a surface behind the mover is not a collision. This also
  // prevents an exact circle/ellipse graze from acquiring an arbitrary slide.
  if (unit.x * movement.x + unit.y * movement.y < -CONTACT_DOT_EPSILON) {
    normals.push(unit);
  }
}

/** Outward normals at a segment contact, restricted to surfaces entered by movement. */
function contactNormals(
  point: Vec2,
  movement: Vec2,
  shape: NodeFeatureShape,
): Vec2[] {
  switch (shape.kind) {
    case 'circle': {
      const normals: Vec2[] = [];
      // The gradient points out of a circle.
      addInwardNormal(normals, { x: point.x - shape.x, y: point.y - shape.y }, movement);
      return normals;
    }
    case 'ellipse': {
      const dx = point.x - shape.x;
      const dy = point.y - shape.y;
      const normals: Vec2[] = [];
      // The normalized gradient is the correct normal for an ellipse. Using the
      // radial vector here would make glancing contacts steer incorrectly.
      addInwardNormal(
        normals,
        { x: dx / (shape.halfW * shape.halfW), y: dy / (shape.halfH * shape.halfH) },
        movement,
      );
      return normals;
    }
    case 'rect': {
      const dx = point.x - shape.x;
      const dy = point.y - shape.y;
      const onX = Math.abs(Math.abs(dx) - shape.halfW) <= 1e-5;
      const onY = Math.abs(Math.abs(dy) - shape.halfH) <= 1e-5;
      const normals: Vec2[] = [];
      if (onX) {
        addInwardNormal(normals, { x: dx >= 0 ? 1 : -1, y: 0 }, movement);
      }
      if (onY) {
        addInwardNormal(normals, { x: 0, y: dy >= 0 ? 1 : -1 }, movement);
      }
      return normals;
    }
  }
}

function firstContact(
  from: Vec2,
  to: Vec2,
  shapes: NodeFeatureShape[],
): Contact | null {
  const movement = { x: to.x - from.x, y: to.y - from.y };
  const length = Math.hypot(movement.x, movement.y);
  if (length < CONTACT_EPSILON) return null;

  let earliest = Infinity;
  const normals: Vec2[] = [];
  for (const shape of shapes) {
    const t = segmentEntryT(from, to, shape);
    if (t === null || !Number.isFinite(t)) continue;
    const point = {
      x: from.x + movement.x * t,
      y: from.y + movement.y * t,
    };
    const shapeNormals = contactNormals(point, movement, shape);
    if (shapeNormals.length === 0) continue;
    if (t < earliest - CONTACT_EPSILON) {
      earliest = t;
      normals.length = 0;
      normals.push(...shapeNormals);
    } else if (Math.abs(t - earliest) <= CONTACT_EPSILON) {
      earliest = Math.min(earliest, t);
      normals.push(...shapeNormals);
    }
  }

  if (!Number.isFinite(earliest) || normals.length === 0) return null;
  // Make simultaneous contacts deterministic even when callers provide the same
  // blockers in a different order.
  normals.sort((a, b) => a.x - b.x || a.y - b.y);
  return { t: Math.max(0, Math.min(1, earliest)), normals };
}

function blocked(pos: Vec2, shapes: NodeFeatureShape[]): boolean {
  return moverOverlapsBlockShapes(pos, shapes);
}

/** Return the furthest non-overlapping point on a known-safe segment. */
function retreatToSafePoint(
  from: Vec2,
  to: Vec2,
  shapes: NodeFeatureShape[],
): Vec2 {
  if (!blocked(to, shapes)) return to;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const point = {
      x: from.x + (to.x - from.x) * mid,
      y: from.y + (to.y - from.y) * mid,
    };
    if (blocked(point, shapes)) hi = mid;
    else lo = mid;
  }
  return {
    x: from.x + (to.x - from.x) * lo,
    y: from.y + (to.y - from.y) * lo,
  };
}

function removeInwardComponents(remainder: Vec2, normals: Vec2[]): Vec2 {
  const projected = { x: remainder.x, y: remainder.y };
  // Sequential projection can reintroduce an inward component against a second
  // non-axis-aligned contact, so settle the small contact set to a common cone.
  for (let pass = 0; pass < normals.length + 1; pass++) {
    let changed = false;
    for (const normal of normals) {
      const inward = projected.x * normal.x + projected.y * normal.y;
      if (inward >= 0) continue;
      projected.x -= normal.x * inward;
      projected.y -= normal.y * inward;
      changed = true;
    }
    if (!changed) break;
  }
  return projected;
}

/**
 * Sweep a player center from `from` toward `to`, preserving only tangential
 * motion at the first terrain contact. This primitive intentionally leaves an
 * already-invalid start in place; authoritative depenetration is a separate
 * operation.
 */
export function movePlayerWithCollisions(
  from: Vec2,
  to: Vec2,
  shapes: NodeFeatureShape[],
  pad: Vec2 = { x: 0, y: 0 },
): Vec2 {
  if (!finiteVec2(from) || !finiteVec2(to) || !finiteVec2(pad)) return { ...from };
  const paddedShapes = shapes.map(shape => inflateShape(shape, pad));
  if (paddedShapes.length === 0) return { ...to };
  if (blocked(from, paddedShapes)) return { ...from };

  const desired = { x: to.x - from.x, y: to.y - from.y };
  const originalBudget = Math.hypot(desired.x, desired.y);
  if (originalBudget < CONTACT_EPSILON) return { ...from };

  let position = { ...from };
  let remainder = desired;
  for (let iteration = 0; iteration < MAX_CONTACT_ITERATIONS; iteration++) {
    const remainderLength = Math.hypot(remainder.x, remainder.y);
    if (remainderLength < CONTACT_EPSILON) break;
    const candidate = {
      x: position.x + remainder.x,
      y: position.y + remainder.y,
    };
    const contact = firstContact(position, candidate, paddedShapes);
    if (!contact) {
      const safe = retreatToSafePoint(position, candidate, paddedShapes);
      position = safe;
      break;
    }

    const travel = Math.max(0, contact.t * remainderLength - 0.5);
    const unit = { x: remainder.x / remainderLength, y: remainder.y / remainderLength };
    const nextPosition = retreatToSafePoint(
      position,
      { x: position.x + unit.x * travel, y: position.y + unit.y * travel },
      paddedShapes,
    );
    const consumed = {
      x: nextPosition.x - position.x,
      y: nextPosition.y - position.y,
    };
    const consumedLength = Math.hypot(consumed.x, consumed.y);
    position = nextPosition;
    remainder = {
      x: remainder.x - consumed.x,
      y: remainder.y - consumed.y,
    };
    remainder = removeInwardComponents(remainder, contact.normals);

    // A contact at the separation gap has no useful travel. The next projection
    // is allowed to make tangential progress once; after that, stop safely if
    // numerical noise keeps finding the same boundary.
    if (consumedLength < CONTACT_EPSILON && Math.hypot(remainder.x, remainder.y) >= remainderLength - CONTACT_EPSILON) {
      break;
    }
  }

  // The projection only removes components from the requested vector, but clamp
  // tiny floating-point overshoot before returning the player endpoint.
  const moved = { x: position.x - from.x, y: position.y - from.y };
  const movedLength = Math.hypot(moved.x, moved.y);
  if (movedLength > originalBudget + 1e-6) {
    const scale = originalBudget / movedLength;
    position = { x: from.x + moved.x * scale, y: from.y + moved.y * scale };
  }
  if (!finiteVec2(position) || blocked(position, paddedShapes)) return { ...from };
  return position;
}

export interface PlayerPathAdvance {
  position: Vec2;
  waypoints: Vec2[];
  blocked: boolean;
}

/** Advance a collision-checked player path, preserving a blocked waypoint head. */
export function advancePlayerPath(
  from: Vec2,
  waypoints: Vec2[],
  distanceBudget: number,
  shapes: NodeFeatureShape[],
  pad: Vec2 = { x: 0, y: 0 },
): PlayerPathAdvance {
  let position = { ...from };
  const remaining = waypoints.map(point => ({ ...point }));
  let budget = Number.isFinite(distanceBudget) ? Math.max(0, distanceBudget) : 0;
  let blockedThisUpdate = false;
  if (moverOverlapsBlockShapes(from, shapes, pad)) {
    return { position, waypoints: remaining, blocked: true };
  }
  const maxIterations = remaining.length + 1;
  let iterations = 0;

  while (remaining.length > 0 && iterations < maxIterations) {
    iterations++;
    const head = remaining[0];
    const toHead = distance(position, head);
    if (toHead <= WAYPOINT_TOLERANCE && budget >= toHead) {
      if (moverOverlapsBlockShapes(head, shapes, pad) || resolveMoveAgainstBlocks(position, head, shapes, pad) !== head) {
        blockedThisUpdate = true;
        break;
      }
      budget -= toHead;
      position = { ...head };
      remaining.shift();
      continue;
    }
    if (budget <= WAYPOINT_TOLERANCE) break;

    const step = Math.min(budget, toHead);
    const unit = { x: (head.x - position.x) / toHead, y: (head.y - position.y) / toHead };
    const intended = {
      x: position.x + unit.x * step,
      y: position.y + unit.y * step,
    };
    // A planned segment must stop on contact, not slide away from its route.
    const next = resolveMoveAgainstBlocks(position, intended, shapes, pad);
    const traveled = distance(position, next);
    const reachedIntended = distance(next, intended) <= WAYPOINT_TOLERANCE;
    position = next;
    budget = Math.max(0, budget - Math.min(budget, traveled));

    if (!reachedIntended) {
      blockedThisUpdate = true;
      break;
    }
    if (step === toHead && distance(position, head) <= WAYPOINT_TOLERANCE) {
      position = { ...head };
      remaining.shift();
    } else {
      break;
    }
  }

  return { position, waypoints: remaining, blocked: blockedThisUpdate };
}
