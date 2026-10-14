import type { EquipmentSlot, EquippedRule, EssenceType, TierCheckpointKind } from "@mmo-idle/shared";

/**
 * A place a step happens. Routes name content, not node ids, so a map edit that
 * renumbers nodes does not silently invalidate every authored route.
 */
export type NodeRef =
  | { kind: "node"; nodeId: string }
  | {
      kind: "biome";
      biomeGroup: string;
      tier: number;
      pick?: "first" | "rotate" | "uncleared" | "current";
      /** Prefer a node carrying this modifier (T2-T4 authoring identity only; no gameplay effect). */
      modifier?: string;
    }
  | { kind: "dungeon"; biomeGroup: string; tier: number };

/** Predicates over the player-visible observation. No hidden state is reachable. */
export type Condition =
  | { type: "biomeLevelAtLeast"; biomeGroup: string; level: number }
  | { type: "essenceAtLeast"; essence: EssenceType; amount: number }
  | { type: "recipeUnlocked"; recipeId: string }
  | { type: "hasItem"; definitionId: string }
  | { type: "itemAtLeastPlus"; definitionId: string; plus: number }
  | { type: "equipped"; definitionId: string }
  | { type: "bossCleared"; biomeGroup: string; tier: number }
  | { type: "playerTierAtLeast"; tier: number }
  | { type: "fullyRecovered" }
  | { type: "canCraft"; recipeId: string }
  | { type: "canUpgrade"; definitionId: string }
  | { type: "globalMasteryAtLeast"; value: number }
  // Guided-tutorial vocabulary (shared/src/tutorial/types.ts), so tutorial scripts run as routes.
  | { type: "classSelected" }
  | { type: "elapsedMs"; ms: number }
  | { type: "allOf"; of: Condition[] }
  | { type: "anyOf"; of: Condition[] }
  | { type: "not"; of: Condition };

export type StepBody =
  /** Spend the first skill point on a class root. */
  | { type: "chooseClass"; skillId: string }
  | { type: "unlockSkill"; skillId: string }
  | { type: "travel"; to: NodeRef }
  /** Ordinary local movement, confirmed before a safe capture or other boundary. */
  | { type: "moveWithinNode"; nodeId: string; position: { x: number; y: number } }
  /** Auto-combat in place until `until` holds. The workhorse step. */
  | { type: "farm"; at: NodeRef; until: Condition;
      /** Additionally observe this much alive, auto-enabled time in the target area. */
      observeForMs?: number }
  /**
   * Craft each recipe, farming `farmAt` whenever the wallet falls short. Costs
   * are read from `RECIPE_DATABASE` at runtime, never restated here.
   */
  | { type: "craft"; recipeIds: string[]; farmAt?: NodeRef }
  | { type: "equip"; definitionIds: string[] }
  /** Take the item out of a slot and put it back in the bag. */
  | {
      type: "unequip";
      slot: EquipmentSlot;
      /**
       * The item this step was planned against. If the slot holds a DIFFERENT
       * item by the time the step runs (a later step equipped a new one into
       * the same slot), evicting unconditionally would strip the wrong,
       * currently-correct item; when set, the executor skips the unequip
       * instead of evicting a mismatch.
       */
      expectedDefinitionId?: string;
    }
  /**
   * Take one item to `toPlus`, farming `farmAt` for the essence it needs.
   *
   * `opportunistic` stops at whatever the CURRENT Global Mastery ceiling allows
   * instead of waiting for GM to rise. That matters because the T1 ceiling is
   * account-wide (+1@GM6, +2@GM12, +3@GM18) while one T1 biome caps at level 6 —
   * so a deep upgrade simply is not purchasable until the character has spread
   * across biomes. A real player upgrades what they can and moves on.
   */
  | {
      type: "upgrade";
      definitionId: string;
      toPlus: number;
      farmAt?: NodeRef;
      opportunistic?: boolean;
      /** Treat farmAt as a preference; follow the actual missing essence. */
      farmForMissingResources?: boolean;
    }
  /**
   * Replace the equipped Rune rules, in priority order. Runes are free
   * universal standing orders: the rules must be owned and fit the class, and
   * nothing else is priced.
   */
  | { type: "configureRunes"; rules: EquippedRule[] }
  /**
   * Choose which owned card is active for a row, or clear the row with `null`.
   * Free and instant.
   */
  /** Fight a biome's tier boss through its guard, up to `maxAttempts` times. */
  | { type: "attemptBoss"; biomeGroup: string; tier: number; maxAttempts?: number }
  | { type: "repeatUntil"; steps: RouteStep[]; until: Condition; maxIterations?: number }
  /**
   * Run `steps` only if `when` holds AT THE MOMENT THE STEP IS REACHED, and skip
   * them outright otherwise. Never waits, never stalls.
   *
   * This exists for progression a route cannot promise: a plain step there waits
   * for something that may never arrive and eventually stalls the whole run --
   * which would destroy the evidence about WHERE the character got walled, the
   * single most valuable thing the run has to say. Wrapping it turns "never got
   * there" into a recorded skip and lets the route continue reporting.
   *
   * Deliberately NOT a general `if/else`: there is no else branch, because a
   * route that silently substitutes a different build is no longer a control.
   */
  | { type: "ifPossible"; when: Condition; steps: RouteStep[] }
  | { type: "assert"; condition: Condition; code?: "INVALID_TREATMENT"; message?: string }
  /** Pure telemetry marker — records that the run reached a named point. */
  | { type: "milestone"; id: string }
  | { type: "captureCheckpoint"; boundaryId: string };

export type RouteStep = StepBody & {
  /** Explicit authored alternatives; resolved once before the run. */
  choice?: { id: string; option: string; defaultOption: string };
  /** Overrides the generated label in telemetry. */
  label?: string;
  /** Per-step wall-clock timeout for a long-running farm or other wait. */
  stepTimeoutMs?: number;
  /**
   * Preparation the *intended* player does but a hurried or careless one skips.
   * Policies drop these rather than the route being forked per policy.
   */
  optional?: boolean;
  /** Per-step override of the run-wide stall timeout. */
  stallAfterMs?: number;
  /** A failed prerequisite skips this step instead of entering a passive wait. */
  requires?: Condition;
};

/** Terminal result for one authored step, independent of run isolation quality. */
export type StepOutcome =
  | { status: "completed" }
  | { status: "skipped"; reason: string }
  | { status: "blocked"; reason: string; failedFact?: string }
  | { status: "failed"; reason: string };

export interface Route {
  /** A preserved historical route that cannot be executed under live mechanics. */
  retired?: string;
  id: string;
  version: string;
  /** Class root this route is authored for, e.g. `cadence-root`. */
  classRoot: string;
  /** Continues from a named checkpoint (`--tierEntrySnapshot`), never a fresh character. */
  progressionEntry?: { boundaryId: string; nodeId: string; tier: number; revisionPolicy: 'same-revision' | 'explicit-current-revision'; prerequisites: Condition[] };

  description: string;
  steps: RouteStep[];
  /** Run is complete when this holds. */
  completion: Condition;
  /** Named checkpoints recorded with their own timestamps when first satisfied. */
  milestones: Array<{ id: string; when: Condition }>;
  checkpointKind?: TierCheckpointKind;
  /** Keep transit through future biomes movement-only for a pre-progression checkpoint. */
  suppressTransitCombat?: boolean;
  captureTier2Handoff?: boolean;
  /** Bounded exploration: record the first death, then stop without respawning. */
  stopOnFirstDeath?: boolean;
  /** Static ordering-test seed for a route that begins from a sealed checkpoint. */
  entryItems?: readonly string[];
}

export function allOf(...of: Condition[]): Condition {
  return { type: "allOf", of };
}

export function anyOf(...of: Condition[]): Condition {
  return { type: "anyOf", of };
}
