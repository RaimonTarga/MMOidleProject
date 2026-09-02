import { nodeExitsForNodeId } from "../collision/nodeAdjacency";
import { NODE_BIOMES } from "../world/nodeBiomes";
import type { AutocombatConfig } from "../components/core/networkedSlices";

// ─── Game balance constants ───────────────────────────────────────────────────

export const GAME_CONFIG = {
  /**
   * Logical pixel dimensions of a single node (the scrollable world area).
   *
   * Square, and 4800 on both axes. The first pass only squared the node by raising
   * height 2400 -> 3200, which grew it 33% but left the WIDTH untouched — and width
   * is the axis you actually read on a widescreen, so the node did not feel any
   * bigger, just longer to walk north-south. Both axes now grow together.
   *
   * 4800 divides evenly by the 64px Wang ground cell (75) and the 32px nav cell
   * (150), so no partial-cell clipping — see the clip mask note in wangGround.
   */
  NODE_WIDTH: 4800,
  NODE_HEIGHT: 4800,
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
   * biomes set their own `mobDensity`.
   *
   * Scaled x1.5 with the 4800 node, NOT by the x2.25 area. Mobs are deliberately
   * scaled sub-linearly so a bigger node reads as genuinely roomier to fight in;
   * props and decor take the full area scale so the ground still looks dressed.
   */
  MONSTERS_PER_NODE: 24,

  // ── Player base stats ────────────────────────────────────────────────────────
  PLAYER_MAX_HP: 100,
  PLAYER_ATTACK: 15, // damage per hit (before plating)
  PLAYER_PLATING: 2,
  /** Edge-to-edge weapon reach past body contact (pixels). */
  PLAYER_ATTACK_RANGE: 12,
  /** Milliseconds between attacks when unarmed. Overridden by weapon attacksPerSecond when a weapon is equipped. */
  PLAYER_ATTACK_COOLDOWN: 3000,
  /** Recovery: 1 point = 1% of maxHp restored per second at 100% active Recovery. */
  PLAYER_RECOVERY: 10,
  /** Milliseconds after leaving combat (no monster aggroed) before Recovery returns to 100% */
  COMBAT_REGEN_DELAY: 4000,

  // ── Recovery access windows ───────────────────────────────────────────────
  // Default durations for the timed Recovery sources, used when an item or node
  // does not author its own companion duration key. All are "how long a fraction
  // of the Recovery rate stays switched on", never a heal amount.
  /** Default window for `defense.recovery-pulse-pct` (ms). */
  RECOVERY_PULSE_MS: 4000,
  /** Default window for `defense.recovery-on-kill-pct` (ms). Kills refresh it. */
  RECOVERY_ON_KILL_MS: 4000,
  /** Default window for `guard.recovery-on-fire-pct` (ms). */
  RECOVERY_ON_GUARD_MS: 4000,
  /** Default window for a Recovery-tagged skill that omits its own duration (ms). */
  RECOVERY_SKILL_MS: 4000,
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

  // ── Barrier (permanent, self-recharging absorb pool) ──────────────────────────
  // Sized by `defense.barrier-pct` × maxHp. It never expires; instead it refills
  // once the player has gone BARRIER_DELAY_MS without taking damage. Direct hits
  // and DoT ticks both restart the delay, so in sustained combat the barrier is a
  // per-engagement buffer that recharges between packs rather than a throughput
  // stat. Items override either default via `defense.barrier-recharge-pct` /
  // `defense.barrier-delay-ms`.
  /** Fraction of the barrier's MAX refilled per second while recharging (0.25 = full in 4s). */
  BARRIER_RECHARGE_PCT: 0.25,
  /** Milliseconds the player must go undamaged before the barrier starts refilling. */
  BARRIER_DELAY_MS: 4000,
  /**
   * Cooldown on the barrier-break riders (`defense.barrier-break-heal-pct` and
   * `defense.max-hit-refills-barrier`). Barrier depletion is routine under the
   * recharge model — without this gate a barrier flickering at zero would fire
   * them every tick.
   */
  BARRIER_BREAK_RIDER_CD_MS: 8000,

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
  /**
   * Per-tier override of {@link GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT}, indexed
   * by BIOME tier. Absent tiers fall back to the base value.
   *
   * T1 economy candidate C (2026-08-31): T1 sits at 150, a x1.5 rate cut on top
   * of decoupling catalyst progress from the dev reward multiplier. T1 asks for
   * exactly one catalyst on the important +5 step, so the tier is an
   * INTRODUCTION to the system -- "I found a catalyst, what does this unlock?"
   * rather than a currency pile. Measured from the 2x bot cohort
   * (reports/t1-economy-cohort-deep-dive-2026-08-31.md): a clean route earned
   * alacrity 2 / swarming 3 / heavy 5 / fortified 15 per run against a demand of
   * one each. Decoupling halves that, and 150 takes it to roughly
   * alacrity 0.7 / swarming 1.0 / heavy 1.7 / fortified 5.0 -- 0-2 units in every
   * family a T1 route actually spends. Later tiers keep 100 and are free to make
   * catalyst routing a real economy.
   */
  CATALYST_PROGRESS_PER_UNIT_BY_TIER: { 1: 150 } as Readonly<Record<number, number>>,
} as const;

/**
 * Kill-weight required to mint one catalyst in a tier-`biomeTier` node. The
 * single place both the reward path and any analysis tooling should ask.
 */
export function catalystProgressPerUnit(biomeTier: number): number {
  return (
    GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT_BY_TIER[biomeTier] ??
    GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT
  );
}

// ── Dev reward multiplier ─────────────────────────────────────────────────────
// A dev-only, server-global scalar on the FARMABLE half of what a kill is worth
// (essence and biome XP) so a balance/playtest cycle can reach late content
// without farming it. It deliberately does NOT scale catalyst progress: a
// catalyst is a discovery gated on node-modifier exposure, and multiplying it
// turns the whole system into a currency pile (see rewards.ts). 1 = shipped rates; it is the only
// value production ever runs at, because the debug handler that changes it is
// registered under IS_DEV.
export const DEBUG_REWARD_MULT_DEFAULT = 1;
export const DEBUG_REWARD_MULT_MIN = 1;
export const DEBUG_REWARD_MULT_MAX = 1000;

/**
 * Coerce an arbitrary inbound value to a usable reward multiplier: non-finite or
 * non-numeric input falls back to 1x rather than poisoning every later kill with
 * NaN, and anything in range is clamped and rounded to 2 decimals.
 */
export function clampRewardMultiplier(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEBUG_REWARD_MULT_DEFAULT;
  const clamped = Math.min(DEBUG_REWARD_MULT_MAX, Math.max(DEBUG_REWARD_MULT_MIN, n));
  return Math.round(clamped * 100) / 100;
}

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
 * Maps biomeGroup -> the HIGHEST tier the group appears at in NODE_BIOMES (its
 * "final tier"). Derived, never authored, exactly like {@link BIOME_START_TIER_BY_GROUP}
 * — a biome's contribution to mastery stops expanding when its authored content does.
 *
 * Node-kind set matches the start-tier derivation (`normal | dungeon`). This is safe
 * because dungeons are authored *inside* a region (see `world/map/authoring.ts`), so a
 * group's dungeon tiers are always a subset of its normal tiers — verified and pinned
 * by `server/test/t3ProgressionEconomy.test.ts`. If side dungeons ever outlive their
 * biome's normal nodes, that test fails and the derivation must be narrowed to
 * `normal` before the caps drift.
 */
export const BIOME_FINAL_TIER_BY_GROUP: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const { biomeGroup, biomeTier, kind } of Object.values(NODE_BIOMES)) {
    if (kind !== 'normal' && kind !== 'dungeon') continue;
    if (map[biomeGroup] === undefined || biomeTier > map[biomeGroup]) {
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
 *
 * The player's tier is also clamped by the biome's {@link BIOME_FINAL_TIER_BY_GROUP}
 * (T3 economy pass 2026-08-30): a RETIRED biome stops growing headroom once it has no
 * more authored content, so Plains/Forest contribute 12 forever rather than demanding
 * six more levels of outgrown T2 grinding per player tier. This is a GAIN STOP, never a
 * retroactive clamp — a legacy save above the cap keeps its level and its Global Mastery
 * (see `progression/rewards.ts`, which only ever early-returns `xpGain: 0`).
 */
export function biomeLevelCap(playerTier: number, biomeGroup: string): number {
  if (biomeGroup === 'clearing') return 4;
  const startTier = BIOME_START_TIER_BY_GROUP[biomeGroup] ?? 1;
  const finalTier = BIOME_FINAL_TIER_BY_GROUP[biomeGroup] ?? startTier;
  const effectiveTier = Math.min(playerTier, finalTier);
  return Math.max(
    0,
    (effectiveTier - startTier + 1) * BIOME_LEVELS_PER_TIER,
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
