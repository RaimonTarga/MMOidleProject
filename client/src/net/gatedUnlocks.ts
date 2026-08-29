import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  RITE_DATABASE,
  RITE_RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  STANCE_DATABASE,
  STANCE_RECIPE_DATABASE,
  isAbilityRecipeUnlocked,
  isRiteRecipeUnlocked,
  isRuneRecipeUnlocked,
  isStanceRecipeUnlocked,
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
 * Every technique, stance, rite and rune whose gate is currently open.
 *
 * Gear unlocks are authoritative — the server pushes them into
 * `TracksProgression.unlockedRecipes` as biome levels land. The other four
 * databases have no such list: their gates are evaluated on demand from biome
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

  for (const recipe of STANCE_RECIPE_DATABASE.values()) {
    if (!isStanceRecipeUnlocked(recipe, input)) continue;
    unlocks.push({
      key: `stance:${recipe.id}`,
      name: STANCE_DATABASE.get(recipe.stanceId)?.name ?? recipe.name,
      recipeGroup: recipe.recipeGroup ?? 'unknown',
    });
  }

  for (const recipe of RITE_RECIPE_DATABASE.values()) {
    if (!isRiteRecipeUnlocked(recipe, input)) continue;
    unlocks.push({
      key: `rite:${recipe.id}`,
      name: RITE_DATABASE.get(recipe.riteId)?.name ?? recipe.name,
      recipeGroup: recipe.recipeGroup ?? 'unknown',
    });
  }

  for (const recipe of RUNE_RECIPE_DATABASE.values()) {
    // Deprecated recipes' runes are already owned as starter defaults — never
    // announce them as a newly-opened gate.
    if (!recipe.runeId || recipe.deprecated || !isRuneRecipeUnlocked(recipe, input)) continue;
    unlocks.push({
      key: `rune:${recipe.id}`,
      name: recipe.name,
      recipeGroup: recipe.recipeGroup ?? 'unknown',
    });
  }

  return unlocks;
}
