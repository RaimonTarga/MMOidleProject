import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  isAbilityRecipeUnlocked,
} from '@mmo-idle/shared';

export interface GatedUnlock {
  /** Unique across databases; recipe ids are only unique within their own. */
  key: string;
  name: string;
  recipeGroup: string;
}

export interface UnlockGateInput {
  biomeLevel: Record<string, number>;
  bossesCleared: readonly string[];
}

/**
 * Every technique whose gate is currently open.
 *
 * Gear unlocks are authoritative — the server pushes them into
 * `TracksProgression.unlockedRecipes` as biome levels land. The ability
 * database has no such list: their gates are evaluated on demand from biome
 * level, which is why crossing one used to happen in total silence while a new
 * sword announced itself. This recomputes the open set so the delta applier can
 * diff it and announce the difference with the same toast.
 */
export function openGatedUnlocks(input: UnlockGateInput): GatedUnlock[] {
  const unlocks: GatedUnlock[] = [];

  for (const recipe of ABILITY_RECIPE_DATABASE.values()) {
    if (!isAbilityRecipeUnlocked(recipe, input)) continue;
    unlocks.push({
      key: `technique:${recipe.id}`,
      name: ABILITY_DATABASE.get(recipe.abilityId)?.name ?? recipe.name,
      recipeGroup: recipe.recipeGroup ?? 'unknown',
    });
  }

  return unlocks;
}
