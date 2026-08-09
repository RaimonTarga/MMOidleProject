import type { EssenceType } from "./items";
import { RITE_DATABASE } from "./rites";

export interface RiteRecipe {
  id: string; name: string; description: string; riteId: string; tier: number;
  cost: Partial<Record<EssenceType, number>>;
  catalystCost?: Partial<Record<string, number>>;
  recipeGroup?: string; requiredBiomeLevel?: number; requiredBossClear?: string;
}

const recipes: RiteRecipe[] = [
  { id: "rite-recipe-swift-repose", name: "Swift Repose", description: "Leave combat sooner and begin recovery earlier.", riteId: "swift-repose", tier: 3, recipeGroup: "forest", requiredBiomeLevel: 13, cost: { green: 120 }, catalystCost: { alacrity: 4 } },
  { id: "rite-recipe-purification", name: "Purification", description: "Remove harmful carryover when combat ends.", riteId: "purification", tier: 3, recipeGroup: "forest", requiredBiomeLevel: 13, cost: { green: 120, purple: 40 }, catalystCost: { blight: 4 } },
  { id: "rite-recipe-lingering-battle", name: "Lingering Battle", description: "Remain in combat state longer between engagements.", riteId: "lingering-battle", tier: 3, recipeGroup: "forest", requiredBiomeLevel: 14, cost: { green: 130, yellow: 40 }, catalystCost: { alacrity: 5 } },
  { id: "rite-recipe-blood-offering", name: "Blood Offering", description: "Recover health from credited kills.", riteId: "blood-offering", tier: 3, recipeGroup: "forest", requiredBiomeLevel: 14, cost: { green: 130, red: 40 }, catalystCost: { predation: 5 } },
  { id: "rite-recipe-mechanic-renewal", name: "Mechanic Renewal", description: "Prepare your class mechanic when combat ends.", riteId: "mechanic-renewal", tier: 3, recipeGroup: "tundra", requiredBiomeLevel: 14, cost: { blue: 160, yellow: 60 }, catalystCost: { alacrity: 6 } },
  { id: "rite-recipe-ability-reprieve", name: "Ability Reprieve", description: "Reduce equipped ability cooldowns when combat ends.", riteId: "ability-reprieve", tier: 3, recipeGroup: "desert", requiredBiomeLevel: 14, cost: { red: 160, purple: 60 }, catalystCost: { volatility: 6 } },
];

export const RITE_RECIPE_DATABASE = new Map<string, RiteRecipe>(recipes.map((r) => [r.id, r]));
export interface RiteRecipeGateInput { biomeLevel: Record<string, number>; bossesCleared: readonly string[]; }
export function isRiteRecipeUnlocked(recipe: RiteRecipe, input: RiteRecipeGateInput): boolean {
  if (recipe.recipeGroup && recipe.requiredBiomeLevel !== undefined && (input.biomeLevel[recipe.recipeGroup] ?? 0) < recipe.requiredBiomeLevel) return false;
  return !recipe.requiredBossClear || input.bossesCleared.includes(recipe.requiredBossClear);
}
export function validateRiteRecipes(): string[] {
  return [...RITE_RECIPE_DATABASE.values()].filter((r) => !RITE_DATABASE.has(r.riteId)).map((r) => `${r.id} points at unknown rite ${r.riteId}.`);
}
