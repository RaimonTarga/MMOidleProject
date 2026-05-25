import type { PlayerSnapshot, EssenceType } from '@mmo-idle/shared';
import { ESSENCE_TYPES, RECIPE_DATABASE, TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import type { World } from '../world/World';
import type { PlayerEntity } from '../ecs/components/player';
import { withPlayerSnapshotDraft } from '../ecs/playerSnapshotAdapter';

const TEST_ROOM_ESSENCE_AMOUNT = 1_000_000_000;

export interface CraftResult {
  success: boolean;
  reason?: string;
}

export function craftRecipe(world: World, player: PlayerSnapshot | PlayerEntity, recipeId: string): CraftResult {
  if ('entityId' in player) {
    return withPlayerSnapshotDraft(world, player, draft => craftRecipeSnapshot(draft, recipeId));
  }
  return craftRecipeSnapshot(player, recipeId);
}

function craftRecipeSnapshot(player: PlayerSnapshot, recipeId: string): CraftResult {
  const recipe = RECIPE_DATABASE.get(recipeId);
  if (!recipe) return { success: false, reason: 'Unknown recipe.' };

  const isTestRoom = player.nodeId === TEST_ROOM_NODE_ID;
  if (isTestRoom) {
    if (player.playerTier < recipe.tier) {
      return {
        success: false,
        reason: `Test forge tier ${player.playerTier} cannot craft tier ${recipe.tier} recipes.`,
      };
    }
    for (const type of ESSENCE_TYPES) {
      player.essences[type] = TEST_ROOM_ESSENCE_AMOUNT;
    }
  } else {
    if (!player.unlockedRecipes.includes(recipeId)) {
      return {
        success: false,
        reason: `Recipe locked — reach ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel}.`,
      };
    }
  }

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

  for (const [type, amount] of costEntries) {
    player.essences[type] -= amount;
  }

  player.inventory = [...player.inventory, recipe.id];
  return { success: true };
}
