import type { DeathCause, EssenceType } from "@mmo-idle/shared";

/** Bump when an event shape changes incompatibly. Mirrors the bench convention. */
export const BOT_JSONL_SCHEMA_VERSION = 2;

/** Tags that mark a run as unfit for canonical balance conclusions. */
export type RunTaint =
  | "NON_CANONICAL_REWARD_MULTIPLIER"
  | "NON_CANONICAL_TIME_SCALE"
  | "NON_CANONICAL_FAST_BOSS_RETRY"
  | "CONTAMINATED_CONTROLLED_OVERLAP";

export type HarnessExecutionMode =
  | "single"
  | "sequential"
  | "isolated-parallel"
  | "uncontrolled-parallel";

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
  taints: RunTaint[];
  executionMode: HarnessExecutionMode;
  maxConcurrency: number;
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
      newLevel: number;
      success: boolean;
      reason?: string;
      essenceSpent: Partial<Record<EssenceType, number>>;
      catalystsSpent: Record<string, number>;
      context: EconomyContext;
    }
  | { kind: "equip"; atMs: number; slot: string; definitionId: string | null }
  | { kind: "build-change"; atMs: number; system: string; detail: Record<string, unknown> }
  | { kind: "biome-level-up"; atMs: number; biomeGroup: string; newLevel: number; unlockedRecipeIds: string[] }
  | { kind: "tier-up"; atMs: number; newTier: number }
  | { kind: "catalyst-gain"; atMs: number; family: string; amount: number; context: EconomyContext }
  | {
      kind: "blocked-on-resource";
      atMs: number;
      phase: "start" | "end";
      forWhat: string;
      missing: Record<string, number>;
      farmingAt: string | null;
      durationMs?: number;
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
