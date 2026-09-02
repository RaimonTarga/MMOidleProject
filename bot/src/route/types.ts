import type { EquipmentSlot, EquippedRule, EssenceType, EvolveMode } from "@mmo-idle/shared";

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
      pick?: "first" | "rotate" | "uncleared";
      /** Prefer nodes whose live modifier mints this catalyst family. */
      modifier?: string;
    }
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
  | { type: "canEvolve"; recipeId: string; mode: EvolveMode }
  | { type: "canReconstruct"; recipeId: string }
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
  /** Evolve or reconstruct an evolved recipe; costs/gates come from shared data. */
  | { type: "evolveItem"; recipeId: string; mode: EvolveMode; farmAt?: NodeRef }
  /** Learn a stance through its live stance recipe. */
  | { type: "craftStance"; recipeId: string; farmAt?: NodeRef }
  /** Select the free default stance; automated destinations stay on Rune rules. */
  | { type: "setDefaultStance"; stanceId: string | null }
  | { type: "equip"; definitionIds: string[] }
  /**
   * Take the item out of a slot and put it back in the bag.
   *
   * Needed because EVOLUTION consumes a bag copy: `checkEvolve` requires
   * `inventory.includes(predecessor)`, and an equipped item is not in the
   * inventory array. A character wearing its fully-upgraded Tier-1 weapon
   * therefore cannot evolve that weapon without taking it off first -- which is
   * exactly what a player does at the forge, and exactly the step a route needs
   * in order to reach the cheap evolve path instead of paying reconstruction.
   */
  | { type: "unequip"; slot: EquipmentSlot }
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
  /**
   * Run `steps` only if `when` holds AT THE MOMENT THE STEP IS REACHED, and skip
   * them outright otherwise. Never waits, never stalls.
   *
   * This exists for progression a route cannot promise. The tier-2 RANGE node is
   * the motivating case: skill points are minted one per TIER advance, so a
   * character only becomes able to buy its branch after clearing three Tier-2
   * bosses. A plain `unlockSkill` there waits for a point that may never arrive
   * and eventually stalls the whole run -- which would destroy the evidence about
   * WHERE the character got walled, the single most valuable thing the run has to
   * say. Wrapping it turns "never got there" into a recorded skip and lets the
   * route continue reporting.
   *
   * Deliberately NOT a general `if/else`: there is no else branch, because a
   * route that silently substitutes a different build is no longer a control.
   */
  | { type: "ifPossible"; when: Condition; steps: RouteStep[] }
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
  /** Optional T1 frame declaration; canonical routes require this. */
  frameId?: string;
  /**
   * The tier this route expects to START in, when it starts from a tier-entry
   * template rather than from a fresh tier-0 character.
   *
   * Declaring it is what lets static validation know that the run already OWNS
   * the Tier-1 rune catalogue, gear and mastery -- otherwise `harness.test.ts`
   * reads a Tier-2 route as a fresh character illegally equipping runes it
   * never crafted. `botRun` also refuses to run such a route without a matching
   * `--tierEntry` profile, because a tier-0 character sent to a Tier-2 biome
   * banks zero XP (`biomeLevelCap(0, <T2 biome>) === 0`) and would farm forever.
   */
  startsFromTierEntry?: number;
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
