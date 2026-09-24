import {
  ITEM_DATABASE,
  RECIPE_DATABASE,
  getMaxUpgrade,
  globalMastery,
  globalMasteryRequiredForUpgrade,
  requiredBiomeLevelForUpgrade,
  requiredPlusFor,
  upgradeCostFor,
  upgradeCatalystCostFor,
  type EquipmentSlot,
  type TierEntryProfile,
} from "@mmo-idle/shared";
import type { RouteStep } from "../route/types";
import { soleCatalystFamily, t2, t2FarmFor, type T2BiomeGroup } from "./t2Common";

/** Plan from the declared entry inventory. An eligible owned predecessor may be
 * upgraded to the production evolution gate when that strictly dominates reconstruction.
 * Equipped predecessors are accepted by the live server; existing unequip steps remain valid.
 */
export type AcquisitionPath = "craft" | "evolve" | "evolve-after-unequip" | "upgrade-then-evolve" | "reconstruct" | "unreachable";

export interface AcquisitionPlan {
  recipeId: string;
  path: AcquisitionPath;
  predecessorId?: string;
  /** Slot to empty first, when the predecessor is worn. */
  unequipSlot?: EquipmentSlot;
  /** Only present when an owned, already mastery-eligible predecessor needs a top-up. */
  topUpToPlus?: number;
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

  const requiredPlus = requiredPlusFor(recipe);
  const plus = profile.itemUpgrades[predecessorId] ?? 0;
  const inBag = profile.inventory.includes(predecessorId);
  const wornSlot = (Object.entries(profile.equipment) as [EquipmentSlot, string | null][]).find(
    ([, id]) => id === predecessorId,
  )?.[0];

  if (plus >= requiredPlus && inBag) {
    return {
      recipeId,
      path: "evolve",
      predecessorId,
      reason: `${predecessorId} is +${plus} in the bag`,
    };
  }
  if (plus >= requiredPlus && wornSlot) {
    return {
      recipeId,
      path: "evolve-after-unequip",
      predecessorId,
      unequipSlot: wornSlot,
      reason: `${predecessorId} is +${plus} worn in the ${wornSlot} slot; the route explicitly unequips before evolution`,
    };
  }
  const predecessor = ITEM_DATABASE.get(predecessorId);
  if ((inBag || wornSlot) && predecessor && plus < requiredPlus && requiredPlus <= getMaxUpgrade(predecessor)) {
    const topUpEssence: Record<string, number> = { ...recipe.cost };
    const topUpCatalysts: Record<string, number> = Object.fromEntries(Object.entries(recipe.catalystCost ?? {}).map(([key, value]) => [key, value ?? 0]));
    let eligible = true;
    for (let target = plus + 1; target <= requiredPlus; target++) {
      const cost = upgradeCostFor(predecessor, target);
      if (!cost || (profile.biomeLevels[predecessor.biomeGroup!] ?? 0) < requiredBiomeLevelForUpgrade(predecessor, target) ||
          globalMastery(profile.biomeLevels) < globalMasteryRequiredForUpgrade(predecessor.tier, target)) {
        eligible = false;
        break;
      }
      for (const [key, amount] of Object.entries(cost)) topUpEssence[key] = (topUpEssence[key] ?? 0) + amount;
      for (const [key, amount] of Object.entries(upgradeCatalystCostFor(predecessor, target) ?? {})) topUpCatalysts[key] = (topUpCatalysts[key] ?? 0) + (amount ?? 0);
    }
    // Compare each colour/family separately: currencies are not interchangeable.
    const dominates = (a: Record<string, number>, b: Partial<Record<string, number>>) =>
      Object.entries(a).every(([key, amount]) => amount <= (b[key] ?? 0));
    const cheaper = !recipe.reconstructCost || (
      dominates(topUpEssence, recipe.reconstructCost) && dominates(topUpCatalysts, recipe.reconstructCatalystCost ?? {}) &&
      (Object.entries(recipe.reconstructCost).some(([key, amount]) => (topUpEssence[key] ?? 0) < amount) ||
       Object.entries(recipe.reconstructCatalystCost ?? {}).some(([key, amount]) => (topUpCatalysts[key] ?? 0) < (amount ?? 0)))
    );
    if (eligible && cheaper) return {
      recipeId, path: 'upgrade-then-evolve', predecessorId, topUpToPlus: requiredPlus,
      reason: `owned ${predecessorId} +${plus} is mastery-eligible; top up to +${requiredPlus} and evolve for no more of any currency than reconstruction`,
    };
  }
  if (recipe.reconstructCost) {
    const held = inBag ? `+${plus} in the bag` : wornSlot ? `+${plus} worn` : "not owned";
    return {
      recipeId,
      path: "reconstruct",
      predecessorId,
      reason:
        `${predecessorId} is ${held}, below the +${requiredPlus} evolution gate; ` +
        "paying the reconstruction cost instead",
    };
  }
  return {
    recipeId,
    path: "unreachable",
    predecessorId,
    reason:
      `needs ${predecessorId} at +${requiredPlus} and the lineage authors no ` +
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
    case "upgrade-then-evolve":
      return [
        gate,
        { type: 'upgrade', definitionId: plan.predecessorId!, toPlus: plan.topUpToPlus!, farmAt: at,
          label: `top up owned ${plan.predecessorId} to +${plan.topUpToPlus} before evolution` },
        { type: 'evolveItem', recipeId: plan.recipeId, mode: 'evolve', farmAt: at, label: plan.reason },
      ];
    case "evolve-after-unequip":
      return [
        gate,
        {
          type: "unequip",
          slot: plan.unequipSlot!,
          // Guards against a later leg having already re-equipped a different
          // weapon into this slot by the time this step runs (the plan was
          // resolved once, at route-build time, from a static snapshot). If
          // so, the predecessor is presumably already sitting in the bag from
          // that earlier swap, and the evolve step below can consume it
          // directly -- so skipping this unequip rather than evicting the
          // wrong item is the correct behavior, not a fallback.
          expectedDefinitionId: plan.predecessorId,
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
