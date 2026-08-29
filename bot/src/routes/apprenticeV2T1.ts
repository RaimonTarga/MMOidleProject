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
 * Overnight round, 2026-08-25 designer session: "Apprentice should try using
 * the heavy hammer since it's the second best weapon for it." Heavy Hammer
 * (`heavy-hammer`, Mountain) is crafted and equipped at the Mountain leg and
 * KEPT as the final weapon through Cave and every boss -- unlike
 * `squire-heavyhammer-t1`'s transitional treatment, this route never
 * switches to Chaotic Axe at all. Same "no Sweep" treatment as
 * `slinger-v2-t1`: Expose Weakness only, equipped once learned at Cave.
 *
 * Plus Second Wind replacing Brace for the Mountain and Cave bosses (see
 * `striker-v2-t1`'s header), and `wait-for-regen` from the start. The
 * targeting fix from `apprentice-letdotsfinish-t1` / `apprentice-t1` is
 * dropped here -- Runic Point budget only fits one of {targeting fix,
 * survivability + orbit}. Arcane Wrappings (Swamp) and Murk Eye are
 * unchanged from `apprentice-t1`.
 *
 * ORBIT ADDED, 2026-08-26: NEW hypothesis for this class, not a restoration
 * -- Apprentice has never used orbit before. Unlike Slinger (120 range) or
 * Spirit (130), Apprentice's attack range is 60, much closer to melee, so
 * kiting risks pulling it out of its own attack range instead of helping
 * survivability. Worth a data point given tonight's ask, but flagged here as
 * genuinely untested rather than a known-good pick. Needs Mountain L3
 * (`rune-recipe-keep-distance`): RUNES_BASE covers the legs before that,
 * RUNES_ORBIT (auto-path 0 + orbit 3 + wait-for-regen 1 = 4, +3 when Brace
 * fires reactively = 7) covers Mountain onward and every boss. `flee` is
 * dropped to afford it, same trade-off as `slinger-v2-t1`/`spirit-v2-t1`.
 *
 * ALWAYS CONDITION, 2026-08-29: `wait-for-regen` is now paired with `always`
 * instead of `when-idle`. Out of Combat keys off the post-combat grace timer,
 * so the bot spent those seconds walking to the next pull at whatever HP the
 * last fight left it on; Always keys off actual engagement, so it holds the
 * moment nothing is attacking it. Also 1 RP cheaper (Always costs 0), leaving
 * a spare point in every loadout below.
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
  "heavy-hammer",
  "plains-vest-t1",
  "mountain-vest-t1",
  "swamp-vest-t1",
  "swamp-charm-t1",
  "plains-boots-t1",
] as const;

export const APPRENTICE_V2_T1: Route = {
  id: "apprentice-v2-t1",
  version: "1.0.0",
  classRoot: "dot-root",
  description:
    "Overnight v2: Apprentice keeping Heavy Hammer as the FINAL weapon (never switching to Chaotic Axe), Expose-Weakness-only technique, Second Wind swapped in for Mountain/Cave bosses, plus wait-for-regen + flee from the start.",

  steps: [
    ...clearingOpening("dot-root", RUNES_BASE),

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

    // ── Forest: the interim weapon and the first real Guard -> +2 ───────────
    { type: "travel", to: biome("forest") },
    ...getPiece(biome("forest"), "flash-rapier"),
    learnSecondWind(),

    maxOut("forest"),
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 2, farmAt: biome("forest") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 2 },
    { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 2 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 2 },
    { type: "milestone", id: "forest-maxed" },

    // ── Swamp: Cleanse, Arcane Wrappings, the charm -> +3 ─────────────────────
    { type: "travel", to: biome("swamp") },
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

    // ── Mountain: Brace, the plate, commit to the Heavy Hammer -> +4 ────────
    { type: "travel", to: biome("mountain") },
    learnBrace(),
    ...getPiece(biome("mountain"), "mountain-vest-t1"),
    ...getPiece(biome("mountain"), "heavy-hammer"),
    {
      type: "craftRune",
      recipeId: "rune-recipe-keep-distance",
      farmAt: biome("mountain"),
      label: "unlock orbit (Keep Distance)",
    },
    { type: "configureRunes", rules: RUNES_ORBIT, label: "kite with orbit (new hypothesis for this class)" },

    maxOut("mountain"),
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 4, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "heavy-hammer", toPlus: 4, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "swamp-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
    { type: "milestone", id: "mountain-maxed" },

    // ── Cave: Expose Weakness -> GM 30 (Heavy Hammer stays equipped) ─────────
    { type: "travel", to: biome("cave") },
    {
      type: "equip",
      definitionIds: ["heavy-hammer", "mountain-vest-t1", "swamp-charm-t1", "plains-boots-t1"],
      label: "standing kit: heavy hammer, mountain plate, swamp charm",
    },
    learnExposeWeakness(),

    maxOut("cave"),
    { type: "milestone", id: "all-biomes-maxed" },

    { type: "upgrade", definitionId: "heavy-hammer", toPlus: 5, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "swamp-vest-t1", toPlus: 5, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 5 },
    { type: "milestone", id: "gear-plus-5" },

    // ── The boss gauntlet: Heavy Hammer everywhere, Second Wind on the two
    //    hardest hitters ─────────────────────────────────────────────────────
    ...bossFight({
      biomeGroup: "plains",
      wornKit: ["heavy-hammer", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_ORBIT,
      armor: "plains-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "forest",
      wornKit: ["heavy-hammer", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_ORBIT,
      armor: "plains-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "mountain",
      wornKit: ["heavy-hammer", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_ORBIT,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind", // was brace
    }),
    ...bossFight({
      biomeGroup: "swamp",
      wornKit: ["heavy-hammer", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_ORBIT,
      armor: "swamp-vest-t1",
      technique: "expose-weakness",
      guard: "cleanse",
    }),
    ...bossFight({
      biomeGroup: "cave",
      wornKit: ["heavy-hammer", "swamp-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES_ORBIT,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind", // was brace
    }),
  ] satisfies RouteStep[],

  completion: standardCompletion(),
  milestones: standardMilestones(BOSS_KIT),
};
