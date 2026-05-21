import type { NodeDefinition, NodeDirection } from '@mmo-idle/shared';
import { GAME_CONFIG, NODE_BIOMES } from '@mmo-idle/shared';

/** Build a single node definition from its grid coordinates. */
function buildNode(row: number, col: number): [string, NodeDefinition] {
  const id = `node-${row}-${col}`;
  const biomeInfo = NODE_BIOMES[id] ?? { biomeGroup: 'clearing', biomeTier: 0 };

  const exits: Partial<Record<NodeDirection, string>> = {};
  if (row > 0) exits.north = `node-${row - 1}-${col}`;
  if (row < 8) exits.south = `node-${row + 1}-${col}`;
  if (col > 0) exits.west  = `node-${row}-${col - 1}`;
  if (col < 8) exits.east  = `node-${row}-${col + 1}`;

  const tierLabel = biomeInfo.biomeTier > 0 ? ` T${biomeInfo.biomeTier}` : '';
  const biomeName = biomeInfo.biomeGroup.charAt(0).toUpperCase() + biomeInfo.biomeGroup.slice(1);

  return [id, {
    id,
    name: `${biomeName}${tierLabel}`,
    biomeGroup: biomeInfo.biomeGroup,
    biomeTier:  biomeInfo.biomeTier,
    isDungeon:  biomeInfo.isDungeon ?? false,
    width:  GAME_CONFIG.NODE_WIDTH,
    height: GAME_CONFIG.NODE_HEIGHT,
    exits,
  }];
}

/**
 * 9×9 grid of nodes. Center (row 4, col 4) = starting clearing (T0).
 * Chebyshev distance from center maps to tier band: 1→T1, 2→T2, 3→T3, 4→T4.
 */
export const NODE_REGISTRY = new Map<string, NodeDefinition>([
  buildNode(0,0), buildNode(0,1), buildNode(0,2), buildNode(0,3), buildNode(0,4), buildNode(0,5), buildNode(0,6), buildNode(0,7), buildNode(0,8),
  buildNode(1,0), buildNode(1,1), buildNode(1,2), buildNode(1,3), buildNode(1,4), buildNode(1,5), buildNode(1,6), buildNode(1,7), buildNode(1,8),
  buildNode(2,0), buildNode(2,1), buildNode(2,2), buildNode(2,3), buildNode(2,4), buildNode(2,5), buildNode(2,6), buildNode(2,7), buildNode(2,8),
  buildNode(3,0), buildNode(3,1), buildNode(3,2), buildNode(3,3), buildNode(3,4), buildNode(3,5), buildNode(3,6), buildNode(3,7), buildNode(3,8),
  buildNode(4,0), buildNode(4,1), buildNode(4,2), buildNode(4,3), buildNode(4,4), buildNode(4,5), buildNode(4,6), buildNode(4,7), buildNode(4,8),
  buildNode(5,0), buildNode(5,1), buildNode(5,2), buildNode(5,3), buildNode(5,4), buildNode(5,5), buildNode(5,6), buildNode(5,7), buildNode(5,8),
  buildNode(6,0), buildNode(6,1), buildNode(6,2), buildNode(6,3), buildNode(6,4), buildNode(6,5), buildNode(6,6), buildNode(6,7), buildNode(6,8),
  buildNode(7,0), buildNode(7,1), buildNode(7,2), buildNode(7,3), buildNode(7,4), buildNode(7,5), buildNode(7,6), buildNode(7,7), buildNode(7,8),
  buildNode(8,0), buildNode(8,1), buildNode(8,2), buildNode(8,3), buildNode(8,4), buildNode(8,5), buildNode(8,6), buildNode(8,7), buildNode(8,8),
]);
