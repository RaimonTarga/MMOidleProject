import { moverOverlapsBlockShapes, resolveMoveAgainstBlocks, type NodeFeatureShape, type Vec2 } from '@mmo-idle/shared';

/** Never interpolate a position correction through a wall. */
export function correctPlayerPosition(from: Vec2, authoritative: Vec2, desired: Vec2, shapes: NodeFeatureShape[], pad: Vec2): { position: Vec2; snapped: boolean } {
  if (Math.hypot(desired.x - from.x, desired.y - from.y) < 1e-6) return { position: from, snapped: false };
  const authoritySafe = !moverOverlapsBlockShapes(authoritative, shapes, pad);
  if (authoritySafe && (moverOverlapsBlockShapes(from, shapes, pad) || resolveMoveAgainstBlocks(from, authoritative, shapes, pad) !== authoritative)) {
    return { position: { ...authoritative }, snapped: true };
  }
  if (moverOverlapsBlockShapes(from, shapes, pad)) return { position: from, snapped: false };
  return { position: resolveMoveAgainstBlocks(from, desired, shapes, pad), snapped: false };
}
