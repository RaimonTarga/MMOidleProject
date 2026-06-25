import type { EssenceType } from "./items";
import type { CombatArchetype } from "./types/combat";
import {
  ACTION_DATABASE,
  CONDITION_DATABASE,
  STARTER_RUNE_IDS,
  isRuneFragmentKnown,
} from "./runeDatabase";

export type RuneRecipeKind = "unlock-rune";
export type RuneFragmentKind = "condition" | "action";

export interface RuneRecipe {
  id: string;
  name: string;
  description: string;
  kind: RuneRecipeKind;
  tier: number;
  cost: Partial<Record<EssenceType, number>>;
  /**
   * Biome-mastery gate (system rework Step 5): recipe unlocks at
   * `requiredBiomeLevel` in `recipeGroup`. Basic/biome-problem runes use this.
   * Mirrors gear recipe gating.
   */
  recipeGroup?: string;
  requiredBiomeLevel?: number;
  /**
   * Boss gate: recipe unlocks when this token is in `bossesCleared`. Reserved for
   * advanced/signature/boss-reactive runes (authored with Step 13). A recipe may
   * carry both gates; both must be satisfied.
   */
  requiredBossClear?: string;
  runeId?: string;
  runeKind?: RuneFragmentKind;
}

// System rework Step 5: all current (basic) runes source from BIOME MASTERY
// (recipeGroup + requiredBiomeLevel), not boss clears. The boss channel
// (requiredBossClear) is kept free for the advanced/signature runes Step 13 adds.
// requiredBiomeLevel values are PLACEHOLDERS — user balance pass owns the numbers.
const recipes: RuneRecipe[] = [
  {
    id: "rune-recipe-out-of-combat",
    name: "Out of Combat",
    description: "Unlocks the situation for rules that run after combat ends.",
    kind: "unlock-rune",
    tier: 1,
    recipeGroup: "forest",
    requiredBiomeLevel: 2,
    runeId: "when-idle",
    runeKind: "condition",
    cost: { green: 180 },
  },
  {
    id: "rune-recipe-reload-safely",
    name: "Reload Safely",
    description: "Unlocks out-of-combat reload maintenance for reload classes.",
    kind: "unlock-rune",
    tier: 1,
    recipeGroup: "forest",
    requiredBiomeLevel: 2,
    runeId: "tactical-reload",
    runeKind: "action",
    cost: { green: 140, blue: 60 },
  },
  {
    id: "rune-recipe-ready-execution",
    name: "Ready Execution",
    description: "Unlocks out-of-combat execution waiting for cooldown classes.",
    kind: "unlock-rune",
    tier: 1,
    recipeGroup: "forest",
    requiredBiomeLevel: 3,
    runeId: "wait-for-execution",
    runeKind: "action",
    cost: { green: 140, red: 60 },
  },
  {
    id: "rune-recipe-focus-highest-hp",
    name: "Focus Highest HP",
    description: "Unlocks target selection that focuses the enemy with the largest maximum health pool.",
    kind: "unlock-rune",
    tier: 1,
    recipeGroup: "forest",
    requiredBiomeLevel: 4,
    runeId: "focus-highest-max-hp",
    runeKind: "action",
    cost: { green: 220 },
  },
  {
    id: "rune-recipe-low-hp",
    name: "HP Below 25%",
    description: "Unlocks the situation for emergency behavior.",
    kind: "unlock-rune",
    tier: 1,
    recipeGroup: "cave",
    requiredBiomeLevel: 2,
    runeId: "hp-below-25",
    runeKind: "condition",
    cost: { red: 180 },
  },
  {
    id: "rune-recipe-avoid-hazards",
    name: "Avoid Hazards",
    description: "Unlocks pathing that routes around damaging and slowing terrain.",
    kind: "unlock-rune",
    tier: 1,
    recipeGroup: "swamp",
    requiredBiomeLevel: 2,
    runeId: "avoid-hazards",
    runeKind: "action",
    cost: { purple: 90 },
  },
  {
    id: "rune-recipe-flee",
    name: "Flee",
    description: "Unlocks retreat behavior for dangerous fights.",
    kind: "unlock-rune",
    tier: 1,
    recipeGroup: "cave",
    requiredBiomeLevel: 2,
    runeId: "flee",
    runeKind: "action",
    cost: { red: 160, green: 80 },
  },
  {
    id: "rune-recipe-recover-first",
    name: "Recover First",
    description: "Unlocks waiting for full health after combat.",
    kind: "unlock-rune",
    tier: 1,
    recipeGroup: "cave",
    requiredBiomeLevel: 3,
    runeId: "wait-for-regen",
    runeKind: "action",
    cost: { red: 140, green: 100 },
  },
  {
    id: "rune-recipe-keep-distance",
    name: "Keep Distance",
    description: "Unlocks kiting movement while attacking.",
    kind: "unlock-rune",
    tier: 1,
    recipeGroup: "mountain",
    requiredBiomeLevel: 3,
    runeId: "orbit",
    runeKind: "action",
    cost: { blue: 180, yellow: 80 },
  },
  {
    id: "rune-recipe-surrounded",
    name: "Surrounded",
    description: "Unlocks rules for being chased by three or more enemies.",
    kind: "unlock-rune",
    tier: 2,
    recipeGroup: "swamp",
    requiredBiomeLevel: 3,
    runeId: "n-aggro-3",
    runeKind: "condition",
    cost: { purple: 240, red: 100 },
  },
  {
    id: "rune-recipe-focus-lowest-hp",
    name: "Focus Lowest HP",
    description: "Unlocks target selection for finishing weakened enemies.",
    kind: "unlock-rune",
    tier: 2,
    recipeGroup: "swamp",
    requiredBiomeLevel: 2,
    runeId: "focus-lowest-hp",
    runeKind: "action",
    cost: { purple: 240, yellow: 120 },
  },
  {
    id: "rune-recipe-let-dots-finish",
    name: "Let DoTs Finish",
    description: "Unlocks DoT-class target selection that leaves enemies your DoTs should finish.",
    kind: "unlock-rune",
    tier: 2,
    recipeGroup: "swamp",
    requiredBiomeLevel: 3,
    runeId: "let-dots-finish",
    runeKind: "action",
    cost: { purple: 220, green: 120 },
  },
  {
    id: "rune-recipe-spread-dots",
    name: "Spread DoTs",
    description: "Unlocks DoT-class target selection that rotates between enemies to upkeep DoTs.",
    kind: "unlock-rune",
    tier: 2,
    recipeGroup: "swamp",
    requiredBiomeLevel: 4,
    runeId: "spread-dots",
    runeKind: "action",
    cost: { purple: 280, red: 120 },
  },
  {
    // Graveyard teaches the counter to its own necromancers: prioritize the
    // yellow-outlined elites (reusable in any biome with a priority threat — trench
    // apex predators, etc.). requiredBiomeLevel is a PLACEHOLDER (Step 15 numbers).
    id: "rune-recipe-focus-elites",
    name: "Focus Elites",
    description: "Unlocks target selection that prioritizes elite enemies (the yellow-outlined standouts) before the rest.",
    kind: "unlock-rune",
    tier: 4,
    recipeGroup: "graveyard",
    requiredBiomeLevel: 4,
    runeId: "focus-elites",
    runeKind: "action",
    cost: { purple: 320, blue: 140 },
  },
];

export const RUNE_RECIPE_DATABASE = new Map<string, RuneRecipe>(
  recipes.map((recipe) => [recipe.id, recipe]),
);

export function runeIdsFromCraftedRecipes(craftedRecipeIds: readonly string[]): string[] {
  const ids = new Set(STARTER_RUNE_IDS);
  for (const recipeId of craftedRecipeIds) {
    const recipe = RUNE_RECIPE_DATABASE.get(recipeId);
    if (recipe?.kind === "unlock-rune" && recipe.runeId && isRuneFragmentKnown(recipe.runeId)) {
      ids.add(recipe.runeId);
    }
  }
  return [...ids];
}

/** Progression inputs that gate whether a rune recipe is unlocked yet. */
export interface RuneRecipeGateInput {
  biomeLevel: Record<string, number>;
  bossesCleared: readonly string[];
}

/**
 * Whether the recipe's unlock requirements are met. Biome-mastery recipes gate on
 * `requiredBiomeLevel` in `recipeGroup`; advanced recipes gate on `requiredBossClear`.
 * A recipe carrying both must satisfy both. Recipes with neither are always unlocked.
 */
export function isRuneRecipeUnlocked(recipe: RuneRecipe, input: RuneRecipeGateInput): boolean {
  if (recipe.recipeGroup && recipe.requiredBiomeLevel !== undefined) {
    if ((input.biomeLevel[recipe.recipeGroup] ?? 0) < recipe.requiredBiomeLevel) return false;
  }
  if (recipe.requiredBossClear) {
    if (!input.bossesCleared.includes(recipe.requiredBossClear)) return false;
  }
  return true;
}

export function runeRecipeRequiredArchetype(recipe: RuneRecipe): Exclude<CombatArchetype, null> | null {
  if (recipe.kind !== "unlock-rune" || !recipe.runeId) return null;
  return ACTION_DATABASE.get(recipe.runeId)?.requiredArchetype ?? null;
}

export function isRuneRecipeAvailableForArchetype(
  recipe: RuneRecipe,
  combatArchetype: CombatArchetype | undefined,
): boolean {
  const required = runeRecipeRequiredArchetype(recipe);
  return required === null || required === combatArchetype;
}

export function validateRuneRecipes(): string[] {
  const errors: string[] = [];
  for (const recipe of RUNE_RECIPE_DATABASE.values()) {
    if (recipe.kind === "unlock-rune") {
      if (!recipe.runeId || !isRuneFragmentKnown(recipe.runeId)) {
        errors.push(`${recipe.id} points at an unknown rune fragment.`);
      } else if (recipe.runeKind === "condition" && !CONDITION_DATABASE.has(recipe.runeId)) {
        errors.push(`${recipe.id} marks an action as a condition.`);
      } else if (recipe.runeKind === "action" && !ACTION_DATABASE.has(recipe.runeId)) {
        errors.push(`${recipe.id} marks a condition as an action.`);
      }
    }
  }
  return errors;
}
