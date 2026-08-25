import type { EquippedRule } from "@mmo-idle/shared";
import type { Route, RouteStep } from "../route/types";
import {
  biome,
  bossFight,
  clearingOpening,
  getPiece,
  learnBrace,
  learnCleanse,
  learnExposeWeakness,
  learnSecondWind,
  learnSweep,
  maxOut,
  standardCompletion,
  standardMilestones,
} from "./t1Common";

/**
 * Tier 1 baseline route for the Apprentice (DoT root).
 *
 * Reordered per designer instruction: Plains -> Forest -> Swamp -> Mountain ->
 * Cave. Chaotic Axe final weapon (bot-route-reference.md §10 -- Poison Dagger
 * is Experiment E, not assumed better just because both are DoT-flavored).
 * Arcane Wrappings (`swamp-vest-t1`, DoT resistance) is now crafted at the
 * 3rd leg instead of the 4th -- otherwise unchanged, since Apprentice's own
 * affinity (toxin-hardened, converts part of incoming direct damage into DoT
 * it can outlast) stacks with it regardless of when Swamp falls in the spine.
 * Fallen Knight Plate returns for Mountain (now 4th)/Cave's cast pressure.
 *
 * ── The targeting fix ─────────────────────────────────────────────────────
 * Prior runtime traces showed Apprentice spreading damage across several
 * enemies with none dying before the player. The brief's own investigation
 * order is `focus-lowest-hp` -> `let-dots-finish` -> `careful-pulling` ->
 * `spread-dots`; all three DoT-flavored fragments are legitimately unlocked
 * at Swamp (L2/L3/L4 respectively -- inspected directly in `runeRecipes.ts`,
 * NOT taken from the reference packet's own table, which omits them). Only
 * ONE action can claim the TARGETING channel at a time, so the baseline uses
 * `focus-lowest-hp` -- it is both the brief's first preference and the most
 * direct fix for "nothing dies": prefer weakened enemies over new ones.
 * `let-dots-finish` is the natural refinement (only leave a target once its
 * DoT is guaranteed to finish it) and is Experiment D's alternate arm, not
 * dropped -- it just cannot be equipped simultaneously with focus-lowest-hp.
 *
 * The targeting fix now arrives at the 3rd leg instead of the 4th -- one leg
 * earlier than the original spine, which is a straightforward improvement
 * given the failure mode it answers.
 *
 * `avoid-hazards` is dropped from the baseline loadout on a Runic Point
 * budget the harness statically enforces at the GM-0 floor (8 RP): chase-
 * enemy(1) + focus-lowest-hp(3) + fire-guard(3) = 7, and hazards would push
 * it to 9. The targeting fix is prioritized over hazard-pathing because it
 * answers the actually-observed failure mode; hazard-pathing is untested.
 */

const RUNES_BASE: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "target-casting", actionId: "fire-guard" },
];

// Swamp L2 unlocks `focus-lowest-hp` -- the targeting fix.
const RUNES_TARGETING: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "in-combat", actionId: "focus-lowest-hp" },
  { conditionId: "target-casting", actionId: "fire-guard" },
];

const BOSS_KIT = [
  "chaotic-axe",
  "plains-vest-t1",
  "mountain-vest-t1",
  "swamp-vest-t1",
  "swamp-charm-t1",
  "plains-boots-t1",
] as const;

export const APPRENTICE_T1: Route = {
  id: "apprentice-t1",
  version: "1.1.0",
  classRoot: "dot-root",
  description:
    "Baseline for the Apprentice: five-biome GM-30 spine (Plains -> Forest -> Swamp -> Mountain -> Cave) to Chaotic Axe at +5, Arcane Wrappings swapped in for Swamp's DoT-resistance synergy, focus-lowest-hp targeting to fix the observed damage-spreading failure mode.",

  steps: [
    ...clearingOpening("dot-root", RUNES_BASE),

    // ── Plains: the full set, Sweep, then max it out -> +1 ───────────────────
    { type: "travel", to: biome("plains") },
    ...getPiece(biome("plains"), "iron-broadsword"),
    ...getPiece(biome("plains"), "plains-vest-t1"),
    ...getPiece(biome("plains"), "plains-charm-t1"),
    ...getPiece(biome("plains"), "plains-boots-t1"),
    learnSweep(),

    maxOut("plains"),
    { type: "upgrade", definitionId: "iron-broadsword", toPlus: 1, farmAt: biome("plains") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 1, farmAt: biome("plains") },
    { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 1, farmAt: biome("plains") },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 1, farmAt: biome("plains") },
    { type: "milestone", id: "plains-maxed" },

    // ── Forest: the fast weapon and the first real Guard -> +2 ───────────────
    { type: "travel", to: biome("forest") },
    ...getPiece(biome("forest"), "flash-rapier"),
    learnSecondWind(),

    maxOut("forest"),
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 2, farmAt: biome("forest") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 2 },
    { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 2 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 2 },
    { type: "milestone", id: "forest-maxed" },

    // ── Swamp: Cleanse, Arcane Wrappings, the charm, targeting fix -> +3 ─────
    { type: "travel", to: biome("swamp") },
    {
      type: "craftRune",
      recipeId: "rune-recipe-focus-lowest-hp",
      farmAt: biome("swamp"),
      label: "unlock focus-lowest-hp targeting",
    },
    { type: "configureRunes", rules: RUNES_TARGETING, label: "fix the target-spreading failure mode" },
    learnCleanse(),
    ...getPiece(biome("swamp"), "swamp-vest-t1"),
    ...getPiece(biome("swamp"), "swamp-charm-t1"),

    maxOut("swamp"),
    { type: "upgrade", definitionId: "swamp-vest-t1", toPlus: 3, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
    { type: "milestone", id: "swamp-maxed" },

    // ── Mountain: Brace, the plate -> +4 (now the 4th leg) ───────────────────
    { type: "travel", to: biome("mountain") },
    learnBrace(),
    ...getPiece(biome("mountain"), "mountain-vest-t1"),
    { type: "configureRunes", rules: RUNES_TARGETING, label: "arm the charged-attack Brace rune" },

    maxOut("mountain"),
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 4, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
    { type: "upgrade", definitionId: "swamp-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
    { type: "milestone", id: "mountain-maxed" },

    // ── Cave: the Chaotic Axe and Expose Weakness -> GM 30 ───────────────────
    { type: "travel", to: biome("cave") },
    {
      type: "equip",
      definitionIds: ["flash-rapier", "mountain-vest-t1", "swamp-charm-t1", "plains-boots-t1"],
      label: "standing kit: forest weapon, mountain plate, swamp charm",
    },
    { type: "farm", at: biome("cave"), until: { type: "recipeUnlocked", recipeId: "chaotic-axe" } },
    { type: "craft", recipeIds: ["chaotic-axe"], farmAt: biome("cave") },
    learnExposeWeakness(),

    {
      type: "upgrade",
      definitionId: "chaotic-axe",
      toPlus: 4,
      farmAt: biome("cave"),
      opportunistic: true,
    },
    { type: "equip", definitionIds: ["chaotic-axe"], label: "switch to the Chaotic Axe" },

    maxOut("cave"),
    { type: "milestone", id: "all-biomes-maxed" },

    { type: "upgrade", definitionId: "chaotic-axe", toPlus: 5, farmAt: biome("cave") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "swamp-vest-t1", toPlus: 5, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 5 },
    { type: "milestone", id: "gear-plus-5" },

    // ── The boss gauntlet ────────────────────────────────────────────────────
    ...bossFight({
      biomeGroup: "plains",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      armor: "plains-vest-t1",
      technique: "sweep",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "forest",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      armor: "plains-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "mountain",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "brace",
    }),
    ...bossFight({
      biomeGroup: "swamp",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      armor: "swamp-vest-t1",
      technique: "expose-weakness",
      guard: "cleanse",
    }),
    ...bossFight({
      biomeGroup: "cave",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "brace",
    }),
  ] satisfies RouteStep[],

  completion: standardCompletion(),
  milestones: standardMilestones(BOSS_KIT),
};
