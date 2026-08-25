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
 * Tier 1 baseline route for the Spirit (energy root).
 *
 * Same biome spine and ability rhythm as Striker/Squire, Chaotic Axe final
 * weapon (bot-route-reference.md §9 -- the +5 model favors it here too, and
 * Flash Rapier's cadence is only the transitional hypothesis, not the final
 * pick). Spirit's own defensive identity -- almost no natural bulk, but an
 * innate 30%-max-HP rechargeable barrier -- gets the same Granite Barrier
 * (Mountain, transitional) -> Murk Eye (Swamp, final) charm arc as Slinger,
 * since a barrier charm doubles down on the class's own mechanic while it is
 * cheap to try. Armor stays generic (Survivor's Robe -> Fallen Knight Plate)
 * rather than picking a class-specific piece -- the brief explicitly warns
 * against replacing every defensive slot with one universal loadout, and
 * Spirit has no armor analogue to Slinger's evasion synergy.
 *
 * Rune loadout: `orbit` once Mountain L3 unlocks it (fits the low-bulk,
 * barrier-reliant identity -- more distance is more time for the barrier to
 * matter before a hit lands), `target-casting -> fire-guard`, and
 * `avoid-hazards` once Swamp L2 unlocks it. Total 8 RP, exactly the GM-0
 * floor the harness enforces on every `configureRunes` step.
 */

const RUNES_BASE: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "target-casting", actionId: "fire-guard" },
];

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
  "chaotic-axe",
  "plains-vest-t1",
  "mountain-vest-t1",
  "swamp-charm-t1",
  "plains-boots-t1",
] as const;

export const SPIRIT_T1: Route = {
  id: "spirit-t1",
  version: "1.0.0",
  classRoot: "energy-root",
  description:
    "Baseline for the Spirit: five-biome GM-30 spine to Chaotic Axe at +5, generic Survivor's Robe -> Fallen Knight Plate armor, Granite Barrier (transitional) -> Murk Eye charm arc doubling down on the innate barrier, orbit kiting once unlocked.",

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

    // ── Mountain: Brace, Granite Barrier (transitional), orbit rune -> +3 ────
    { type: "travel", to: biome("mountain") },
    learnBrace(),
    ...getPiece(biome("mountain"), "mountain-charm-t1"),
    ...getPiece(biome("mountain"), "mountain-vest-t1"),
    {
      type: "craftRune",
      recipeId: "rune-recipe-keep-distance",
      farmAt: biome("mountain"),
      label: "unlock orbit (Keep Distance)",
    },
    { type: "configureRunes", rules: RUNES_ORBIT, label: "kite with orbit; arm the Brace rune" },

    maxOut("mountain"),
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 3, farmAt: biome("mountain") },
    // Granite Barrier is transitional -- it is replaced by Murk Eye at Swamp,
    // so it is deliberately taken no further than +1.
    { type: "upgrade", definitionId: "mountain-charm-t1", toPlus: 1 },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 3 },
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
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
    { type: "milestone", id: "swamp-maxed" },

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
      armor: "mountain-vest-t1",
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
