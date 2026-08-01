import type { Recipe } from './types';

// CLEARING (T0 tutorial). Charm is pure-regen (no secondary effect) -> it keeps
// upgrading hpRegen (the regen IS its mechanic). See recipes index for conventions.

export const clearingRecipeEntries = [
  ['primordial-club', {
    id: 'primordial-club', name: 'Primordial Club',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 4 }, stats: { attack: 3 }, attacksPerSecond: 0.65, tier: 0,
    icon: 'items/weapons/primordial-club.png',
    description: 'Whittled from ironwood in a single evening, and it has not snapped since.',
    upgrades: [
      { stats: { attack: 1 }, cost: { green: 2  }, requiredBiomeLevel: 2 },
      { stats: { attack: 1 }, cost: { green: 4 }, requiredBiomeLevel: 3 },
      { stats: { attack: 1 }, cost: { green: 8 }, requiredBiomeLevel: 4 },
      { stats: { attack: 1 }, cost: { green: 8 }, requiredBiomeLevel: 4 },
      { stats: { attack: 1 }, cost: { green: 8 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['clearing-vest-t1', {
    id: 'clearing-vest-t1', name: 'Bark Wrap',
    recipeGroup: 'clearing', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 4 }, stats: { maxHp: 4, plating: 4 }, tier: 0,
    icon: 'items/armor/rags-1.png',
    description: 'Bound bark and twine, smelling of sap and rain — the first armor any wanderer learns to make.',
    upgrades: [
      { stats: { maxHp: 1, plating: 1 }, cost: { green: 2 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 1, plating: 1 }, cost: { green: 4 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 1, plating: 1 }, cost: { green: 8 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 1, plating: 1 }, cost: { green: 8 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 1, plating: 1 }, cost: { green: 8 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Pure-regen charm: keeps upgrading hpRegen (regen is its only effect).
  ['clearing-charm-t1', {
    id: 'clearing-charm-t1', name: 'Herb Pouch',
    recipeGroup: 'clearing', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 3 }, stats: { hpRegen: 2 }, tier: 0,
    icon: 'items/charms/wood-charm-1.png',
    description: 'A drawstring pouch of bruised green leaves, gathered at the forest edge.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { green: 1 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { green: 3 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { green: 6 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { green: 6 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { green: 6 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['clearing-boots-t1', {
    id: 'clearing-boots-t1', name: 'Soft Boots',
    recipeGroup: 'clearing', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { green: 3 }, stats: { speed: 12 }, tier: 0,
    icon: 'items/boots/leather-boots-1.png',
    description: 'Worn soft by a hundred miles of easy trail.',
    upgrades: [
      { stats: { speed: 3 }, cost: { green: 1 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { green: 2 }, requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 4 }, requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 4 }, requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 4 }, requiredBiomeLevel: 4 },
    ],
  }],


] satisfies [string, Recipe][];
