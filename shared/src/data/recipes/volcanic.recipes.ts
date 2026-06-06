import type { Recipe } from './types';

// VOLCANIC (debuts T3). Identity: hardening armor / flurry weapon / in-combat-regen
// + kill-burst charm. Charm rework: upgrades ramp BOTH mechanics, hpRegen flat
// (see mountain.recipes.ts header).

export const volcanicRecipeEntries = [
  
  ['volcanic-cinderlash', {
    id: 'volcanic-cinderlash', name: 'Cinderlash',
    recipeGroup: 'volcanic', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { red: 120 }, stats: { attack: 34 }, attacksPerSecond: 1.65, tier: 3,
    mechanicEffects: { 'weapon.flurry-pct': 0.06, 'weapon.flurry-stacks': 5 },
    icon: 'items/weapons/rapier-3.png',
    description: 'A whip of braided ember that strikes faster the longer it burns.',
    upgrades: [
      { stats: { attack: 6 }, cost: { red: 60 },  requiredBiomeLevel: 2 },
      { stats: { attack: 6 }, cost: { red: 120 }, requiredBiomeLevel: 3 },
      { stats: { attack: 6 }, cost: { red: 200 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp in-combat-regen 0.14 -> 0.20 AND kill-burst 0.08 -> 0.14.
  ['volcanic-charm-t3', {
    id: 'volcanic-charm-t3', name: 'Magmaheart Core',
    recipeGroup: 'volcanic', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { red: 100 }, stats: { hpRegen: 11 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.14, 'defense.kill-burst-pct': 0.08 },
    tier: 3,
    icon: 'items/charms/jewel-charm-2.png',
    description: 'A still-molten heart that mends you mid-fight, and flares with every kill.',
    upgrades: [
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 50 },  requiredBiomeLevel: 3 },
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 100 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 175 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['volcanic-boots-t3', {
    id: 'volcanic-boots-t3', name: 'Magma Walkers',
    recipeGroup: 'volcanic', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { red: 62 }, stats: { speed: 36 }, tier: 3,
    mechanicEffects: { 'mobility.passive-speed-pct': 0.55, 'mobility.suppress-ms': 4000 },
    icon: 'items/boots/plate-boots-5.png',
    description: 'Quick as a thrown spark — until a solid blow knocks the wind from them.',
    upgrades: [
      { stats: { speed: 8 },  cost: { red: 30 },  requiredBiomeLevel: 4 },
      { stats: { speed: 12 }, cost: { red: 62 },  requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { red: 104 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['volcanic-vest-t3', {
    id: 'volcanic-vest-t3', name: 'Emberforge Plate',
    recipeGroup: 'volcanic', requiredBiomeLevel: 4, slot: 'armor',
    cost: { red: 120 }, stats: { maxHp: 90, plating: 20 },
    mechanicEffects: { 'defense.hardening-per-sec': 3, 'defense.hardening-max': 24, 'defense.hardening-reset-pct': 0.25 },
    tier: 3,
    icon: 'items/armor/plate-armor-3.png',
    description: 'Plate quenched in a lava flow; it thickens against a steady fire and cracks only to a true blow.',
    upgrades: [
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 60 },  requiredBiomeLevel: 4 },
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 120 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 200 }, requiredBiomeLevel: 4 },
    ],
  }],


] satisfies [string, Recipe][];
