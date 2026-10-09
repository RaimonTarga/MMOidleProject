import type { EquippedRule } from "@mmo-idle/shared";
import type { Route, RouteStep } from "../route/types";
import {
  biome,
  bossFight,
  clearingOpening,
  getPiece,
  learnBrace,
  learnCleanse,
  learnSlam,
  learnSecondWind,
  learnSweep,
  maxOut,
  reactiveGuardRune,
  standardCompletion,
  standardMilestones,
} from "./t1Common";

/**
 * Experiment A (bot-route-reference.md §12): does Heavy Hammer's empowered-hit
 * spec pay for its slow cadence during the Mountain leg, compared to the
 * `squire-t1` baseline which keeps Flash Rapier all the way through?
 *
 * Single variable, everything else identical to `squire-t1`: Heavy Hammer
 * (`heavy-hammer`, Mountain L1) replaces Flash Rapier as the ACTIVE weapon for
 * the Mountain leg only -- crafted and upgraded to +4 in its place, carried
 * into Cave, then abandoned for Chaotic Axe exactly like Flash Rapier is in
 * the baseline (neither transitional weapon is pushed to +5). Forest still
 * gets Flash Rapier normally per the shared baseline spine; only what's
 * ACTIVE during Mountain changes.
 */

// `target-casting -> fire-guard` is NOT baked in here -- it only belongs in
// the loadout while Brace is the equipped Guard (see `reactiveGuardRune` in
// t1Common.ts). Every configureRunes call below appends it explicitly.
const RUNES_BASE: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
];

const RUNES_FULL: EquippedRule[] = [
  ...RUNES_BASE,
  { conditionId: "always", actionId: "avoid-hazards" },
];

const BOSS_KIT = [
  "chaotic-axe",
  "plains-vest-t1",
  "mountain-vest-t1",
  "swamp-charm-t1",
  "plains-boots-t1",
] as const;

export const SQUIRE_HEAVYHAMMER_T1: Route = {
  id: "squire-heavyhammer-t1",
  version: "1.0.0",
  classRoot: "cooldown-root",
  description:
    "Experiment A: Squire baseline with Heavy Hammer replacing Flash Rapier as the active Mountain-leg weapon, still ending on Chaotic Axe. Isolates whether the empowered-hit spec is worth its crafting/upgrade cost before being replaced.",

  steps: [
    ...clearingOpening("cooldown-root", RUNES_BASE),

    // ── Plains: the full set, Sweep, then max it out -> +1 ───────────────────
    { type: "travel", to: biome("plains") },
    ...getPiece(biome("plains"), "iron-broadsword"),
    ...getPiece(biome("plains"), "plains-vest-t1"),
    ...getPiece(biome("plains"), "plains-charm-t1"),
    ...getPiece(biome("plains"), "plains-boots-t1"),
    learnSweep(),

    maxOut("plains"),
    { type: "milestone", id: "plains-maxed" },

    // ── Forest: the fast weapon and the first real Guard -> +2 ───────────────
    { type: "travel", to: biome("forest") },
    ...getPiece(biome("forest"), "flash-rapier"),
    learnSecondWind(),

    maxOut("forest"),
    { type: "milestone", id: "forest-maxed" },

    // ── Swamp: Cleanse, hazard pathing, the charm -> +3 (now the 3rd leg) ────
    { type: "travel", to: biome("swamp") },
    { type: "craftRune", recipeId: "rune-recipe-avoid-hazards", farmAt: biome("swamp") },
    {
      type: "configureRunes",
      rules: [...RUNES_FULL, ...reactiveGuardRune("cleanse")],
      label: "add hazard-aware pathing",
    },
    learnCleanse(),
    ...getPiece(biome("swamp"), "swamp-charm-t1"),

    maxOut("swamp"),
    { type: "milestone", id: "swamp-maxed" },

    // ── Mountain: Brace, the plate, HEAVY HAMMER replaces the rapier -> +4 ───
    { type: "travel", to: biome("mountain") },
    learnBrace(),
    ...getPiece(biome("mountain"), "mountain-vest-t1"),
    ...getPiece(biome("mountain"), "heavy-hammer"),
    {
      type: "configureRunes",
      rules: [...RUNES_FULL, ...reactiveGuardRune("brace")],
      label: "arm the charged-attack Brace rune",
    },

    maxOut("mountain"),
    { type: "milestone", id: "mountain-maxed" },

    // ── Cave: the Chaotic Axe (abandoning the hammer) and Expose Weakness ────
    { type: "travel", to: biome("cave") },
    {
      type: "equip",
      definitionIds: ["heavy-hammer", "mountain-vest-t1", "swamp-charm-t1", "plains-boots-t1"],
      label: "standing kit: heavy hammer, mountain plate, swamp charm",
    },
    { type: "farm", at: biome("cave"), until: { type: "recipeUnlocked", recipeId: "chaotic-axe" } },
    { type: "craft", recipeIds: ["chaotic-axe"], farmAt: biome("cave") },
    learnSlam(),

    { type: "equip", definitionIds: ["chaotic-axe"], label: "switch to the Chaotic Axe" },

    maxOut("cave"),
    { type: "milestone", id: "all-biomes-maxed" },

    { type: "milestone", id: "gear-plus-5" },

    // ── The boss gauntlet ────────────────────────────────────────────────────
    ...bossFight({
      biomeGroup: "plains",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_FULL,
      armor: "plains-vest-t1",
      technique: "sweep",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "forest",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_FULL,
      armor: "plains-vest-t1",
      technique: "slam",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "mountain",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_FULL,
      armor: "mountain-vest-t1",
      technique: "slam",
      guard: "brace",
    }),
    ...bossFight({
      biomeGroup: "swamp",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_FULL,
      armor: "mountain-vest-t1",
      technique: "slam",
      guard: "cleanse",
    }),
    ...bossFight({
      biomeGroup: "cave",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_FULL,
      armor: "mountain-vest-t1",
      technique: "slam",
      guard: "brace",
    }),
  ] satisfies RouteStep[],

  completion: standardCompletion(),
  milestones: standardMilestones(BOSS_KIT),
};
