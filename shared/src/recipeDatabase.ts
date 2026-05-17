import type { EquipmentSlot, ItemStats } from './items';

export interface Recipe {
  id: string;
  name: string;
  /** Progression group — matches the key in PlayerState.recipeProgress. */
  recipeGroup: string;
  /** Minimum value of recipeProgress[recipeGroup] required to see/craft this recipe. */
  requiredTier: number;
  slot: EquipmentSlot;
  cost: { essence: number };
  stats: Partial<ItemStats>;
  tier: number;
  description?: string;
}

export const RECIPE_DATABASE: Map<string, Recipe> = new Map([
  ['forest-blade-t1', {
    id: 'forest-blade-t1',
    name: 'Forest Blade',
    recipeGroup: 'forest',
    requiredTier: 1,
    slot: 'weapon',
    cost: { essence: 20 },
    stats: { attack: 8 },
    tier: 1,
    description: 'A blade carved from dense forest ironwood.',
  }],
  ['forest-vest-t1', {
    id: 'forest-vest-t1',
    name: 'Bark Vest',
    recipeGroup: 'forest',
    requiredTier: 1,
    slot: 'armor',
    cost: { essence: 20 },
    stats: { defense: 7 },
    tier: 1,
    description: 'Hardened bark bound together with forest vines.',
  }],
  ['forest-boots-t1', {
    id: 'forest-boots-t1',
    name: 'Sprinter Wraps',
    recipeGroup: 'forest',
    requiredTier: 1,
    slot: 'mobility',
    cost: { essence: 15 },
    stats: { speed: 20 },
    tier: 1,
    description: 'Light wrappings that free the ankle.',
  }],
  ['forest-charm-t1', {
    id: 'forest-charm-t1',
    name: 'Moss Charm',
    recipeGroup: 'forest',
    requiredTier: 1,
    slot: 'recovery',
    cost: { essence: 15 },
    stats: { hpRegen: 3 },
    tier: 1,
    description: 'A pouch of healing moss that hastens recovery.',
  }],
]);
