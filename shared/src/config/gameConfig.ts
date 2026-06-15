import { nodeExitsForNodeId } from "../collision/nodeAdjacency";
import { NODE_BIOMES } from "../world/nodeBiomes";
import type { AutocombatConfig } from "../components/core/networkedSlices";

// ─── Game balance constants ───────────────────────────────────────────────────

export const GAME_CONFIG = {
  /** Logical pixel dimensions of a single node (the scrollable world area) */
  NODE_WIDTH: 3200,
  NODE_HEIGHT: 2400,
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
  /** Maximum number of monsters alive in a node at any time */
  MONSTERS_PER_NODE: 12,

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

  // ── AoE splash ────────────────────────────────────────────────────────────────
  /** Pixel radius of the empowered-attack splash, centered on the primary target. */
  EMPOWERED_AOE_RADIUS: 80,
  /**
   * Fraction of the attacker's raw `attack` stat dealt as splash damage to each
   * secondary target. Using the attack stat (not the empowered hit damage) keeps
   * splash independent of each archetype's multiplier.
   */
  EMPOWERED_AOE_MULT: 0.5,

  // ── Biome progression ─────────────────────────────────────────────────────────
  BIOME_XP_BASE: 40,
  BIOME_XP_EXPONENT: 2.8,
  BIOME_XP_ESSENCE_MULT: [
    1.0, 2.0, 1.1, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  ] as unknown as readonly number[],
  BIOME_LEVEL_CAP_BY_TIER: [
    5, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41,
  ] as unknown as readonly number[],
} as const;

/**
 * Total XP required to reach biome level `n` (from 0).
 * Formula: round(BASE × n ^ EXPONENT)
 * Example with defaults (BASE=80, EXP=1.7):
 *   Lv 1 →   80 XP   (8 T1 kills)
 *   Lv 2 →  260 XP   (26 T1 kills total)
 *   Lv 3 →  518 XP   (52 T1 kills total)
 *   Lv 4 →  845 XP   (85 T1 kills total)
 *   Lv 6 → 1831 XP   (92 T2 kills total)
 *   Lv 9 → 3848 XP   (192 T2 kills total)
 */
export function biomeXpForLevel(n: number): number {
  if (n <= 0) return 0;
  return Math.round(
    GAME_CONFIG.BIOME_XP_BASE * Math.pow(n, GAME_CONFIG.BIOME_XP_EXPONENT),
  );
}

/** Maps biomeGroup -> biomeTier, derived from NODE_BIOMES. */
export const BIOME_TIER_BY_GROUP: Record<string, number> = Object.fromEntries(
  Object.values(NODE_BIOMES).map((v) => [v.biomeGroup, v.biomeTier]),
);

/**
 * Returns the maximum biome level a player of `playerTier` can reach.
 * Cap = playerTier * 4, minimum 4. Clearing is always capped at 4.
 */
export function biomeLevelCap(playerTier: number, biomeGroup: string): number {
  if (biomeGroup === "clearing") return 4;
  return Math.max(4, playerTier * 4);
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
