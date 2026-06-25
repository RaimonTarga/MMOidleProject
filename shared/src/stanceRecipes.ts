/**
 * Stance recipes (system rework Step 10) — parallel to `RuneRecipe` / `AbilityRecipe`.
 *
 * Crafting a stance recipe LEARNS the stance permanently (adds its id to
 * `TracksProgression.knownStances`); the player then freely slots it into the
 * default / reactive stance slot. Stances are a T2 system, gated by Biome Mastery
 * placement in the T2 level band (`recipeGroup` + `requiredBiomeLevel` ≥ 7, which
 * `biomeLevelCap()` tier-gates). The boss channel (`requiredBossClear`) is reserved
 * for signature stance variants (Step 13).
 */
import type { EssenceType } from "./items";
import { STANCE_DATABASE } from "./stances";

export interface StanceRecipe {
  id: string;
  name: string;
  description: string;
  /** The stance learned when this recipe is crafted. */
  stanceId: string;
  tier: number;
  cost: Partial<Record<EssenceType, number>>;
  /** Catalyst cost, parallel to `cost` (mirrors gear/rune/ability catalyst gating). */
  catalystCost?: Partial<Record<string, number>>;
  /** Biome-mastery gate (T2 band: requiredBiomeLevel ≥ 7). */
  recipeGroup?: string;
  requiredBiomeLevel?: number;
  /** Boss gate (reserved for signature stance variants). */
  requiredBossClear?: string;
}

// requiredBiomeLevel + costs are PLACEHOLDERS — user balance pass owns the numbers.
const recipes: StanceRecipe[] = [
  {
    id: "stance-recipe-offensive",
    name: "Offensive Stance",
    description: "Learn the Offensive Stance: trade defense for damage and tempo.",
    stanceId: "offensive-stance",
    tier: 2,
    recipeGroup: "forest",
    requiredBiomeLevel: 7,
    cost: { green: 60 },
    catalystCost: { forest: 2 },
  },
  {
    id: "stance-recipe-defensive",
    name: "Defensive Stance",
    description: "Learn the Defensive Stance: trade offense for damage reduction.",
    stanceId: "defensive-stance",
    tier: 2,
    recipeGroup: "forest",
    requiredBiomeLevel: 7,
    cost: { green: 60, blue: 20 },
    catalystCost: { forest: 2 },
  },
  {
    id: "stance-recipe-tanking",
    name: "Tanking Stance",
    description: "Learn the Tanking Stance: bulk up to hold the line.",
    stanceId: "tanking-stance",
    tier: 2,
    recipeGroup: "forest",
    requiredBiomeLevel: 8,
    cost: { green: 70, blue: 30 },
    catalystCost: { forest: 3 },
  },
];

export const STANCE_RECIPE_DATABASE = new Map<string, StanceRecipe>(
  recipes.map((r) => [r.id, r]),
);

/** Progression inputs that gate whether a stance recipe is unlocked yet. */
export interface StanceRecipeGateInput {
  biomeLevel: Record<string, number>;
  bossesCleared: readonly string[];
}

/**
 * Whether the recipe's unlock requirements are met. Biome-mastery recipes gate on
 * `requiredBiomeLevel` in `recipeGroup`; signature recipes gate on `requiredBossClear`.
 * A recipe carrying both must satisfy both. Recipes with neither are always unlocked.
 */
export function isStanceRecipeUnlocked(
  recipe: StanceRecipe,
  input: StanceRecipeGateInput,
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

export function validateStanceRecipes(): string[] {
  const errors: string[] = [];
  for (const recipe of STANCE_RECIPE_DATABASE.values()) {
    if (!STANCE_DATABASE.has(recipe.stanceId)) {
      errors.push(`${recipe.id} points at unknown stance ${recipe.stanceId}.`);
    }
  }
  return errors;
}
