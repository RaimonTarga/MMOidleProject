import type { DeathCause, EssenceType } from "@mmo-idle/shared";
import type { T1EconomyArm, TierEntryInitialState } from "@mmo-idle/shared";

/** Bump when an event shape changes incompatibly. Mirrors the bench convention. */
export const BOT_JSONL_SCHEMA_VERSION = 3;

/** Tags that mark a run as unfit for canonical balance conclusions. */
export type RunTaint =
  | "NON_CANONICAL_REWARD_MULTIPLIER"
  | "NON_CANONICAL_TIME_SCALE"
  | "NON_CANONICAL_FAST_BOSS_RETRY"
  | "NON_CANONICAL_SHARED_WORLD"
  | "NON_CANONICAL_EARLY_STOP"
  /** Synthetic entry state is auditable but does not invalidate combat evidence. */
  | "SYNTHETIC_TIER_ENTRY"
  | "CONTAMINATED_CONTROLLED_OVERLAP";

export type HarnessExecutionMode =
  | "single"
  | "sequential"
  | "isolated-parallel"
  | "uncontrolled-parallel";

/**
 * The economy candidate a run was executed under, resolved from the LIVE shared
 * data at connect time rather than restated by hand -- a run header that merely
 * repeats a constant cannot detect a mismatched build. Stamped into every run so
 * a cohort can be audited without the git revision alone.
 */
export interface EconomyCandidate {
  /** Free-form label for the candidate under test. */
  id: string;
  /** Immutable revision of the factorial configuration. */
  revision: string;
  /** One of the four fixed arms assigned to this run. */
  arm: T1EconomyArm;
  /** Exact per-player T1 +5 essence multiplier. */
  t1Plus5EssenceCostMultiplier: number;
  /** Kill-weight per catalyst unit at biome tier 1, read from GAME_CONFIG. */
  catalystProgressPerUnitT1: number;
  /** Whether the dev reward multiplier also scales catalyst progress. */
  catalystsScaledByRewardMultiplier: boolean;
  /** Canonical T1 biome XP rate at rewardMultiplier=1. */
  t1BiomeXpRewardMultiplier: number;
  /** Canonical T1 essence rate at rewardMultiplier=1. */
  t1BiomeEssenceRewardMultiplier: number;
  /** Live `+5` essence costs for the T1 items a route can actually buy. */
  t1Plus5EssenceCosts: Record<string, number>;
}

export interface RunHeader {
  schemaVersion: number;
  runId: string;
  botId: string;
  devAccountId: string;
  characterName: string;
  characterId: string;
  routeId: string;
  routeVersion: string;
  policyId: string;
  classRoot: string;
  gitRevision: string;
  serverUrl: string;
  startedAt: number;
  /** Server-global kill-reward multiplier observed at connect. 1 = canonical. */
  rewardMultiplier: number;
  /** Economy tuning this run was executed under. */
  economyCandidate: EconomyCandidate;
  taints: RunTaint[];
  executionMode: HarnessExecutionMode;
  maxConcurrency: number;
  /** Wallet at the first authoritative run snapshot. */
  initialEssences?: Record<EssenceType, number>;
  initialCatalysts?: Record<string, number>;
  /** Present only for an explicit synthetic tier-entry run. */
  tierEntry?: TierEntryInitialState;
  /**
   * Present only for a tier-entry run: proof that the template this run started
   * from is a character the game could actually have produced.
   *
   * A stale template does not announce itself -- it silently spawns an
   * impossible character and every number the run produces describes a build no
   * player can hold. The run refuses to start when this fails, and the artifact
   * records the result either way so a reader never has to take it on trust.
   */
  templateValidation?: TemplateValidationSummary;
}

export interface TemplateValidationSummary {
  profileId: string;
  /** Offline legality against today's static game data. */
  profilePass: boolean;
  /** Live agreement between the template and the character the server built. */
  spawnPass: boolean;
  checked: number;
  /** Every failing check, verbatim, so a FAIL is diagnosable from the artifact. */
  failures: Array<{ pass: "profile" | "spawn"; check: string; message: string }>;
}

export type CompletionState =
  | "completed"
  | "stalled"
  | "timed-out"
  | "error"
  | "aborted";

/** Where a currency came from or went. */
export interface EconomyContext {
  nodeId: string;
  biomeGroup: string | null;
  nodeModifier: string | null;
}

/** One frame of the rolling pre-death combat window. */
export interface DeathTraceFrame {
  atMs: number;
  serverTime: number;
  kind: "damage" | "heal" | "dodge" | "kill" | "buff";
  attacker?: string;
  attackerType?: string;
  source?: string;
  damageType?: string;
  amount: number;
  absorbed?: number;
  hpBefore: number;
  hpAfter: number;
  concurrentAttackers: number;
  targetId?: string;
}

export interface DeathRecord {
  atMs: number;
  cause: DeathCause;
  killingBlow: DeathTraceFrame | null;
  largestHit: DeathTraceFrame | null;
  dominantSource: { name: string; damage: number } | null;
  maxConcurrentAttackers: number;
  nodeId: string;
  biomeGroup: string | null;
  nodeModifier: string | null;
  routeStepIndex: number;
  routeStepLabel: string;
  loadout: Record<string, string | null>;
  itemUpgrades: Record<string, number>;
  maxHp: number;
  plating: number;
  damageReduction: number;
  window: DeathTraceFrame[];
}

/** Where in the run a {@link BotEvent} wallet snapshot was taken. */
export type WalletSnapshotReason =
  | "run-start"
  | "milestone"
  | "block-start"
  | "block-end"
  | "pre-upgrade"
  | "pre-craft"
  | "run-end";

/**
 * One failed predicate behind a block, named precisely enough that an analysis
 * can separate essence waits from catalyst waits from gate waits without
 * guessing from the farm node.
 */
export type BlockReason =
  | { kind: "essence"; essence: string; current: number; required: number; missing: number }
  | { kind: "catalyst"; family: string; current: number; required: number; missing: number }
  | { kind: "globalMastery"; current: number; required: number; missing: number }
  | { kind: "biomeLevel"; biomeGroup: string; current: number; required: number; missing: number }
  | { kind: "recipeLocked"; recipeId: string }
  | { kind: "prerequisite"; detail: string };

export type BotEvent =
  | { kind: "run-start"; atMs: number; header: RunHeader }
  | {
      kind: "run-end";
      atMs: number;
      completion: CompletionState;
      reason?: string;
      durationMs: number;
    }
  | {
      /**
       * An `ifPossible` gate was reached. Recorded whether or not it fired: a
       * SKIPPED branch is the evidence that the character never got far enough
       * to buy it, which is exactly what a walled run needs to report.
       */
      kind: "route-conditional";
      atMs: number;
      condition: string;
      taken: boolean;
      skippedSteps: number;
    }
  | {
      kind: "route-step-start";
      atMs: number;
      index: number;
      label: string;
      stepType: string;
    }
  | {
      kind: "route-step-end";
      atMs: number;
      index: number;
      label: string;
      stepType: string;
      durationMs: number;
      outcome: "done" | "stalled";
      reason?: string;
    }
  | { kind: "node-enter"; atMs: number; nodeId: string; biomeGroup: string | null; nodeModifier: string | null }
  | { kind: "milestone"; atMs: number; id: string; detail?: Record<string, unknown> }
  | {
      kind: "kill";
      atMs: number;
      monsterTypeId: string;
      monsterName: string;
      isBoss: boolean;
      essenceGained: number;
      essenceType: EssenceType | null;
      biomeXpGained: number;
      context: EconomyContext;
    }
  | { kind: "death"; atMs: number; record: DeathRecord }
  | { kind: "respawn"; atMs: number; downtimeMs: number; nodeId: string }
  | {
      kind: "craft";
      atMs: number;
      recipeId: string;
      success: boolean;
      reason?: string;
      essenceSpent: Partial<Record<EssenceType, number>>;
      catalystsSpent: Record<string, number>;
      context: EconomyContext;
    }
  | {
      kind: "upgrade";
      atMs: number;
      itemId: string;
      /** Level held when the intent was sent; `newLevel` is where it landed. */
      fromLevel: number;
      newLevel: number;
      success: boolean;
      reason?: string;
      essenceSpent: Partial<Record<EssenceType, number>>;
      catalystsSpent: Record<string, number>;
      context: EconomyContext;
    }
  | {
      kind: "evolution";
      atMs: number;
      recipeId: string;
      mode: "evolve" | "reconstruct";
      predecessorId: string;
      success: boolean;
      reason?: string;
      essenceSpent: Partial<Record<EssenceType, number>>;
      catalystsSpent: Record<string, number>;
      context: EconomyContext;
    }
  | {
      kind: "stance-craft";
      atMs: number;
      recipeId: string;
      stanceId: string;
      success: boolean;
      reason?: string;
      essenceSpent: Partial<Record<EssenceType, number>>;
      catalystsSpent: Record<string, number>;
      context: EconomyContext;
    }
  | { kind: "equip"; atMs: number; slot: string; definitionId: string | null }
  /**
   * A slot was deliberately emptied. Almost always the prelude to an evolution:
   * the cheap evolve path consumes a BAG copy of the predecessor, so a worn item
   * has to come off before it can be evolved.
   */
  | { kind: "unequip"; atMs: number; slot: string; definitionId: string }
  | { kind: "build-change"; atMs: number; system: string; detail: Record<string, unknown> }
  | { kind: "biome-level-up"; atMs: number; biomeGroup: string; newLevel: number; unlockedRecipeIds: string[] }
  | { kind: "tier-up"; atMs: number; newTier: number }
  | { kind: "catalyst-gain"; atMs: number; family: string; amount: number; context: EconomyContext }
  | {
      /**
       * A complete wallet reading at an economically meaningful instant.
       * `reason` names the instant so an analysis can pair snapshots without
       * having to reconstruct the run's step order.
       */
      kind: "wallet-snapshot";
      atMs: number;
      reason: WalletSnapshotReason;
      /** Free-form tag: the milestone id, the `forWhat` of a block, etc. */
      detail?: string;
      essences: Record<string, number>;
      catalysts: Record<string, number>;
      /** Partial kill-weight banked toward the NEXT catalyst of each family. */
      catalystProgress: Record<string, number>;
      biomeLevels: Record<string, number>;
      globalMastery: number;
      itemUpgrades: Record<string, number>;
      nodeId: string;
    }
  | {
      kind: "blocked-on-resource";
      atMs: number;
      phase: "start" | "end";
      forWhat: string;
      missing: Record<string, number>;
      farmingAt: string | null;
      durationMs?: number;
      /**
       * The exact predicates that were failing when the span opened/closed --
       * never a generic `{blocked:1}`. Empty on an `end` phase means the block
       * actually cleared.
       */
      blockReasons?: BlockReason[];
      /** The authority's own rejection string, when one was available. */
      gateReason?: string;
    }
  | {
      /** Pre-clearing a dungeon's guard before the altar is touched. */
      kind: "dungeon-guard";
      atMs: number;
      phase: "start" | "end";
      nodeId: string;
      biomeGroup: string | null;
      attempt: number;
      guardianTotal: number;
      guardianAlive: number;
      durationMs?: number;
      outcome?: "cleared" | "reformed" | "gave-up";
    }
  | {
      kind: "boss-attempt";
      atMs: number;
      phase: "start" | "end";
      nodeId: string;
      biomeGroup: string | null;
      attempt: number;
      outcome?: "victory" | "death" | "timeout" | "unreachable";
      durationMs?: number;
      bossHpFraction?: number;
      bossCombatStartedAtMs?: number;
      bossCombatEndedAtMs?: number;
      bossCombatDurationMs?: number;
    }
  | {
      /** The route exhausted this boss's attempts and intentionally advanced. */
      kind: "boss-step-exhausted";
      atMs: number;
      nodeId: string;
      biomeGroup: string;
      tier: number;
      attempts: number;
      nextAction: "continue-route";
    }
  | {
      kind: "fast-boss-retry";
      atMs: number;
      nodeId: string;
      attempt: number;
      taint: "NON_CANONICAL_FAST_BOSS_RETRY";
      includeGuardians: boolean;
      playerReset: "respawn-baseline";
      skipped: string[];
    }
  | {
      kind: "area-lease";
      atMs: number;
      phase: "wait-start" | "acquired" | "released";
      areaIds: string[];
      reason: string;
      waitDurationMs?: number;
      conflictingOwnerId?: string;
    }
  | {
      kind: "controlled-overlap";
      atMs: number;
      areaId: string;
      nodeId: string;
      ownerIds: string[];
      entityIds: string[];
      reason: "unleased-entry" | "controlled-player-observed" | "transit-co-presence";
      /**
       * Only a bot ENGAGED in a node it does not own taints a run. A bot merely
       * walking through is recorded but harmless -- transit is unleased by
       * design, and a transiting bot does not fight.
       */
      contaminating: boolean;
    }
  | {
      /** Authoritative Rune posture change carried by a DeltaSnapshot when available. */
      kind: "stance-switch";
      atMs: number;
      playerId: string;
      nodeId: string;
      stanceId: string | null;
    }
  | {
      kind: "concurrency-sample";
      atMs: number;
      nodeId: string;
      attackers: number;
      monstersInNode: number;
      otherPlayersInNode: number;
      hpFraction: number;
    }
  | {
      kind: "contention";
      atMs: number;
      nodeId: string;
      otherPlayerIds: string[];
      sharedTargetIds: string[];
    }
  | { kind: "target-switch"; atMs: number; fromId: string | null; toId: string | null; nodeId: string }
  | { kind: "stall"; atMs: number; reason: string; detail?: Record<string, unknown> }
  | {
      kind: "damage";
      atMs: number;
      direction: "in" | "out";
      sourceName: string;
      sourceType: string;
      targetName: string;
      damageType: string;
      hpDamage: number;
      absorbed: number;
      nodeId: string;
    }
  | {
      kind: "ability-activation";
      atMs: number;
      abilityId: string;
      slot: "guard" | "technique";
      removedEffects?: Array<{ effectId: string; stacks: number }>;
    }
  | {
      kind: "hazard-contact";
      atMs: number;
      hazardId: string;
      hazardKind: string;
      sourceId: string;
      sourceName: string;
      phase: "enter" | "leave";
      durationMs?: number;
      damageReceived?: number;
      harmfulEffects?: string[];
      endReason?: "exited" | "expired" | "death" | "node-cleared";
    }
  | {
      kind: "hazard-escape";
      atMs: number;
      hazardIds: string[];
      hazardKinds: string[];
      phase: "attempt" | "result";
      outcome?: "success" | "failed" | "expired" | "interrupted";
      reason?: string;
    }
  | {
      kind: "telegraph-dodge";
      atMs: number;
      phase: "activation" | "attempt" | "safe" | "reenter" | "resolution" | "release" | "result";
      telegraphId?: string;
      telegraphKind?: string;
      ownerId?: string;
      trackedTelegraphIds?: string[];
      acquiredAtMs?: number;
      startingPosition?: { x: number; y: number };
      telegraphGeometry?: Array<{ pos: { x: number; y: number }; radius: number }>;
      escapePoint?: { x: number; y: number };
      firstSafeAtMs?: number;
      resolvedAtMs?: number;
      releasedAtMs?: number;
      releaseReason?: string;
      reenteredAfterSafe?: boolean;
      outcome?: "success" | "failure" | "discarded";
      damageReceived?: number;
      reason?: string;
    }
  | {
      kind: "technique-adapter";
      atMs: number;
      adapter: "apprentice-sweep" | "slinger-sweep" | "conduit-formation";
      event:
        | "apprentice-secondary-target"
        | "slinger-clip-created"
        | "slinger-clip-shot"
        | "slinger-splash-hit"
        | "conduit-arm"
        | "conduit-delivery"
        | "conduit-share-lost"
        | "conduit-secondary-damage";
      targetName?: string;
      stacksApplied?: number;
      clipSize?: number;
      splashDamage?: number;
      eligibleSummons?: number;
    };
