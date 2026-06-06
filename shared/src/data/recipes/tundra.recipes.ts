import type { Recipe } from './types';

// TUNDRA (debuts T3). Identity: stationary-ramp DR + cap armor / brittle weapon /
// shield + absorb charm. Charm rework: upgrades ramp BOTH mechanics, hpRegen flat
// (see mountain.recipes.ts header).

export const tundraRecipeEntries = [

  ['tundra-permafrost-maul', {
    id: 'tundra-permafrost-maul', name: 'Permafrost Maul',
    recipeGroup: 'tundra', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 124 }, stats: { attack: 76 }, attacksPerSecond: 0.42, tier: 3,
    mechanicEffects: { 'weapon.brittle-plating': 2, 'weapon.brittle-dr': 0.01, 'weapon.brittle-stacks': 8 },
    icon: 'items/weapons/hammer-2.png',
    description: 'Each blow leaves a deep frost-crack; armor that takes enough of them simply gives.',
    upgrades: [
      { stats: { attack: 25 }, cost: { blue: 62 },  requiredBiomeLevel: 2 },
      { stats: { attack: 25 }, cost: { blue: 124 }, requiredBiomeLevel: 3 },
      { stats: { attack: 25 }, cost: { blue: 208 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp shield 0.12 -> 0.18 AND absorb 0.08 -> 0.14.
  ['tundra-charm-t3', {
    id: 'tundra-charm-t3', name: 'Frostward Charm',
    recipeGroup: 'tundra', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { blue: 104 }, stats: { hpRegen: 11 },
    mechanicEffects: {
      'defense.shield-pct': 0.12, 'defense.shield-interval-ms': 9000, 'defense.shield-duration-ms': 9000,
      'defense.absorb-pct': 0.08,
    },
    tier: 3,
    icon: 'items/charms/stone-hand-charm-2.png',
    description: 'A rime-cold ward that throws up a sheet of ice, and drinks the blows that get through.',
    upgrades: [
      { mechanicEffects: { 'defense.shield-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 52 },  requiredBiomeLevel: 3 },
      { mechanicEffects: { 'defense.shield-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 104 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.shield-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 180 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['tundra-boots-t3', {
    id: 'tundra-boots-t3', name: 'Glacier Striders',
    recipeGroup: 'tundra', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { blue: 60 }, stats: { speed: 30 }, tier: 3,
    mechanicEffects: { 'mobility.ramp-speed-pct': 0.60, 'mobility.ramp-rate': 0.30 },
    icon: 'items/boots/plate-boots-4.png',
    description: 'They gather momentum across the ice and are loath to give it back.',
    upgrades: [
      { stats: { speed: 8 },  cost: { blue: 30 },  requiredBiomeLevel: 4 },
      { stats: { speed: 12 }, cost: { blue: 60 },  requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { blue: 100 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['tundra-vest-t3', {
    id: 'tundra-vest-t3', name: 'Glacial Bulwark',
    recipeGroup: 'tundra', requiredBiomeLevel: 4, slot: 'armor',
    cost: { blue: 124 }, stats: { maxHp: 100, plating: 15 },
    mechanicEffects: {
      'defense.stationary-dr-pct': 0.15, 'defense.stationary-dr-ramptime-ms': 6000,
      'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5,
    },
    tier: 3,
    icon: 'items/armor/plate-armor-1.png',
    description: 'Stand still and the ice creeps over the plate, until you are part of the glacier itself.',
    upgrades: [
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 62 },  requiredBiomeLevel: 4 },
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 124 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 208 }, requiredBiomeLevel: 4 },
    ],
  }],

] satisfies [string, Recipe][];
