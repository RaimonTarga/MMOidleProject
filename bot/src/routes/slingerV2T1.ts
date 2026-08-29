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
  maxOut,
  standardCompletion,
  standardMilestones,
} from "./t1Common";

/**
 * Overnight round, 2026-08-25 designer session. Four changes from
 * `slinger-t1` / `slinger-murkeyeonly-t1`, all explicitly requested:
 *
 *  1. Poison Dagger is committed to as soon as it's crafted at Swamp -- no
 *     more "keep the rapier active, dagger levels up in reserve" alternation.
 *     That dance is the likeliest cause of the "switches back to Flash
 *     Rapier sometimes" behavior observed tonight: simplest fix is to remove
 *     the alternation entirely rather than patch its edge cases blind.
 *  2. No Sweep at all -- Expose Weakness only, equipped once it's actually
 *     learned at Cave. No Technique is equipped before that.
 *  3. Shaded Bindings (`forest-vest-t1`) is worn for EVERY fight, including
 *     all five bosses -- no Fallen Knight Plate swap. Leans fully into the
 *     evasion-armor identity instead of splitting it with a Brace-plate pick.
 *  4. Murk Eye only (no Granite Barrier detour), same as
 *     `slinger-murkeyeonly-t1` -- carried forward as the better-performing
 *     arm from today's earlier A/B.
 *
 * Plus Second Wind replacing Brace for the Mountain and Cave bosses (see
 * `striker-v2-t1`'s header), and `wait-for-regen` from the start. Since
 * Slinger never wears Fallen Knight Plate here, Brace itself is still
 * learned (for ordinary Mountain-leg farming survivability) but never
 * appears in a boss loadout at all.
 *
 * ORBIT RESTORED, 2026-08-26: `orbit` was dropped from the first overnight
 * pass to fit `wait-for-regen` + `flee` in the RP budget, but that also
 * meant losing the orbit-vs-chase test this route existed to run (still
 * live in `slinger-t1`/`slinger-murkeyeonly-t1`, but not here). Restored by
 * dropping `flee` instead -- `wait-for-regen` is the stronger of the two
 * survivability runes on its own. `orbit` still needs Mountain L3
 * (`rune-recipe-keep-distance`) before it can be equipped, same as every
 * other orbit route -- RUNES_BASE covers the legs before that, RUNES_ORBIT
 * (auto-path 0 + orbit 3 + wait-for-regen 1 = 4, +3 when Brace fires
 * reactively = 7) covers Mountain onward and every boss.
 *
 * ALWAYS CONDITION, 2026-08-29: see `apprentice-v2-t1`'s header --
 * `wait-for-regen` now pairs with `always` (holds whenever nothing is
 * attacking, not just once the combat timer lapses) and costs 1 RP, not 2.
 */

const RUNES_BASE: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "always", actionId: "wait-for-regen" },
];

const RUNES_ORBIT: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "orbit" },
  { conditionId: "always", actionId: "wait-for-regen" },
];

const BOSS_KIT = [
  "ashbrand-blade",
  "forest-vest-t1",
  "swamp-charm-t1",
  "plains-boots-t1",
] as const;

export const SLINGER_V2_T1: Route = {
  id: "slinger-v2-t1",
  version: "1.0.0",
  classRoot: "reload-root",
  description:
    "Overnight v2: Slinger committing to Poison Dagger the moment it's crafted (no rapier alternation), Expose-Weakness-only technique, Shaded Bindings worn into every boss fight, Murk Eye only, Second Wind swapped in for Mountain/Cave bosses, plus wait-for-regen + flee from the start.",

  steps: [
    ...clearingOpening("reload-root", RUNES_BASE),

    // ── Plains: the full set, max it out -> +1 (no Sweep) ────────────────────
    { type: "travel", to: biome("plains") },
    ...getPiece(biome("plains"), "iron-broadsword"),
    ...getPiece(biome("plains"), "plains-vest-t1"),
    ...getPiece(biome("plains"), "plains-charm-t1"),
    ...getPiece(biome("plains"), "plains-boots-t1"),

    maxOut("plains"),
    { type: "upgrade", definitionId: "iron-broadsword", toPlus: 1, farmAt: biome("plains") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 1, farmAt: biome("plains") },
    { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 1, farmAt: biome("plains") },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 1, farmAt: biome("plains") },
    { type: "milestone", id: "plains-maxed" },

    // ── Forest: the interim weapon, Shaded Bindings, first Guard -> +2 ───────
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

    // ── Swamp: Cleanse, Murk Eye, commit to the Poison Dagger -> +3 ──────────
    { type: "travel", to: biome("swamp") },
    learnCleanse(),
    ...getPiece(biome("swamp"), "swamp-charm-t1"),
    ...getPiece(biome("swamp"), "ashbrand-blade"),

    maxOut("swamp"),
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 3, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "ashbrand-blade", toPlus: 3, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
    { type: "milestone", id: "swamp-maxed" },

    // ── Mountain: Brace (farming only), orbit rune -> +4 (4th leg) ───────────
    { type: "travel", to: biome("mountain") },
    learnBrace(),
    {
      type: "craftRune",
      recipeId: "rune-recipe-keep-distance",
      farmAt: biome("mountain"),
      label: "unlock orbit (Keep Distance)",
    },
    { type: "configureRunes", rules: RUNES_ORBIT, label: "kite with orbit" },

    maxOut("mountain"),
    { type: "upgrade", definitionId: "ashbrand-blade", toPlus: 4, farmAt: biome("swamp"), opportunistic: true },
    { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
    { type: "milestone", id: "mountain-maxed" },

    // ── Cave: Expose Weakness -> GM 30 ────────────────────────────────────────
    { type: "travel", to: biome("cave") },
    learnExposeWeakness(),

    maxOut("cave"),
    { type: "milestone", id: "all-biomes-maxed" },

    { type: "upgrade", definitionId: "ashbrand-blade", toPlus: 5, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 5 },
    { type: "milestone", id: "gear-plus-5" },

    // ── The boss gauntlet: Shaded Bindings everywhere, Second Wind on the two
    //    hardest hitters ─────────────────────────────────────────────────────
    ...bossFight({
      biomeGroup: "plains",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_ORBIT,
      armor: "forest-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "forest",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_ORBIT,
      armor: "forest-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "mountain",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_ORBIT,
      armor: "forest-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind", // was brace
    }),
    ...bossFight({
      biomeGroup: "swamp",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_ORBIT,
      armor: "forest-vest-t1",
      technique: "expose-weakness",
      guard: "cleanse",
    }),
    ...bossFight({
      biomeGroup: "cave",
      wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_ORBIT,
      armor: "forest-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind", // was brace
    }),
  ] satisfies RouteStep[],

  completion: standardCompletion(),
  milestones: standardMilestones(BOSS_KIT),
};
