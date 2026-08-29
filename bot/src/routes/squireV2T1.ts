import type { EquippedRule } from "@mmo-idle/shared";
import type { Route, RouteStep } from "../route/types";
import {
  biome,
  bossFight,
  clearingOpening,
  getPiece,
  learnBrace,
  learnCleanse,
  learnSecondWind,
  learnSweep,
  maxOut,
  standardCompletion,
  standardMilestones,
} from "./t1Common";

/**
 * Overnight round, 2026-08-25 designer session. Three changes from
 * `squire-t1`, all explicitly requested:
 *
 *  1. Charm is Heartroot Amulet (`forest-charm-t1`, Recovery 3 + Recovery-
 *     skill potency) instead of Murk Eye -- the highest raw Recovery stat of
 *     any T1 charm, and it doubles down on two things Squire already has:
 *     `defense.recovery-active-pct` (10% of Recovery stays active even while
 *     fighting) and Second Wind itself being a Recovery-tagged skill the
 *     potency rider buffs directly. Crafted at Forest instead of visiting
 *     Swamp for a charm at all.
 *  2. Technique is Power Strike ("heavy strike", Mountain L5 -- a charge-up
 *     hit that breaks on hard control) instead of Sweep -> Expose Weakness.
 *     Learned partway through the Mountain farm once L5 opens, then used for
 *     every remaining leg and every boss. Expose Weakness is never learned.
 *  3. Second Wind replaces Brace for the Mountain and Cave bosses (see
 *     `striker-v2-t1`'s header for the full reasoning) -- Brace is still
 *     learned and used during ordinary Mountain-leg farming.
 *
 * Plus the universal overnight change: `wait-for-regen` + `flee` equipped
 * from the start (both are now starter fragments), `avoid-hazards` dropped
 * to fit the GM-0 Runic Point floor. *
 * ALWAYS CONDITION, 2026-08-29: see `apprentice-v2-t1`'s header --
 * `wait-for-regen` now pairs with `always` (holds whenever nothing is
 * attacking, not just once the combat timer lapses) and costs 1 RP, not 2.
 */

const RUNES: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  // target-casting -> fire-guard is intentionally NOT here -- see
  // strikerV2T1.ts's header comment; bossFight() appends it per-boss only
  // when Brace is the equipped Guard.
  { conditionId: "always", actionId: "wait-for-regen" },
  { conditionId: "hp-below-25", actionId: "flee" },
];

const BOSS_KIT = [
  "chaotic-axe",
  "plains-vest-t1",
  "mountain-vest-t1",
  "forest-charm-t1",
  "plains-boots-t1",
] as const;

export const SQUIRE_V2_T1: Route = {
  id: "squire-v2-t1",
  version: "1.0.0",
  classRoot: "cooldown-root",
  description:
    "Overnight v2: Squire with Heartroot Amulet (best raw Recovery, synergizes with Squire's own Recovery-active affinity and Second Wind), Power Strike replacing Sweep/Expose Weakness entirely, Second Wind swapped in for Mountain/Cave bosses, plus wait-for-regen + flee from the start.",

  steps: [
    ...clearingOpening("cooldown-root", RUNES),

    // ── Plains: the full set, Sweep (interim -- replaced at Mountain L5), +1 ─
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

    // ── Forest: the fast weapon, Heartroot Amulet, first Guard -> +2 ─────────
    { type: "travel", to: biome("forest") },
    ...getPiece(biome("forest"), "flash-rapier"),
    ...getPiece(biome("forest"), "forest-charm-t1"),
    learnSecondWind(),

    maxOut("forest"),
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 2, farmAt: biome("forest") },
    { type: "upgrade", definitionId: "forest-charm-t1", toPlus: 2, farmAt: biome("forest") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 2 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 2 },
    { type: "milestone", id: "forest-maxed" },

    // ── Swamp: Cleanse -> +3 (3rd leg; no swamp gear needed) ─────────────────
    { type: "travel", to: biome("swamp") },
    learnCleanse(),

    maxOut("swamp"),
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
    { type: "upgrade", definitionId: "forest-charm-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
    { type: "milestone", id: "swamp-maxed" },

    // ── Mountain: Brace (farming), Power Strike at L5, the plate -> +4 ───────
    { type: "travel", to: biome("mountain") },
    learnBrace(),
    ...getPiece(biome("mountain"), "mountain-vest-t1"),
    {
      type: "learnAbility",
      recipeId: "ability-recipe-power-strike",
      abilityId: "power-strike",
      slot: "technique",
      farmAt: biome("mountain"),
      label: "learn Power Strike (replaces Sweep for good -- Expose Weakness is never learned)",
    },

    maxOut("mountain"),
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 4, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
    { type: "upgrade", definitionId: "forest-charm-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
    { type: "milestone", id: "mountain-maxed" },

    // ── Cave: the Chaotic Axe -> GM 30 ────────────────────────────────────────
    { type: "travel", to: biome("cave") },
    {
      type: "equip",
      definitionIds: ["flash-rapier", "mountain-vest-t1", "forest-charm-t1", "plains-boots-t1"],
      label: "standing kit: forest weapon, mountain plate, Heartroot Amulet",
    },
    { type: "farm", at: biome("cave"), until: { type: "recipeUnlocked", recipeId: "chaotic-axe" } },
    { type: "craft", recipeIds: ["chaotic-axe"], farmAt: biome("cave") },

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
    { type: "upgrade", definitionId: "forest-charm-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 5 },
    { type: "milestone", id: "gear-plus-5" },

    // ── The boss gauntlet: Power Strike everywhere, Second Wind on the two
    //    hardest hitters ─────────────────────────────────────────────────────
    ...bossFight({
      biomeGroup: "plains",
      wornKit: ["chaotic-axe", "forest-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "plains-vest-t1",
      technique: "power-strike",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "forest",
      wornKit: ["chaotic-axe", "forest-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "plains-vest-t1",
      technique: "power-strike",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "mountain",
      wornKit: ["chaotic-axe", "forest-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "mountain-vest-t1",
      technique: "power-strike",
      guard: "second-wind", // was brace
    }),
    ...bossFight({
      biomeGroup: "swamp",
      wornKit: ["chaotic-axe", "forest-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "mountain-vest-t1",
      technique: "power-strike",
      guard: "cleanse",
    }),
    ...bossFight({
      biomeGroup: "cave",
      wornKit: ["chaotic-axe", "forest-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "mountain-vest-t1",
      technique: "power-strike",
      guard: "second-wind", // was brace
    }),
  ] satisfies RouteStep[],

  completion: standardCompletion(),
  milestones: standardMilestones(BOSS_KIT),
};
