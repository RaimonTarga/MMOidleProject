import type { PlayerState } from '@mmo-idle/shared';
import { RECIPE_DATABASE } from '@mmo-idle/shared';

export interface CraftResult {
  success: boolean;
  reason?: string;
}

export function craftRecipe(player: PlayerState, recipeId: string): CraftResult {
  const recipe = RECIPE_DATABASE.get(recipeId);
  if (!recipe) return { success: false, reason: 'Unknown recipe.' };

  const progress = player.recipeProgress[recipe.recipeGroup] ?? 0;
  if (progress < recipe.requiredTier) {
    return {
      success: false,
      reason: `Recipe locked — need ${recipe.recipeGroup} tier ${recipe.requiredTier}.`,
    };
  }

  if (player.essence < recipe.cost.essence) {
    return {
      success: false,
      reason: `Not enough essence. Need ${recipe.cost.essence}, have ${player.essence}.`,
    };
  }

  player.essence -= recipe.cost.essence;
  player.inventory = [...player.inventory, recipe.id];

  return { success: true };
}
