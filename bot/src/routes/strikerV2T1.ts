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
 * Overnight round, 2026-08-25 designer session: "T1 is too deadly, bots are
 * dying too often -- the only difference a real human makes is waiting to
 * recover before pulling again, or running away when things are bad."
 *
 * Two universal changes now folded into every v2 route:
 *
 *  1. `wait-for-regen` (always) and `flee` (hp-below-25) are now STARTER
 *     rune fragments (`runeDatabase.ts`) -- no recipe needed, available from
 *     minute one. Every v2 route equips both from the very start.
 *  2. Second Wind replaces Brace for the Mountain and Cave bosses
 *     specifically -- the two hardest-hitting T1 bosses (Crag Behemoth
 *     atk56, Obsidian Broodmother atk47) -- to compare a healing-focused
 *     answer against a mitigation-focused one on the fights that hit hardest.
 *     Brace is still learned and still the active Guard during ordinary
 *     Mountain-leg farming; only the two boss loadouts change.
 *
 * Runic Point budget forced a trade: auto-path-enemy(0) + chase-enemy(1) +
 * fire-guard(3) + wait-for-regen(1) + flee(2) = 7, one under the GM-0 floor
 * of 8. `avoid-hazards` (2 RP) is still dropped -- the spare point does not
 * cover it -- so survivability keeps winning the trade-off per tonight's
 * explicit priority.
 *
 * ALWAYS CONDITION, 2026-08-29: `wait-for-regen` pairs with `always` rather
 * than `when-idle`. Out of Combat keys off the post-combat grace timer, so
 * the bot spent those seconds walking to the next pull at whatever HP the
 * last fight left it on; Always keys off actual engagement, so it holds the
 * moment nothing is attacking it. Costs 1 RP instead of 2, which is where
 * the spare point above comes from.
 *
 * Everything else (gear, biome order, ability schedule) is identical to
 * `striker-t1`.
 */

const RUNES: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  // target-casting -> fire-guard is intentionally NOT here -- it only belongs
  // in the loadout while Brace is equipped (t1Common.ts's `reactiveGuardRune`),
  // and `bossFight()` appends it automatically per-boss now. Baking it in
  // unconditionally here would suppress Second Wind's and Cleanse's own
  // built-in triggers (hp-below-60% / has-debuff) for the whole run.
  { conditionId: "always", actionId: "wait-for-regen" },
  { conditionId: "hp-below-25", actionId: "flee" },
];

const BOSS_KIT = [
  "chaotic-axe",
  "plains-vest-t1",
  "mountain-vest-t1",
  "swamp-charm-t1",
  "plains-boots-t1",
] as const;

export const STRIKER_V2_T1: Route = {
  id: "striker-v2-t1",
  version: "1.0.0",
  classRoot: "cadence-root",
  description:
    "Overnight v2: Striker baseline gear/schedule with wait-for-regen + flee equipped from the start, and Second Wind replacing Brace for the Mountain and Cave boss fights specifically.",

  steps: [
    ...clearingOpening("cadence-root", RUNES),

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

    // ── Swamp: Cleanse, the charm -> +3 (3rd leg) ─────────────────────────────
    { type: "travel", to: biome("swamp") },
    learnCleanse(),
    ...getPiece(biome("swamp"), "swamp-charm-t1"),

    maxOut("swamp"),
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 3, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
    { type: "milestone", id: "swamp-maxed" },

    // ── Mountain: Brace (farming only), the plate -> +4 (4th leg) ────────────
    { type: "travel", to: biome("mountain") },
    learnBrace(),
    ...getPiece(biome("mountain"), "mountain-vest-t1"),

    maxOut("mountain"),
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 4, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 4 },
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
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 5 },
    { type: "milestone", id: "gear-plus-5" },

    // ── The boss gauntlet: Second Wind on the two hardest hitters ────────────
    ...bossFight({
      biomeGroup: "plains",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "plains-vest-t1",
      technique: "sweep",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "forest",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "plains-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "mountain",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind", // was brace
    }),
    ...bossFight({
      biomeGroup: "swamp",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "cleanse",
    }),
    ...bossFight({
      biomeGroup: "cave",
      wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind", // was brace
    }),
  ] satisfies RouteStep[],

  completion: standardCompletion(),
  milestones: standardMilestones(BOSS_KIT),
};
