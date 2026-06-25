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
    lineageId: recipe.lineageId,
    evolvesFrom: recipe.evolvesFrom,
    rangeTag: recipe.rangeTag,
  });
}
