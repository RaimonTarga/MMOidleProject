import type { WorldLogDisplayKind, EssenceType } from '@mmo-idle/shared';

export const BALANCE_JSONL_SCHEMA_VERSION = 1;

export type BalanceOutputFormat = 'csv' | 'jsonl';

/** Which kind of content the bench is exercising. */
export type BenchMode = 'boss' | 'overlord';

/** Party size used for overlord runs. */
export const OVERLORD_PARTY_SIZE = 4;

export type BalanceOutcome = 'clear' | 'bot_died' | 'timeout';

export type GearSlot = 'weapon' | 'armor' | 'recovery' | 'mobility';

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
}

export interface BalanceJsonlMeta {
  schemaVersion: typeof BALANCE_JSONL_SCHEMA_VERSION;
  kind: 'run_meta';
  mode: BenchMode;
  expectedMatches: number;
  tiers: number[];
  biome?: string;
  classRoot?: string;
  timeScale: number;
  maxSimSeconds: number;
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
  schemaVersion: typeof BALANCE_JSONL_SCHEMA_VERSION;
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
