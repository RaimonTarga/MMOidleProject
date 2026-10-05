import type { EquipmentSlot, EquippedRule, EssenceType, EvolveMode, PacketId, RowKind, TierCheckpointKind } from "@mmo-idle/shared";

/**
 * One planned item level inside a legacy `canAffordUpgrades` condition. The +N
 * ladder is retired on every slot (design §24.5); the shape stays so the old
 * route definitions still type-check, and the condition always holds.
 */
export interface UpgradeTarget {
  definitionId: string;
  toPlus: number;
}
import type { DesiredBuild } from "../loadout/loadout";

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
      /**
       * Only nodes whose kills pay this shard (`nodeShard`, design §24.3). A shard
       * farm on any other node of the biome pays none of it.
       */
      shard?: PacketId;
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
  | { type: "abilityKnown"; abilityId: string }
  | { type: "abilityEquipped"; abilityId: string }
  | { type: "frameSelected"; frameId: string }
  | { type: "equippedWeaponWithDot" }
  | { type: "bossCleared"; biomeGroup: string; tier: number }
  | { type: "playerTierAtLeast"; tier: number }
  | { type: "fullyRecovered" }
  | { type: "canCraft"; recipeId: string }
  | { type: "canEvolve"; recipeId: string; mode: EvolveMode }
  | { type: "canReconstruct"; recipeId: string }
  | { type: "canUpgrade"; definitionId: string }
  | { type: "globalMasteryAtLeast"; value: number }
  // Lineage trees: the two kill-driven wallets, and what they have already bought.
  | { type: "shardAtLeast"; packet: PacketId; amount: number }
  | { type: "capstoneAtLeast"; biome: string; amount: number }
  | { type: "lineageCardOwned"; lineageId: string; cardId: string }
  | { type: "lineageFormOwned"; lineageId: string; recipeId: string }
  | { type: "lineageFormWorn"; lineageId: string; recipeId: string }
  // Guided-tutorial vocabulary (shared/src/tutorial/types.ts), so tutorial scripts run as routes.
  | { type: "classSelected" }
  | { type: "runeRecipeCrafted"; recipeId: string }
  | { type: "canAffordUpgrades"; items: UpgradeTarget[] }
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
  | {
      type: "unequip";
      slot: EquipmentSlot;
      /**
       * The item this step was planned against. `t2Acquisition.ts` resolves
       * `unequipSlot` once, at route-build time, from a static profile
       * snapshot; if the slot goes on to hold a DIFFERENT item by the time
       * this step actually runs (e.g. a later leg equipped a new weapon into
       * the same slot before this step's own leg arrived), evicting
       * unconditionally would strip the wrong, currently-correct item. When
       * set, the executor skips the unequip instead of evicting a mismatch.
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
  | { type: "configureRunes"; rules: EquippedRule[] }
  | { type: "configureBuild"; build: DesiredBuild }
  | { type: "craftRite"; recipeId: string; farmAt?: NodeRef }
  /**
   * Learn an ability by crafting its recipe, then slot it. This is what makes a
   * reactive Rune rule (e.g. `target-casting` -> `use-ability` targeting Brace) actually do
   * something: the rune fragment ships with the character, the Guard it fires
   * has to be earned.
   */
  | {
      type: "learnAbility";
      recipeId: string;
      abilityId: string;
      slot: "technique" | "guard";
      /** false learns only; configureBuild can attune the final repertoire later. */
      attune?: boolean;
      farmAt?: NodeRef;
    }
  /**
   * Replace the ordered Technique and Guard repertoires. These are semantic
   * families, not fixed slots; all entries reserve RP and must be learned.
   */
  | { type: "setAbilities"; techniques: string[]; guards: string[] }
  /** Craft a Rune forge recipe, which is how new rune FRAGMENTS are unlocked. */
  | { type: "craftRune"; recipeId: string; farmAt?: NodeRef }
  /**
   * Buy one lineage card, farming `farmAt` while the wallet falls short.
   *
   * Costs (essence AND the lane's shard) come from the magnitude table at
   * runtime, exactly as `craft` reads `RECIPE_DATABASE` — a route never restates
   * a price. The tree itself is opened by HOLDING the lineage's base form, so an
   * `unlockCard` step is only legal after the `craft`/`equip` that took the slot.
   *
   * Buying a card into an EMPTY row also activates it (the server does that), so
   * a route that only ever owns one card per row needs no `setActive` at all.
   */
  | { type: "unlockCard"; lineageId: string; cardId: string; farmAt?: NodeRef }
  /**
   * Choose which owned card is active for a row, or clear the row with `null`.
   * Free and instant — this is the swap the lane matrix measures, and the step a
   * route uses to state "own three, run one".
   */
  | { type: "setActive"; lineageId: string; row: RowKind; cardId: string | null }
  /**
   * Pay a band's gate, farming `farmAt` while the wallet falls short. The gate
   * costs essence, the crowned lane's shard and the biome boss's capstone — and
   * the capstone only drops from that boss, so a route that pays a gate must
   * have cleared it enough times first (the executor raises a named stall
   * rather than farming a node that can never mint one).
   */
  | { type: "unlockForm"; lineageId: string; recipeId: string; farmAt?: NodeRef }
  /** Wear an owned form. Free and instant, like swapping gear. */
  | { type: "wearForm"; lineageId: string; recipeId: string }
  /**
   * Fight a biome's tier boss. `repeat` marks a step that wants a FRESH kill even
   * though the biome's seal is already held — a capstone loop, where the drop is the
   * point and `bossesCleared` (a first-clear flag, true forever) is the wrong signal.
   */
  | { type: "attemptBoss"; biomeGroup: string; tier: number; maxAttempts?: number; repeat?: boolean }
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
  /** Restores the sealed --tierEntrySnapshot, never a generic profile. */
  progressionEntry?: { boundaryId: string; nodeId: string; tier: number; revisionPolicy: 'same-revision' | 'explicit-current-revision'; prerequisites: Condition[] };

  description: string;
  steps: RouteStep[];
  /** Run is complete when this holds. */
  completion: Condition;
  /** Named checkpoints recorded with their own timestamps when first satisfied. */
  milestones: Array<{ id: string; when: Condition }>;
  checkpointKind?: TierCheckpointKind;
  /** Expected checkpoint kind when this route consumes a sealed experiment state. */
  entryCheckpointKind?: TierCheckpointKind;
  /** Explicitly resume an unchanged full-mastery, pre-boss T2 Snapshot B. */
  resumePreparedT2?: boolean;
  /** Keep transit through future biomes movement-only for a pre-progression checkpoint. */
  suppressTransitCombat?: boolean;
  captureTier2Handoff?: boolean;
  /** Bounded exploration: record the first death, then stop without respawning. */
  stopOnFirstDeath?: boolean;
  /** Static ordering-test seed for a route that begins from a sealed checkpoint. */
  entryItems?: readonly string[];
  entryKnownAbilities?: readonly string[];
}

export function allOf(...of: Condition[]): Condition {
  return { type: "allOf", of };
}

export function anyOf(...of: Condition[]): Condition {
  return { type: "anyOf", of };
}
