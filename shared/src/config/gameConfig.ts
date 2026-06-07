import { NODE_BIOMES } from '../world/nodeBiomes';
import type { AutocombatConfig } from '../components/core/networkedSlices';

// ─── Game balance constants ───────────────────────────────────────────────────

export const GAME_CONFIG = {
  /** Logical pixel dimensions of a single node (the scrollable world area) */
  NODE_WIDTH:  3200,
  NODE_HEIGHT: 2400,
  /** Half-width of each cardinal gate opening along the border edge */
  GATE_HALF: 160,
  /** Simulation tick rate in Hz — controls attack timing, AI, movement precision */
  LOGIC_TICK_RATE: 10,
  /** State broadcast rate in Hz — controls how often clients receive snapshots */
  BROADCAST_TICK_RATE: 5,
  /** Player movement speed in pixels per second */
  PLAYER_SPEED: 120,
  /** Maximum number of monsters alive in a node at any time */
  MONSTERS_PER_NODE: 12,

  // ── Player base stats ────────────────────────────────────────────────────────
  PLAYER_MAX_HP:  100,
  PLAYER_ATTACK:  15,  // damage per hit (before plating)
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
  // Was 40 before, now tuned to be about 25 
  // The change's intention is to make biome XP less grindy, while shifting the balance towards essence being more scarce
  // power is unlocked, but needs to be paid for in essence, which will take more time to farm

  BIOME_XP_BASE: 25,
  BIOME_XP_EXPONENT: 2.8,
  BIOME_LEVEL_CAP_BY_TIER: [5, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41] as unknown as readonly number[],
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
  return Math.round(GAME_CONFIG.BIOME_XP_BASE * Math.pow(n, GAME_CONFIG.BIOME_XP_EXPONENT));
}

/** Maps biomeGroup -> biomeTier, derived from NODE_BIOMES. */
export const BIOME_TIER_BY_GROUP: Record<string, number> = Object.fromEntries(
  Object.values(NODE_BIOMES).map((v) => [v.biomeGroup, v.biomeTier]),
);

/**
 * Maps biomeGroup -> the lowest tier the group appears at in NODE_BIOMES (its
 * "start tier"). Biomes that first appear above T1 (e.g. desert at T2) use this
 * to offset their XP curve so a given level costs what the same-tier level costs
 * in a biome that started at T1. See {@link biomeLevelOffset}.
 */
export const BIOME_START_TIER_BY_GROUP: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const { biomeGroup, biomeTier } of Object.values(NODE_BIOMES)) {
    if (map[biomeGroup] === undefined || biomeTier < map[biomeGroup]) {
      map[biomeGroup] = biomeTier;
    }
  }
  return map;
})();

/** Each tier spans this many biome levels. */
export const BIOME_LEVELS_PER_TIER = 4;

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
 * spans, so the cap shrinks for biomes that start above T1: cap =
 * (playerTier - startTier + 1) * 4, minimum 4. Clearing is always capped at 4.
 */
export function biomeLevelCap(playerTier: number, biomeGroup: string): number {
  if (biomeGroup === 'clearing') return 4;
  const startTier = BIOME_START_TIER_BY_GROUP[biomeGroup] ?? 1;
  return Math.max(
    BIOME_LEVELS_PER_TIER,
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

export const DEFAULT_AUTOCOMBAT_CONFIG: AutocombatConfig = {
  engageUltimateBosses: false,
  fleeWhenLow: true,
  fleeHpPct: 0.25,
  priorityMode: 'balanced',
  acquireRadius: 600,
  focusLeaderTarget: true,
};
