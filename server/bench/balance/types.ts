import type { WorldLogDisplayKind, EssenceType } from '@mmo-idle/shared';
import type { ConcurrencyStats } from './concurrency';

export const BALANCE_JSONL_SCHEMA_VERSION = 1;

export type BalanceOutputFormat = 'csv' | 'jsonl';

/**
 * Which kind of content the bench is exercising.
 * `boss` / `overlord` measure a FIGHT (clear one node, once). `farm` measures a
 * RUN: repopulation on, no clear-break, income ledgered per simulated hour.
 */
export type BenchMode = 'boss' | 'overlord' | 'farm';

/** Party size used for overlord runs. */
export const OVERLORD_PARTY_SIZE = 4;

export type BalanceOutcome = 'clear' | 'bot_died' | 'timeout';

export type GearSlot = 'weapon' | 'armor' | 'recovery' | 'mobility' | 'core' | 'relic';

export interface BuildSpec {
  id: string;
  classRoot: string;
  skillPath: string[];
  contentTier: number;
  playerTier: number;
  gearTier: number;
  gearItemIds: Partial<Record<GearSlot, string>>;
}

export interface ContentTarget {
  nodeId: string;
  biomeGroup: string;
  contentTier: number;
  isDungeon: boolean;
}

export interface FightLogLine {
  tick: number;
  timeMs: number;
  kind: WorldLogDisplayKind;
  headline: string;
  detail?: string;
}

export interface BalanceRunResult {
  buildId: string;
  biomeGroup: string;
  contentTier: number;
  nodeId: string;
  isDungeon: boolean;
  outcome: BalanceOutcome;
  simDurationMs: number;
  ticks: number;
  timeScale: number;
  initialMobCount: number;
  damageDealt: number;
  damageTaken: number;
  botHpEnd: number;
  maxHp: number;
  /** Type id of the dungeon boss present in the node (for difficulty targeting). */
  bossTypeId?: string;
  /**
   * Overlord (party) runs only: the build ids of all party members, and how many
   * of them died. Solo boss runs leave these undefined. For party runs the
   * `damageDealt` / `damageTaken` / `botHpEnd` / `maxHp` fields are party totals,
   * so `botHpEnd / maxHp` is the party-average end-HP fraction.
   */
  partyBuildIds?: string[];
  partyDeaths?: number;
  fightLog?: FightLogLine[];
}

/**
 * One farm run: a single build farming a single open-world node for a stretch of
 * simulated time, with everything it earned expressed as a per-hour rate.
 *
 * Rates are the deliverable — totals are kept alongside them so a short run can
 * be sanity-checked against the wall it was measured over.
 */
export interface FarmRunResult {
  buildId: string;
  classRoot: string;
  biomeGroup: string;
  contentTier: number;
  nodeId: string;
  /** The node's modifier — its catalyst key. Absent on excluded nodes. */
  modifier?: string;
  /** Target monster population the node repopulates back to. */
  mobDensity: number;
  simDurationMs: number;
  ticks: number;
  timeScale: number;

  kills: number;
  killsPerHour: number;
  deaths: number;
  deathsPerHour: number;

  essenceTotal: Record<EssenceType, number>;
  essencePerHour: Record<EssenceType, number>;
  essenceSum: number;
  essenceSumPerHour: number;

  /** Catalysts by node modifier, counting banked partial progress fractionally. */
  catalystTotal: Record<string, number>;
  catalystPerHour: Record<string, number>;
  catalystSum: number;
  catalystSumPerHour: number;

  /**
   * Biome XP for the farmed biome. `biomeXpPerHour` is measured over the window
   * BEFORE the level cap was reached — past the cap `applyBiomeXP` early-returns
   * and the raw average would decay toward zero for a reason that has nothing to
   * do with the node's income.
   */
  biomeXpTotal: number;
  biomeXpPerHour: number;
  biomeLevelStart: number;
  biomeLevelEnd: number;
  biomeLevelCap: number;
  /** Sim hours taken to reach the tier's biome-level cap; null if never reached. */
  hoursToBiomeCap: number | null;
  recipesUnlocked: number;

  damageDealt: number;
  damageTaken: number;
  damageTakenPerHour: number;
  /** HP lost per hour from EVERY damage source; `damageTaken` is pipeline-only. */
  hpLostPerHour: number;

  /** Item upgrade level the bot ran at; null = fully upgraded. */
  upgradeLevel: number | null;
  /** How many monsters were actually on the player — see concurrency.ts. */
  concurrency: ConcurrencyStats;
}

/** Composite difficulty bucket for a match. */
export type BalanceRating = 'too_easy' | 'easy' | 'balanced' | 'hard' | 'too_hard';

/** Per-axis weights used by the composite difficulty score. */
export interface BalanceWeights {
  survival: number;
  punish: number;
  attrition: number;
}

/**
 * Full breakdown of the composite "balance" score so the UI can show the
 * calculation, not just the final bucket.
 */
export interface BalanceScore {
  rating: BalanceRating;
  /** Weighted composite in [0,1] (0 = trivial, 1 = brutal). */
  difficulty: number;
  /** Per-axis danger scores in [0,1] (higher = harder). */
  survivalDanger: number;
  punishDanger: number;
  attritionDanger: number;
  /** Raw context values feeding the axes. */
  hpFraction: number;
  dmgRatio: number;
  seconds: number;
  /** Ideal fight-duration window for this encounter kind (seconds). */
  targetMinSecs: number;
  targetMaxSecs: number;
  isOverlord: boolean;
  /** True when outcome (death/timeout) forced the rating to too_hard. */
  outcomeGated: boolean;
  weights: BalanceWeights;
}

export interface MatrixFilter {
  classRoot?: string;
  biome?: string;
  build?: string;
}

export interface BalanceCliArgs {
  /** `boss` = solo dungeon-boss matrix; `overlord` = 4-bot party vs an overlord. */
  mode: BenchMode;
  tiers: number[];
  biome?: string;
  classRoot?: string;
  buildId?: string;
  timeScale: number;
  maxSimSeconds: number;
  single: boolean;
  format: BalanceOutputFormat;
  captureLog: boolean;
  dryRun: boolean;
  /**
   * When true, enumerate every possible perk combination (full root → variant →
   * range → T3 path depth) regardless of content tier, instead of capping skill
   * depth at the realistic `contentTier - 1`.
   */
  allPaths: boolean;
  /**
   * Shard index for parallel runs (0-based). Each shard simulates only the
   * matrix entries where `globalIndex % shardCount === shardIndex`.
   */
  shardIndex: number;
  /** Total number of shards. `1` = no sharding (run the full matrix). */
  shardCount: number;
  /**
   * Overlord-only: cap the run to this many randomly-sampled party scenarios per
   * overlord target (stratified across class archetypes, optimized builds first).
   * `0` = no cap (full distinct-class enumeration).
   */
  sampleSize: number;
  /**
   * Overlord-only on-demand re-run: the exact party member build ids to
   * reconstruct and run as a single logged match (use with `--biome`/`--tier`
   * and `--log`). When set, the matrix is skipped entirely.
   */
  partyIds?: string[];
  /** Farm-only: farm this exact node instead of the per-biome representatives. */
  farmNodeId?: string;
  /**
   * Farm-only: run the full build enumeration instead of one representative
   * build per class root.
   */
  allBuilds: boolean;
  /**
   * Farm-only: re-run the same (build × node) at each of these time scales and
   * report how far the rates drift. `dt = 100ms × timeScale`, so a fast run
   * resolves attack timers, DoT ticks, movement and repop in coarser lumps —
   * this is the check that the fast runs are not lying.
   */
  scaleSweep?: number[];
  /**
   * Farm mode: re-run every (build x node) pair once per item-upgrade level.
   * Concurrency is not player-independent — a bot that kills faster lingers less
   * and is swarmed less — so measuring it at one power level biases the result.
   */
  gearSweep?: number[];
}

export interface BalanceJsonlMeta {
  /** Always {@link BALANCE_JSONL_SCHEMA_VERSION}; typed as `number` so producers can build records incrementally. */
  schemaVersion: number;
  kind: 'run_meta';
  mode: BenchMode;
  expectedMatches: number;
  tiers: number[];
  biome?: string;
  classRoot?: string;
  timeScale: number;
  maxSimSeconds: number;
  /** Present when the requested tick scale is outside the measured fidelity ceiling. */
  warning?: string;
}

/** One farm run as a JSONL record, with the build resolved to readable names. */
export interface BalanceJsonlFarm extends FarmRunResult {
  /** Always {@link BALANCE_JSONL_SCHEMA_VERSION}; typed as `number` so producers can build records incrementally. */
  schemaVersion: number;
  kind: 'farm';
  skillPath: string[];
  perks: BalancePerkInfo[];
  gearItemIds: Partial<Record<GearSlot, string>>;
  gear: BalanceGearInfo[];
}

/** One unlocked skill node, resolved to its human-readable name + description. */
export interface BalancePerkInfo {
  id: string;
  name: string;
  /** Skill-tree tier (0 root, 1 variant, 2 range, 3 path modifier, …). */
  tier: number;
  description: string;
}

/** One authored upgrade step for a gear item (the "+N" path). */
export interface BalanceUpgradeStepInfo {
  /** 1-based upgrade level (index + 1). */
  level: number;
  stats?: Record<string, number>;
  mechanicEffects?: Record<string, number>;
  cost: Partial<Record<EssenceType, number>>;
  requiredBiomeLevel: number;
}

/** One equipped gear item, resolved to name + base stats + upgrade path. */
export interface BalanceGearInfo {
  slot: GearSlot;
  itemId: string;
  name: string;
  tier: number;
  /** Upgrade level applied in the sim (bench bots always run fully upgraded). */
  upgradeLevel: number;
  stats: Record<string, number>;
  mechanicEffects?: Record<string, number>;
  upgrades: BalanceUpgradeStepInfo[];
}

/** One party member in an overlord run, resolved to readable build info. */
export interface BalancePartyMemberInfo {
  buildId: string;
  classRoot: string;
  skillPath: string[];
  /** Skill path resolved to readable perk names + descriptions. */
  perks: BalancePerkInfo[];
}

export interface BalanceJsonlMatch extends BalanceRunResult {
  /** Always {@link BALANCE_JSONL_SCHEMA_VERSION}; typed as `number` so producers can build records incrementally. */
  schemaVersion: number;
  kind: 'match';
  classRoot: string;
  skillPath: string[];
  gearItemIds: Partial<Record<GearSlot, string>>;
  /** Skill path resolved to readable perk names + descriptions (solo boss runs). */
  perks: BalancePerkInfo[];
  /** Equipped gear resolved to names, stats, and upgrade paths. */
  gear: BalanceGearInfo[];
  /**
   * Overlord runs only: the resolved roster (4 members). Gear is shared (all
   * members run the same tier loadout) so it stays in `gear`.
   */
  party?: BalancePartyMemberInfo[];
  /** Computed composite difficulty score + breakdown. */
  balance: BalanceScore;
  dps: number;
  incomingDps: number;
  hpFraction: number;
}
