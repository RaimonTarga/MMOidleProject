// ─── Node / zone definitions ──────────────────────────────────────────────────

export type NodeDirection = 'north' | 'south' | 'east' | 'west';

export interface NodeDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Which biome family this node belongs to (e.g. "forest", "mountain"). */
  biomeGroup: string;
  /** Difficulty tier within the biome family — higher tiers have harder mobs. */
  biomeTier: number;
  /** Adjacent node ids keyed by the direction of travel. Only present exits are listed. */
  exits: Partial<Record<NodeDirection, string>>;
  /**
   * True for dungeon variant nodes. Enemies within deal extra damage and have more HP.
   * One boss monster is maintained alongside the normal population.
   */
  isDungeon: boolean;
  /** Optional explicit boss type for unique dungeon encounters. */
  bossTypeId?: string;
}

export const TEST_ROOM_NODE_ID = 'node-test-room';

/**
 * 11×11 grid map. Center is node-5-5 (T0 clearing).
 * Chebyshev distance from center determines tier band:
 *   0        — clearing (T0)                    1 node
 *   1–2      — T1 biomes (24 nodes)             forest, mountain, plains, swamp, cave, jungle
 *   3        — T2 biomes (24 nodes)             + tundra, desert
 *   4        — T3 biomes (32 nodes)             + volcanic, graveyard (first appearance)
 *   5        — T4 biomes (40 nodes)             + trench (first appearance)
 *
 * Each tier has exactly one dungeon per biome present at that tier.
 * Geographic layout:
 *   North (rows 0–2)         — tundra / mountain
 *   NE   (rows 0–4, cols 7+) — forest / plains
 *   East (col 10)            — plains / desert / jungle
 *   SE   (rows 8–10, cols 7+)— jungle
 *   South (rows 9–10)        — volcanic / graveyard / trench
 *   West  (col 0)            — swamp / cave / trench
 *   NW   (rows 0–4, cols 0–4)— swamp / tundra
 */
export interface NodeBiomeInfo {
  biomeGroup: string;
  biomeTier: number;
  isDungeon?: boolean;
  bossTypeId?: string;
  /** Overrides biome mobDensity for this node only (e.g. 0 = boss adds only). */
  mobDensity?: number;
}

export const NODE_BIOMES: Record<string, NodeBiomeInfo> = {
  'node-0-0': { biomeGroup: 'tundra', biomeTier: 4, isDungeon: true },   // Glacial Titan
  'node-0-1': { biomeGroup: 'tundra', biomeTier: 4 },
  'node-0-2': { biomeGroup: 'tundra', biomeTier: 4 },
  'node-0-3': { biomeGroup: 'mountain', biomeTier: 4 },
  'node-0-4': { biomeGroup: 'mountain', biomeTier: 4 },
  'node-0-5': { biomeGroup: 'mountain', biomeTier: 4 },
  'node-0-6': { biomeGroup: 'mountain', biomeTier: 4, isDungeon: true },   // Mountain Titan
  'node-0-7': { biomeGroup: 'mountain', biomeTier: 4 },
  'node-0-8': { biomeGroup: 'mountain', biomeTier: 4 },
  'node-0-9': { biomeGroup: 'graveyard', biomeTier: 4 },
  'node-0-10': { biomeGroup: 'graveyard', biomeTier: 4, isDungeon: true },   // Undying Lord

  'node-1-0': { biomeGroup: 'tundra', biomeTier: 4 },
  'node-1-1': { biomeGroup: 'tundra', biomeTier: 3 },
  'node-1-2': { biomeGroup: 'mountain', biomeTier: 3 },
  'node-1-3': { biomeGroup: 'mountain', biomeTier: 3 },
  'node-1-4': { biomeGroup: 'mountain', biomeTier: 3, isDungeon: true },   // Crag Gorged Horn Behemoth
  'node-1-5': { biomeGroup: 'cave', biomeTier: 3 },
  'node-1-6': { biomeGroup: 'cave', biomeTier: 3 },
  'node-1-7': { biomeGroup: 'cave', biomeTier: 3 },
  'node-1-8': { biomeGroup: 'cave', biomeTier: 3 },
  'node-1-9': { biomeGroup: 'cave', biomeTier: 3, isDungeon: true },   // Deep Core Burrow Gorger
  'node-1-10': { biomeGroup: 'graveyard', biomeTier: 4 },

  'node-2-0': { biomeGroup: 'tundra', biomeTier: 4 },
  'node-2-1': { biomeGroup: 'tundra', biomeTier: 3 },
  'node-2-2': { biomeGroup: 'mountain', biomeTier: 2, isDungeon: true },   // Stoneplate Juggernaut
  'node-2-3': { biomeGroup: 'mountain', biomeTier: 2 },
  'node-2-4': { biomeGroup: 'mountain', biomeTier: 2 },
  'node-2-5': { biomeGroup: 'cave', biomeTier: 2 },
  'node-2-6': { biomeGroup: 'cave', biomeTier: 2 },
  'node-2-7': { biomeGroup: 'cave', biomeTier: 2, isDungeon: true },   // Chitinous Dreadbore
  'node-2-8': { biomeGroup: 'jungle', biomeTier: 2, isDungeon: true },   // Jungle Dread Gorger
  'node-2-9': { biomeGroup: 'jungle', biomeTier: 3 },
  'node-2-10': { biomeGroup: 'jungle', biomeTier: 4 },

  'node-3-0': { biomeGroup: 'tundra', biomeTier: 4 },
  'node-3-1': { biomeGroup: 'tundra', biomeTier: 3 },
  'node-3-2': { biomeGroup: 'mountain', biomeTier: 2 },
  'node-3-3': { biomeGroup: 'mountain', biomeTier: 1, isDungeon: true },   // Crag Behemoth
  'node-3-4': { biomeGroup: 'mountain', biomeTier: 1 },
  'node-3-5': { biomeGroup: 'cave', biomeTier: 1 },
  'node-3-6': { biomeGroup: 'cave', biomeTier: 1, isDungeon: true },   // Obsidian Broodmother
  'node-3-7': { biomeGroup: 'jungle', biomeTier: 2 },
  'node-3-8': { biomeGroup: 'jungle', biomeTier: 2 },
  'node-3-9': { biomeGroup: 'jungle', biomeTier: 3 },
  'node-3-10': { biomeGroup: 'jungle', biomeTier: 4, isDungeon: true },   // Jungle Ancient Lord

  'node-4-0': { biomeGroup: 'tundra', biomeTier: 4 },
  'node-4-1': { biomeGroup: 'tundra', biomeTier: 3, isDungeon: true },   // Frost Plated Rime Mammoth
  'node-4-2': { biomeGroup: 'plains', biomeTier: 2 },
  'node-4-3': { biomeGroup: 'plains', biomeTier: 1, isDungeon: true },   // Tusked Razorback
  'node-4-4': { biomeGroup: 'mountain', biomeTier: 1 },
  'node-4-5': { biomeGroup: 'cave', biomeTier: 1 },
  'node-4-6': { biomeGroup: 'forest', biomeTier: 1 },
  'node-4-7': { biomeGroup: 'forest', biomeTier: 1 },
  'node-4-8': { biomeGroup: 'forest', biomeTier: 2, isDungeon: true },   // Apex Timberclaw
  'node-4-9': { biomeGroup: 'jungle', biomeTier: 3 },
  'node-4-10': { biomeGroup: 'jungle', biomeTier: 4 },

  'node-5-0': { biomeGroup: 'tundra', biomeTier: 4 },
  'node-5-1': { biomeGroup: 'desert', biomeTier: 3 },
  'node-5-2': { biomeGroup: 'plains', biomeTier: 2 },
  'node-5-3': { biomeGroup: 'plains', biomeTier: 1 },
  'node-5-4': { biomeGroup: 'plains', biomeTier: 1 },
  'node-5-5': { biomeGroup: 'clearing', biomeTier: 0 },
  'node-5-6': { biomeGroup: 'forest', biomeTier: 1 },
  'node-5-7': { biomeGroup: 'forest', biomeTier: 1 },
  'node-5-8': { biomeGroup: 'forest', biomeTier: 2 },
  'node-5-9': { biomeGroup: 'jungle', biomeTier: 3 },
  'node-5-10': { biomeGroup: 'jungle', biomeTier: 4 },

  'node-6-0': { biomeGroup: 'desert', biomeTier: 4 },
  'node-6-1': { biomeGroup: 'desert', biomeTier: 3 },
  'node-6-2': { biomeGroup: 'plains', biomeTier: 2, isDungeon: true },   // Gorging Razortusk
  'node-6-3': { biomeGroup: 'plains', biomeTier: 1 },
  'node-6-4': { biomeGroup: 'plains', biomeTier: 1 },
  'node-6-5': { biomeGroup: 'swamp', biomeTier: 1 },
  'node-6-6': { biomeGroup: 'swamp', biomeTier: 1 },
  'node-6-7': { biomeGroup: 'forest', biomeTier: 1, isDungeon: true },   // Gnarled Greatbear
  'node-6-8': { biomeGroup: 'forest', biomeTier: 2 },
  'node-6-9': { biomeGroup: 'jungle', biomeTier: 3, isDungeon: true },   // Apex Bramble Slasher
  'node-6-10': { biomeGroup: 'jungle', biomeTier: 4 },

  'node-7-0': { biomeGroup: 'desert', biomeTier: 4 },
  'node-7-1': { biomeGroup: 'desert', biomeTier: 3, isDungeon: true },   // Dune Carapace Monarch
  'node-7-2': { biomeGroup: 'desert', biomeTier: 2 },
  'node-7-3': { biomeGroup: 'desert', biomeTier: 2 },
  'node-7-4': { biomeGroup: 'swamp', biomeTier: 1, isDungeon: true },   // Grave Toadeater
  'node-7-5': { biomeGroup: 'swamp', biomeTier: 1 },
  'node-7-6': { biomeGroup: 'swamp', biomeTier: 1 },
  'node-7-7': { biomeGroup: 'swamp', biomeTier: 3 },
  'node-7-8': { biomeGroup: 'volcanic', biomeTier: 3 },
  'node-7-9': { biomeGroup: 'volcanic', biomeTier: 3 },
  'node-7-10': { biomeGroup: 'volcanic', biomeTier: 4 },

  'node-8-0': { biomeGroup: 'desert', biomeTier: 4 },
  'node-8-1': { biomeGroup: 'desert', biomeTier: 3 },
  'node-8-2': { biomeGroup: 'desert', biomeTier: 2 },
  'node-8-3': { biomeGroup: 'desert', biomeTier: 2, isDungeon: true },   // Dune Stalker Emperor
  'node-8-4': { biomeGroup: 'swamp', biomeTier: 2 },
  'node-8-5': { biomeGroup: 'swamp', biomeTier: 2 },
  'node-8-6': { biomeGroup: 'swamp', biomeTier: 2, isDungeon: true },   // Mire Gorged Behemoth
  'node-8-7': { biomeGroup: 'swamp', biomeTier: 3 },
  'node-8-8': { biomeGroup: 'volcanic', biomeTier: 3 },
  'node-8-9': { biomeGroup: 'volcanic', biomeTier: 3, isDungeon: true },   // Cinder Shell Magma Salamander
  'node-8-10': { biomeGroup: 'volcanic', biomeTier: 4 },

  'node-9-1': { biomeGroup: 'desert', biomeTier: 3 },
  'node-9-2': { biomeGroup: 'desert', biomeTier: 3 },
  'node-9-3': { biomeGroup: 'desert', biomeTier: 3 },
  'node-9-4': { biomeGroup: 'swamp', biomeTier: 3, isDungeon: true },   // Rot Spore Croc Behemoth
  'node-9-5': { biomeGroup: 'swamp', biomeTier: 3 },
  'node-9-6': { biomeGroup: 'swamp', biomeTier: 3 },
  'node-9-7': { biomeGroup: 'swamp', biomeTier: 3 },
  'node-9-8': { biomeGroup: 'volcanic', biomeTier: 3 },
  'node-9-9': { biomeGroup: 'volcanic', biomeTier: 3 },
  'node-9-10': { biomeGroup: 'volcanic', biomeTier: 4 },

  'node-10-0': { biomeGroup: 'trench', biomeTier: 4, isDungeon: true },   // Void Overlord
  'node-10-1': { biomeGroup: 'trench', biomeTier: 4 },
  'node-10-2': { biomeGroup: 'desert', biomeTier: 4, isDungeon: true },   // Desert Eternal
  'node-10-3': { biomeGroup: 'desert', biomeTier: 4 },
  'node-10-4': { biomeGroup: 'desert', biomeTier: 4 },
  'node-10-5': { biomeGroup: 'volcanic', biomeTier: 4 },
  'node-10-6': { biomeGroup: 'volcanic', biomeTier: 4 },
  'node-10-7': { biomeGroup: 'volcanic', biomeTier: 4 },
  'node-10-8': { biomeGroup: 'volcanic', biomeTier: 4 },
  'node-10-9': { biomeGroup: 'volcanic', biomeTier: 4 },
  'node-10-10': { biomeGroup: 'volcanic', biomeTier: 4, isDungeon: true },   // Inferno Lord
};

// ─── In-game coordinate system ──────────────────────────────────────────────
// Node ids stay in the internal `node-{row}-{col}` form (rows/cols 0–10), but the
// player-facing coordinate system is centered on the starting clearing: the clearing
// is the origin [0, 0]. X is east-positive (increasing column), Y is north-positive
// (decreasing row, so "up" on the map is +Y).

/** The starting clearing node — origin of the in-game coordinate system. */
export const CLEARING_NODE_ID = 'node-5-5';

/** Grid row/col of the origin (the clearing). */
export const ORIGIN_ROW = 5;
export const ORIGIN_COL = 5;

export interface NodeCoord {
  x: number;
  y: number;
}

/**
 * Convert a `node-{row}-{col}` id to centered coordinates where the clearing is `[0, 0]`.
 * X = east-positive (col − 5), Y = north-positive (5 − row). Returns null for malformed ids.
 */
export function nodeIdToCoord(nodeId: string): NodeCoord | null {
  const parts = nodeId.split('-');
  if (parts.length !== 3) return null;
  const row = Number(parts[1]);
  const col = Number(parts[2]);
  if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
  return { x: col - ORIGIN_COL, y: ORIGIN_ROW - row };
}

/** Convert centered coordinates back to a `node-{row}-{col}` id. */
export function coordToNodeId({ x, y }: NodeCoord): string {
  return `node-${ORIGIN_ROW - y}-${ORIGIN_COL + x}`;
}

/** Format coordinates for display, e.g. `[0, 0]`. */
export function formatNodeCoord(coord: NodeCoord): string {
  return `[${coord.x}, ${coord.y}]`;
}
