import type { EssenceType } from "./items";
import type { CombatArchetype } from "./types/combat";
import {
  ACTION_DATABASE,
  CONDITION_DATABASE,
  STARTER_RUNE_IDS,
  isRuneFragmentKnown,
} from "./runeDatabase";

export type RuneRecipeKind = "unlock-rune" | "increase-rune-points";
export type RuneFragmentKind = "condition" | "action";

export interface RuneRecipe {
  id: string;
  name: string;
  description: string;
  kind: RuneRecipeKind;
  tier: number;
  cost: Partial<Record<EssenceType, number>>;
  requiredBossClear?: string;
  runeId?: string;
  runeKind?: RuneFragmentKind;
  runePointBonus?: number;
}

const recipes: RuneRecipe[] = [
  {
    id: "rune-recipe-out-of-combat",
    name: "Out of Combat",
    description: "Unlocks the situation for rules that run after combat ends.",
    kind: "unlock-rune",
    tier: 1,
    requiredBossClear: "forest:1",
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
    requiredBossClear: "forest:1",
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
    requiredBossClear: "forest:1",
    runeId: "wait-for-execution",
    runeKind: "action",
    cost: { green: 140, red: 60 },
  },
  {
    id: "rune-recipe-rp-forest-1",
    name: "Rune Capacity I",
    description: "Permanently increases maximum rune points by 1.",
    kind: "increase-rune-points",
    tier: 1,
    requiredBossClear: "forest:1",
    runePointBonus: 1,
    cost: { green: 280, blue: 100 },
  },
  {
    id: "rune-recipe-low-hp",
    name: "HP Below 25%",
    description: "Unlocks the situation for emergency behavior.",
    kind: "unlock-rune",
    tier: 1,
    requiredBossClear: "cave:1",
    runeId: "hp-below-25",
    runeKind: "condition",
    cost: { red: 180 },
  },
  {
    id: "rune-recipe-flee",
    name: "Flee",
    description: "Unlocks retreat behavior for dangerous fights.",
    kind: "unlock-rune",
    tier: 1,
    requiredBossClear: "cave:1",
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
    requiredBossClear: "cave:1",
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
    requiredBossClear: "mountain:1",
    runeId: "orbit",
    runeKind: "action",
    cost: { blue: 180, yellow: 80 },
  },
  {
    id: "rune-recipe-rp-mountain-1",
    name: "Rune Capacity II",
    description: "Permanently increases maximum rune points by 1.",
    kind: "increase-rune-points",
    tier: 1,
    requiredBossClear: "mountain:1",
    runePointBonus: 1,
    cost: { blue: 320, yellow: 120 },
  },
  {
    id: "rune-recipe-surrounded",
    name: "Surrounded",
    description: "Unlocks rules for being chased by three or more enemies.",
    kind: "unlock-rune",
    tier: 2,
    requiredBossClear: "swamp:1",
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
    requiredBossClear: "swamp:1",
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
    requiredBossClear: "swamp:1",
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
    requiredBossClear: "swamp:1",
    runeId: "spread-dots",
    runeKind: "action",
    cost: { purple: 280, red: 120 },
  },
  {
    id: "rune-recipe-rp-swamp-1",
    name: "Rune Capacity III",
    description: "Permanently increases maximum rune points by 1.",
    kind: "increase-rune-points",
    tier: 2,
    requiredBossClear: "swamp:1",
    runePointBonus: 1,
    cost: { purple: 360, red: 160 },
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

export function runePointBonusFromCraftedRecipes(craftedRecipeIds: readonly string[]): number {
  let bonus = 0;
  for (const recipeId of craftedRecipeIds) {
    const recipe = RUNE_RECIPE_DATABASE.get(recipeId);
    if (recipe?.kind === "increase-rune-points") {
      bonus += Math.max(0, recipe.runePointBonus ?? 0);
    }
  }
  return bonus;
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
    if (recipe.kind === "increase-rune-points" && (recipe.runePointBonus ?? 0) <= 0) {
      errors.push(`${recipe.id} must grant positive rune points.`);
    }
  }
  return errors;
}
