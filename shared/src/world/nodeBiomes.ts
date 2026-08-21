import {
  type NodeModifierFamily,
} from './nodeModifierTypes';
import {
  WORLD_MAP_BOUNDS,
  WORLD_NODE_LIST,
  WORLD_NODES,
  mapCoordForNodeId,
  nodeIdAtMapCoord,
  worldNodeExits,
} from './map/registry';
import type {
  WorldMapCoord,
  WorldNodeKind,
  WorldRegionId,
} from './map/types';

export type NodeDirection = 'north' | 'south' | 'east' | 'west';

export interface NodeDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  biomeGroup: string;
  biomeTier: number;
  regionId?: WorldRegionId;
  kind?: WorldNodeKind;
  map?: WorldMapCoord;
  exits: Partial<Record<NodeDirection, string>>;
  isDungeon: boolean;
  bossTypeId?: string;
  mobDensity?: number;
  featureSetId?: string;
  featureVariant?: number;
}

export interface NodeBiomeInfo {
  biomeGroup: string;
  biomeTier: number;
  regionId: WorldRegionId;
  kind: WorldNodeKind;
  displayName: string;
  map: WorldMapCoord;
  modifier?: NodeModifierFamily;
  isDungeon?: boolean;
  bossTypeId?: string;
  mobDensity?: number;
  featureSetId?: string;
  featureVariant?: number;
}

export const TEST_ROOM_NODE_ID = 'node-test-room';
export const CLEARING_NODE_ID = 'node-clearing';

/** Biome families with canonical gauntlet dungeons and bespoke altar art. */
export const DUNGEON_BIOME_GROUPS = [
  'forest',
  'plains',
  'mountain',
  'cave',
  'swamp',
  'jungle',
  'desert',
  'tundra',
  'volcanic',
  'graveyard',
  'trench',
] as const;
export type DungeonBiomeGroup = (typeof DUNGEON_BIOME_GROUPS)[number];

/** Compatibility projection for systems that still consume biome metadata by id. */
export const NODE_BIOMES: Record<string, NodeBiomeInfo> = Object.fromEntries(
  WORLD_NODE_LIST.map((node) => [
    node.id,
    {
      biomeGroup: node.biomeGroup,
      biomeTier: node.biomeTier,
      regionId: node.regionId,
      kind: node.kind,
      displayName: node.displayName,
      map: node.map,
      modifier: node.modifier,
      isDungeon: node.kind === 'dungeon' || node.kind === 'unique',
      bossTypeId: node.bossTypeId,
      mobDensity: node.mobDensity,
      featureSetId: node.featureSetId,
      featureVariant: node.featureVariant,
    },
  ]),
);

export interface NodeCoord {
  x: number;
  y: number;
}

const CLEARING_MAP = WORLD_NODES.get(CLEARING_NODE_ID)?.map;
if (!CLEARING_MAP) {
  throw new Error('Canonical world is missing the Clearing');
}

/** Legacy names retained as display-coordinate origins, never as map bounds. */
export const ORIGIN_ROW = CLEARING_MAP.row;
export const ORIGIN_COL = CLEARING_MAP.col;

export function nodeIdToCoord(nodeId: string): NodeCoord | null {
  const map = mapCoordForNodeId(nodeId);
  if (!map) return null;
  return {
    x: map.col - ORIGIN_COL,
    y: ORIGIN_ROW - map.row,
  };
}

export function coordToNodeId({ x, y }: NodeCoord): string | null {
  return nodeIdAtMapCoord(ORIGIN_ROW - y, ORIGIN_COL + x);
}

export function formatNodeCoord(coord: NodeCoord): string {
  return `[${coord.x}, ${coord.y}]`;
}

export {
  WORLD_MAP_BOUNDS,
  WORLD_NODE_LIST,
  WORLD_NODES,
  mapCoordForNodeId,
  nodeIdAtMapCoord,
  worldNodeExits,
};
export type {
  WorldMapBounds,
  WorldMapCoord,
  WorldNodeAuthoring,
  WorldNodeKind,
  WorldRegionDefinition,
  WorldRegionId,
} from './map/types';
export {
  WORLD_REGIONS,
} from './map/regions';
export {
  adjacentWorldNodeIds,
  directionBetweenWorldNodes,
  respawnNodeIdForNodeId,
  shortestWorldPath,
  worldNodeById,
  worldRegionForNodeId,
} from './map/registry';
