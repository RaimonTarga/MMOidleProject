import { NODE_BIOMES, biomeLevelCap, type EquippedRule } from "@mmo-idle/shared";
import type { NodeRef, RouteStep } from "../route/types";

/**
 * Shared vocabulary for the Tier-2 control route.
 *
 * ── The controlled variable is BIOME ORDER, and nothing else ────────────────
 *
 * The order below is a designer decision (2026-09-02), deliberately NOT an
 * optimization: it runs roughly from lower baseline power toward higher, and it
 * is held constant across every class and branch so that differences between
 * runs are attributable to the build rather than to the route. Do not "improve"
 * it. Route optimization is a LATER campaign that needs this control to exist
 * first.
 */
export const T2_PROGRESSION_ORDER = [
  "plains",
  "forest",
  "swamp",
  "mountain",
  "cave",
  "jungle",
  "desert",
] as const;

export type T2BiomeGroup = (typeof T2_PROGRESSION_ORDER)[number];

/** A Tier-2 biome's normal nodes. */
export function t2(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 2, pick: "uncleared" };
}

/**
 * Where to farm for a purchase that costs CATALYSTS.
 *
 * Catalysts are minted by the node MODIFIER, not by the biome, and a node's
 * modifier is static (`NODE_BIOMES[...].modifier`). Farming for a cost in
 * whichever node the rotation happened to pick therefore mints the wrong family
 * indefinitely, and the bot waits forever on a wallet that will never fill.
 *
 * This is not hypothetical -- it was measured. A Striker run spent **521 of its
 * 540 seconds** blocked on `reconstruct:plains-charm-t2` needing 2 alacrity,
 * parked in `node-t2-plains-04` (dominion), holding 46,044 spare yellow essence
 * and 5 dominion catalysts it could not spend. Essence was never the constraint;
 * the node was.
 *
 * Falls back to the plain biome ref when the biome has no node of that family,
 * so a route can never become unresolvable because of this preference.
 */
export function t2FarmFor(biomeGroup: string, catalystFamily?: string): NodeRef {
  if (!catalystFamily) return t2(biomeGroup);
  const hasFamily = Object.values(NODE_BIOMES).some(
    (info) =>
      info.biomeGroup === biomeGroup &&
      info.biomeTier === 2 &&
      info.kind === "normal" &&
      (info as { modifier?: string }).modifier === catalystFamily,
  );
  if (!hasFamily) return t2(biomeGroup);
  return { kind: "biome", biomeGroup, tier: 2, pick: "uncleared", modifier: catalystFamily };
}

/**
 * The single catalyst family a cost record demands, or undefined when it demands
 * none -- or more than one, which no node can mint at once and which therefore
 * has no single right place to farm.
 */
export function soleCatalystFamily(
  ...costs: Array<Partial<Record<string, number>> | undefined>
): string | undefined {
  const families = new Set<string>();
  for (const cost of costs) {
    for (const [family, amount] of Object.entries(cost ?? {})) {
      if ((amount ?? 0) > 0) families.add(family);
    }
  }
  return families.size === 1 ? [...families][0] : undefined;
}

/**
 * The level a Tier-2 leg farms to, read live from `biomeLevelCap`.
 *
 * The two shapes are not a mistake and the route depends on knowing the
 * difference. Plains/Forest/Swamp/Mountain/Cave carry over from Tier 1 and run
 * levels 7-12 in Tier 2, with their T2 recipes gated at 7/8/9/10. Jungle and
 * Desert FIRST APPEAR at Tier 2, so their own levels start at 1 and their
 * recipes gate at 1/2/3/4 -- their cap at playerTier 2 is 6, not 12.
 */
export function t2MaxLevel(biomeGroup: T2BiomeGroup): number {
  return biomeLevelCap(2, biomeGroup);
}

/**
 * Farm a Tier-2 biome to its playerTier-2 ceiling.
 *
 * Maxing every biome is not thoroughness for its own sake: the Tier-2 item
 * upgrade ceiling is driven by GLOBAL MASTERY, and at Tier-2 entry (GM 30) it is
 * +0. Nothing crafted in Tier 2 can be upgraded at all until GM 42, and +5
 * requires GM 72 -- the sum of all seven biomes at their caps. Skipping a
 * biome's levels is therefore a decision to keep every OTHER biome's gear
 * weaker, which is why the boring control maxes each leg in turn.
 */
export function maxOutT2(biomeGroup: T2BiomeGroup): RouteStep {
  const level = t2MaxLevel(biomeGroup);
  return {
    type: "farm",
    at: t2(biomeGroup),
    until: { type: "biomeLevelAtLeast", biomeGroup, level },
    label: `max out ${biomeGroup} T2 (level ${level})`,
  };
}

/** Farm until a recipe's gate opens, then craft it and wear it. */
export function getT2Piece(biomeGroup: T2BiomeGroup, recipeId: string): RouteStep[] {
  const at = t2(biomeGroup);
  return [
    { type: "farm", at, until: { type: "recipeUnlocked", recipeId } },
    { type: "craft", recipeIds: [recipeId], farmAt: at },
    { type: "equip", definitionIds: [recipeId] },
  ];
}

/**
 * Craft a piece WITHOUT equipping it.
 *
 * Used where a class's plan says the item is worth owning but not worth wearing
 * over what it already has -- a distinction the gear-adoption report needs, and
 * one that collapses if crafting always implies equipping.
 */
export function craftT2Piece(biomeGroup: T2BiomeGroup, recipeId: string): RouteStep[] {
  const at = t2(biomeGroup);
  return [
    { type: "farm", at, until: { type: "recipeUnlocked", recipeId } },
    { type: "craft", recipeIds: [recipeId], farmAt: at },
  ];
}

/**
 * The Tier-2 movement/survival Rune profiles.
 *
 * These are the SAME loadouts the controlled Tier-1 routes end on, carried
 * forward unchanged on purpose. Tier 2 opens four new Rune recipes (Surrounded
 * and Focus Lowest HP in Swamp, plus the two DoT-targeting runes), and adopting
 * any of them in the baseline would make automation quality a second variable
 * moving alongside biome difficulty. Rune adoption is its own experiment axis --
 * see the Rune regression suite and the experiment ledger.
 *
 * Cost against the 11 RP budget Global Mastery 30 buys:
 *   melee-chase  : auto-path 0 + step-back 3 + chase 1 + hazards 2 + regen 1 = 7
 *   ranged-orbit : auto-path 0 + step-back 3 + orbit 3 + hazards 2 + regen 1 = 9
 */
export type T2MovementProfile = "melee-chase" | "ranged-orbit";

export function t2Runes(profile: T2MovementProfile, braceEquipped = false): EquippedRule[] {
  const rules: EquippedRule[] = [
    { conditionId: "always", actionId: "auto-path-enemy" },
    // Step Back must precede the chase/orbit rule: arbitration inside the
    // MOVEMENT channel is top-to-bottom, so a lower Step Back never fires.
    { conditionId: "inside-telegraph", actionId: "step-back" },
    { conditionId: "in-combat", actionId: profile === "ranged-orbit" ? "orbit" : "chase-enemy" },
    { conditionId: "always", actionId: "avoid-hazards" },
    // Paired with `always`, not `when-idle`: Out of Combat keys off the
    // post-combat grace timer, so the bot spends those seconds walking to the
    // next pull at whatever HP the last fight left it on.
    { conditionId: "always", actionId: "wait-for-regen" },
  ];
  if (braceEquipped) {
    // `shouldFire()` suppresses a Guard's own built-in trigger the moment ANY
    // fire-guard rule is equipped, so this rule is only ever correct while Brace
    // -- whose intended trigger really is an enemy cast -- is the equipped Guard.
    rules.push({ conditionId: "target-casting", actionId: "fire-guard" });
  }
  return rules;
}
