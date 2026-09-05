import type { EssenceType } from "./items";
import { STANCE_DATABASE } from "./stances";

export interface StanceRecipe {
  id: string; name: string; description: string; stanceId: string; tier: number;
  cost: Partial<Record<EssenceType, number>>;
  catalystCost?: Partial<Record<string, number>>;
  recipeGroup?: string; requiredBiomeLevel?: number; requiredBossClear?: string;
}

/**
 * PLACEMENT RULES (corrective pass 2026-08-22, redistributed 2026-09-04).
 * `recipeGates.test.ts` enforces all three across every recipe database; read it
 * before moving a recipe.
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
 *     outside the test room. The repo-wide convention is to use the biome's
 *     NATIVE_MODIFIER when it fits; this redistribution uses only live families
 *     and keeps role-appropriate exceptions explicit.
 *
 * The 2026-09-04 redistribution places the Tier-2 Stances in their locked biome
 * sequence and uses local essence plus role-appropriate live catalyst families.
 *
 * The locked Tier-3 redistribution places the four conditional/specialized
 * Stances in their T3 homes. The follow-on Tier-4 redistribution moves the
 * three advanced stateful Stances into T4, moves Recuperating to Graveyard,
 * and places the already-implemented Powering Up in Trench.
 *
 * Stance mechanics and recipe IDs remain unchanged. The three newly placed
 * postures use stable recipe IDs matching their existing stance IDs.
 */
const recipes: StanceRecipe[] = [
  // Introductory/basic stances: deliberately cheap and available at the start of
  // the returning-biome T2 continuation band.
  { id: "stance-recipe-offensive", name: "Offensive Stance", description: "Trade defense for damage and tempo.", stanceId: "offensive-stance", tier: 2, recipeGroup: "plains", requiredBiomeLevel: 7, cost: { yellow: 60 }, catalystCost: { alacrity: 1 } },
  { id: "stance-recipe-defensive", name: "Defensive Stance", description: "Trade offense for dependable protection.", stanceId: "defensive-stance", tier: 2, recipeGroup: "plains", requiredBiomeLevel: 7, cost: { yellow: 60 }, catalystCost: { fortified: 1 } },
  { id: "stance-recipe-tanking", name: "Tanking Stance", description: "Become dramatically safer and dramatically slower.", stanceId: "tanking-stance", tier: 2, recipeGroup: "mountain", requiredBiomeLevel: 8, cost: { blue: 100 }, catalystCost: { heavy: 1 } },
  { id: "stance-recipe-enraged", name: "Enraged Stance", description: "Answer danger with finishing pressure.", stanceId: "enraged-stance", tier: 2, recipeGroup: "cave", requiredBiomeLevel: 8, cost: { red: 110 }, catalystCost: { dominion: 1 } },
  { id: "stance-recipe-perfection", name: "Perfection Stance", description: "Reward near-perfect control.", stanceId: "perfection-stance", tier: 2, recipeGroup: "forest", requiredBiomeLevel: 8, cost: { green: 110 }, catalystCost: { alacrity: 1 } },
  // Specialized T2 stances stay early in their returning-biome band, but carry
  // the full 90-120 essence price rather than the Plains introduction price.
  { id: "stance-recipe-fleeting", name: "Fleeting Stance", description: "Abandon pressure to reposition and escape.", stanceId: "fleeting-stance", tier: 2, recipeGroup: "swamp", requiredBiomeLevel: 8, cost: { purple: 110 }, catalystCost: { alacrity: 1 } },
  // T3 conditional/specialized Stances: early in each biome's own T3 band, with
  // local essence and exactly two live catalysts.
  // Cave T3 L13 — high output paid for with the stance's existing self-bleed.
  { id: "stance-recipe-berserker", name: "Berserker Stance", description: "Gain tempo while bleeding your own life away.", stanceId: "berserker-stance", tier: 3, recipeGroup: "cave", requiredBiomeLevel: 13, cost: { red: 230 }, catalystCost: { dominion: 2 } },
  // Swamp T3 L13 — endure layered harmful statuses rather than cleanse them.
  { id: "stance-recipe-warding", name: "Warding Stance", description: "Endure harmful statuses at a severe offensive cost.", stanceId: "warding-stance", tier: 3, recipeGroup: "swamp", requiredBiomeLevel: 13, cost: { purple: 220 }, catalystCost: { fortified: 2 } },
  // Tundra T3 L2 — Dominion is live here and reinforces isolated, deliberate pulls.
  { id: "stance-recipe-predator", name: "Predator Stance", description: "Stalk enemies and empower the opening strike.", stanceId: "predator-stance", tier: 3, recipeGroup: "tundra", requiredBiomeLevel: 2, cost: { blue: 210 }, catalystCost: { dominion: 2 } },
  // Desert T3 L7 — precision finishing pressure in the local yellow essence band.
  { id: "stance-recipe-execute", name: "Execute Stance", description: "Finish wounded prey at the cost of neutral pressure.", stanceId: "execute-stance", tier: 3, recipeGroup: "desert", requiredBiomeLevel: 7, cost: { yellow: 230 }, catalystCost: { dominion: 2 } },
  // T4 advanced/stateful Stances: 3-4 live catalysts and a moderate local
  // essence bill, ordered before their biome's Core/Relic where applicable.
  // Mountain T4 L20 — deliberate slow/heavy preparation for an empowered hit.
  { id: "stance-recipe-time-to-strike", name: "Time to Strike", description: "Commit to one empowered hit at the cost of ordinary tempo.", stanceId: "time-to-strike-stance", tier: 4, recipeGroup: "mountain", requiredBiomeLevel: 20, cost: { blue: 450 }, catalystCost: { heavy: 3 } },
  // Jungle T4 L14 — crowd mitigation where multiple attackers are common.
  { id: "stance-recipe-brawler", name: "Brawler Stance", description: "Endure the pressure of many attackers.", stanceId: "brawler-stance", tier: 4, recipeGroup: "jungle", requiredBiomeLevel: 14, cost: { green: 500 }, catalystCost: { swarming: 3 } },
  // Volcanic T4 L8 — kill momentum through the native Swarming identity.
  { id: "stance-recipe-reaper", name: "Reaper Stance", description: "Turn a kill into short-lived momentum against the next target.", stanceId: "reaper-stance", tier: 4, recipeGroup: "volcanic", requiredBiomeLevel: 8, cost: { red: 500 }, catalystCost: { swarming: 3 } },
  // Graveyard T4 L2 — persistent pressure makes in-combat Recovery the point.
  { id: "stance-recipe-recuperating", name: "Recuperating Stance", description: "Surrender offense to regenerate during combat.", stanceId: "recuperating-stance", tier: 4, recipeGroup: "graveyard", requiredBiomeLevel: 2, cost: { purple: 450 }, catalystCost: { fortified: 3 } },
  // Trench T4 L2 — deliberate charge/release play against long single-target fights.
  { id: "stance-recipe-powering-up", name: "Powering Up", description: "Charge through a weak posture, then leave to release stored offense.", stanceId: "powering-up-stance", tier: 4, recipeGroup: "trench", requiredBiomeLevel: 2, cost: { green: 550 }, catalystCost: { dominion: 4 } },
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
