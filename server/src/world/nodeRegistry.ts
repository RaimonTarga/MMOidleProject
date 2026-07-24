import {
  GAME_CONFIG,
  TEST_ROOM_NODE_ID,
  WORLD_NODE_LIST,
  assertValidWorldMap,
  worldNodeExits,
  type NodeDefinition,
} from '@mmo-idle/shared';

assertValidWorldMap();

export const NODE_REGISTRY = new Map<string, NodeDefinition>(
  WORLD_NODE_LIST.map((node) => [
    node.id,
    {
      id: node.id,
      name: node.displayName,
      biomeGroup: node.biomeGroup,
      biomeTier: node.biomeTier,
      regionId: node.regionId,
      kind: node.kind,
      map: node.map,
      isDungeon: node.kind === 'dungeon' || node.kind === 'unique',
      bossTypeId: node.bossTypeId,
      mobDensity: node.mobDensity,
      featureSetId: node.featureSetId,
      featureVariant: node.featureVariant,
      width: GAME_CONFIG.NODE_WIDTH,
      height: GAME_CONFIG.NODE_HEIGHT,
      exits: worldNodeExits(node.id),
    },
  ]),
);

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
