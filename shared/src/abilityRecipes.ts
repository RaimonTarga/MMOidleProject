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
//
// Each ability is its biome's "answer tool" — placed MID-band so the player meets
// the biome's challenge first, then earns the response. T1 sits at level 3 of the
// L1–6 T1 band; T2 sits at level 9 of the L7–12 band (BIOME_LEVELS_PER_TIER = 6),
// which is how a T2 ability can live in a biome that debuts at T1.
//
// Re-keyed to the abilities-evolution T1 table: Sweep→Plains, Second Wind→Forest,
// Brace→Mountain, Expose Weakness→Cave (Cleanse was already Swamp). Safe to move —
// `knownAbilities` stores ABILITY ids, so nobody loses a learned ability.
const recipes: AbilityRecipe[] = [
  {
    id: "ability-recipe-sweep",
    name: "Sweep",
    description: "Learn the Sweep technique: arm your next attack to cleave.",
    abilityId: "sweep",
    tier: 1,
    // Plains is the swarm biome — density is the problem Sweep answers.
    recipeGroup: "plains",
    requiredBiomeLevel: 3,
    cost: { green: 160 },
  },
  {
    id: "ability-recipe-second-wind",
    name: "Second Wind",
    description: "Learn the Second Wind guard: recover health when badly wounded.",
    abilityId: "second-wind",
    tier: 1,
    // Forest pressures through frequent small hits — sustain is the answer.
    recipeGroup: "forest",
    requiredBiomeLevel: 3,
    cost: { green: 150 },
  },
  {
    id: "ability-recipe-brace",
    name: "Brace",
    description: "Learn the Brace guard: shield yourself under heavy pressure.",
    abilityId: "brace",
    tier: 1,
    // Mountain is the telegraphed-huge-hit biome — Brace is the mitigation beat.
    recipeGroup: "mountain",
    requiredBiomeLevel: 3,
    cost: { yellow: 140, green: 60 },
  },
  {
    id: "ability-recipe-cleanse",
    name: "Cleanse",
    description: "Learn the Cleanse guard: purge rot and debuffs under pressure.",
    abilityId: "cleanse",
    tier: 1,
    // Swamp is attrition-by-DoT — stripping stacks is the answer.
    recipeGroup: "swamp",
    requiredBiomeLevel: 3,
    cost: { green: 150 },
  },
  {
    id: "ability-recipe-expose-weakness",
    name: "Expose Weakness",
    description: "Learn the Expose Weakness technique: make a target take increased damage.",
    abilityId: "expose-weakness",
    tier: 1,
    // Cave is few-but-elite — killing the big one faster is the answer.
    recipeGroup: "cave",
    requiredBiomeLevel: 3,
    cost: { purple: 150 },
  },
  // ── T2 (abilities evolution §9): reflect, repositioning, and the first cast. ──
  {
    id: "ability-recipe-bramble-guard",
    name: "Bramble Guard",
    description: "Learn the Bramble Guard: armor yourself with thorns that injure attackers.",
    abilityId: "bramble-guard",
    tier: 2,
    // Jungle: high density + aggressive on-hit profile.
    recipeGroup: "jungle",
    requiredBiomeLevel: 3,
    cost: { green: 320 },
  },
  {
    id: "ability-recipe-charge",
    name: "Charge",
    description: "Learn Charge: close the gap instantly and land an empowered blow.",
    abilityId: "charge",
    tier: 2,
    // Desert: the low-density standoff biome, where closing distance is the problem.
    recipeGroup: "desert",
    requiredBiomeLevel: 3,
    cost: { yellow: 320 },
  },
  {
    id: "ability-recipe-charged-strike",
    name: "Charged Strike",
    description: "Learn Charged Strike: wind up a heavy blow that hard control can interrupt.",
    abilityId: "charged-strike",
    tier: 2,
    // Mountain again, in its T2 band — the biome that taught you to READ a
    // wind-up is the one that teaches you to perform one.
    recipeGroup: "mountain",
    requiredBiomeLevel: 9,
    cost: { yellow: 300, blue: 120 },
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
