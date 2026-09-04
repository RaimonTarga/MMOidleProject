import { CLEARING_NODE_ID, type EquippedRule } from "@mmo-idle/shared";
import { allOf, type NodeRef, type RouteStep } from "../route/types";

/**
 * Low-level T1 step helpers used by the controlled route builder and retained
 * historical routes.
 *
 * `t1RouteBuilder.ts` owns the current controlled biome order, Rune profiles,
 * ability/Guard matrix, and boss preparation. Historical routes still import
 * some helpers below, but they are not controlled-batch authority.
 *
 * ORDER (designer override, 2026-08-25): Clearing -> Plains -> Forest ->
 * Swamp -> Mountain -> Cave -> all five bosses. This SWAPS Swamp and Mountain
 * from the original spine (Plains -> Forest -> Mountain -> Swamp -> Cave) --
 * Cleanse is learned at Swamp L3 (3rd leg); Mountain uses its available
 * movement tools, Step Back is learned at Cave L2, and Expose Weakness caps it
 * off at Cave. Upgrade targets follow leg position:
 * Plains -> +1 (GM6), Forest -> +2 (GM12), Swamp -> +3 (GM18),
 * Mountain -> +4 (GM24), Cave -> +5 (GM30).
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

/** Learn Sweep at Plains L2 -- the shared T1 offensive Technique baseline. */
export function learnSweep(): RouteStep {
  return {
    type: "learnAbility",
    recipeId: "ability-recipe-sweep",
    abilityId: "sweep",
    slot: "technique",
    farmAt: biome("plains"),
  };
}

/** Learn Second Wind at Forest L2, replacing nothing (first Guard slot fill). */
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

/** Learn Cleanse at Swamp L3, replacing Second Wind for the Swamp leg. */
export function learnCleanse(): RouteStep {
  return {
    type: "learnAbility",
    recipeId: "ability-recipe-cleanse",
    abilityId: "cleanse",
    slot: "guard",
    farmAt: biome("swamp"),
    label: "learn Cleanse (replaces Second Wind for the Swamp leg)",
  };
}

/** Re-equip the already learned Second Wind after the Swamp Cleanse leg. */
export function restoreSecondWind(): RouteStep {
  return {
    type: "setAbilities",
    techniques: ["sweep"],
    guards: ["second-wind"],
    label: "restore Second Wind for telegraph-dodge progression",
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
 * BUG FIX, 2026-08-26: `abilityFiring.ts`'s `shouldFire()` suppresses a Guard's
 * OWN built-in trigger the instant a `fire-guard` rune rule is equipped AT
 * ALL, regardless of which condition it is paired with or whether that
 * condition is currently true (`hasRuneAction` only checks the action id is
 * present in the loadout). `target-casting -> fire-guard` was designed for
 * Brace specifically ("the primary legitimate bot answer to charged/cast
 * attacks"), but every route kept it equipped unconditionally -- so Second
 * Wind (built-in default `hp-below 60%`) and Cleanse (built-in default
 * `has-debuff`) have never fired on their own sensible default this entire
 * session; they only fired in the rare window an enemy happened to be
 * mid-cast. Confirmed live: bots fighting bosses with `second-wind` equipped
 * still carried the rune, HP never triggering it.
 *
 * The fix is this rune ONLY when Brace is the currently-equipped Guard.
 */
const FIRE_GUARD_ON_CAST: EquippedRule = { conditionId: "target-casting", actionId: "fire-guard" };

/** `guard` is the currently-equipped Guard ability id, or "none" before one is learned. */
export function reactiveGuardRune(guard: string): EquippedRule[] {
  return guard === "brace" ? [FIRE_GUARD_ON_CAST] : [];
}

/**
 * One boss fight: set the standing kit's armor slot and the ability pair,
 * then attempt. `wornKit` is everything else worn alongside `armor`
 * (weapon/charm/boots), constant across the gauntlet. `baseRunes` is the
 * route's own movement/targeting/survival loadout WITHOUT any Guard-reactive
 * rule -- this appends the correct one (or none) for `guard` automatically.
 */
export function bossFight(opts: {
  biomeGroup: string;
  wornKit: readonly string[];
  armor: string;
  technique: string;
  guard: string;
  baseRunes: EquippedRule[];
}): RouteStep[] {
  return [
    { type: "equip", definitionIds: [...opts.wornKit, opts.armor] },
    { type: "setAbilities", techniques: [opts.technique], guards: [opts.guard] },
    {
      type: "configureRunes",
      rules: [...opts.baseRunes, ...reactiveGuardRune(opts.guard)],
      label: `arm the Guard-reactive rune for ${opts.guard}`,
    },
    { type: "attemptBoss", biomeGroup: opts.biomeGroup, tier: 1, maxAttempts: 6 },
    {
      type: "milestone",
      id: `${opts.biomeGroup}-boss-cleared`,
      requires: { type: "bossCleared", biomeGroup: opts.biomeGroup, tier: 1 },
    },
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
