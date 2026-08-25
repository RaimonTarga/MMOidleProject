import type { EquippedRule, EssenceType } from "@mmo-idle/shared";

/**
 * A place a step happens. Routes name content, not node ids, so a map edit that
 * renumbers nodes does not silently invalidate every authored route.
 */
export type NodeRef =
  | { kind: "node"; nodeId: string }
  | { kind: "biome"; biomeGroup: string; tier: number; pick?: "first" | "rotate" | "uncleared" }
  | { kind: "dungeon"; biomeGroup: string; tier: number };

/** Predicates over the player-visible observation. No hidden state is reachable. */
export type Condition =
  | { type: "biomeLevelAtLeast"; biomeGroup: string; level: number }
  | { type: "essenceAtLeast"; essence: EssenceType; amount: number }
  | { type: "catalystAtLeast"; family: string; amount: number }
  | { type: "recipeUnlocked"; recipeId: string }
  | { type: "hasItem"; definitionId: string }
  | { type: "itemAtLeastPlus"; definitionId: string; plus: number }
  | { type: "equipped"; definitionId: string }
  | { type: "bossCleared"; biomeGroup: string; tier: number }
  | { type: "playerTierAtLeast"; tier: number }
  | { type: "canCraft"; recipeId: string }
  | { type: "canUpgrade"; definitionId: string }
  | { type: "globalMasteryAtLeast"; value: number }
  | { type: "elapsedMs"; ms: number }
  | { type: "allOf"; of: Condition[] }
  | { type: "anyOf"; of: Condition[] }
  | { type: "not"; of: Condition };

export type StepBody =
  /** Spend the first skill point on a class root. */
  | { type: "chooseClass"; skillId: string }
  | { type: "unlockSkill"; skillId: string }
  | { type: "travel"; to: NodeRef }
  /** Auto-combat in place until `until` holds. The workhorse step. */
  | { type: "farm"; at: NodeRef; until: Condition }
  /**
   * Craft each recipe, farming `farmAt` whenever the wallet falls short. Costs
   * are read from `RECIPE_DATABASE` at runtime, never restated here.
   */
  | { type: "craft"; recipeIds: string[]; farmAt?: NodeRef }
  | { type: "equip"; definitionIds: string[] }
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
    }
  | { type: "configureRunes"; rules: EquippedRule[] }
  /**
   * Learn an ability by crafting its recipe, then slot it. This is what makes a
   * reactive Rune rule (e.g. `target-casting` -> `fire-guard`) actually do
   * something: the rune fragment ships with the character, the Guard it fires
   * has to be earned.
   */
  | {
      type: "learnAbility";
      recipeId: string;
      abilityId: string;
      slot: "technique" | "guard";
      farmAt?: NodeRef;
    }
  /**
   * Set the equipped abilities outright. Tier 1 grants ONE Technique and ONE
   * Guard slot, so every mid-run change is a REPLACEMENT — this is how a
   * boss-prep swap (Sweep -> Expose Weakness, Second Wind -> Brace) is authored.
   * Abilities must already be learned.
   */
  | { type: "setAbilities"; techniques: string[]; guards: string[] }
  /** Craft a Rune forge recipe, which is how new rune FRAGMENTS are unlocked. */
  | { type: "craftRune"; recipeId: string; farmAt?: NodeRef }
  | { type: "attemptBoss"; biomeGroup: string; tier: number; maxAttempts?: number }
  | { type: "repeatUntil"; steps: RouteStep[]; until: Condition; maxIterations?: number }
  /** Pure telemetry marker — records that the run reached a named point. */
  | { type: "milestone"; id: string };

export type RouteStep = StepBody & {
  /** Overrides the generated label in telemetry. */
  label?: string;
  /**
   * Preparation the *intended* player does but a hurried or careless one skips.
   * Policies drop these rather than the route being forked per policy.
   */
  optional?: boolean;
  /** Per-step override of the run-wide stall timeout. */
  stallAfterMs?: number;
};

export interface Route {
  id: string;
  version: string;
  /** Class root this route is authored for, e.g. `cadence-root`. */
  classRoot: string;
  description: string;
  steps: RouteStep[];
  /** Run is complete when this holds. */
  completion: Condition;
  /** Named checkpoints recorded with their own timestamps when first satisfied. */
  milestones: Array<{ id: string; when: Condition }>;
}

export function allOf(...of: Condition[]): Condition {
  return { type: "allOf", of };
}

export function anyOf(...of: Condition[]): Condition {
  return { type: "anyOf", of };
}
