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
 * Overnight round, 2026-08-25 designer session: "Conduit tries different
 * things, I dunno what is good for it." Exploratory pick, not a confirmed
 * direction -- Granite Barrier (`mountain-charm-t1`) as the standing charm
 * from Mountain onward, same treatment as `spirit-v2-t1`. Reasoning: the
 * owner's own HP is what actually matters more now that tonight's summon-
 * rebuild buff (`shared/src/data/summoner.ts`) already cut the HP tax a
 * fallen slot costs to rebuild from 50% to 30% -- a barrier on the OWNER is
 * an untested extra layer on top of that, worth a data point even without a
 * strong hypothesis for why it should help. Flag if you had something else
 * in mind.
 *
 * Plus Second Wind replacing Brace for the Mountain and Cave bosses (see
 * `striker-v2-t1`'s header), and the universal `wait-for-regen` + `flee`
 * from the start. `orbit` is dropped from this round (Runic Point budget
 * only fits one of {orbit, survivability pair}, and tonight's priority is
 * survivability) -- the orbit-vs-chase question from `conduit-t1` is still
 * open, just not tested tonight. Weapon and armor otherwise unchanged from
 * `conduit-t1` (Chaotic Axe, generic Survivor's Robe -> Fallen Knight Plate). *
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
  "mountain-charm-t1",
  "plains-boots-t1",
] as const;

export const CONDUIT_V2_T1: Route = {
  id: "conduit-v2-t1",
  version: "1.0.0",
  classRoot: "summoner-root",
  description:
    "Overnight v2, exploratory: Conduit trying Granite Barrier as the standing charm from Mountain onward (untested direction, paired with tonight's summon-rebuild buff), Second Wind swapped in for Mountain/Cave bosses, plus wait-for-regen + flee from the start.",

  steps: [
    ...clearingOpening("summoner-root", RUNES),

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

    // ── Swamp: Cleanse -> +3 (3rd leg; Plains Stone still covers Recovery) ───
    { type: "travel", to: biome("swamp") },
    learnCleanse(),

    maxOut("swamp"),
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
    { type: "milestone", id: "swamp-maxed" },

    // ── Mountain: Brace, the plate, Granite Barrier becomes standing -> +4 ───
    { type: "travel", to: biome("mountain") },
    learnBrace(),
    ...getPiece(biome("mountain"), "mountain-vest-t1"),
    ...getPiece(biome("mountain"), "mountain-charm-t1"),

    maxOut("mountain"),
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 4, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "mountain-charm-t1", toPlus: 4, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
    { type: "milestone", id: "mountain-maxed" },

    // ── Cave: the Chaotic Axe and Expose Weakness -> GM 30 ───────────────────
    { type: "travel", to: biome("cave") },
    {
      type: "equip",
      definitionIds: ["flash-rapier", "mountain-vest-t1", "mountain-charm-t1", "plains-boots-t1"],
      label: "standing kit: forest weapon, mountain plate, Granite Barrier",
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
    { type: "upgrade", definitionId: "mountain-charm-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 5 },
    { type: "milestone", id: "gear-plus-5" },

    // ── The boss gauntlet: Second Wind on the two hardest hitters ────────────
    ...bossFight({
      biomeGroup: "plains",
      wornKit: ["chaotic-axe", "mountain-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "plains-vest-t1",
      technique: "sweep",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "forest",
      wornKit: ["chaotic-axe", "mountain-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "plains-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "mountain",
      wornKit: ["chaotic-axe", "mountain-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind", // was brace
    }),
    ...bossFight({
      biomeGroup: "swamp",
      wornKit: ["chaotic-axe", "mountain-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "cleanse",
    }),
    ...bossFight({
      biomeGroup: "cave",
      wornKit: ["chaotic-axe", "mountain-charm-t1", "plains-boots-t1"],
      baseRunes: RUNES,
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind", // was brace
    }),
  ] satisfies RouteStep[],

  completion: standardCompletion(),
  milestones: standardMilestones(BOSS_KIT),
};
