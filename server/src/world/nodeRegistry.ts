import type { NodeDefinition, NodeDirection } from '@mmo-idle/shared';
import { GAME_CONFIG, NODE_BIOMES, TEST_ROOM_NODE_ID } from '@mmo-idle/shared';

/** Build a single node definition from its grid coordinates. */
function buildNode(row: number, col: number): [string, NodeDefinition] {
  const id = `node-${row}-${col}`;
  const biomeInfo = NODE_BIOMES[id] ?? { biomeGroup: 'clearing', biomeTier: 0 };

  const exits: Partial<Record<NodeDirection, string>> = {};
  if (row > 0)  exits.north = `node-${row - 1}-${col}`;
  if (row < 10) exits.south = `node-${row + 1}-${col}`;
  if (col > 0)  exits.west  = `node-${row}-${col - 1}`;
  if (col < 10) exits.east  = `node-${row}-${col + 1}`;

  const tierLabel = biomeInfo.biomeTier > 0 ? ` T${biomeInfo.biomeTier}` : '';
  const biomeName = biomeInfo.biomeGroup.charAt(0).toUpperCase() + biomeInfo.biomeGroup.slice(1);

  return [id, {
    id,
    name: `${biomeName}${tierLabel}`,
    biomeGroup: biomeInfo.biomeGroup,
    biomeTier:  biomeInfo.biomeTier,
    isDungeon:  biomeInfo.isDungeon ?? false,
    bossTypeId:  biomeInfo.bossTypeId,
    width:  GAME_CONFIG.NODE_WIDTH,
    height: GAME_CONFIG.NODE_HEIGHT,
    exits,
  }];
}

/**
 * 11×11 grid of nodes. Center (row 5, col 5) = starting clearing (T0).
 * Chebyshev distance from center maps to tier band:
 *   1–2 → T1,  3 → T2,  4 → T3,  5 → T4
 */
export const NODE_REGISTRY = new Map<string, NodeDefinition>([
  buildNode(0,0),  buildNode(0,1),  buildNode(0,2),  buildNode(0,3),  buildNode(0,4),  buildNode(0,5),  buildNode(0,6),  buildNode(0,7),  buildNode(0,8),  buildNode(0,9),  buildNode(0,10),
  buildNode(1,0),  buildNode(1,1),  buildNode(1,2),  buildNode(1,3),  buildNode(1,4),  buildNode(1,5),  buildNode(1,6),  buildNode(1,7),  buildNode(1,8),  buildNode(1,9),  buildNode(1,10),
  buildNode(2,0),  buildNode(2,1),  buildNode(2,2),  buildNode(2,3),  buildNode(2,4),  buildNode(2,5),  buildNode(2,6),  buildNode(2,7),  buildNode(2,8),  buildNode(2,9),  buildNode(2,10),
  buildNode(3,0),  buildNode(3,1),  buildNode(3,2),  buildNode(3,3),  buildNode(3,4),  buildNode(3,5),  buildNode(3,6),  buildNode(3,7),  buildNode(3,8),  buildNode(3,9),  buildNode(3,10),
  buildNode(4,0),  buildNode(4,1),  buildNode(4,2),  buildNode(4,3),  buildNode(4,4),  buildNode(4,5),  buildNode(4,6),  buildNode(4,7),  buildNode(4,8),  buildNode(4,9),  buildNode(4,10),
  buildNode(5,0),  buildNode(5,1),  buildNode(5,2),  buildNode(5,3),  buildNode(5,4),  buildNode(5,5),  buildNode(5,6),  buildNode(5,7),  buildNode(5,8),  buildNode(5,9),  buildNode(5,10),
  buildNode(6,0),  buildNode(6,1),  buildNode(6,2),  buildNode(6,3),  buildNode(6,4),  buildNode(6,5),  buildNode(6,6),  buildNode(6,7),  buildNode(6,8),  buildNode(6,9),  buildNode(6,10),
  buildNode(7,0),  buildNode(7,1),  buildNode(7,2),  buildNode(7,3),  buildNode(7,4),  buildNode(7,5),  buildNode(7,6),  buildNode(7,7),  buildNode(7,8),  buildNode(7,9),  buildNode(7,10),
  buildNode(8,0),  buildNode(8,1),  buildNode(8,2),  buildNode(8,3),  buildNode(8,4),  buildNode(8,5),  buildNode(8,6),  buildNode(8,7),  buildNode(8,8),  buildNode(8,9),  buildNode(8,10),
  buildNode(9,0),  buildNode(9,1),  buildNode(9,2),  buildNode(9,3),  buildNode(9,4),  buildNode(9,5),  buildNode(9,6),  buildNode(9,7),  buildNode(9,8),  buildNode(9,9),  buildNode(9,10),
  buildNode(10,0), buildNode(10,1), buildNode(10,2), buildNode(10,3), buildNode(10,4), buildNode(10,5), buildNode(10,6), buildNode(10,7), buildNode(10,8), buildNode(10,9), buildNode(10,10),
]);

NODE_REGISTRY.set(TEST_ROOM_NODE_ID, {
  id: TEST_ROOM_NODE_ID,
  name: 'Test Room',
  biomeGroup: 'testroom',
  biomeTier: 0,
  width: GAME_CONFIG.NODE_WIDTH,
  height: GAME_CONFIG.NODE_HEIGHT,
  exits: {},
  isDungeon: false,
});
