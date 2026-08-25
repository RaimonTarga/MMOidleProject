import type { DeathCause, EssenceType } from "@mmo-idle/shared";

/** Bump when an event shape changes incompatibly. Mirrors the bench convention. */
export const BOT_JSONL_SCHEMA_VERSION = 1;

/** Tags that mark a run as unfit for canonical balance conclusions. */
export type RunTaint =
  | "NON_CANONICAL_REWARD_MULTIPLIER"
  | "NON_CANONICAL_TIME_SCALE";

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
    };
