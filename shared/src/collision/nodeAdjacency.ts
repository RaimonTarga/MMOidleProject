import type { NodeDirection } from '../world/nodeBiomes';

/** Pixels from the node boundary that fire a transition. Matches server/client gate thickness. */
export const EXIT_TRIGGER = 20;

/**
 * Cardinal exits for grid nodes `node-{row}-{col}` (rows/cols 0–10).
 * Returns `{}` for non-grid ids such as `node-test-room`.
 */
export function nodeExitsForNodeId(
  nodeId: string,
): Partial<Record<NodeDirection, string>> {
  const parts = nodeId.split('-');
  if (parts.length !== 3 || parts[0] !== 'node') return {};
  const row = parseInt(parts[1], 10);
  const col = parseInt(parts[2], 10);
  if (Number.isNaN(row) || Number.isNaN(col)) return {};

  const exits: Partial<Record<NodeDirection, string>> = {};
  if (row > 0) exits.north = `node-${row - 1}-${col}`;
  if (row < 10) exits.south = `node-${row + 1}-${col}`;
  if (col > 0) exits.west = `node-${row}-${col - 1}`;
  if (col < 10) exits.east = `node-${row}-${col + 1}`;
  return exits;
}

/** Cardinal direction from `fromId` to an adjacent `toId`, or null if not neighbors. */
export function directionBetweenNodes(
  fromId: string,
  toId: string,
): NodeDirection | null {
  const exits = nodeExitsForNodeId(fromId);
  for (const dir of ['north', 'south', 'east', 'west'] as NodeDirection[]) {
    if (exits[dir] === toId) return dir;
  }
  return null;
}
