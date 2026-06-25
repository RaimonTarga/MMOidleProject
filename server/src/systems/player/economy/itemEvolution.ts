import type { EssenceType, EvolveMode } from "@mmo-idle/shared";
import {
  ESSENCE_TYPES,
  RECIPE_DATABASE,
  TEST_ROOM_NODE_ID,
  checkEvolve,
  checkReconstruct,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";

const TEST_ROOM_ESSENCE_AMOUNT = 1_000_000_000;

export interface CraftResult {
  success: boolean;
  reason?: string;
}

/**
 * Evolve or reconstruct an item (system rework Step 6). `evolve` consumes the +3
 * predecessor + pays the recipe's `cost`; `reconstruct` skips the predecessor and
 * pays the higher `reconstructCost`. Both grant the evolved item at +0.
 */
export function evolveItem(
  world: World,
  entity: PlayerEntity,
  recipeId: string,
  mode: EvolveMode,
): CraftResult {
  const recipe = RECIPE_DATABASE.get(recipeId);
  if (!recipe) return { success: false, reason: "Unknown recipe." };
  if (!recipe.evolvesFrom) return { success: false, reason: "This recipe is not an evolution." };

  const prog = entity.tracksProgression;
  const inv = entity.holdsInventory;
  const isTestRoom = entity.hasPosition.nodeId === TEST_ROOM_NODE_ID;

  if (isTestRoom) {
    for (const type of ESSENCE_TYPES) prog.essences[type] = TEST_ROOM_ESSENCE_AMOUNT;
    const allCatalysts = { ...recipe.catalystCost, ...recipe.reconstructCatalystCost };
    for (const group of Object.keys(allCatalysts)) prog.catalysts[group] = TEST_ROOM_ESSENCE_AMOUNT;
    markSliceDirty(world, entity, "tracksProgression");
  } else if (!prog.unlockedRecipes.includes(recipeId)) {
    return {
      success: false,
      reason: `Recipe locked — reach ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel}.`,
    };
  }

  // Which cost axis applies depends on the path.
  const essenceCost = mode === "evolve" ? recipe.cost : recipe.reconstructCost;
  const catalystCost = mode === "evolve" ? recipe.catalystCost : recipe.reconstructCatalystCost;

  if (mode === "evolve") {
    const check = checkEvolve({
      recipe,
      inventory: inv.inventory,
      itemUpgrades: inv.itemUpgrades,
      essences: prog.essences,
      catalysts: prog.catalysts,
      isTestRoom,
    });
    if (!check.ok) return { success: false, reason: check.reason };
  } else {
    const check = checkReconstruct({
      recipe,
      essences: prog.essences,
      catalysts: prog.catalysts,
      isTestRoom,
    });
    if (!check.ok) return { success: false, reason: check.reason };
  }

  // Consume the predecessor (one bag copy) on the evolve path.
  if (mode === "evolve" && !isTestRoom) {
    const idx = inv.inventory.indexOf(recipe.evolvesFrom);
    if (idx === -1) return { success: false, reason: "Predecessor item must be in your bag to evolve." };
    inv.inventory = [...inv.inventory.slice(0, idx), ...inv.inventory.slice(idx + 1)];
  }

  // Spend essence + catalysts for the chosen path.
  if (!isTestRoom) {
    for (const [type, amount] of Object.entries(essenceCost ?? {}) as [EssenceType, number][]) {
      prog.essences[type] = (prog.essences[type] ?? 0) - amount;
    }
    for (const [group, amount] of Object.entries(catalystCost ?? {}) as [string, number][]) {
      prog.catalysts[group] = (prog.catalysts[group] ?? 0) - amount;
    }
    markSliceDirty(world, entity, "tracksProgression");
  }

  // Grant the evolved item at +0 (per-id upgrade level left untouched).
  inv.inventory = [...inv.inventory, recipe.id];
  markSliceDirty(world, entity, "holdsInventory");
  return { success: true };
}
