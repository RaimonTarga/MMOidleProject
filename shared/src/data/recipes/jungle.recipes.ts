import type { Recipe } from './types';

// JUNGLE (debuts T2; Forest successor). Identity: evasion + bulk armor / on-hit
// rapier / ramping-regen charm. Charm rework: upgrades ramp the mechanic, hpRegen flat
// (see mountain.recipes.ts header). MIGRATION: hardening stripped from the T2 armor
// (it now lives on Volcano) — Jungle armor is pure evasion+bulk at every tier.

export const jungleRecipeEntries = [
  // ── T2 ──
  ['jungle-stinger-rapier', {
    id: 'jungle-stinger-rapier', name: 'Stinger Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 55}, stats: { attack: 12, onHitDamage: 8 }, attacksPerSecond: 1.55, tier: 2,
    icon: 'items/weapons/rapier-3.png',
    description: 'A thin blade kept slick with something the jungle distilled and never named.',
    upgrades: [
      { stats: { attack: 5, onHitDamage: 3 }, cost: { green: 66 }, requiredBiomeLevel: 2 },
      { stats: { attack: 5, onHitDamage: 3 }, cost: { green: 132 }, requiredBiomeLevel: 3 },
      { stats: { attack: 5, onHitDamage: 3 }, cost: { green: 264 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp ramp-regen MAX 0.21 -> 0.30 (start/ramptime flat).
  ['jungle-charm-t2', {
    id: 'jungle-charm-t2', name: 'Canopy Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { green: 45 }, stats: { hpRegen: 6 },
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.05,
      'defense.ramp-regen-max-pct': 0.14,
      'defense.ramp-regen-ramptime-ms': 10000,
    },
    tier: 2,
    icon: 'items/charms/wood-charm-2.png',
    description: 'A knot of ancient vine that wakes, slowly, to the rhythm of a long fight.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 33 }, requiredBiomeLevel: 3 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 66 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['jungle-boots-t2', {
    id: 'jungle-boots-t2', name: 'Vine Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { green: 30 }, stats: { speed: 22 }, tier: 2,
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.50 },
    icon: 'items/boots/plate-boots-3.png',
    description: 'Springy growth lashed to the feet, always eager to be running.',
    upgrades: [
      { stats: { speed: 5 }, cost: { green: 20 }, requiredBiomeLevel: 4 },
      { stats: { speed: 7 }, cost: { green: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 9 }, cost: { green: 80 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['jungle-vest-t2', {
    id: 'jungle-vest-t2', name: 'Verdant Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 4, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { maxHp: 44, plating: 6, evasion: 0.15 },
    tier: 2,
    icon: 'items/armor/leater-armor-2.png',
    description: 'A living mesh of leaf and creeper, too quick and too giving to be struck square.',
    upgrades: [
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 55, yellow: 11 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 100, yellow: 44 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 200, yellow: 55 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T3 ──
  ['jungle-venomthorn-rapier', {
    id: 'jungle-venomthorn-rapier', name: 'Venomthorn Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { green: 120 }, stats: { attack: 24, onHitDamage: 18 }, attacksPerSecond: 1.65, tier: 3,
    icon: 'items/weapons/rapier-3.png',
    description: 'Thin and quick, and slick with a thorn-sap that bites a little more with every touch.',
    upgrades: [
      { stats: { attack: 6, onHitDamage: 4 }, cost: { green: 180 },  requiredBiomeLevel: 6 },
      { stats: { attack: 6, onHitDamage: 4 }, cost: { green: 270 }, requiredBiomeLevel: 7 },
      { stats: { attack: 6, onHitDamage: 4 }, cost: { green: 360 }, requiredBiomeLevel: 8 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp ramp-regen MAX 0.23 -> 0.35.
  ['jungle-charm-t3', {
    id: 'jungle-charm-t3', name: 'Worldvine Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { green: 100 }, stats: { hpRegen: 11 },
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.05,
      'defense.ramp-regen-max-pct': 0.19,
      'defense.ramp-regen-ramptime-ms': 10000,
    },
    tier: 3,
    icon: 'items/charms/wood-charm-2.png',
    description: 'It wakes slowly to a long fight, and by the end is pouring life back faster than it leaves.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 75 },  requiredBiomeLevel: 7 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 150 }, requiredBiomeLevel: 8 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 225 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['jungle-boots-t3', {
    id: 'jungle-boots-t3', name: 'Canopy Striders',
    recipeGroup: 'jungle', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { green: 90 }, stats: { speed: 44 }, tier: 3,
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.65 },
    icon: 'items/boots/plate-boots-4.png',
    description: 'They crash through the green loud enough to turn every hungry thing your way.',
    upgrades: [
      { stats: { speed: 6 },  cost: { green: 25 }, requiredBiomeLevel: 8 },
      { stats: { speed: 8 },  cost: { green: 50 }, requiredBiomeLevel: 8 },
      { stats: { speed: 10 }, cost: { green: 100 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['jungle-vest-t3', {
    id: 'jungle-vest-t3', name: 'Wildgrowth Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 8, slot: 'armor',
    cost: { green: 90, yellow: 30 }, stats: { maxHp: 80, plating: 13, evasion: 0.40 },
    tier: 3,
    icon: 'items/armor/leater-armor-2.png',
    description: 'A living mesh of leaf and vine, too quick and too giving to ever quite be struck square.',
    upgrades: [
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 100, yellow: 50 },  requiredBiomeLevel: 8 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 225, yellow: 75 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 300, yellow: 150 }, requiredBiomeLevel: 8 },
    ],
  }],

] satisfies [string, Recipe][];
