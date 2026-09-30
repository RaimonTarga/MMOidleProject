import type { NodeBlend } from '../../data/families';
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
  /**
   * What this node is made of: its biome's families and the share of spawns each
   * one takes (design §12). Normal nodes of a biome with an authored family table
   * carry one; every other node carries none, and spawning falls back to the flat
   * biome pool.
   */
  blend?: NodeBlend;
  /**
   * @deprecated Superseded by `blend` (Phase 2a). Still authored and still live —
   * node display names, monster stat scaling, catalysts and reward multipliers all
   * read it, and the region masks are cut to the modifier count. Phase 2b deletes
   * the field together with that machinery.
   */
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
