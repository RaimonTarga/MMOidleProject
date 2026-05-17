import type { NodeDefinition, NodeDirection } from '@mmo-idle/shared';
import { GAME_CONFIG, NODE_BIOMES } from '@mmo-idle/shared';

/** Build a single node definition from its grid coordinates. */
function buildNode(row: number, col: number): [string, NodeDefinition] {
  const id = `node-${row}-${col}`;
  const biomeInfo = NODE_BIOMES[id] ?? { biomeGroup: 'clearing', biomeTier: 0 };

  const exits: Partial<Record<NodeDirection, string>> = {};
  if (row > 0) exits.north = `node-${row - 1}-${col}`;
  if (row < 4) exits.south = `node-${row + 1}-${col}`;
  if (col > 0) exits.west  = `node-${row}-${col - 1}`;
  if (col < 4) exits.east  = `node-${row}-${col + 1}`;

  const tierLabel = biomeInfo.biomeTier > 0 ? ` T${biomeInfo.biomeTier}` : '';
  const biomeName = biomeInfo.biomeGroup.charAt(0).toUpperCase() + biomeInfo.biomeGroup.slice(1);

  return [id, {
    id,
    name: `${biomeName}${tierLabel}`,
    biomeGroup: biomeInfo.biomeGroup,
    biomeTier:  biomeInfo.biomeTier,
    width:  GAME_CONFIG.NODE_WIDTH,
    height: GAME_CONFIG.NODE_HEIGHT,
    exits,
  }];
}

/**
 * 5×5 grid of nodes. Center (row 2, col 2) = starting clearing.
 *
 * Geographic overview:
 *   (0,*)  tundra/mountain   — ring 2, far north
 *   (1,1)+(1,2) forest T1   — ring 1, northwest
 *   (1,3)+(2,3) plains T1   — ring 1, northeast / east
 *   (2,1) swamp T1          — ring 1, west
 *   (3,1)+(3,2) cave T1     — ring 1, south
 *   (3,3) jungle T1         — ring 1, southeast
 *   Outer ring — swamp/desert/jungle/volcanic/tundra T2
 */
export const NODE_REGISTRY = new Map<string, NodeDefinition>([
  buildNode(0, 0), buildNode(0, 1), buildNode(0, 2), buildNode(0, 3), buildNode(0, 4),
  buildNode(1, 0), buildNode(1, 1), buildNode(1, 2), buildNode(1, 3), buildNode(1, 4),
  buildNode(2, 0), buildNode(2, 1), buildNode(2, 2), buildNode(2, 3), buildNode(2, 4),
  buildNode(3, 0), buildNode(3, 1), buildNode(3, 2), buildNode(3, 3), buildNode(3, 4),
  buildNode(4, 0), buildNode(4, 1), buildNode(4, 2), buildNode(4, 3), buildNode(4, 4),
]);
