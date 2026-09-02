import {
  EVOLUTION_REQUIRED_PLUS,
  RECIPE_DATABASE,
  type EquipmentSlot,
  type TierEntryProfile,
} from "@mmo-idle/shared";
import type { RouteStep } from "../route/types";
import { soleCatalystFamily, t2, t2FarmFor, type T2BiomeGroup } from "./t2Common";

/**
 * How a Tier-2 item is actually obtained.
 *
 * ── The constraint that shapes the whole tier ──────────────────────────────
 *
 * 20 of the 32 Tier-2 recipes are EVOLUTIONS (`evolvesFrom`) of one specific
 * Tier-1 item, and `craftRecipe` refuses them outright ("This item must be
 * evolved or reconstructed"). Only the eight Jungle/Desert pieces and the three
 * Cores are plain crafts. An evolution offers two paths:
 *
 *   EVOLVE       consume a BAG copy of the predecessor at +5, pay the cheap
 *                `cost`. Roughly a third of the reconstruct price.
 *   RECONSTRUCT  pay `reconstructCost` instead, no predecessor needed -- and
 *                only where that cost is authored at all.
 *
 * Two consequences the route has to handle, and both were live traps:
 *
 * 1. `checkEvolve` tests `inventory.includes(predecessor)`, and an EQUIPPED item
 *    is not in the inventory array. A character wearing its fully-upgraded
 *    Tier-1 weapon cannot evolve that weapon until it takes it off. Without the
 *    unequip the route silently pays reconstruction -- three times the price,
 *    for no reason a reader of the run could ever see.
 *
 * 2. `EVOLUTION_REQUIRED_PLUS` is 5. The canonical Tier-1 routes take only SOME
 *    of their gear to +5 (Striker's flash-rapier ends at +4, its iron-broadsword
 *    at +1), so most lineages are not evolvable at Tier-2 entry no matter what
 *    the route does. That is recorded as a progression finding, not routed
 *    around: see docs/t2-bot-testing-infrastructure.md.
 *
 * Because the path depends on what the class's own Tier-1 template happens to
 * hold, it is resolved HERE, at route-build time, from that template -- not
 * guessed at runtime and not restated per class.
 */

export type AcquisitionPath = "craft" | "evolve" | "evolve-after-unequip" | "reconstruct" | "unreachable";

export interface AcquisitionPlan {
  recipeId: string;
  path: AcquisitionPath;
  predecessorId?: string;
  /** Slot to empty first, when the predecessor is worn. */
  unequipSlot?: EquipmentSlot;
  /** Why this path and not a cheaper one. Copied into the adoption report. */
  reason: string;
}

/** Decide how `recipeId` can be obtained from `profile`'s starting state. */
export function planAcquisition(
  profile: TierEntryProfile,
  recipeId: string,
): AcquisitionPlan {
  const recipe = RECIPE_DATABASE.get(recipeId);
  if (!recipe) throw new Error(`unknown T2 recipe "${recipeId}"`);

  const predecessorId = recipe.evolvesFrom;
  if (!predecessorId) {
    return { recipeId, path: "craft", reason: "plain recipe, no predecessor lineage" };
  }

  const plus = profile.itemUpgrades[predecessorId] ?? 0;
  const inBag = profile.inventory.includes(predecessorId);
  const wornSlot = (Object.entries(profile.equipment) as [EquipmentSlot, string | null][]).find(
    ([, id]) => id === predecessorId,
  )?.[0];

  if (plus >= EVOLUTION_REQUIRED_PLUS && inBag) {
    return {
      recipeId,
      path: "evolve",
      predecessorId,
      reason: `${predecessorId} is +${plus} in the bag`,
    };
  }
  if (plus >= EVOLUTION_REQUIRED_PLUS && wornSlot) {
    return {
      recipeId,
      path: "evolve-after-unequip",
      predecessorId,
      unequipSlot: wornSlot,
      reason: `${predecessorId} is +${plus} but worn in the ${wornSlot} slot; evolution consumes a bag copy`,
    };
  }
  if (recipe.reconstructCost) {
    const held = inBag ? `+${plus} in the bag` : wornSlot ? `+${plus} worn` : "not owned";
    return {
      recipeId,
      path: "reconstruct",
      predecessorId,
      reason:
        `${predecessorId} is ${held}, below the +${EVOLUTION_REQUIRED_PLUS} evolution gate; ` +
        "paying the reconstruction cost instead",
    };
  }
  return {
    recipeId,
    path: "unreachable",
    predecessorId,
    reason:
      `needs ${predecessorId} at +${EVOLUTION_REQUIRED_PLUS} and the lineage authors no ` +
      "reconstruction cost, so this item cannot be obtained from this template at all",
  };
}

/**
 * Steps that obtain `recipeId` in `group`, farming for the gate and the cost.
 *
 * An `unreachable` plan emits a milestone and nothing else. That is deliberate:
 * a route must not stall for hours on an item the game will never hand it, and
 * "this template could not reach this item" is itself a finding the run should
 * report rather than crash on.
 */
export function obtainSteps(group: T2BiomeGroup, plan: AcquisitionPlan): RouteStep[] {
  const recipe = RECIPE_DATABASE.get(plan.recipeId)!;
  // The catalyst family this purchase needs decides WHERE to farm for it, because
  // catalysts are minted by the node modifier and nothing else. Evolve and
  // reconstruct have separate catalyst cost axes, so the family is read from the
  // one this plan will actually pay. See `t2FarmFor` for the measured failure
  // this prevents.
  const family = soleCatalystFamily(
    plan.path === "reconstruct" ? recipe.reconstructCatalystCost : recipe.catalystCost,
  );
  const at = t2FarmFor(group, family);
  const gate: RouteStep = {
    // The GATE farm is about biome XP, which any node in the biome grants, so it
    // stays on the plain rotating ref and spreads load across the biome.
    type: "farm",
    at: t2(group),
    until: { type: "recipeUnlocked", recipeId: plan.recipeId },
    label: `farm ${group} until ${plan.recipeId} unlocks`,
  };

  switch (plan.path) {
    case "craft":
      return [gate, { type: "craft", recipeIds: [plan.recipeId], farmAt: at }];
    case "evolve":
      return [
        gate,
        {
          type: "evolveItem",
          recipeId: plan.recipeId,
          mode: "evolve",
          farmAt: at,
          label: `evolve ${plan.predecessorId} into ${plan.recipeId}`,
        },
      ];
    case "evolve-after-unequip":
      return [
        gate,
        {
          type: "unequip",
          slot: plan.unequipSlot!,
          label: `unequip ${plan.predecessorId} so the evolve path can consume it`,
        },
        {
          type: "evolveItem",
          recipeId: plan.recipeId,
          mode: "evolve",
          farmAt: at,
          label: `evolve ${plan.predecessorId} into ${plan.recipeId}`,
        },
      ];
    case "reconstruct":
      return [
        gate,
        {
          type: "evolveItem",
          recipeId: plan.recipeId,
          mode: "reconstruct",
          farmAt: at,
          label: `reconstruct ${plan.recipeId} (${plan.reason})`,
        },
      ];
    case "unreachable":
      return [
        {
          type: "milestone",
          id: `unreachable:${plan.recipeId}`,
          label: `SKIPPED, unobtainable: ${plan.recipeId} -- ${plan.reason}`,
        },
      ];
  }
}
