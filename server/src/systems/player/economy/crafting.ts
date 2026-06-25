import type { EssenceType } from "@mmo-idle/shared";
import {
  ESSENCE_TYPES,
  ESSENCE_LABELS,
  RECIPE_DATABASE,
  TEST_ROOM_NODE_ID,
  catalystLabel,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";

const TEST_ROOM_ESSENCE_AMOUNT = 1_000_000_000;

export interface CraftResult {
  success: boolean;
  reason?: string;
}

export function craftRecipe(
  world: World,
  entity: PlayerEntity,
  recipeId: string,
): CraftResult {
  const recipe = RECIPE_DATABASE.get(recipeId);
  if (!recipe) return { success: false, reason: "Unknown recipe." };
  // Evolved recipes are crafted via the evolve/reconstruct path, not plain crafting
  // (which would skip consuming the +3 predecessor). See economy/itemEvolution.ts.
  if (recipe.evolvesFrom) {
    return { success: false, reason: "This item must be evolved or reconstructed." };
  }

  const isTestRoom = entity.hasPosition.nodeId === TEST_ROOM_NODE_ID;
  if (isTestRoom) {
    for (const type of ESSENCE_TYPES) {
      entity.tracksProgression.essences[type] = TEST_ROOM_ESSENCE_AMOUNT;
    }
    for (const group of Object.keys(recipe.catalystCost ?? {})) {
      entity.tracksProgression.catalysts[group] = TEST_ROOM_ESSENCE_AMOUNT;
    }
    markSliceDirty(world, entity, "tracksProgression");
  } else {
    if (recipe.requiredBossClear &&
        !entity.tracksProgression.bossesCleared.includes(recipe.requiredBossClear)) {
      return {
        success: false,
        reason: 'Defeat the Void Overlord to unlock this recipe.',
      };
    }
    if (!entity.tracksProgression.unlockedRecipes.includes(recipeId)) {
      return {
        success: false,
        reason: recipe.requiredBossClear
          ? 'Recipe locked — defeat the Void Overlord.'
          : `Recipe locked — reach ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel}.`,
      };
    }
  }

  const costEntries = Object.entries(recipe.cost) as [EssenceType, number][];
  for (const [type, amount] of costEntries) {
    const held = entity.tracksProgression.essences[type] ?? 0;
    if (held < amount) {
      return {
        success: false,
        reason: `Not enough ${ESSENCE_LABELS[type]} essence. Need ${amount}, have ${held}.`,
      };
    }
  }

  const catalystEntries = Object.entries(recipe.catalystCost ?? {}) as [string, number][];
  for (const [group, amount] of catalystEntries) {
    const held = entity.tracksProgression.catalysts[group] ?? 0;
    if (held < amount) {
      return {
        success: false,
        reason: `Not enough ${catalystLabel(group)}. Need ${amount}, have ${held}.`,
      };
    }
  }

  for (const [type, amount] of costEntries) {
    entity.tracksProgression.essences[type] -= amount;
  }
  for (const [group, amount] of catalystEntries) {
    entity.tracksProgression.catalysts[group] =
      (entity.tracksProgression.catalysts[group] ?? 0) - amount;
  }

  entity.holdsInventory.inventory = [
    ...entity.holdsInventory.inventory,
    recipe.id,
  ];
  markSliceDirty(world, entity, "holdsInventory");
  return { success: true };
}
