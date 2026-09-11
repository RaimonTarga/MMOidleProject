import { advancePlayerPath, type Vec2, type NodeFeatureShape } from '@mmo-idle/shared';

/** Resume an authoritative preview at the rendered position, which may lead a snapshot. */
export function predictAutoPath(
  from: Vec2,
  preview: Vec2[],
  budget: number,
  shapes: NodeFeatureShape[],
  pad: Vec2,
): Vec2 {
  let closest = Infinity;
  let head = 1;
  for (let i = 1; i < preview.length; i++) {
    const a = preview[i - 1], b = preview[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq ? Math.max(0, Math.min(1,
      ((from.x - a.x) * dx + (from.y - a.y) * dy) / lengthSq)) : 1;
    const distance = (from.x - a.x - t * dx) ** 2 + (from.y - a.y - t * dy) ** 2;
    if (distance < closest) {
      closest = distance;
      head = t >= 1 ? i + 1 : i;
    }
  }
  return advancePlayerPath(from, preview.slice(head), budget, shapes, pad).position;
}
