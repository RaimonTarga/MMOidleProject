import type { Recipe } from './types';

// DESERT (debuts T2). Identity: last-stand + cleanse armor / ambush weapon /
// cleanse-or-burst charm. Charm rework: upgrades ramp the empty-heal, hpRegen flat
// (cleanse stacks/interval stay flat — too chunky to ramp). See mountain.recipes.ts.

export const desertRecipeEntries = [
  // ── T2 ──
  ['desert-sunsteel-cross', {
    id: 'desert-sunsteel-cross', name: 'Sunsteel Cross',
    recipeGroup: 'desert', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { yellow: 70 }, stats: { attack: 14 }, attacksPerSecond: 0.70, tier: 2,
    mechanicEffects: { 'weapon.first-strike-mult': 2.0 },
    icon: 'items/weapons/sword-3.png',
    description: 'Sun-forged and ward-etched, it strikes the first blow as if it waited years for it.',
    upgrades: [
      { stats: { attack: 6 }, cost: { yellow: 34 }, requiredBiomeLevel: 5 },
      { stats: { attack: 6 }, cost: { yellow: 70 }, requiredBiomeLevel: 6 },
      { stats: { attack: 6 }, cost: { yellow: 115 }, requiredBiomeLevel: 7 },
    ],
  }],

  ['desert-vest-t2', {
    id: 'desert-vest-t2', name: 'Duneplate of the Last Stand',
    recipeGroup: 'desert', requiredBiomeLevel: 4, slot: 'armor',
    cost: { yellow: 70 }, stats: { maxHp: 44, plating: 10 },
    mechanicEffects: { 'defense.cheat-death': 1, 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 8000 },
    tier: 2,
    icon: 'items/armor/plate-armor-5.png',
    description: 'Plate of the standfast dead, who are said to have refused to fall even once.',
    upgrades: [
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 34 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 70 }, requiredBiomeLevel: 5 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 115 }, requiredBiomeLevel: 6 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp cleanse empty-heal 0.03 -> 0.06 (stacks/interval flat).
  ['desert-charm-t2', {
    id: 'desert-charm-t2', name: 'Mirage Core',
    recipeGroup: 'desert', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { yellow: 58 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 6000, 'defense.cleanse-empty-heal-pct': 0.03 },
    tier: 2,
    icon: 'items/charms/tear-charm-1.png',
    description: 'A shard of cooled glass that shows you water which is not there, and mends what is.',
    upgrades: [
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 28 }, requiredBiomeLevel: 3 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 58 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 96 }, requiredBiomeLevel: 5 },
    ],
  }],

  ['desert-boots-t2', {
    id: 'desert-boots-t2', name: 'Sand Sprint',
    recipeGroup: 'desert', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { yellow: 58 }, stats: { speed: 58 }, tier: 2,
    mechanicEffects: { 'mobility.kite-speed-pct': 0.40 },
    icon: 'items/boots/mage-boots-1.png',
    description: 'Wide and light, made to outpace a storm across open dune.',
    upgrades: [
      { stats: { speed: 8 },  cost: { yellow: 28 }, requiredBiomeLevel: 2 },
      { stats: { speed: 12 }, cost: { yellow: 58 }, requiredBiomeLevel: 3 },
      { stats: { speed: 16 }, cost: { yellow: 96 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T3 ──
  ['desert-solar-cross', {
    id: 'desert-solar-cross', name: 'Solar Cross',
    recipeGroup: 'desert', requiredBiomeLevel: 8, slot: 'weapon',
    cost: { yellow: 116 }, stats: { attack: 34 }, attacksPerSecond: 0.70, tier: 3,
    mechanicEffects: { 'weapon.first-strike-mult': 2.0 },
    icon: 'items/weapons/sword-3.png',
    description: 'It saves its fury for the opening blow, and spends it all at once.',
    upgrades: [
      { stats: { attack: 8 }, cost: { yellow: 58 },  requiredBiomeLevel: 9 },
      { stats: { attack: 8 }, cost: { yellow: 116 }, requiredBiomeLevel: 10 },
      { stats: { attack: 8 }, cost: { yellow: 196 }, requiredBiomeLevel: 11 },
    ],
  }],

  ['desert-vest-t3', {
    id: 'desert-vest-t3', name: 'Eternal Duneplate',
    recipeGroup: 'desert', requiredBiomeLevel: 11, slot: 'armor',
    cost: { yellow: 116 }, stats: { maxHp: 90, plating: 20 },
    mechanicEffects: { 'defense.cheat-death': 1, 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 8000, 'defense.debuff-resist': 0.20 },
    tier: 3,
    icon: 'items/armor/plate-armor-5.png',
    description: 'Worn by the standfast dead, who shed curses like sand and refused, once, to die.',
    upgrades: [
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 58 },  requiredBiomeLevel: 11 },
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 116 }, requiredBiomeLevel: 11 },
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 196 }, requiredBiomeLevel: 11 },
    ],
  }],

  ['desert-boots-t3', {
    id: 'desert-boots-t3', name: 'Mirage Striders',
    recipeGroup: 'desert', requiredBiomeLevel: 5, slot: 'mobility',
    cost: { yellow: 80 }, stats: { speed: 96 }, tier: 3,
    mechanicEffects: { 'mobility.kite-speed-pct': 0.55 },
    icon: 'items/boots/mage-boots-2.png',
    description: 'By the time the storm reaches where you stood, you are already a rumor on the next dune.',
    upgrades: [
      { stats: { speed: 10 }, cost: { yellow: 40 },  requiredBiomeLevel: 6 },
      { stats: { speed: 14 }, cost: { yellow: 80 },  requiredBiomeLevel: 7 },
      { stats: { speed: 18 }, cost: { yellow: 138 }, requiredBiomeLevel: 8 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp cleanse empty-heal 0.05 -> 0.08.
  ['desert-charm-t3', {
    id: 'desert-charm-t3', name: 'Oasis Core',
    recipeGroup: 'desert', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { yellow: 100 }, stats: { hpRegen: 11 },
    mechanicEffects: { 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 6000, 'defense.cleanse-empty-heal-pct': 0.05 },
    tier: 3,
    icon: 'items/charms/tear-charm-1.png',
    description: 'It strips the curse from your blood, or — finding none — gives you a swallow of water instead.',
    upgrades: [
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 50 },  requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 100 }, requiredBiomeLevel: 11 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 175 }, requiredBiomeLevel: 11 },
    ],
  }],
] satisfies [string, Recipe][];
