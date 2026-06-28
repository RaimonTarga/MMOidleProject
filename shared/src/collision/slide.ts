import type { NodeFeatureShape } from '../world/nodeFeatures';
import { resolveMoveAgainstBlocks, type Vec2 } from '../systems/spatial';

/**
 * Deflection angles (degrees) tried to each side of the desired heading when the
 * straight move is blocked. Smaller angles keep more forward progress; the 90°
 * entry is the pure tangent used as a last-resort wall-follow.
 */
const DEFLECT_ANGLES_DEG = [25, 45, 65, 90];

/** Straight move counts as "good enough" once it keeps this fraction of forward reach. */
const GRAZE_FRACTION = 0.5;
const MIN_MOVE = 0.5;

function rotate(v: Vec2, rad: number): Vec2 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

/**
 * Keyboard-style move resolution: try the straight move, then deflect around the
 * obstacle when blocked. Does not run full A*.
 *
 * The straight result is taken whenever it makes real headway. Otherwise the
 * desired displacement is rotated by increasing angles to each side and re-clamped;
 * the candidate that keeps the most progress *toward the destination* wins, so a
 * mover holding a heading into a convex obstacle (a tree trunk) curves smoothly
 * around it instead of catching on the surface. When the mover is pinned dead-on —
 * no deflection makes forward progress — it commits to the tangent slide that
 * travels farthest along the surface, wall-following free rather than dead-stopping
 * (the singular case the old forward-progress-only scoring could never escape).
 */
export function slideMoveAgainstBlocks(
  from: Vec2,
  to: Vec2,
  shapes: NodeFeatureShape[],
  pad: Vec2 = { x: 0, y: 0 },
): Vec2 {
  const straight = resolveMoveAgainstBlocks(from, to, shapes, pad);
  if (straight === to) return to;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return straight;
  const dir = { x: dx / len, y: dy / len };

  let best = straight;
  let bestForward = (straight.x - from.x) * dir.x + (straight.y - from.y) * dir.y;
  if (bestForward >= len * GRAZE_FRACTION) return straight;

  // Track the farthest-travelling candidate separately so a head-on mover (no
  // forward progress anywhere) can still slide along the surface to break free.
  let bestSlide = best;
  let bestSlideMove = Math.hypot(best.x - from.x, best.y - from.y);

  for (const deg of DEFLECT_ANGLES_DEG) {
    const rad = (deg * Math.PI) / 180;
    for (const sign of [1, -1]) {
      const rot = rotate({ x: dir.x * len, y: dir.y * len }, sign * rad);
      const resolved = resolveMoveAgainstBlocks(
        from,
        { x: from.x + rot.x, y: from.y + rot.y },
        shapes,
        pad,
      );
      const forward = (resolved.x - from.x) * dir.x + (resolved.y - from.y) * dir.y;
      if (forward > bestForward + 1e-6) {
        bestForward = forward;
        best = resolved;
      }
      const move = Math.hypot(resolved.x - from.x, resolved.y - from.y);
      if (move > bestSlideMove + 1e-6) {
        bestSlideMove = move;
        bestSlide = resolved;
      }
    }
  }

  if (bestForward < MIN_MOVE && bestSlideMove >= MIN_MOVE) return bestSlide;
  return best;
}
