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
 * Experiment D (bot-route-reference.md §12): the targeting-fix alternate arm.
 * Single variable vs. `apprentice-t1`: `let-dots-finish` (Swamp L3) replaces
 * `focus-lowest-hp` (Swamp L2) as the TARGETING answer to the observed
 * damage-spreading failure mode. `let-dots-finish` is the more mechanically
 * DoT-native fix (only leave a target once its DoT is guaranteed to finish
 * it, rather than always preferring the weakest enemy in the node), and --
 * worth noting -- it is also CHEAPER (condition+action cost 1+1=2 vs
 * focus-lowest-hp's 1+2=3), which leaves enough Runic Point budget to add
 * `avoid-hazards` too: chase-enemy(1) + let-dots-finish(2) + fire-guard(3) +
 * avoid-hazards(2) = 8, exactly the GM-0 floor. The baseline had to drop
 * hazard-pathing entirely to afford its targeting fix; this variant doesn't.
 */

// `target-casting -> fire-guard` is NOT baked in here -- it only belongs in
// the loadout while Brace is the equipped Guard (see `reactiveGuardRune` in
// t1Common.ts). Every configureRunes call below appends it explicitly.
const RUNES_BASE: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
];

// Swamp L3 unlocks `let-dots-finish` -- the alternate targeting fix. Cheaper
// than focus-lowest-hp, so avoid-hazards fits alongside it.
const RUNES_TARGETING: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "in-combat", actionId: "let-dots-finish" },
  { conditionId: "always", actionId: "avoid-hazards" },
];

const BOSS_KIT = [
  "chaotic-axe",
  "plains-vest-t1",
  "mountain-vest-t1",
  "swamp-vest-t1",
  "swamp-charm-t1",
  "plains-boots-t1",
] as const;

export const APPRENTICE_LETDOTSFINISH_T1: Route = {
  id: "apprentice-letdotsfinish-t1",
  version: "1.0.0",
  classRoot: "dot-root",
  description:
    "Experiment D, alternate arm: Apprentice baseline with let-dots-finish (Swamp L3) replacing focus-lowest-hp (Swamp L2) as the TARGETING fix -- cheaper, so avoid-hazards fits in the same loadout too. Compare target-switch rate, kills, and deaths against apprentice-t1.",

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

    // ── Swamp: Cleanse, Arcane Wrappings, the charm, the targeting fix -> +3 ─
    { type: "travel", to: biome("swamp") },
    {
      type: "craftRune",
      recipeId: "rune-recipe-let-dots-finish",
      farmAt: biome("swamp"),
      label: "unlock let-dots-finish targeting",
    },
    { type: "craftRune", recipeId: "rune-recipe-avoid-hazards", farmAt: biome("swamp") },
    {
      type: "configureRunes",
      rules: [...RUNES_TARGETING, ...reactiveGuardRune("cleanse")],
      label: "fix target-spreading; keep hazard pathing too",
    },
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
    {
      type: "configureRunes",
      rules: [...RUNES_TARGETING, ...reactiveGuardRune("brace")],
      label: "arm the charged-attack Brace rune",
    },

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
      baseRunes: RUNES_TARGETING,
      armor: "plains-vest-t1",
      technique: "sweep",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "forest",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_TARGETING,
      armor: "plains-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "mountain",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_TARGETING,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "brace",
    }),
    ...bossFight({
      biomeGroup: "swamp",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_TARGETING,
      armor: "swamp-vest-t1",
      technique: "expose-weakness",
      guard: "cleanse",
    }),
    ...bossFight({
      biomeGroup: "cave",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_TARGETING,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "brace",
    }),
  ] satisfies RouteStep[],

  completion: standardCompletion(),
  milestones: standardMilestones(BOSS_KIT),
};
