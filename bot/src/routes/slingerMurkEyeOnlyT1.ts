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
  reactiveGuardRune,
  standardCompletion,
  standardMilestones,
} from "./t1Common";

/**
 * Experiment F (bot-route-reference.md §12), control arm: Slinger baseline
 * with the Mountain-leg Granite Barrier detour removed entirely -- Murk Eye,
 * crafted at Swamp, is simply worn straight through Mountain too. Single
 * variable vs. `slinger-t1`: no `mountain-charm-t1` craft/upgrade/revert at
 * all. Everything else (weapon path, armor, runes, boss loadouts) identical.
 * Compare damage-taken and deaths during the Mountain leg specifically
 * against the baseline's Granite-Barrier-then-revert arm.
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
  "ashbrand-blade",
  "forest-vest-t1",
  "mountain-vest-t1",
  "swamp-charm-t1",
  "plains-boots-t1",
] as const;

export const SLINGER_MURKEYEONLY_T1: Route = {
  id: "slinger-murkeyeonly-t1",
  version: "1.0.0",
  classRoot: "reload-root",
  description:
    "Experiment F, control arm: Slinger baseline with Murk Eye worn straight through Mountain instead of trying Granite Barrier there. Compare damage-taken and deaths during the Mountain leg against slinger-t1's Granite-Barrier-then-revert arm.",

  steps: [
    ...clearingOpening("reload-root", RUNES_BASE),

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

    // ── Forest: the fast weapon, Shaded Bindings, first Guard -> +2 ──────────
    { type: "travel", to: biome("forest") },
    ...getPiece(biome("forest"), "flash-rapier"),
    ...getPiece(biome("forest"), "forest-vest-t1"),
    learnSecondWind(),

    maxOut("forest"),
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 2, farmAt: biome("forest") },
    { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 2, farmAt: biome("forest") },
    { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 2 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 2 },
    { type: "milestone", id: "forest-maxed" },

    // ── Swamp: Cleanse, hazard pathing, Murk Eye, the dagger -> +3 ───────────
    { type: "travel", to: biome("swamp") },
    { type: "craftRune", recipeId: "rune-recipe-avoid-hazards", farmAt: biome("swamp") },
    {
      type: "configureRunes",
      rules: [...RUNES_HAZARDS, ...reactiveGuardRune("cleanse")],
      label: "add hazard-aware pathing",
    },
    learnCleanse(),
    ...getPiece(biome("swamp"), "swamp-charm-t1"),
    ...getPiece(biome("swamp"), "ashbrand-blade"),
    { type: "equip", definitionIds: ["flash-rapier"], label: "keep the rapier active; the dagger levels up in reserve" },

    maxOut("swamp"),
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 3, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "ashbrand-blade", toPlus: 3, farmAt: biome("swamp"), opportunistic: true },
    { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
    { type: "milestone", id: "swamp-maxed" },

    // ── Mountain: Brace, orbit rune -- Murk Eye carried straight through -> +4
    { type: "travel", to: biome("mountain") },
    learnBrace(),
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
    { type: "upgrade", definitionId: "ashbrand-blade", toPlus: 4, farmAt: biome("swamp"), opportunistic: true },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
    { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
    { type: "milestone", id: "mountain-maxed" },

    // ── Cave: the Poison Dagger and Expose Weakness -> GM 30 ─────────────────
    { type: "travel", to: biome("cave") },
    {
      type: "equip",
      definitionIds: ["flash-rapier", "forest-vest-t1", "swamp-charm-t1", "plains-boots-t1"],
      label: "standing kit: forest weapon, forest armor, swamp charm",
    },
    learnExposeWeakness(),

    {
      type: "upgrade",
      definitionId: "ashbrand-blade",
      toPlus: 4,
      farmAt: biome("swamp"),
      opportunistic: true,
    },
    { type: "equip", definitionIds: ["ashbrand-blade"], label: "switch to the Poison Dagger" },

    maxOut("cave"),
    { type: "milestone", id: "all-biomes-maxed" },

    ...getPiece(biome("mountain"), "mountain-vest-t1"),

    { type: "upgrade", definitionId: "ashbrand-blade", toPlus: 5, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 5, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 5 },
    { type: "milestone", id: "gear-plus-5" },

    // ── The boss gauntlet ────────────────────────────────────────────────────
    ...bossFight({
      biomeGroup: "plains",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_FULL,
      armor: "forest-vest-t1",
      technique: "sweep",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "forest",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_FULL,
      armor: "forest-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "mountain",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_FULL,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "brace",
    }),
    ...bossFight({
      biomeGroup: "swamp",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_FULL,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "cleanse",
    }),
    ...bossFight({
      biomeGroup: "cave",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_FULL,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "brace",
    }),
  ] satisfies RouteStep[],

  completion: standardCompletion(),
  milestones: standardMilestones(BOSS_KIT),
};
