import type { ItemDefinition } from './items';
import { RECIPE_DATABASE } from './recipeDatabase';

export const ITEM_DATABASE: Map<string, ItemDefinition> = new Map();

// Register all crafted items so equipItem / ITEM_DATABASE lookups work for them too.
for (const recipe of RECIPE_DATABASE.values()) {
  ITEM_DATABASE.set(recipe.id, {
    id: recipe.id,
    name: recipe.name,
    slot: recipe.slot,
    tier: recipe.tier,
    biomeGroup: recipe.recipeGroup,
    statModifiers: Object.fromEntries(
      Object.entries(recipe.stats).filter(([, v]) => v !== undefined),
    ) as Record<string, number>,
    mechanicEffects: recipe.mechanicEffects,
    attacksPerSecond: recipe.attacksPerSecond,
    description: recipe.description,
    upgrades: recipe.upgrades,
    icon: recipe.icon,
    // Cosmetic attack tint. Falls back to the reservoir DoT's element so a DoT
    // weapon never has to author the same element twice (and cannot disagree
    // with itself); `weaponDot` itself is deliberately not projected here.
    element: recipe.element ?? recipe.weaponDot?.element,
    lineageId: recipe.lineageId,
    evolvesFrom: recipe.evolvesFrom,
    coreEligibility: recipe.coreEligibility,
  });
}
