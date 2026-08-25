import { CLEARING_NODE_ID, type EquippedRule } from "@mmo-idle/shared";
import { allOf, type NodeRef, type RouteStep } from "../route/types";

/**
 * Shared spine for every T1 baseline route (bot-route-reference.md §3-4).
 *
 * All six root classes share ONE biome order (Clearing -> Plains -> Forest ->
 * Mountain -> Swamp -> Cave -> all five bosses) and one ability-learning
 * rhythm (Sweep at Plains, Second Wind at Forest, Brace at Mountain, Cleanse
 * at Swamp, Expose Weakness at Cave -- see the brief §4, "shared baseline
 * progression behavior"). What differs per class is gear (weapon/armor/charm)
 * and rune movement/targeting choices, authored per-class in each routeXT1.ts.
 */

export const CLEARING: NodeRef = { kind: "node", nodeId: CLEARING_NODE_ID };

/** A T1 biome's normal nodes. */
export function biome(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 1, pick: "uncleared" };
}

/** The level cap for any T1 biome while the character is player tier 1. */
export const BIOME_MAX = 6;

export function maxOut(biomeGroup: string): RouteStep {
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
 * `normal` node at tier 1 -- it is `kind: "tutorial"`, `biomeTier: 0`, so a
 * `{ kind: "biome", biomeGroup: "clearing", tier: 1 }` ref resolves to nothing.
 */
export function getPiece(at: NodeRef, recipeId: string): RouteStep[] {
  return [
    { type: "farm", at, until: { type: "recipeUnlocked", recipeId } },
    { type: "craft", recipeIds: [recipeId], farmAt: at },
    { type: "equip", definitionIds: [recipeId] },
  ];
}

/** The shared tutorial + class-selection opening, identical for every root. */
export function clearingOpening(skillId: string, runes: EquippedRule[]): RouteStep[] {
  return [
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

    { type: "chooseClass", skillId },
    { type: "configureRunes", rules: runes },

    ...getPiece(CLEARING, "primordial-club"),
    ...getPiece(CLEARING, "clearing-vest-t1"),
    ...getPiece(CLEARING, "clearing-charm-t1"),
    ...getPiece(CLEARING, "clearing-boots-t1"),
    { type: "milestone", id: "clearing-set-complete" },
  ];
}

/** Learn Sweep at Plains L3 -- the shared T1 offensive Technique baseline. */
export function learnSweep(): RouteStep {
  return {
    type: "learnAbility",
    recipeId: "ability-recipe-sweep",
    abilityId: "sweep",
    slot: "technique",
    farmAt: biome("plains"),
  };
}

/** Learn Second Wind at Forest L3, replacing nothing (first Guard slot fill). */
export function learnSecondWind(): RouteStep {
  return {
    type: "learnAbility",
    recipeId: "ability-recipe-second-wind",
    abilityId: "second-wind",
    slot: "guard",
    farmAt: biome("forest"),
  };
}

/** Learn Brace at Mountain L3, replacing Second Wind in the single Guard slot. */
export function learnBrace(): RouteStep {
  return {
    type: "learnAbility",
    recipeId: "ability-recipe-brace",
    abilityId: "brace",
    slot: "guard",
    farmAt: biome("mountain"),
    label: "learn Brace (replaces Second Wind in the single Guard slot)",
  };
}

/** Learn Cleanse at Swamp L3, replacing Brace for the Swamp leg. */
export function learnCleanse(): RouteStep {
  return {
    type: "learnAbility",
    recipeId: "ability-recipe-cleanse",
    abilityId: "cleanse",
    slot: "guard",
    farmAt: biome("swamp"),
    label: "learn Cleanse (replaces Brace for the Swamp leg)",
  };
}

/** Learn Expose Weakness at Cave L3, replacing Sweep for the rest of the run. */
export function learnExposeWeakness(): RouteStep {
  return {
    type: "learnAbility",
    recipeId: "ability-recipe-expose-weakness",
    abilityId: "expose-weakness",
    slot: "technique",
    farmAt: biome("cave"),
    label: "learn Expose Weakness (replaces Sweep)",
  };
}

/**
 * One boss fight: set the standing kit's armor slot and the ability pair,
 * then attempt. `wornKit` is everything else worn alongside `armor`
 * (weapon/charm/boots), constant across the gauntlet.
 */
export function bossFight(opts: {
  biomeGroup: string;
  wornKit: readonly string[];
  armor: string;
  technique: string;
  guard: string;
}): RouteStep[] {
  return [
    { type: "equip", definitionIds: [...opts.wornKit, opts.armor] },
    { type: "setAbilities", techniques: [opts.technique], guards: [opts.guard] },
    { type: "attemptBoss", biomeGroup: opts.biomeGroup, tier: 1, maxAttempts: 6 },
    { type: "milestone", id: `${opts.biomeGroup}-boss-cleared` },
  ];
}

/** The shared GM/tier milestone ladder, plus one per BOSS_KIT item at +5. */
export function standardMilestones(bossKit: readonly string[]) {
  return [
    { id: "tier-1-reached", when: { type: "playerTierAtLeast" as const, tier: 1 } },
    // The shipped tier gate: one T1 boss down advances the character to tier 2.
    { id: "tier-1-quest-complete", when: { type: "playerTierAtLeast" as const, tier: 2 } },
    { id: "gm-6-first-upgrade", when: { type: "globalMasteryAtLeast" as const, value: 6 } },
    { id: "gm-12", when: { type: "globalMasteryAtLeast" as const, value: 12 } },
    { id: "gm-18", when: { type: "globalMasteryAtLeast" as const, value: 18 } },
    { id: "gm-24", when: { type: "globalMasteryAtLeast" as const, value: 24 } },
    { id: "gm-30-all-maxed", when: { type: "globalMasteryAtLeast" as const, value: 30 } },
    ...bossKit.map((definitionId) => ({
      id: `${definitionId}-plus-5`,
      when: { type: "itemAtLeastPlus" as const, definitionId, plus: 5 },
    })),
  ];
}

export function standardCompletion() {
  return allOf(
    { type: "bossCleared", biomeGroup: "plains", tier: 1 },
    { type: "bossCleared", biomeGroup: "forest", tier: 1 },
    { type: "bossCleared", biomeGroup: "cave", tier: 1 },
    { type: "bossCleared", biomeGroup: "mountain", tier: 1 },
    { type: "bossCleared", biomeGroup: "swamp", tier: 1 },
  );
}
