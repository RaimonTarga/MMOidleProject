import type { NodeDirection } from '@mmo-idle/shared';

// Gate marker dimensions (world-space). GATE_THICK must match the server
// transition trigger thickness so the visible gate covers the trigger zone.
export const GATE_THICK = 20;
export const GATE_COLOR = 0x00ffdd;

// Minimap layout constants.
export const MM_W = 220;
export const MM_H = 165;
export const MM_PAD = 8;

// Node IDs follow the format "node-{row}-{col}" in an 11x11 grid.
// Exits are derived from coordinates so no registry duplication is needed.
export function getNodeExits(nodeId: string): Partial<Record<NodeDirection, string>> {
  const parts = nodeId.split('-');
  if (parts.length !== 3) return {};
  const r = parseInt(parts[1], 10);
  const c = parseInt(parts[2], 10);
  if (isNaN(r) || isNaN(c)) return {};
  const exits: Partial<Record<NodeDirection, string>> = {};
  if (r > 0) exits.north = `node-${r - 1}-${c}`;
  if (r < 10) exits.south = `node-${r + 1}-${c}`;
  if (c > 0) exits.west = `node-${r}-${c - 1}`;
  if (c < 10) exits.east = `node-${r}-${c + 1}`;
  return exits;
}
