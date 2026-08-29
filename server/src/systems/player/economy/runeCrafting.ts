import type { EssenceType } from "@mmo-idle/shared";
import {
  ESSENCE_TYPES,
  RUNE_RECIPE_DATABASE,
  TEST_ROOM_NODE_ID,
  isRuneRecipeAvailableForArchetype,
  isRuneRecipeUnlocked,
  isRuneFragmentKnown,
  runeIdsFromCraftedRecipes,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";

const TEST_ROOM_ESSENCE_AMOUNT = 1_000_000_000;

export interface RuneCraftResult {
  recipeId: string;
  success: boolean;
  reason?: string;
}

export function craftRuneRecipe(
  world: World,
  entity: PlayerEntity,
  recipeId: string,
): RuneCraftResult {
  const recipe = RUNE_RECIPE_DATABASE.get(recipeId);
  if (!recipe) return { recipeId, success: false, reason: "Unknown rune recipe." };
  // Deprecated recipes (their rune was promoted to a starter default) grant
  // nothing — reject explicitly, before any essence check, rather than relying
  // on the "already unlocked" fallback below.
  if (recipe.deprecated) {
    return { recipeId, success: false, reason: "This recipe is no longer craftable." };
  }

  const crafted = entity.tracksProgression.runeRecipesCrafted ?? [];
  if (crafted.includes(recipeId)) {
    return { recipeId, success: false, reason: "Rune recipe already crafted." };
  }

  const isTestRoom = entity.hasPosition.nodeId === TEST_ROOM_NODE_ID;
  if (isTestRoom) {
    for (const type of ESSENCE_TYPES) {
      entity.tracksProgression.essences[type] = TEST_ROOM_ESSENCE_AMOUNT;
    }
  } else if (
    !isRuneRecipeUnlocked(recipe, {
      biomeLevel: entity.tracksProgression.biomeLevel,
      bossesCleared: entity.tracksProgression.bossesCleared,
    })
  ) {
    const reason = recipe.recipeGroup
      ? `Reach ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel} to unlock this recipe.`
      : "Defeat the linked boss to unlock this recipe.";
    return { recipeId, success: false, reason };
  }

  if (recipe.kind === "unlock-rune") {
    if (!recipe.runeId || !isRuneFragmentKnown(recipe.runeId)) {
      return { recipeId, success: false, reason: "Rune recipe is misconfigured." };
    }
    if (!isRuneRecipeAvailableForArchetype(recipe, entity.usesSkills.combatArchetype)) {
      return { recipeId, success: false, reason: "This rune belongs to another class." };
    }
    if (entity.tracksProgression.runesOwned.includes(recipe.runeId)) {
      return { recipeId, success: false, reason: "Rune fragment already unlocked." };
    }
  }

  const costEntries = Object.entries(recipe.cost) as [EssenceType, number][];
  for (const [type, amount] of costEntries) {
    const held = entity.tracksProgression.essences[type] ?? 0;
    if (!isTestRoom && held < amount) {
      return {
        recipeId,
        success: false,
        reason: `Not enough ${type} essence. Need ${amount}, have ${held}.`,
      };
    }
  }

  if (!isTestRoom) {
    for (const [type, amount] of costEntries) {
      entity.tracksProgression.essences[type] -= amount;
    }
  }

  const nextCrafted = [...crafted, recipeId];
  entity.tracksProgression.runeRecipesCrafted = nextCrafted;
  entity.tracksProgression.runesOwned = runeIdsFromCraftedRecipes(nextCrafted);
  markSliceDirty(world, entity, "tracksProgression");
  return { recipeId, success: true };
}
