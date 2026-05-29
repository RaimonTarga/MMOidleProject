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
 *   4        — T3 biomes (32 nodes)             + volcanic, necropolis (first appearance)
 *   5        — T4 biomes (40 nodes)             + abyss (first appearance)
 *
 * Each tier has exactly one dungeon per biome present at that tier.
 * Geographic layout:
 *   North (rows 0–2)         — tundra / mountain
 *   NE   (rows 0–4, cols 7+) — forest / plains
 *   East (col 10)            — plains / desert / jungle
 *   SE   (rows 8–10, cols 7+)— jungle
 *   South (rows 9–10)        — volcanic / necropolis / abyss
 *   West  (col 0)            — swamp / cave / abyss
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

  // ── T0 center — starting clearing ─────────────────────────────────────────
  'node-5-5': { biomeGroup: 'clearing',   biomeTier: 0 },
  [TEST_ROOM_NODE_ID]: { biomeGroup: 'testroom', biomeTier: 0 },

  // ── T1 band (Chebyshev distance 1–2) — 6 biomes × 4 nodes ────────────────
  // Forest T1 — NE quadrant
  'node-4-6': { biomeGroup: 'forest',     biomeTier: 1 },
  'node-4-7': { biomeGroup: 'forest',     biomeTier: 1 },
  'node-3-6': { biomeGroup: 'forest',     biomeTier: 1 },
  'node-3-7': { biomeGroup: 'forest',     biomeTier: 1, isDungeon: true },   // forest-warden

  // Mountain T1 — North
  'node-4-5': { biomeGroup: 'mountain',   biomeTier: 1 },
  'node-3-5': { biomeGroup: 'mountain',   biomeTier: 1, isDungeon: true },   // mountain-sentinel
  'node-4-4': { biomeGroup: 'mountain',   biomeTier: 1 },
  'node-3-4': { biomeGroup: 'mountain',   biomeTier: 1 },

  // Plains T1 — East
  'node-5-6': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-5-7': { biomeGroup: 'plains',     biomeTier: 1, isDungeon: true },   // plains-champion
  'node-6-6': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-6-7': { biomeGroup: 'plains',     biomeTier: 1 },

  // Swamp T1 — NW
  'node-5-4': { biomeGroup: 'swamp',      biomeTier: 1 },
  'node-5-3': { biomeGroup: 'swamp',      biomeTier: 1, isDungeon: true },   // bog-sovereign
  'node-4-3': { biomeGroup: 'swamp',      biomeTier: 1 },
  'node-3-3': { biomeGroup: 'swamp',      biomeTier: 1 },

  // Cave T1 — West
  'node-6-4': { biomeGroup: 'cave',       biomeTier: 1 },
  'node-6-3': { biomeGroup: 'cave',       biomeTier: 1, isDungeon: true },   // cave-sentinel
  'node-7-3': { biomeGroup: 'cave',       biomeTier: 1 },
  'node-7-4': { biomeGroup: 'cave',       biomeTier: 1 },

  // Plains T1 — SE extension (jungle moved to T2+)
  'node-6-5': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-7-5': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-7-6': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-7-7': { biomeGroup: 'plains',     biomeTier: 1 },

  // ── T2 band (Chebyshev distance 3) — 7 biomes, 4 dungeons ──────────────────
  // Swamp T2 — NW (5 nodes: 3 original + 2 ex-tundra slots folded in)
  'node-2-2': { biomeGroup: 'swamp',      biomeTier: 2 },
  'node-2-3': { biomeGroup: 'swamp',      biomeTier: 2 },
  'node-3-2': { biomeGroup: 'swamp',      biomeTier: 2 },
  'node-4-2': { biomeGroup: 'swamp',      biomeTier: 2 },
  'node-5-2': { biomeGroup: 'swamp',      biomeTier: 2 },

  // Mountain T2 — North (4 nodes: 3 original + 1 ex-tundra slot folded in)
  'node-2-4': { biomeGroup: 'mountain',   biomeTier: 2 },
  'node-2-5': { biomeGroup: 'mountain',   biomeTier: 2 },
  'node-2-6': { biomeGroup: 'mountain',   biomeTier: 2, isDungeon: true },
  'node-2-7': { biomeGroup: 'mountain',   biomeTier: 2 },

  // Forest T2 — NE
  'node-2-8': { biomeGroup: 'forest',     biomeTier: 2 },
  'node-3-8': { biomeGroup: 'forest',     biomeTier: 2, isDungeon: true },
  'node-4-8': { biomeGroup: 'forest',     biomeTier: 2 },

  // Plains T2 — East
  'node-5-8': { biomeGroup: 'plains',     biomeTier: 2 },
  'node-6-8': { biomeGroup: 'plains',     biomeTier: 2 },
  'node-7-8': { biomeGroup: 'plains',     biomeTier: 2 },

  // Desert T2 — SE (new biome)
  'node-8-6': { biomeGroup: 'desert',     biomeTier: 2 },
  'node-8-7': { biomeGroup: 'desert',     biomeTier: 2, isDungeon: true },
  'node-8-8': { biomeGroup: 'desert',     biomeTier: 2 },

  // Jungle T2 — South (new biome)
  'node-8-3': { biomeGroup: 'jungle',     biomeTier: 2 },
  'node-8-4': { biomeGroup: 'jungle',     biomeTier: 2, isDungeon: true },
  'node-8-5': { biomeGroup: 'jungle',     biomeTier: 2 },

  // Cave T2 — SW
  'node-6-2': { biomeGroup: 'cave',       biomeTier: 2 },
  'node-7-2': { biomeGroup: 'cave',       biomeTier: 2 },
  'node-8-2': { biomeGroup: 'cave',       biomeTier: 2 },

  // ── T3 band (Chebyshev distance 4) — 9 biomes, 4 dungeons ──────────────────
  // Tundra T3 — NW (new biome, 4 nodes)
  'node-1-1': { biomeGroup: 'tundra',     biomeTier: 3 },
  'node-1-2': { biomeGroup: 'tundra',     biomeTier: 3, isDungeon: true },
  'node-1-3': { biomeGroup: 'tundra',     biomeTier: 3 },
  'node-2-1': { biomeGroup: 'tundra',     biomeTier: 3 },

  // Mountain T3 — North
  'node-1-4': { biomeGroup: 'mountain',   biomeTier: 3 },
  'node-1-5': { biomeGroup: 'mountain',   biomeTier: 3, isDungeon: true },
  'node-1-6': { biomeGroup: 'mountain',   biomeTier: 3 },

  // Forest T3 — NE
  'node-1-7': { biomeGroup: 'forest',     biomeTier: 3 },
  'node-1-8': { biomeGroup: 'forest',     biomeTier: 3 },
  'node-1-9': { biomeGroup: 'forest',     biomeTier: 3 },

  // Plains T3 — East
  'node-2-9': { biomeGroup: 'plains',     biomeTier: 3 },
  'node-3-9': { biomeGroup: 'plains',     biomeTier: 3 },
  'node-4-9': { biomeGroup: 'plains',     biomeTier: 3 },

  // Desert T3 — East-SE
  'node-5-9': { biomeGroup: 'desert',     biomeTier: 3 },
  'node-6-9': { biomeGroup: 'desert',     biomeTier: 3 },
  'node-7-9': { biomeGroup: 'desert',     biomeTier: 3 },

  // Jungle T3 — SE
  'node-8-9': { biomeGroup: 'jungle',     biomeTier: 3 },
  'node-9-8': { biomeGroup: 'jungle',     biomeTier: 3 },
  'node-9-9': { biomeGroup: 'jungle',     biomeTier: 3 },

  // Volcanic T3 — South (new biome, 5 nodes: 3 original + 2 ex-necropolis slots)
  'node-9-3': { biomeGroup: 'volcanic',   biomeTier: 3 },
  'node-9-4': { biomeGroup: 'volcanic',   biomeTier: 3 },
  'node-9-5': { biomeGroup: 'volcanic',   biomeTier: 3 },
  'node-9-6': { biomeGroup: 'volcanic',   biomeTier: 3, isDungeon: true },
  'node-9-7': { biomeGroup: 'volcanic',   biomeTier: 3 },

  // Cave T3 — West (4 nodes: 3 original + 1 ex-necropolis slot)
  'node-7-1': { biomeGroup: 'cave',       biomeTier: 3 },
  'node-8-1': { biomeGroup: 'cave',       biomeTier: 3, isDungeon: true },
  'node-9-1': { biomeGroup: 'cave',       biomeTier: 3 },
  'node-9-2': { biomeGroup: 'cave',       biomeTier: 3 },

  // Swamp T3 — NW
  'node-3-1': { biomeGroup: 'swamp',      biomeTier: 3 },
  'node-4-1': { biomeGroup: 'swamp',      biomeTier: 3 },
  'node-5-1': { biomeGroup: 'swamp',      biomeTier: 3 },
  'node-6-1': { biomeGroup: 'swamp',      biomeTier: 3 },

  // ── T4 band (Chebyshev distance 5) — 11 biomes, 4 dungeons ────────────────
  // Tundra T4 — NW corner (row 0, cols 0–3)
  'node-0-0': { biomeGroup: 'tundra',     biomeTier: 4 },
  'node-0-1': { biomeGroup: 'tundra',     biomeTier: 4 },
  'node-0-2': { biomeGroup: 'tundra',     biomeTier: 4 },
  'node-0-3': { biomeGroup: 'tundra',     biomeTier: 4 },

  // Mountain T4 — North center (row 0, cols 4–6)
  'node-0-4': { biomeGroup: 'mountain',   biomeTier: 4 },
  'node-0-5': { biomeGroup: 'mountain',   biomeTier: 4, isDungeon: true },
  'node-0-6': { biomeGroup: 'mountain',   biomeTier: 4 },

  // Forest T4 — NE (row 0, cols 7–10)
  'node-0-7':  { biomeGroup: 'forest',    biomeTier: 4 },
  'node-0-8':  { biomeGroup: 'forest',    biomeTier: 4 },
  'node-0-9':  { biomeGroup: 'forest',    biomeTier: 4, isDungeon: true },
  'node-0-10': { biomeGroup: 'forest',    biomeTier: 4 },

  // Plains T4 — East (col 10, rows 1–4)
  'node-1-10': { biomeGroup: 'plains',    biomeTier: 4 },
  'node-2-10': { biomeGroup: 'plains',    biomeTier: 4 },
  'node-3-10': { biomeGroup: 'plains',    biomeTier: 4 },
  'node-4-10': { biomeGroup: 'plains',    biomeTier: 4 },

  // Desert T4 — East (col 10, rows 5–7)
  'node-5-10': { biomeGroup: 'desert',    biomeTier: 4 },
  'node-6-10': { biomeGroup: 'desert',    biomeTier: 4 },
  'node-7-10': { biomeGroup: 'desert',    biomeTier: 4 },

  // Jungle T4 — SE (col 10 rows 8–10 + row 10 cols 8–9)
  'node-8-10':  { biomeGroup: 'jungle',   biomeTier: 4 },
  'node-9-10':  { biomeGroup: 'jungle',   biomeTier: 4 },
  'node-10-10': { biomeGroup: 'jungle',   biomeTier: 4 },
  'node-10-9':  { biomeGroup: 'jungle',   biomeTier: 4 },
  'node-10-8':  { biomeGroup: 'jungle',   biomeTier: 4 },

  // Volcanic T4 — South (row 10, cols 5–7)
  'node-10-5': { biomeGroup: 'volcanic',  biomeTier: 4 },
  'node-10-6': { biomeGroup: 'volcanic',  biomeTier: 4 },
  'node-10-7': { biomeGroup: 'volcanic',  biomeTier: 4 },

  // Necropolis T4 — SW (row 10, cols 2–4; first appearance)
  'node-10-2': { biomeGroup: 'necropolis', biomeTier: 4 },
  'node-10-3': { biomeGroup: 'necropolis', biomeTier: 4, isDungeon: true },
  'node-10-4': { biomeGroup: 'necropolis', biomeTier: 4 },

  // Abyss T4 — SW corner (row 10 cols 0–1 + col 0 rows 8–9; first appearance)
  'node-10-0': { biomeGroup: 'abyss',     biomeTier: 4 },
  'node-10-1': { biomeGroup: 'abyss',     biomeTier: 4 },
  'node-9-0':  { biomeGroup: 'abyss',     biomeTier: 4, isDungeon: true, bossTypeId: 'void-overlord', mobDensity: 0 },
  'node-8-0':  { biomeGroup: 'abyss',     biomeTier: 4 },

  // Cave T4 — West (col 0, rows 5–7)
  'node-5-0': { biomeGroup: 'cave',       biomeTier: 4 },
  'node-6-0': { biomeGroup: 'cave',       biomeTier: 4 },
  'node-7-0': { biomeGroup: 'cave',       biomeTier: 4 },

  // Swamp T4 — NW (col 0, rows 1–4)
  'node-1-0': { biomeGroup: 'swamp',      biomeTier: 4 },
  'node-2-0': { biomeGroup: 'swamp',      biomeTier: 4 },
  'node-3-0': { biomeGroup: 'swamp',      biomeTier: 4 },
  'node-4-0': { biomeGroup: 'swamp',      biomeTier: 4 },
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
