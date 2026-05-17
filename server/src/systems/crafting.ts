import type { PlayerState, EssenceType } from '@mmo-idle/shared';
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

  // Check every essence type in the cost.
  const costEntries = Object.entries(recipe.cost) as [EssenceType, number][];
  for (const [type, amount] of costEntries) {
    const held = player.essences[type] ?? 0;
    if (held < amount) {
      return {
        success: false,
        reason: `Not enough ${type} essence. Need ${amount}, have ${held}.`,
      };
    }
  }

  // Deduct all.
  for (const [type, amount] of costEntries) {
    player.essences[type] -= amount;
  }

  player.inventory = [...player.inventory, recipe.id];
  return { success: true };
}
