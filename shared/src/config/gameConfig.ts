import { NODE_BIOMES } from '../world/nodeBiomes';

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
  /** Pixel radius within which a player can hit a monster */
  PLAYER_ATTACK_RANGE: 60,
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

  // ── AoE splash ────────────────────────────────────────────────────────────────
  /** Pixel radius of the empowered-attack splash, centered on the primary target. */
  EMPOWERED_AOE_RADIUS: 80,
  /**
   * Fraction of the attacker's raw `attack` stat dealt as splash damage to each
   * secondary target. Using the attack stat (not the empowered hit damage) keeps
   * splash independent of each archetype's multiplier.
   */
  EMPOWERED_AOE_MULT: 0.5,

  // ── Biome XP / recipe unlock system ──────────────────────────────────────
  /**
   * XP needed to reach level 1. Higher levels cost BASE * level^EXPONENT total XP.
   * Use biomeXpForLevel(n) from this package to compute thresholds.
   */
  BIOME_XP_BASE: 80,
  /**
   * Power-curve exponent. 1.7 means each level costs noticeably more than the last.
   * Tune alongside BIOME_XP_BASE and BIOME_XP_BY_NODE_TIER.
   */
  BIOME_XP_EXPONENT: 1.7,
  /** @deprecated No longer used by the rewards system — see BIOME_XP_ESSENCE_MULT. */
  BIOME_XP_BY_NODE_TIER: [25, 10, 20, 35, 55, 80] as unknown as readonly number[],
  /**
   * Per-kill biome XP = round(monster.essence * BIOME_XP_ESSENCE_MULT[biomeTier]).
   * Monsters with an explicit rewards.biomeXp bypass this multiplier.
   */
  BIOME_XP_ESSENCE_MULT: [1.0, 2.0, 1.1, 1.0, 1.0, 1.0] as unknown as readonly number[],
  /** Maximum biome level attainable at each playerTier (index = playerTier). T2 recipes start at level 6. */
  BIOME_LEVEL_CAP_BY_TIER: [2, 5, 10, 15, 20, 25, 30, 35] as unknown as readonly number[],
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
  return Math.round(GAME_CONFIG.BIOME_XP_BASE * Math.pow(n, GAME_CONFIG.BIOME_XP_EXPONENT));
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
  if (biomeGroup === 'clearing') return 4;
  return Math.max(4, playerTier * 4);
}
