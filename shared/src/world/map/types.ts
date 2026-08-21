import type { NodeModifierFamily } from '../nodeModifierTypes';

export type WorldRegionId = `t${number}`;

export type WorldNodeKind =
  | 'normal'
  | 'dungeon'
  | 'sanctuary'
  | 'tutorial'
  | 'unique';

export interface WorldMapCoord {
  row: number;
  col: number;
}

export interface WorldNodeAuthoring {
  id: string;
  displayName: string;
  regionId: WorldRegionId;
  map: WorldMapCoord;
  kind: WorldNodeKind;
  biomeGroup: string;
  biomeTier: number;
  modifier?: NodeModifierFamily;
  bossTypeId?: string;
  mobDensity?: number;
  featureSetId?: string;
  featureVariant?: number;
}

export interface WorldRegionDefinition {
  id: WorldRegionId;
  tier: number;
  displayName: string;
  respawnNodeId: string;
}

export interface WorldMapBounds {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
  rows: number;
  cols: number;
}
