import type { EssenceType } from '@mmo-idle/shared';
import { ESSENCE_TYPES, RECIPE_DATABASE, TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import type { World } from '../world/World';
import type { PlayerEntity } from '../ecs/components/player';

const TEST_ROOM_ESSENCE_AMOUNT = 1_000_000_000;

export interface CraftResult {
  success: boolean;
  reason?: string;
}

export function craftRecipe(world: World, entity: PlayerEntity, recipeId: string): CraftResult {
  const recipe = RECIPE_DATABASE.get(recipeId);
  if (!recipe) return { success: false, reason: 'Unknown recipe.' };

  const isTestRoom = entity.hasPosition.nodeId === TEST_ROOM_NODE_ID;
  if (isTestRoom) {
    if (entity.tracksProgression.playerTier < recipe.tier) {
      return {
        success: false,
        reason: `Test forge tier ${entity.tracksProgression.playerTier} cannot craft tier ${recipe.tier} recipes.`,
      };
    }
    for (const type of ESSENCE_TYPES) {
      entity.tracksProgression.essences[type] = TEST_ROOM_ESSENCE_AMOUNT;
    }
  } else {
    if (!entity.tracksProgression.unlockedRecipes.includes(recipeId)) {
      return {
        success: false,
        reason: `Recipe locked — reach ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel}.`,
      };
    }
  }

  const costEntries = Object.entries(recipe.cost) as [EssenceType, number][];
  for (const [type, amount] of costEntries) {
    const held = entity.tracksProgression.essences[type] ?? 0;
    if (held < amount) {
      return {
        success: false,
        reason: `Not enough ${type} essence. Need ${amount}, have ${held}.`,
      };
    }
  }

  for (const [type, amount] of costEntries) {
    entity.tracksProgression.essences[type] -= amount;
  }

  entity.holdsInventory.inventory = [...entity.holdsInventory.inventory, recipe.id];
  return { success: true };
}
