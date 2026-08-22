import type { EssenceType } from "./items";
import { STANCE_DATABASE } from "./stances";

export interface StanceRecipe {
  id: string; name: string; description: string; stanceId: string; tier: number;
  cost: Partial<Record<EssenceType, number>>;
  catalystCost?: Partial<Record<string, number>>;
  recipeGroup?: string; requiredBiomeLevel?: number; requiredBossClear?: string;
}

/**
 * PLACEMENT RULES (corrective pass 2026-08-22). `recipeGates.test.ts` enforces all
 * three across every recipe database; read it before moving a recipe.
 *
 *  1. `recipeGroup` must be a biome that still has NODES at `tier`. Three recipes had
 *     drifted onto retired content: Fleeting sat in a Tundra that does not exist at T2,
 *     Brawler in a Plains retired by T3, Recuperating in a Forest long gone by T4.
 *  2. `requiredBiomeLevel` must be reachable at `tier`, i.e. no greater than
 *     `biomeLevelCap(tier, recipeGroup)`. Late-starting biomes have a narrow band — a
 *     Desert (start T2) recipe cannot ask for level 8 at T2, because the cap is 6.
 *  3. `catalystCost` must name a LIVE node-modifier family that the biome can actually
 *     roll. Eight of these still charged the retired blight / volatility / predation /
 *     brutality families, which no player can hold, so those stances were uncraftable
 *     outside the test room. The repo-wide convention is the biome's NATIVE_MODIFIER.
 *
 * Essence costs and catalyst AMOUNTS are unchanged: this pass fixed reachability, not
 * economy.
 */
const recipes: StanceRecipe[] = [
  { id: "stance-recipe-offensive", name: "Offensive Stance", description: "Trade defense for damage and tempo.", stanceId: "offensive-stance", tier: 2, recipeGroup: "forest", requiredBiomeLevel: 7, cost: { green: 60 }, catalystCost: { alacrity: 2 } },
  { id: "stance-recipe-defensive", name: "Defensive Stance", description: "Trade offense for dependable protection.", stanceId: "defensive-stance", tier: 2, recipeGroup: "forest", requiredBiomeLevel: 7, cost: { green: 60, blue: 20 }, catalystCost: { alacrity: 2 } },
  { id: "stance-recipe-tanking", name: "Tanking Stance", description: "Become dramatically safer and dramatically slower.", stanceId: "tanking-stance", tier: 2, recipeGroup: "forest", requiredBiomeLevel: 8, cost: { green: 70, blue: 30 }, catalystCost: { alacrity: 3 } },
  // Desert starts at T2, so its whole T2 band is levels 1-6.
  { id: "stance-recipe-enraged", name: "Enraged Stance", description: "Answer danger with finishing pressure.", stanceId: "enraged-stance", tier: 2, recipeGroup: "desert", requiredBiomeLevel: 5, cost: { red: 80, yellow: 30 }, catalystCost: { dominion: 3 } },
  { id: "stance-recipe-perfection", name: "Perfection Stance", description: "Reward near-perfect control.", stanceId: "perfection-stance", tier: 2, recipeGroup: "plains", requiredBiomeLevel: 8, cost: { yellow: 80, green: 30 }, catalystCost: { alacrity: 3 } },
  // Re-homed: Tundra has no T2 nodes at all. Jungle runs T2-T4 and drops the green
  // essence half of this cost.
  { id: "stance-recipe-fleeting", name: "Fleeting Stance", description: "Abandon pressure to reposition and escape.", stanceId: "fleeting-stance", tier: 2, recipeGroup: "jungle", requiredBiomeLevel: 5, cost: { blue: 80, green: 30 }, catalystCost: { alacrity: 3 } },
  { id: "stance-recipe-berserker", name: "Berserker Stance", description: "Gain tempo while bleeding your own life away.", stanceId: "berserker-stance", tier: 3, recipeGroup: "desert", requiredBiomeLevel: 11, cost: { red: 140, purple: 40 }, catalystCost: { dominion: 5 } },
  { id: "stance-recipe-predator", name: "Predator Stance", description: "Stalk enemies and empower the opening strike.", stanceId: "predator-stance", tier: 3, recipeGroup: "jungle", requiredBiomeLevel: 11, cost: { green: 130, red: 50 }, catalystCost: { alacrity: 5 } },
  // Re-homed: Plains has retired by T3. Volcanic runs T3-T4 and its NATIVE modifier is
  // Swarming — the exact crowd this stance exists to survive — and it drops the red
  // essence half of the cost.
  { id: "stance-recipe-brawler", name: "Brawler Stance", description: "Endure the pressure of many attackers.", stanceId: "brawler-stance", tier: 3, recipeGroup: "volcanic", requiredBiomeLevel: 5, cost: { yellow: 130, red: 50 }, catalystCost: { swarming: 5 } },
  { id: "stance-recipe-execute", name: "Execute Stance", description: "Finish wounded prey at the cost of neutral pressure.", stanceId: "execute-stance", tier: 3, recipeGroup: "swamp", requiredBiomeLevel: 13, cost: { purple: 130, red: 50 }, catalystCost: { fortified: 5 } },
  // Re-homed: Forest has retired long before T4. Jungle runs to T4 and drops green.
  { id: "stance-recipe-recuperating", name: "Recuperating Stance", description: "Surrender offense to regenerate during combat.", stanceId: "recuperating-stance", tier: 4, recipeGroup: "jungle", requiredBiomeLevel: 17, cost: { green: 220, blue: 100 }, catalystCost: { alacrity: 7 } },
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
