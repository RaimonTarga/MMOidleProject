/**
 * Rite recipes (system rework Step 11) — parallel to `StanceRecipe` / `AbilityRecipe`.
 *
 * Crafting a rite recipe LEARNS the rite permanently (adds its id to
 * `TracksProgression.knownRites`); the player then freely slots it into a rite slot.
 * Rites are a T3 system, gated by Biome Mastery placement in the T3 level band
 * (`recipeGroup` + `requiredBiomeLevel`, which `biomeLevelCap()` tier-gates). The boss
 * channel (`requiredBossClear`) is reserved for signature rite variants (Step 13).
 */
import type { EssenceType } from "./items";
import { RITE_DATABASE } from "./rites";

export interface RiteRecipe {
  id: string;
  name: string;
  description: string;
  /** The rite learned when this recipe is crafted. */
  riteId: string;
  tier: number;
  cost: Partial<Record<EssenceType, number>>;
  /** Catalyst cost, parallel to `cost` (mirrors gear/rune/ability/stance catalyst gating). */
  catalystCost?: Partial<Record<string, number>>;
  /** Biome-mastery gate (T3 band). */
  recipeGroup?: string;
  requiredBiomeLevel?: number;
  /** Boss gate (reserved for signature rite variants). */
  requiredBossClear?: string;
}

// requiredBiomeLevel + costs are PLACEHOLDERS — user balance pass owns the numbers.
// T3 band: stances placed at forest L7-8 (T2); rites land one tier-band higher (L13-14).
const recipes: RiteRecipe[] = [
  {
    id: "rite-recipe-quickened-breath",
    name: "Quickened Breath",
    description: "Learn Quickened Breath: health regeneration resumes sooner after combat.",
    riteId: "quickened-breath",
    tier: 3,
    recipeGroup: "forest",
    requiredBiomeLevel: 13,
    cost: { green: 120 },
    catalystCost: { forest: 4 },
  },
  {
    id: "rite-recipe-cleansing-breath",
    name: "Cleansing Breath",
    description: "Learn Cleansing Breath: debuffs and DoTs decay out of combat.",
    riteId: "cleansing-breath",
    tier: 3,
    recipeGroup: "forest",
    requiredBiomeLevel: 13,
    cost: { green: 120, purple: 40 },
    catalystCost: { forest: 4 },
  },
  {
    id: "rite-recipe-lingering-momentum",
    name: "Lingering Momentum",
    description: "Learn Lingering Momentum: beneficial buffs fade more slowly out of combat.",
    riteId: "lingering-momentum",
    tier: 3,
    recipeGroup: "forest",
    requiredBiomeLevel: 14,
    cost: { green: 130, yellow: 40 },
    catalystCost: { forest: 5 },
  },
  {
    id: "rite-recipe-hunters-instinct",
    name: "Hunter's Instinct",
    description: "Learn Hunter's Instinct: a fresh kill grants a brief speed burst.",
    riteId: "hunters-instinct",
    tier: 3,
    recipeGroup: "forest",
    requiredBiomeLevel: 14,
    cost: { green: 130, red: 40 },
    catalystCost: { forest: 5 },
  },
];

export const RITE_RECIPE_DATABASE = new Map<string, RiteRecipe>(
  recipes.map((r) => [r.id, r]),
);

/** Progression inputs that gate whether a rite recipe is unlocked yet. */
export interface RiteRecipeGateInput {
  biomeLevel: Record<string, number>;
  bossesCleared: readonly string[];
}

/**
 * Whether the recipe's unlock requirements are met. Biome-mastery recipes gate on
 * `requiredBiomeLevel` in `recipeGroup`; signature recipes gate on `requiredBossClear`.
 * A recipe carrying both must satisfy both. Recipes with neither are always unlocked.
 */
export function isRiteRecipeUnlocked(
  recipe: RiteRecipe,
  input: RiteRecipeGateInput,
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

export function validateRiteRecipes(): string[] {
  const errors: string[] = [];
  for (const recipe of RITE_RECIPE_DATABASE.values()) {
    if (!RITE_DATABASE.has(recipe.riteId)) {
      errors.push(`${recipe.id} points at unknown rite ${recipe.riteId}.`);
    }
  }
  return errors;
}
