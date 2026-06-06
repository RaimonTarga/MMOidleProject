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
    cost: { green: 48, yellow: 12 }, stats: { attack: 12, onHitDamage: 8 }, attacksPerSecond: 1.55, tier: 2,
    icon: 'items/weapons/rapier-3.png',
    description: 'A thin blade kept slick with something the jungle distilled and never named.',
    upgrades: [
      { stats: { attack: 5, onHitDamage: 3 }, cost: { green: 22 }, requiredBiomeLevel: 2 },
      { stats: { attack: 5, onHitDamage: 3 }, cost: { green: 48 }, requiredBiomeLevel: 3 },
      { stats: { attack: 5, onHitDamage: 3 }, cost: { green: 85 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Hardening REMOVED (migrated to Volcano). Now pure evasion + bulk. Renamed off
  // the "hardplate" flavor — cosmetic pass can finalize.
  ['jungle-vest-t2', {
    id: 'jungle-vest-t2', name: 'Verdant Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 3, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { maxHp: 44, plating: 6, evasion: 0.15 },
    tier: 2,
    icon: 'items/armor/leater-armor-2.png',
    description: 'A living mesh of leaf and creeper, too quick and too giving to be struck square.',
    upgrades: [
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 22 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 48 }, requiredBiomeLevel: 5 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 85 }, requiredBiomeLevel: 6 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp ramp-regen MAX 0.21 -> 0.30 (start/ramptime flat).
  ['jungle-charm-t2', {
    id: 'jungle-charm-t2', name: 'Canopy Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { green: 38, yellow: 10 }, stats: { hpRegen: 6 },
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.05,
      'defense.ramp-regen-max-pct': 0.21,
      'defense.ramp-regen-ramptime-ms': 10000,
    },
    tier: 2,
    icon: 'items/charms/wood-charm-2.png',
    description: 'A knot of ancient vine that wakes, slowly, to the rhythm of a long fight.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.03 }, cost: { green: 18 }, requiredBiomeLevel: 3 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.03 }, cost: { green: 38 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.03 }, cost: { green: 68 }, requiredBiomeLevel: 5 },
    ],
  }],

  ['jungle-boots-t2', {
    id: 'jungle-boots-t2', name: 'Vine Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 1, slot: 'mobility',
    cost: { green: 18 }, stats: { speed: 22 }, tier: 2,
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.50 },
    icon: 'items/boots/plate-boots-3.png',
    description: 'Springy growth lashed to the feet, always eager to be running.',
    upgrades: [
      { stats: { speed: 5 }, cost: { green: 10 }, requiredBiomeLevel: 2 },
      { stats: { speed: 7 }, cost: { green: 20 }, requiredBiomeLevel: 3 },
      { stats: { speed: 9 }, cost: { green: 36 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T3 ──
  ['jungle-venomthorn-rapier', {
    id: 'jungle-venomthorn-rapier', name: 'Venomthorn Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 8, slot: 'weapon',
    cost: { green: 116 }, stats: { attack: 28, onHitDamage: 18 }, attacksPerSecond: 1.55, tier: 3,
    icon: 'items/weapons/rapier-3.png',
    description: 'Thin and quick, and slick with a thorn-sap that bites a little more with every touch.',
    upgrades: [
      { stats: { attack: 6, onHitDamage: 4 }, cost: { green: 58 },  requiredBiomeLevel: 9 },
      { stats: { attack: 6, onHitDamage: 4 }, cost: { green: 116 }, requiredBiomeLevel: 10 },
      { stats: { attack: 6, onHitDamage: 4 }, cost: { green: 196 }, requiredBiomeLevel: 11 },
    ],
  }],

  ['jungle-vest-t3', {
    id: 'jungle-vest-t3', name: 'Wildgrowth Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 11, slot: 'armor',
    cost: { green: 116 }, stats: { maxHp: 80, plating: 13, evasion: 0.40 },
    tier: 3,
    icon: 'items/armor/leater-armor-2.png',
    description: 'A living mesh of leaf and vine, too quick and too giving to ever quite be struck square.',
    upgrades: [
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 58 },  requiredBiomeLevel: 11 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 116 }, requiredBiomeLevel: 11 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 196 }, requiredBiomeLevel: 11 },
    ],
  }],

  ['jungle-boots-t3', {
    id: 'jungle-boots-t3', name: 'Canopy Striders',
    recipeGroup: 'jungle', requiredBiomeLevel: 5, slot: 'mobility',
    cost: { green: 58 }, stats: { speed: 44 }, tier: 3,
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.65 },
    icon: 'items/boots/plate-boots-4.png',
    description: 'They crash through the green loud enough to turn every hungry thing your way.',
    upgrades: [
      { stats: { speed: 6 },  cost: { green: 28 }, requiredBiomeLevel: 6 },
      { stats: { speed: 8 },  cost: { green: 58 }, requiredBiomeLevel: 7 },
      { stats: { speed: 10 }, cost: { green: 96 }, requiredBiomeLevel: 8 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp ramp-regen MAX 0.23 -> 0.35.
  ['jungle-charm-t3', {
    id: 'jungle-charm-t3', name: 'Worldvine Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { green: 100 }, stats: { hpRegen: 11 },
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.05,
      'defense.ramp-regen-max-pct': 0.23,
      'defense.ramp-regen-ramptime-ms': 10000,
    },
    tier: 3,
    icon: 'items/charms/wood-charm-2.png',
    description: 'It wakes slowly to a long fight, and by the end is pouring life back faster than it leaves.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.04 }, cost: { green: 50 },  requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.04 }, cost: { green: 100 }, requiredBiomeLevel: 11 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.04 }, cost: { green: 175 }, requiredBiomeLevel: 11 },
    ],
  }],
] satisfies [string, Recipe][];
