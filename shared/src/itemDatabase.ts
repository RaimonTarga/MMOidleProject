import type { ItemDefinition } from './items';
import { RECIPE_DATABASE } from './recipeDatabase';

function mods(m: Record<string, number>): Record<string, number> { return m; }

export const ITEM_DATABASE: Map<string, ItemDefinition> = new Map([
  ['basic-sword',    { id: 'basic-sword',    name: 'Basic Sword',    slot: 'weapon',   tier: 1, statModifiers: mods({ attack: 5 }),   attacksPerSecond: 0.5, description: 'A simple iron sword.' }],
  ['leather-armor',  { id: 'leather-armor',  name: 'Leather Armor',  slot: 'armor',    tier: 1, statModifiers: mods({ plating: 5 }),  description: 'Rough but effective.' }],
  ['bandage-charm',  { id: 'bandage-charm',  name: 'Bandage Charm',  slot: 'recovery', tier: 1, statModifiers: mods({ hpRegen: 2 }),  description: 'A blood-soaked charm that speeds recovery.' }],
  ['light-boots',    { id: 'light-boots',    name: 'Light Boots',    slot: 'mobility', tier: 1, statModifiers: mods({ speed: 15 }),   description: 'Supple boots that aid movement.' }],
]);

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
  });
}
