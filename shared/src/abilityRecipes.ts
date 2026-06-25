/**
 * Ability recipes (system rework Step 7) — parallel to `RuneRecipe`.
 *
 * Crafting an ability recipe LEARNS the ability permanently (adds its id to
 * `TracksProgression.knownAbilities`); the player then freely slots it into the
 * Technique / Guard slot. Recipes gate on Biome Mastery (`recipeGroup` +
 * `requiredBiomeLevel`), mirroring gear and rune recipes. The boss channel
 * (`requiredBossClear`) is reserved for advanced/signature abilities (Step 13).
 */
import type { EssenceType } from "./items";
import { ABILITY_DATABASE } from "./abilities";

export interface AbilityRecipe {
  id: string;
  name: string;
  description: string;
  /** The ability learned when this recipe is crafted. */
  abilityId: string;
  tier: number;
  cost: Partial<Record<EssenceType, number>>;
  /** Catalyst cost, parallel to `cost` (mirrors gear/rune catalyst gating). */
  catalystCost?: Partial<Record<string, number>>;
  /** Biome-mastery gate. */
  recipeGroup?: string;
  requiredBiomeLevel?: number;
  /** Boss gate (reserved for advanced/signature abilities). */
  requiredBossClear?: string;
}

// requiredBiomeLevel + costs are PLACEHOLDERS — user balance pass owns the numbers.
const recipes: AbilityRecipe[] = [
  {
    id: "ability-recipe-sweep",
    name: "Sweep",
    description: "Learn the Sweep technique: arm your next attack to cleave.",
    abilityId: "sweep",
    tier: 1,
    recipeGroup: "forest",
    requiredBiomeLevel: 2,
    cost: { green: 160 },
  },
  {
    id: "ability-recipe-brace",
    name: "Brace",
    description: "Learn the Brace guard: shield yourself under heavy pressure.",
    abilityId: "brace",
    tier: 1,
    recipeGroup: "forest",
    requiredBiomeLevel: 2,
    cost: { green: 140, blue: 60 },
  },
];

export const ABILITY_RECIPE_DATABASE = new Map<string, AbilityRecipe>(
  recipes.map((r) => [r.id, r]),
);

/** Progression inputs that gate whether an ability recipe is unlocked yet. */
export interface AbilityRecipeGateInput {
  biomeLevel: Record<string, number>;
  bossesCleared: readonly string[];
}

/**
 * Whether the recipe's unlock requirements are met. Biome-mastery recipes gate on
 * `requiredBiomeLevel` in `recipeGroup`; advanced recipes gate on `requiredBossClear`.
 * A recipe carrying both must satisfy both. Recipes with neither are always unlocked.
 */
export function isAbilityRecipeUnlocked(
  recipe: AbilityRecipe,
  input: AbilityRecipeGateInput,
): boolean {
  if (recipe.recipeGroup && recipe.requiredBiomeLevel !== undefined) {
    if ((input.biomeLevel[recipe.recipeGroup] ?? 0) < recipe.requiredBiomeLevel) {
      return false;
    }
  }
  if (recipe.requiredBossClear) {
    if (!input.bossesCleared.includes(recipe.requiredBossClear)) return false;
  }
  return true;
}

export function validateAbilityRecipes(): string[] {
  const errors: string[] = [];
  for (const recipe of ABILITY_RECIPE_DATABASE.values()) {
    if (!ABILITY_DATABASE.has(recipe.abilityId)) {
      errors.push(`${recipe.id} points at unknown ability ${recipe.abilityId}.`);
    }
  }
  return errors;
}
