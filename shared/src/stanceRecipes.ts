import type { EssenceType } from "./items";
import { STANCE_DATABASE } from "./stances";

export interface StanceRecipe {
  id: string; name: string; description: string; stanceId: string; tier: number;
  cost: Partial<Record<EssenceType, number>>;
  catalystCost?: Partial<Record<string, number>>;
  recipeGroup?: string; requiredBiomeLevel?: number; requiredBossClear?: string;
}

const recipes: StanceRecipe[] = [
  { id: "stance-recipe-offensive", name: "Offensive Stance", description: "Trade defense for damage and tempo.", stanceId: "offensive-stance", tier: 2, recipeGroup: "forest", requiredBiomeLevel: 7, cost: { green: 60 }, catalystCost: { alacrity: 2 } },
  { id: "stance-recipe-defensive", name: "Defensive Stance", description: "Trade offense for dependable protection.", stanceId: "defensive-stance", tier: 2, recipeGroup: "forest", requiredBiomeLevel: 7, cost: { green: 60, blue: 20 }, catalystCost: { volatility: 2 } },
  { id: "stance-recipe-tanking", name: "Tanking Stance", description: "Become dramatically safer and dramatically slower.", stanceId: "tanking-stance", tier: 2, recipeGroup: "forest", requiredBiomeLevel: 8, cost: { green: 70, blue: 30 }, catalystCost: { brutality: 3 } },
  { id: "stance-recipe-enraged", name: "Enraged Stance", description: "Answer danger with finishing pressure.", stanceId: "enraged-stance", tier: 2, recipeGroup: "desert", requiredBiomeLevel: 8, cost: { red: 80, yellow: 30 }, catalystCost: { brutality: 3 } },
  { id: "stance-recipe-perfection", name: "Perfection Stance", description: "Reward near-perfect control.", stanceId: "perfection-stance", tier: 2, recipeGroup: "plains", requiredBiomeLevel: 8, cost: { yellow: 80, green: 30 }, catalystCost: { alacrity: 3 } },
  { id: "stance-recipe-fleeting", name: "Fleeting Stance", description: "Abandon pressure to reposition and escape.", stanceId: "fleeting-stance", tier: 2, recipeGroup: "tundra", requiredBiomeLevel: 8, cost: { blue: 80, green: 30 }, catalystCost: { alacrity: 3 } },
  { id: "stance-recipe-berserker", name: "Berserker Stance", description: "Gain tempo while bleeding your own life away.", stanceId: "berserker-stance", tier: 3, recipeGroup: "desert", requiredBiomeLevel: 13, cost: { red: 140, purple: 40 }, catalystCost: { brutality: 5 } },
  { id: "stance-recipe-predator", name: "Predator Stance", description: "Stalk enemies and empower the opening strike.", stanceId: "predator-stance", tier: 3, recipeGroup: "jungle", requiredBiomeLevel: 13, cost: { green: 130, red: 50 }, catalystCost: { predation: 5 } },
  { id: "stance-recipe-brawler", name: "Brawler Stance", description: "Endure the pressure of many attackers.", stanceId: "brawler-stance", tier: 3, recipeGroup: "plains", requiredBiomeLevel: 13, cost: { yellow: 130, red: 50 }, catalystCost: { volatility: 5 } },
  { id: "stance-recipe-execute", name: "Execute Stance", description: "Finish wounded prey at the cost of neutral pressure.", stanceId: "execute-stance", tier: 3, recipeGroup: "swamp", requiredBiomeLevel: 13, cost: { purple: 130, red: 50 }, catalystCost: { predation: 5 } },
  { id: "stance-recipe-recuperating", name: "Recuperating Stance", description: "Surrender offense to regenerate during combat.", stanceId: "recuperating-stance", tier: 4, recipeGroup: "forest", requiredBiomeLevel: 19, cost: { green: 220, blue: 100 }, catalystCost: { blight: 7 } },
];

export const STANCE_RECIPE_DATABASE = new Map<string, StanceRecipe>(recipes.map((r) => [r.id, r]));
export interface StanceRecipeGateInput { biomeLevel: Record<string, number>; bossesCleared: readonly string[]; }
export function isStanceRecipeUnlocked(recipe: StanceRecipe, input: StanceRecipeGateInput): boolean {
  if (recipe.recipeGroup && recipe.requiredBiomeLevel !== undefined && (input.biomeLevel[recipe.recipeGroup] ?? 0) < recipe.requiredBiomeLevel) return false;
  return !recipe.requiredBossClear || input.bossesCleared.includes(recipe.requiredBossClear);
}
export function validateStanceRecipes(): string[] {
  return [...STANCE_RECIPE_DATABASE.values()].filter((r) => !STANCE_DATABASE.has(r.stanceId)).map((r) => `${r.id} points at unknown stance ${r.stanceId}.`);
}
