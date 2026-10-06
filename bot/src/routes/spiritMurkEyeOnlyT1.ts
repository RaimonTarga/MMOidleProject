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
 * Experiment F (bot-route-reference.md §12), control arm, Spirit's twin of
 * `slinger-murkeyeonly-t1`: the Mountain-leg Granite Barrier detour removed
 * entirely -- Murk Eye, crafted at Swamp, is worn straight through Mountain
 * too. Single variable vs. `spirit-t1`: no `mountain-charm-t1` craft/upgrade/
 * revert at all. Compare damage-taken and deaths during the Mountain leg
 * specifically against the baseline's Granite-Barrier-then-revert arm.
 */

// `target-casting -> fire-guard` is NOT baked in here -- it only belongs in
// the loadout while Brace is the equipped Guard (see `reactiveGuardRune` in
// t1Common.ts). Every configureRunes call below appends it explicitly.
const RUNES_BASE: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
];

const RUNES_HAZARDS: EquippedRule[] = [
  ...RUNES_BASE,
  { conditionId: "always", actionId: "avoid-hazards" },
];

const RUNES_FULL: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "orbit" },
  { conditionId: "always", actionId: "avoid-hazards" },
];

const BOSS_KIT = [
  "chaotic-axe",
  "plains-vest-t1",
  "mountain-vest-t1",
  "swamp-charm-t1",
  "plains-boots-t1",
] as const;

export const SPIRIT_MURKEYEONLY_T1: Route = {
  id: "spirit-murkeyeonly-t1",
  version: "1.0.0",
  classRoot: "energy-root",
  description:
    "Experiment F, control arm: Spirit baseline with Murk Eye worn straight through Mountain instead of trying Granite Barrier there. Compare damage-taken and deaths during the Mountain leg against spirit-t1's Granite-Barrier-then-revert arm.",

  steps: [
    ...clearingOpening("energy-root", RUNES_BASE),

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

    // ── Swamp: Cleanse, hazard pathing, Murk Eye -> +3 (now the 3rd leg) ─────
    { type: "travel", to: biome("swamp") },
    { type: "craftRune", recipeId: "rune-recipe-avoid-hazards", farmAt: biome("swamp") },
    {
      type: "configureRunes",
      rules: [...RUNES_HAZARDS, ...reactiveGuardRune("cleanse")],
      label: "add hazard-aware pathing",
    },
    learnCleanse(),
    ...getPiece(biome("swamp"), "swamp-charm-t1"),

    maxOut("swamp"),
    { type: "milestone", id: "swamp-maxed" },

    // ── Mountain: Brace, orbit rune -- Murk Eye carried straight through -> +4
    { type: "travel", to: biome("mountain") },
    learnBrace(),
    ...getPiece(biome("mountain"), "mountain-vest-t1"),
    {
      type: "craftRune",
      recipeId: "rune-recipe-keep-distance",
      farmAt: biome("mountain"),
      label: "unlock orbit (Keep Distance)",
    },
    {
      type: "configureRunes",
      rules: [...RUNES_FULL, ...reactiveGuardRune("brace")],
      label: "kite with orbit; arm the Brace rune",
    },

    maxOut("mountain"),
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
