import type { NodeFeatureShape } from '../world/nodeFeatures';
import { resolveMoveAgainstBlocks, type Vec2 } from '../systems/spatial';

/**
 * Keyboard-style move resolution: try straight, then perpendicular slides when
 * blocked. Does not run full A*.
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

  const px = -dy / len;
  const py = dx / len;
  let best = straight;
  let bestProgress =
    (straight.x - from.x) * dx + (straight.y - from.y) * dy;

  for (const sign of [1, -1]) {
    const slideTo: Vec2 = {
      x: from.x + px * sign * len,
      y: from.y + py * sign * len,
    };
    const resolved = resolveMoveAgainstBlocks(from, slideTo, shapes, pad);
    const progress = (resolved.x - from.x) * dx + (resolved.y - from.y) * dy;
    if (progress > bestProgress) {
      bestProgress = progress;
      best = resolved;
    }
  }

  return best;
}
