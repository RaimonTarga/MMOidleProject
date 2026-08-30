import type { EssenceType } from "./items";
import { RITE_DATABASE } from "./rites";

export interface RiteRecipe {
  id: string; name: string; description: string; riteId: string; tier: number;
  cost: Partial<Record<EssenceType, number>>;
  catalystCost?: Partial<Record<string, number>>;
  recipeGroup?: string; requiredBiomeLevel?: number; requiredBossClear?: string;
}

/**
 * Same placement rules as stance recipes — see the header in stanceRecipes.ts, and
 * `recipeGates.test.ts` for the enforcement.
 *
 * Two rounds of drift were cleared on 2026-08-22. First, three recipes charged retired
 * catalyst families (blight / predation / volatility) and one charged a family BANNED in
 * its own biome, so four of these six rites could never be crafted at all. Second, four
 * sat in FOREST, which has no nodes past T2: reaching forest 13-14 as a T3 character meant
 * 300-600 extra kills of content you had already outgrown, purely to buy a T3 rite.
 *
 * The cast is now one rite per biome, each taking that biome's NATIVE catalyst family, and
 * each homed where its effect is the answer to that biome's pressure. Amounts are unchanged;
 * the PRIMARY essence follows the new home, per the repo-wide convention that a recipe is
 * paid for in the essence of the biome you level to unlock it.
 */
// T3 economy pass (2026-08-30): CATALYST amounts only. Ordinary/low-mid-RP rites pay 2,
// the two premium 5-RP rites pay 3 (was 4-6). Essence costs, RP costs, gates, families and
// effects are ALL UNCHANGED and deliberately so:
//  · RP is loadout OPPORTUNITY cost; essence is ACQUISITION cost. They are different
//    currencies answering different questions, so rite essence is NOT required to be
//    monotonic in RP. (Lingering Battle at 2 RP / 170 essence is not an inversion to fix.)
//  · All six rites still total 20 RP against a 19-RP budget at max T3 Global Mastery, by
//    design: limited RP forces a build choice, and rites compete with rune rules for the
//    same pool. See docs/rites-current-state.md.
const recipes: RiteRecipe[] = [
  // Cave is sparse and elite-heavy (native Dominion): long gaps between hard fights, so
  // getting back to out-of-combat recovery sooner is what the biome asks for.
  { id: "rite-recipe-swift-repose", name: "Swift Repose", description: "Leave combat sooner and begin recovery earlier.", riteId: "swift-repose", tier: 3, recipeGroup: "cave", requiredBiomeLevel: 15, cost: { red: 120 }, catalystCost: { dominion: 2 } },
  // Swamp is the poison/blight biome (native Fortified). Cleansing what a fight left on you
  // is its signature problem.
  { id: "rite-recipe-purification", name: "Purification", description: "Remove harmful carryover when combat ends.", riteId: "purification", tier: 3, recipeGroup: "swamp", requiredBiomeLevel: 15, cost: { purple: 120, green: 40 }, catalystCost: { fortified: 2 } },
  // Mountain is ponderous by identity (native Heavy) and bans Alacrity. A rite about staying
  // in the combat state longer belongs to the slowest biome in the game.
  { id: "rite-recipe-lingering-battle", name: "Lingering Battle", description: "Remain in combat state longer between engagements.", riteId: "lingering-battle", tier: 3, recipeGroup: "mountain", requiredBiomeLevel: 15, cost: { blue: 130, yellow: 40 }, catalystCost: { heavy: 2 } },
  // Volcanic is the swarm biome (native Swarming). Kill-credit recovery is a chain-farming
  // mechanic, so it wants the biome that supplies the chain. Volcanic starts at T3, so its
  // whole T3 band is levels 1-6.
  { id: "rite-recipe-blood-offering", name: "Blood Offering", description: "Recover health from credited kills.", riteId: "blood-offering", tier: 3, recipeGroup: "volcanic", requiredBiomeLevel: 5, cost: { red: 130, green: 40 }, catalystCost: { swarming: 2 } },
  // Tundra starts at T3 (band 1-6) and BANS Alacrity; its native family is Heavy.
  { id: "rite-recipe-mechanic-renewal", name: "Mechanic Renewal", description: "Prepare your class mechanic when combat ends.", riteId: "mechanic-renewal", tier: 3, recipeGroup: "tundra", requiredBiomeLevel: 5, cost: { blue: 160, yellow: 60 }, catalystCost: { heavy: 3 } },
  // Desert starts at T2, so its T3 cap is level 12.
  { id: "rite-recipe-ability-reprieve", name: "Ability Reprieve", description: "Reduce equipped ability cooldowns when combat ends.", riteId: "ability-reprieve", tier: 3, recipeGroup: "desert", requiredBiomeLevel: 11, cost: { red: 160, purple: 60 }, catalystCost: { dominion: 3 } },
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
