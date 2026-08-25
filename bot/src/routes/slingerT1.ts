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
 * Diverges from the Striker spine in three deliberate ways (bot-route-
 * reference.md §8):
 *
 *  1. Final weapon is Poison Dagger (`ashbrand-blade`, Swamp), NOT Chaotic Axe
 *     -- this is the one class where the DPS packet's own +5 winner is not the
 *     axe. Forest's Flash Rapier is still the mid-route weapon.
 *  2. Shaded Bindings (`forest-vest-t1`) replaces Survivor's Robe as the
 *     Forest-onward armor hypothesis: Slinger already has evasion + range, so
 *     an evasion-armor specialization is coherent instead of generic plating.
 *     Fallen Knight Plate is still carried for the Brace-heavy boss fights.
 *  3. Charm arc is Granite Barrier (Mountain, transitional) -> Murk Eye
 *     (Swamp, final). Granite Barrier is deliberately NOT pushed past +1 --
 *     the brief warns against sinking essence into gear the route plans to
 *     replace immediately.
 *
 * Rune loadout: `orbit` REPLACES `chase-enemy` once Mountain L3 unlocks it
 * (brief: "this should replace chase-enemy, not conflict with it"), tested
 * head-to-head against chase-enemy in Experiment B. `tactical-reload` (this
 * class's own `reload` archetype maintenance rune, unlocked Forest L2) is
 * deliberately withheld from the baseline for the same reason as Squire's
 * `wait-for-execution`: every `configureRunes` step must fit the GM-0 Runic
 * Point floor (8 RP) the harness statically enforces, and
 * orbit(3) + fire-guard(3) + avoid-hazards(2) already spends all 8. Reload
 * maintenance is a real candidate for its own experiment, not this baseline.
 */

const RUNES_BASE: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "target-casting", actionId: "fire-guard" },
];

// Mountain L3 unlocks `orbit`; it replaces chase-enemy in the MOVEMENT channel.
const RUNES_ORBIT: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "orbit" },
  { conditionId: "target-casting", actionId: "fire-guard" },
];

const RUNES_FULL: EquippedRule[] = [
  ...RUNES_ORBIT,
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
  version: "1.0.0",
  classRoot: "reload-root",
  description:
    "Baseline for the Slinger: five-biome GM-30 spine to Poison Dagger at +5, Shaded Bindings as the evasion-armor specialization, Granite Barrier (transitional) -> Murk Eye charm arc, orbit kiting once unlocked.",

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

    // ── Mountain: Brace, Granite Barrier (transitional), orbit rune -> +3 ────
    { type: "travel", to: biome("mountain") },
    learnBrace(),
    ...getPiece(biome("mountain"), "mountain-charm-t1"),
    {
      type: "craftRune",
      recipeId: "rune-recipe-keep-distance",
      farmAt: biome("mountain"),
      label: "unlock orbit (Keep Distance)",
    },
    { type: "configureRunes", rules: RUNES_ORBIT, label: "kite with orbit; arm the Brace rune" },

    maxOut("mountain"),
    // Granite Barrier is transitional -- it is replaced by Murk Eye at Swamp,
    // so it is deliberately taken no further than +1.
    { type: "upgrade", definitionId: "mountain-charm-t1", toPlus: 1, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
    { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
    { type: "milestone", id: "mountain-maxed" },

    // ── Swamp: Cleanse, hazard pathing, Murk Eye replaces the barrier -> +4 ──
    { type: "travel", to: biome("swamp") },
    { type: "craftRune", recipeId: "rune-recipe-avoid-hazards", farmAt: biome("swamp") },
    { type: "configureRunes", rules: RUNES_FULL, label: "add hazard-aware pathing" },
    learnCleanse(),
    ...getPiece(biome("swamp"), "swamp-charm-t1"),

    maxOut("swamp"),
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 4, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
    { type: "milestone", id: "swamp-maxed" },

    // ── Cave: the Poison Dagger and Expose Weakness -> GM 30 ─────────────────
    { type: "travel", to: biome("cave") },
    {
      type: "equip",
      definitionIds: ["flash-rapier", "forest-vest-t1", "swamp-charm-t1", "plains-boots-t1"],
      label: "standing kit: forest weapon, forest armor, swamp charm",
    },
    learnExposeWeakness(),

    // The Poison Dagger's own recipe (`ashbrand-blade`) actually lives in
    // Swamp, not Cave -- it was already unlocked when Swamp was maxed. Bring
    // it up to +4 before the switch (a +0 dagger is a downgrade on a +4
    // rapier), then finish it out once GM 30 opens +5.
    ...getPiece(biome("swamp"), "ashbrand-blade"),
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
