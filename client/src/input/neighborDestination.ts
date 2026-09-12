import { GAME_CONFIG, nodeExitsForNodeId, type Vec2 } from '@mmo-idle/shared';

export interface NeighborDestination { nodeId: string; pos: Vec2 }

/** Only the four rendered cardinal previews are clickable, never corner voids. */
export function neighborDestination(nodeId: string, point: Vec2): NeighborDestination | null {
  const { NODE_WIDTH: w, NODE_HEIGHT: h } = GAME_CONFIG;
  const exits = nodeExitsForNodeId(nodeId);
  if (point.y >= 0 && point.y <= h) {
    if (point.x < 0 && point.x >= -w && exits.west) return { nodeId: exits.west, pos: { x: point.x + w, y: point.y } };
    if (point.x > w && point.x <= 2 * w && exits.east) return { nodeId: exits.east, pos: { x: point.x - w, y: point.y } };
  }
  if (point.x >= 0 && point.x <= w) {
    if (point.y < 0 && point.y >= -h && exits.north) return { nodeId: exits.north, pos: { x: point.x, y: point.y + h } };
    if (point.y > h && point.y <= 2 * h && exits.south) return { nodeId: exits.south, pos: { x: point.x, y: point.y - h } };
  }
  return null;
}

export function destinationScenePoint(currentNodeId: string, destination: NeighborDestination): Vec2 | null {
  if (currentNodeId === destination.nodeId) return destination.pos;
  const exits = nodeExitsForNodeId(currentNodeId);
  const { NODE_WIDTH: w, NODE_HEIGHT: h } = GAME_CONFIG;
  if (exits.west === destination.nodeId) return { x: destination.pos.x - w, y: destination.pos.y };
  if (exits.east === destination.nodeId) return { x: destination.pos.x + w, y: destination.pos.y };
  if (exits.north === destination.nodeId) return { x: destination.pos.x, y: destination.pos.y - h };
  if (exits.south === destination.nodeId) return { x: destination.pos.x, y: destination.pos.y + h };
  return null;
}
