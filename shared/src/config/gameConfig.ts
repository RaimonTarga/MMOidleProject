import { nodeExitsForNodeId } from "../collision/nodeAdjacency";
import { NODE_BIOMES } from "../world/nodeBiomes";
import type { AutocombatConfig } from "../components/core/networkedSlices";

// ─── Game balance constants ───────────────────────────────────────────────────

export const GAME_CONFIG = {
  /**
   * Logical pixel dimensions of a single node (the scrollable world area).
   * Square since the node-size pass: a 4:3 node made vertical terrain variety
   * cramped and gave north/south traversal a different feel to east/west.
   * 3200 also divides evenly by both the 64px Wang ground cell and the 32px nav
   * cell, which 2400 did not (2400/64 = 37.5 — see the clip mask in wangGround).
   */
  NODE_WIDTH: 3200,
  NODE_HEIGHT: 3200,
  /** Link's-Awakening-style map slide duration (ms). */
  MAP_SLIDE_MS: 600,
  /** Fraction of start→end screen distance the own player walks during a map slide. */
  MAP_SLIDE_WALK_FRAC: 0.25,
  /** Canvas fill behind node layers — distinct from Phaser canvas backdrop (0x1a1a2e). */
  SCENE_BACKDROP_COLOR: 0x252545,
  /** Black fog overlay alpha drawn over preloaded adjacent nodes (preview peek at edges). */
  NEIGHBOR_FOG_ALPHA: 0.6,
  /** Simulation tick rate in Hz — controls attack timing, AI, movement precision */
  LOGIC_TICK_RATE: 10,
  /** State broadcast rate in Hz — controls how often clients receive snapshots */
  BROADCAST_TICK_RATE: 5,
  /** Player movement speed in pixels per second */
  PLAYER_SPEED: 120,
  /**
   * Maximum number of monsters alive in a node at any time. Fallback only —
   * biomes set their own `mobDensity`. Raised 12 -> 16 alongside the square-node
   * resize so per-AREA density (and therefore fight pacing) held steady while the
   * node grew 33%.
   */
  MONSTERS_PER_NODE: 16,

  // ── Player base stats ────────────────────────────────────────────────────────
  PLAYER_MAX_HP: 100,
  PLAYER_ATTACK: 15, // damage per hit (before plating)
  PLAYER_PLATING: 2,
  /** Edge-to-edge weapon reach past body contact (pixels). */
  PLAYER_ATTACK_RANGE: 12,
  /** Milliseconds between attacks when unarmed. Overridden by weapon attacksPerSecond when a weapon is equipped. */
  PLAYER_ATTACK_COOLDOWN: 3000,
  /** Out-of-combat HP regen as a percentage of maxHp per second (10 = 10%/s). */
  PLAYER_HP_REGEN: 10,
  /** Milliseconds after leaving combat (no monster aggroed) before player regen starts */
  COMBAT_REGEN_DELAY: 4000,
  /** Milliseconds after last aggro drop before a monster starts regenerating */
  MONSTER_REGEN_DELAY: 5000,
  /** Monster OOC regen rate as a percentage of maxHp per second */
  MONSTER_REGEN_RATE: 20,

  // ── Spawn ─────────────────────────────────────────────────────────────────────
  /** Minimum pixel distance between two monsters at spawn time */
  MONSTER_MIN_SPAWN_DIST: 120,

  // ── Dungeon scaling ─────────────────────────────────────────────────────────
  // Regular (non-gauntlet) dungeon nodes scale up their normal monster population.
  // Boss stats come from the database directly (no mult). Single source of truth
  // shared by the server spawner and the client bestiary.
  /** HP multiplier applied to non-boss monsters in regular dungeon nodes. */
  DUNGEON_HP_MULT: 2.0,
  /** Attack multiplier applied to non-boss monsters in regular dungeon nodes. */
  DUNGEON_ATK_MULT: 1.6,

  // ── Evasion (fully deterministic — fractional accumulator, no RNG) ─────────────
  /**
   * Baseline fraction of a hit's damage avoided when it is evaded (0.5 = half).
   * Classes/items push this toward 1.0 (full avoid) via `defense.evade-mitigation`;
   * monsters may override it per-definition with `evadeMitigation`.
   */
  EVADE_MITIGATION_BASE: 0.5,
  /**
   * Raw dodge rate (Σ 1/N across evasion sources) at or below which dodge
   * frequency stays linear/unchanged. Above it, diminishing returns kick in.
   */
  EVASION_SOFT_CAP: 0.5,
  /** Asymptotic ceiling on dodge rate — full avoidance comes from the mitigation lever, not frequency. */
  EVASION_MAX_DODGE: 0.85,
  /** Diminishing-returns steepness past the soft cap. Higher = approaches the ceiling faster. */
  EVASION_DR_K: 2.0,
  /**
   * Value the deterministic dodge accumulator is reset to while a player is out
   * of combat. 0 = first in-combat hit starts a fresh dodge count. Raise toward
   * 1.0 to "preload" a guaranteed dodge on the first hit of an engagement.
   */
  EVADE_OOC_RESET: 0,

  // ── Empowered-hit radius ───────────────────────────────────────────────────────
  /**
   * Pixel radius associated with an empowered hit. Empowered attacks no longer deal
   * inherent splash damage (AoE is opt-in now — see the Sweep ability's cleave); this
   * is retained for the client empowered-ring FX and the AI's cluster-target heuristic.
   */
  EMPOWERED_AOE_RADIUS: 80,

  // ── Biome progression ─────────────────────────────────────────────────────────
  // Was 40 before, now tuned to be about 25 
  // The change's intention is to make biome XP less grindy, while shifting the balance towards essence being more scarce
  // power is unlocked, but needs to be paid for in essence, which will take more time to farm

  BIOME_XP_BASE: 25,
  BIOME_XP_EXPONENT: 2.8,
  /** Per-tier multiplier on biomeXp granted to the player. Front-loads early progression. Index = biomeTier. */
  BIOME_XP_REWARD_MULT_BY_TIER: [
    1.0, 1.5, 1.25, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  ] as unknown as readonly number[],
  /** Per-tier multiplier on essence granted to the player. Dampens late-game essence flooding. Index = biomeTier. */
  BIOME_ESSENCE_TIER_MULT: [
    1.0, 1.0, 0.85, 0.70, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55,
  ] as unknown as readonly number[],
  // ── Biome catalysts ─────────────────────────────────────────────────────────
  /**
   * Accumulated kill-weight (Σ monster `catalystWeight`) required to mint one
   * biome catalyst. Placeholder — tuned in the balance pass (Step 15).
   */
  CATALYST_PROGRESS_PER_UNIT: 100,
} as const;

/**
 * Total XP required to reach biome level `n` (from 0).
 * Formula: round(BASE × n ^ EXPONENT)
 * Example with defaults (BASE=25, EXP=2.8):
 *   Lv 1 →   25 XP   (25 T1 kills)
 *   Lv 2 →  250 XP   (25 T1 kills total)
 *   Lv 3 →  500 XP   (50 T1 kills total)
 *   Lv 4 →  800 XP   (80 T1 kills total)
 *   Lv 6 → 1800 XP   (90 T2 kills total)
 *   Lv 9 → 3800 XP   (190 T2 kills total)
 */
export function biomeXpForLevel(n: number): number {
  if (n <= 0) return 0;
  return Math.round(
    GAME_CONFIG.BIOME_XP_BASE * Math.pow(n, GAME_CONFIG.BIOME_XP_EXPONENT),
  );
}

/** Maps biomeGroup -> biomeTier, derived from NODE_BIOMES. */
export const BIOME_TIER_BY_GROUP: Record<string, number> = Object.fromEntries(
  Object.values(NODE_BIOMES)
    .filter((node) => node.kind !== 'sanctuary')
    .map((v) => [v.biomeGroup, v.biomeTier]),
);

/**
 * Maps biomeGroup -> the lowest tier the group appears at in NODE_BIOMES (its
 * "start tier"). Biomes that first appear above T1 (e.g. desert at T2) use this
 * to offset their XP curve so a given level costs what the same-tier level costs
 * in a biome that started at T1. See {@link biomeLevelOffset}.
 */
export const BIOME_START_TIER_BY_GROUP: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const { biomeGroup, biomeTier, kind } of Object.values(NODE_BIOMES)) {
    if (kind !== 'normal' && kind !== 'dungeon') continue;
    if (map[biomeGroup] === undefined || biomeTier < map[biomeGroup]) {
      map[biomeGroup] = biomeTier;
    }
  }
  return map;
})();

/**
 * Each tier spans this many biome levels. Expanded 4 → 6 (system rework Step 3) to
 * make reward space for skills/runes/cores. Levels 1–4 of each segment hold the
 * existing item recipes; levels 5–6 are reward space filled by later steps. Drives
 * {@link biomeLevelCap}, {@link biomeLevelOffset}, the XP-curve mapping, and the
 * generic upgrade-requirement fallback in itemUpgrades.ts.
 */
export const BIOME_LEVELS_PER_TIER = 6;

/**
 * Level offset for a biome whose start tier is above T1. A biome starting at
 * tier T behaves, level-for-level, like the top `(T-1)*4` levels of a T1 biome:
 * its level 1 lines up with a T1 biome's level `(T-1)*4 + 1`. Returns 0 for T1
 * biomes and the clearing, so they keep the unshifted curve.
 */
export function biomeLevelOffset(biomeGroup: string): number {
  if (biomeGroup === 'clearing') return 0;
  const startTier = BIOME_START_TIER_BY_GROUP[biomeGroup] ?? 1;
  return Math.max(0, (startTier - 1) * BIOME_LEVELS_PER_TIER);
}

/**
 * Returns the maximum biome level a player of `playerTier` can reach in a given
 * biome. A biome only has `BIOME_LEVELS_PER_TIER` levels of content per tier it
 * spans, so the cap grows with the player's tier: cap =
 * (playerTier - startTier + 1) * 4. A player at exactly the biome's start tier
 * gets the native 4 levels; a player below it gets 0 (they can't bank levels in
 * a biome they haven't unlocked — this is the case that matters for biomes that
 * first appear above T1, e.g. a T1 player must not gain levels in the T2 jungle).
 * Clearing is always capped at 4.
 */
export function biomeLevelCap(playerTier: number, biomeGroup: string): number {
  if (biomeGroup === 'clearing') return 4;
  const startTier = BIOME_START_TIER_BY_GROUP[biomeGroup] ?? 1;
  return Math.max(
    0,
    (playerTier - startTier + 1) * BIOME_LEVELS_PER_TIER,
  );
}

/**
 * Cumulative XP required to reach biome level `n` *within a specific biome*,
 * accounting for its start-tier offset. For a T1 biome this equals
 * {@link biomeXpForLevel}. For a biome starting at tier T, level `n` costs what
 * the equivalent same-tier level costs in a T1 biome — the offset levels are
 * subtracted out so the biome's own curve still starts at 0 XP for level 0
 * (i.e. level 1 costs the increment, not the whole cumulative wall below it).
 */
export function biomeXpForBiomeLevel(biomeGroup: string, n: number): number {
  const offset = biomeLevelOffset(biomeGroup);
  if (offset === 0) return biomeXpForLevel(n);
  return biomeXpForLevel(n + offset) - biomeXpForLevel(offset);
}

/**
 * Global Mastery (system rework Step 4): a derived account-wide aggregate equal to
 * the sum of every biome's level. Not persisted — recomputed from `biomeLevel`
 * wherever it's needed. Rewards breadth (farming any biome raises it) and drives
 * system-depth caps (rune-point budget, item upgrade ceiling) instead of granting
 * direct stats. The `clearing` tutorial hub is excluded — it is not a real biome.
 */
export function globalMastery(biomeLevel: Record<string, number>): number {
  let total = 0;
  for (const [group, level] of Object.entries(biomeLevel)) {
    if (group === 'clearing' || group === 'sanctuary') continue;
    total += Math.max(0, level);
  }
  return total;
}

/**
 * Maximum Global Mastery attainable at `playerTier`: the sum of every real
 * biome's {@link biomeLevelCap} at that tier (clearing excluded, matching
 * {@link globalMastery}). Defines the per-tier GM bands the item upgrade
 * ceiling is built on: tier T's band is
 * (maxGlobalMasteryAtTier(T-1), maxGlobalMasteryAtTier(T)].
 */
export function maxGlobalMasteryAtTier(playerTier: number): number {
  let total = 0;
  for (const group of Object.keys(BIOME_START_TIER_BY_GROUP)) {
    if (group === 'clearing') continue;
    total += biomeLevelCap(playerTier, group);
  }
  return total;
}

export interface NodeSceneBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Active node footprint — node coords equal scene coords. */
export function nodeSceneBounds(): NodeSceneBounds {
  return {
    x: 0,
    y: 0,
    width: GAME_CONFIG.NODE_WIDTH,
    height: GAME_CONFIG.NODE_HEIGHT,
  };
}

/** Camera scroll bounds: node footprint + half viewport per open cardinal exit. */
export function peekSceneBounds(
  nodeId: string,
  viewportW: number,
  viewportH: number,
): NodeSceneBounds {
  const exits = nodeExitsForNodeId(nodeId);
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const peekW = viewportW / 2;
  const peekH = viewportH / 2;

  const west = exits.west ? peekW : 0;
  const east = exits.east ? peekW : 0;
  const north = exits.north ? peekH : 0;
  const south = exits.south ? peekH : 0;

  return {
    x: -west,
    y: -north,
    width: W + west + east,
    height: H + north + south,
  };
}

/** World-space center of the node footprint. */
export function nodeSceneCenter(): { x: number; y: number } {
  return {
    x: GAME_CONFIG.NODE_WIDTH / 2,
    y: GAME_CONFIG.NODE_HEIGHT / 2,
  };
}

/** Authoritative node coords → client scene world coords. */
export function nodeToSceneCoords(
  x: number,
  y: number,
): { x: number; y: number } {
  return { x, y };
}

/** Client scene world coords → authoritative node coords. */
export function sceneToNodeCoords(
  x: number,
  y: number,
): { x: number; y: number } {
  return { x, y };
}

export const DEFAULT_AUTOCOMBAT_CONFIG: AutocombatConfig = {
  engageUltimateBosses: false,
  fleeWhenLow: true,
  fleeHpPct: 0.25,
  priorityMode: "balanced",
  acquireRadius: 600,
  focusLeaderTarget: true,
};
