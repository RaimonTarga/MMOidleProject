import { CLEARING_NODE_ID, type EquippedRule } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";

/**
 * Tier 1 baseline route for the Striker (cadence root).
 *
 * ORIGINALLY authored by the designer, 2026-08-25, with a Plains -> Forest ->
 * Mountain -> Swamp -> Cave spine. REORDERED same day, designer instruction:
 * swap Mountain and Swamp so the spine reads Plains -> Forest -> Swamp ->
 * Mountain -> Cave. Cleanse is now learned at Swamp L3 (3rd leg, replacing
 * Second Wind) and Brace at Mountain L3 (4th leg, replacing Cleanse) --
 * exactly the mirror of the original schedule. See `t1Common.ts`'s header for
 * the shared-spine rationale that now applies uniformly across all six roots.
 *
 * ── The spine ────────────────────────────────────────────────────────────────
 * Gear through ALL FIVE T1 biomes first, then fight all five bosses at +5.
 *
 * That ordering is forced by the game's own maths rather than taste: item
 * upgrade levels are gated on Global Mastery at 6 / 12 / 18 / 24 / 30, GM is the
 * sum of biome levels across every biome (Clearing excluded), and each T1 biome
 * caps at level 6 while the player is tier 1. So maxing one more biome buys
 * exactly one more upgrade level, and `+5` is only reachable once all five are
 * maxed — which is also the power band the T1 bosses are tuned for.
 *
 *   Clearing  full tutorial set, tier 0 -> 1, pick Striker
 *   Plains    whole set + Sweep,                max out -> +1
 *   Forest    weapon + Second Wind,              max out -> +2
 *   Swamp     charm + Cleanse + hazards rune,     max out -> +3
 *   Mountain  armor + Brace (replaces Cleanse),   max out -> +4
 *   Cave      Chaotic Axe + Expose Weakness,      max out -> GM 30, everything -> +5
 *   Bosses    Plains, Forest, Mountain, Swamp, Cave — loadout swapped per fight
 *
 * ── Standing kit going into the bosses ───────────────────────────────────────
 *   weapon    chaotic-axe          (Cave; carried by every boss fight)
 *   armor     plains-vest-t1       for Plains + Forest   (plating 7)
 *             mountain-vest-t1     for Mountain, Swamp, Cave (guard potency 15%)
 *   charm     swamp-charm-t1       (Recovery pulse)
 *   boots     plains-boots-t1      (kill-speed; cheapest slot, so upgraded too)
 *
 * Tier 1 grants ONE Technique and ONE Guard slot, so every ability change below
 * is a REPLACEMENT, not an addition.
 */

const CLEARING = { kind: "node", nodeId: CLEARING_NODE_ID } as const;

/** A T1 biome's normal nodes. */
function biome(biomeGroup: string) {
  return { kind: "biome", biomeGroup, tier: 1, pick: "uncleared" } as const;
}

/** The level cap for any T1 biome while the character is player tier 1. */
const BIOME_MAX = 6;

function maxOut(biomeGroup: string): RouteStep {
  return {
    type: "farm",
    at: biome(biomeGroup),
    until: { type: "biomeLevelAtLeast", biomeGroup, level: BIOME_MAX },
    label: `max out ${biomeGroup} (level ${BIOME_MAX})`,
  };
}

/**
 * Craft one piece the moment its recipe gate opens, then wear it.
 *
 * Takes a NodeRef rather than a biome name because the Clearing is NOT a
 * `normal` node at tier 1 — it is `kind: "tutorial"`, `biomeTier: 0`, so a
 * `{ kind: "biome", biomeGroup: "clearing", tier: 1 }` ref resolves to nothing.
 */
function getPiece(at: NodeRef, recipeId: string): RouteStep[] {
  return [
    { type: "farm", at, until: { type: "recipeUnlocked", recipeId } },
    { type: "craft", recipeIds: [recipeId], farmAt: at },
    { type: "equip", definitionIds: [recipeId] },
  ];
}

/**
 * Base rune rules. `target-casting -> fire-guard` is legal from minute one
 * (both fragments ship in `STARTER_RUNE_IDS`) but is INERT until a Guard has
 * been learned — which now happens at Swamp (Cleanse), not Mountain.
 */
const RUNES_BASE: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  // Answer a telegraphed cast-time attack with the equipped Guard. This is the
  // only "react to the boss" behavior in the run, and the game supplies it.
  { conditionId: "target-casting", actionId: "fire-guard" },
];

/**
 * Adds hazard-aware pathing, unlocked by a Swamp rune recipe (level 2, 90
 * purple) — now the 3rd leg. Total 6 RP against a starting budget of 8, so it
 * always fits, and stays active through Mountain and Cave too.
 */
const RUNES_FULL: EquippedRule[] = [
  ...RUNES_BASE,
  { conditionId: "always", actionId: "avoid-hazards" },
];

/** Everything worn into the boss gauntlet, taken to +5 once GM hits 30. */
const BOSS_KIT = [
  "chaotic-axe",
  "plains-vest-t1",
  "mountain-vest-t1",
  "swamp-charm-t1",
  "plains-boots-t1",
] as const;

/** One boss fight: set the armor and the ability pair, then go. */
function bossFight(opts: {
  biomeGroup: string;
  armor: string;
  technique: string;
  guard: string;
}): RouteStep[] {
  return [
    { type: "equip", definitionIds: ["chaotic-axe", opts.armor, "swamp-charm-t1", "plains-boots-t1"] },
    { type: "setAbilities", techniques: [opts.technique], guards: [opts.guard] },
    { type: "attemptBoss", biomeGroup: opts.biomeGroup, tier: 1, maxAttempts: 6 },
    { type: "milestone", id: `${opts.biomeGroup}-boss-cleared` },
  ];
}

export const STRIKER_T1: Route = {
  id: "striker-t1",
  version: "2.1.0",
  classRoot: "cadence-root",
  description:
    "Designer baseline for the Striker: gear through all five T1 biomes (Plains -> Forest -> Swamp -> Mountain -> Cave) to Global Mastery 30, take every piece to +5, then clear all five T1 dungeon bosses with a per-boss loadout.",

  steps: [
    // ── Clearing: tier 0 -> 1, then the whole tutorial set ───────────────────
    { type: "travel", to: CLEARING },

    // Nothing in T1 works before this: `biomeLevelCap(playerTier 0, <T1 biome>)`
    // is ZERO, so a tier-0 character cannot bank a single level in Plains.
    {
      type: "farm",
      at: CLEARING,
      until: { type: "playerTierAtLeast", tier: 1 },
      label: "clear the tier-0 quest (10 Tiny Wisps)",
    },
    { type: "milestone", id: "tier-0-quest" },

    { type: "chooseClass", skillId: "cadence-root" },
    { type: "configureRunes", rules: RUNES_BASE },

    ...getPiece(CLEARING, "primordial-club"),
    ...getPiece(CLEARING, "clearing-vest-t1"),
    ...getPiece(CLEARING, "clearing-charm-t1"),
    ...getPiece(CLEARING, "clearing-boots-t1"),
    { type: "milestone", id: "clearing-set-complete" },

    // ── Plains: the full set, Sweep, then max it out -> +1 ───────────────────
    { type: "travel", to: biome("plains") },
    ...getPiece(biome("plains"), "iron-broadsword"),
    ...getPiece(biome("plains"), "plains-vest-t1"),
    ...getPiece(biome("plains"), "plains-charm-t1"),
    ...getPiece(biome("plains"), "plains-boots-t1"),

    // Set-and-forget Technique for the rest of the run, until Expose Weakness
    // replaces it in the Cave.
    {
      type: "learnAbility",
      recipeId: "ability-recipe-sweep",
      abilityId: "sweep",
      slot: "technique",
      farmAt: biome("plains"),
    },

    maxOut("plains"),
    { type: "upgrade", definitionId: "iron-broadsword", toPlus: 1, farmAt: biome("plains") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 1, farmAt: biome("plains") },
    { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 1, farmAt: biome("plains") },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 1, farmAt: biome("plains") },
    { type: "milestone", id: "plains-maxed" },

    // ── Forest: the fast weapon and the first real Guard -> +2 ───────────────
    { type: "travel", to: biome("forest") },
    ...getPiece(biome("forest"), "flash-rapier"),
    {
      type: "learnAbility",
      recipeId: "ability-recipe-second-wind",
      abilityId: "second-wind",
      slot: "guard",
      farmAt: biome("forest"),
    },

    maxOut("forest"),
    // Plains pieces upgrade against Plains essence, so these steps walk back and
    // farm Plains on their own when the yellow wallet is short.
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 2, farmAt: biome("forest") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 2 },
    { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 2 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 2 },
    { type: "milestone", id: "forest-maxed" },

    // ── Swamp: Cleanse, hazard pathing, the charm -> +3 (now the 3rd leg) ────
    { type: "travel", to: biome("swamp") },
    { type: "craftRune", recipeId: "rune-recipe-avoid-hazards", farmAt: biome("swamp") },
    { type: "configureRunes", rules: RUNES_FULL, label: "add hazard-aware pathing" },
    {
      type: "learnAbility",
      recipeId: "ability-recipe-cleanse",
      abilityId: "cleanse",
      slot: "guard",
      farmAt: biome("swamp"),
      label: "learn Cleanse (replaces Second Wind in the single Guard slot)",
    },
    ...getPiece(biome("swamp"), "swamp-charm-t1"),

    maxOut("swamp"),
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 3, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
    { type: "milestone", id: "swamp-maxed" },

    // ── Mountain: Brace, the plate -> +4 (now the 4th leg) ───────────────────
    // Nothing else is crafted here on purpose.
    { type: "travel", to: biome("mountain") },
    {
      type: "learnAbility",
      recipeId: "ability-recipe-brace",
      abilityId: "brace",
      slot: "guard",
      farmAt: biome("mountain"),
      label: "learn Brace (replaces Cleanse for the Mountain leg)",
    },
    ...getPiece(biome("mountain"), "mountain-vest-t1"),
    // Re-assert the loadout now that `fire-guard` fires Brace instead of
    // Cleanse. Hazard-aware pathing (from Swamp) stays active.
    { type: "configureRunes", rules: RUNES_FULL, label: "arm the charged-attack Brace rune" },

    maxOut("mountain"),
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 4, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
    { type: "milestone", id: "mountain-maxed" },

    // ── Cave: the Chaotic Axe and Expose Weakness -> GM 30 ───────────────────
    { type: "travel", to: biome("cave") },
    // Confirm the standing kit before the last leg.
    {
      type: "equip",
      definitionIds: ["flash-rapier", "mountain-vest-t1", "swamp-charm-t1", "plains-boots-t1"],
      label: "standing kit: forest weapon, mountain plate, swamp charm",
    },
    { type: "farm", at: biome("cave"), until: { type: "recipeUnlocked", recipeId: "chaotic-axe" } },
    { type: "craft", recipeIds: ["chaotic-axe"], farmAt: biome("cave") },
    {
      type: "learnAbility",
      recipeId: "ability-recipe-expose-weakness",
      abilityId: "expose-weakness",
      slot: "technique",
      farmAt: biome("cave"),
      label: "learn Expose Weakness (replaces Sweep)",
    },

    // Bring the axe up before switching to it — a +0 axe is a downgrade on a
    // +4 rapier. `opportunistic` takes it as far as current GM allows.
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

    // ── The +5 push. GM is now 30, so every gate is open; only essence remains.
    { type: "upgrade", definitionId: "chaotic-axe", toPlus: 5, farmAt: biome("cave") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 5 },
    { type: "milestone", id: "gear-plus-5" },

    // ── The boss gauntlet ────────────────────────────────────────────────────
    ...bossFight({
      biomeGroup: "plains",
      armor: "plains-vest-t1",
      technique: "sweep",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "forest",
      armor: "plains-vest-t1",
      technique: "expose-weakness",
      guard: "second-wind",
    }),
    ...bossFight({
      biomeGroup: "mountain",
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "brace",
    }),
    ...bossFight({
      biomeGroup: "swamp",
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "cleanse",
    }),
    ...bossFight({
      biomeGroup: "cave",
      armor: "mountain-vest-t1",
      technique: "expose-weakness",
      guard: "brace",
    }),
  ],

  completion: allOf(
    { type: "bossCleared", biomeGroup: "plains", tier: 1 },
    { type: "bossCleared", biomeGroup: "forest", tier: 1 },
    { type: "bossCleared", biomeGroup: "cave", tier: 1 },
    { type: "bossCleared", biomeGroup: "mountain", tier: 1 },
    { type: "bossCleared", biomeGroup: "swamp", tier: 1 },
  ),

  milestones: [
    { id: "tier-1-reached", when: { type: "playerTierAtLeast", tier: 1 } },
    // The shipped tier gate: one T1 boss down advances the character to tier 2.
    { id: "tier-1-quest-complete", when: { type: "playerTierAtLeast", tier: 2 } },
    { id: "gm-6-first-upgrade", when: { type: "globalMasteryAtLeast", value: 6 } },
    { id: "gm-12", when: { type: "globalMasteryAtLeast", value: 12 } },
    { id: "gm-18", when: { type: "globalMasteryAtLeast", value: 18 } },
    { id: "gm-24", when: { type: "globalMasteryAtLeast", value: 24 } },
    { id: "gm-30-all-maxed", when: { type: "globalMasteryAtLeast", value: 30 } },
    ...BOSS_KIT.map((definitionId) => ({
      id: `${definitionId}-plus-5`,
      when: { type: "itemAtLeastPlus" as const, definitionId, plus: 5 },
    })),
  ],
};
