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
 * Tier 1 baseline route for the Slinger (reload root).
 *
 * Reordered per designer instruction: Plains -> Forest -> Swamp -> Mountain ->
 * Cave. This flips the ORIGINAL charm-arc reasoning (bot-route-reference.md
 * §8: "Granite Barrier during Mountain, transitional -> Murk Eye at Swamp,
 * final") because Swamp now comes BEFORE Mountain. Reinterpreted rather than
 * kept verbatim: Murk Eye (`swamp-charm-t1`) is crafted the moment Swamp
 * unlocks it and worn as the DEFAULT charm everywhere; Granite Barrier
 * (`mountain-charm-t1`) is crafted and worn ONLY during the Mountain leg,
 * since the brief's own reasoning for it ("a valid Mountain survival
 * hypothesis") is about answering MOUNTAIN's content specifically, not about
 * being an early-route placeholder. It reverts to Murk Eye once Mountain is
 * maxed, and is capped at +1 -- it is never the standing kit, so the brief's
 * warning against over-investing in gear the route plans to set aside still
 * applies.
 *
 * Two other deviations from Striker (unchanged by the reorder):
 *  1. Final weapon is Poison Dagger (`ashbrand-blade`, Swamp -- now crafted at
 *     the 3rd leg the moment its gate opens), NOT Chaotic Axe. Flash Rapier
 *     stays the active weapon through Swamp and Mountain; the switch happens
 *     at Cave, same as the original design intent.
 *  2. Shaded Bindings (`forest-vest-t1`) replaces Survivor's Robe as the
 *     Forest-onward armor hypothesis. Fallen Knight Plate is still carried
 *     for the Brace-heavy boss fights.
 *
 * Rune loadout: `orbit` REPLACES `chase-enemy` once Mountain L3 unlocks it
 * (now the 4th leg) -- tested head-to-head against chase-enemy in Experiment
 * B. `tactical-reload` (this class's own `reload` archetype maintenance rune,
 * unlocked Forest L2) stays out of the baseline for the same GM-0 Runic Point
 * reason as before: orbit(3) + fire-guard(3) + avoid-hazards(2) already
 * spends all 8.
 */

const RUNES_BASE: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "target-casting", actionId: "fire-guard" },
];

// Swamp L2 unlocks `avoid-hazards` (now the 3rd leg).
const RUNES_HAZARDS: EquippedRule[] = [
  ...RUNES_BASE,
  { conditionId: "always", actionId: "avoid-hazards" },
];

// Mountain L3 unlocks `orbit` (now the 4th leg); it replaces chase-enemy.
const RUNES_FULL: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "orbit" },
  { conditionId: "target-casting", actionId: "fire-guard" },
  { conditionId: "always", actionId: "avoid-hazards" },
];

const BOSS_KIT = [
  "ashbrand-blade",
  "forest-vest-t1",
  "mountain-vest-t1",
  "swamp-charm-t1",
  "plains-boots-t1",
] as const;

export const SLINGER_T1: Route = {
  id: "slinger-t1",
  version: "1.1.0",
  classRoot: "reload-root",
  description:
    "Baseline for the Slinger: five-biome GM-30 spine (Plains -> Forest -> Swamp -> Mountain -> Cave) to Poison Dagger at +5, Shaded Bindings as the evasion-armor specialization, Murk Eye as the default charm with Granite Barrier tried specifically during the Mountain leg, orbit kiting once unlocked.",

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
    { type: "configureRunes", rules: RUNES_HAZARDS, label: "add hazard-aware pathing" },
    learnCleanse(),
    ...getPiece(biome("swamp"), "swamp-charm-t1"),
    // Craft the final weapon the moment its gate opens, then go straight back
    // to the rapier -- a +0 dagger is a downgrade on an upgraded rapier, and
    // it is carried and upgraded passively until the Cave switch.
    ...getPiece(biome("swamp"), "ashbrand-blade"),
    { type: "equip", definitionIds: ["flash-rapier"], label: "keep the rapier active; the dagger levels up in reserve" },

    maxOut("swamp"),
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 3, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "ashbrand-blade", toPlus: 3, farmAt: biome("swamp"), opportunistic: true },
    { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
    { type: "milestone", id: "swamp-maxed" },

    // ── Mountain: Brace, orbit rune, Granite Barrier tried in-context -> +4 ──
    { type: "travel", to: biome("mountain") },
    learnBrace(),
    ...getPiece(biome("mountain"), "mountain-charm-t1"),
    {
      type: "craftRune",
      recipeId: "rune-recipe-keep-distance",
      farmAt: biome("mountain"),
      label: "unlock orbit (Keep Distance)",
    },
    { type: "configureRunes", rules: RUNES_FULL, label: "kite with orbit; arm the Brace rune" },

    maxOut("mountain"),
    // Granite Barrier is a content-specific experiment for this leg only --
    // never the standing kit, so it is taken no further than +1.
    { type: "upgrade", definitionId: "mountain-charm-t1", toPlus: 1, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "ashbrand-blade", toPlus: 4, farmAt: biome("swamp"), opportunistic: true },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
    { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
    { type: "milestone", id: "mountain-maxed" },
    // Revert to Murk Eye now that Mountain's own content is behind us.
    { type: "equip", definitionIds: ["swamp-charm-t1"], label: "revert to Murk Eye" },

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

    // Fallen Knight Plate is the Brace-boss swap, not a farmed piece -- craft
    // it fresh once GM 30 is banked so a Brace fight never wears Shaded
    // Bindings' evasion armor into a cast-heavy encounter.
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
      armor: "forest-vest-t1",
      technique: "sweep",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "forest",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      armor: "forest-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "mountain",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "brace",
    }),
    ...bossFight({
      biomeGroup: "swamp",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "cleanse",
    }),
    ...bossFight({
      biomeGroup: "cave",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "brace",
    }),
  ] satisfies RouteStep[],

  completion: standardCompletion(),
  milestones: standardMilestones(BOSS_KIT),
};
