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
    cost: { green: 55}, stats: { attack: 10, onHitDamage: 8 }, attacksPerSecond: 1.55, tier: 2,
    icon: 'items/weapons/jungle-rapier.png',
    description: 'A thin blade kept slick with something the jungle distilled and never named.',
    upgrades: [
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 66 }, requiredBiomeLevel: 2 },
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 132 }, requiredBiomeLevel: 3 },
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 264 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['jungle-vest-t2', {
    id: 'jungle-vest-t2', name: 'Verdant Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { maxHp: 44, plating: 6, evasion: 0.15 },
    tier: 2,
    icon: 'items/armor/leater-armor-2.png',
    description: 'A living mesh of leaf and creeper, too quick and too giving to be struck square.',
    upgrades: [
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 55, yellow: 11 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 100, yellow: 44 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 200, yellow: 55 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp ramp-regen MAX 0.21 -> 0.30 (start/ramptime flat).
  ['jungle-charm-t2', {
    id: 'jungle-charm-t2', name: 'Canopy Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 45 }, stats: { hpRegen: 6 },
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.04,
      'defense.ramp-regen-max-pct': 0.10,
      'defense.ramp-regen-ramptime-ms': 10000,
    },
    tier: 2,
    icon: 'items/charms/wood-charm-2.png',
    description: 'A knot of ancient vine that wakes, slowly, to the rhythm of a long fight.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 33 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 66 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['jungle-boots-t2', {
    id: 'jungle-boots-t2', name: 'Vine Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { green: 30 }, stats: { speed: 22 }, tier: 2,
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.50 },
    icon: 'items/boots/wraps-3.png',
    description: 'Springy growth lashed to the feet, always eager to be running.',
    upgrades: [
      { stats: { speed: 5 }, cost: { green: 20 }, requiredBiomeLevel: 4 },
      { stats: { speed: 7 }, cost: { green: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 9 }, cost: { green: 80 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T3 ──
  ['jungle-venomthorn-rapier', {
    id: 'jungle-venomthorn-rapier', name: 'Venomthorn Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { green: 120 }, stats: { attack: 22, onHitDamage: 18 }, attacksPerSecond: 1.65, tier: 3,
    icon: 'items/weapons/jungle-rapier.png',
    description: 'Thin and quick, and slick with a thorn-sap that bites a little more with every touch.',
    upgrades: [
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 180 },  requiredBiomeLevel: 6 },
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 270 }, requiredBiomeLevel: 7 },
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 360 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['jungle-vest-t3', {
    id: 'jungle-vest-t3', name: 'Wildgrowth Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 6, slot: 'armor',
    cost: { green: 90, yellow: 30 }, stats: { maxHp: 80, plating: 13, evasion: 0.40 },
    tier: 3,
    icon: 'items/armor/jungle-armor-1.png',
    description: 'A living mesh of leaf and vine, too quick and too giving to ever quite be struck square.',
    upgrades: [
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 100, yellow: 50 },  requiredBiomeLevel: 7 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 225, yellow: 75 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 300, yellow: 150 }, requiredBiomeLevel: 8 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp ramp-regen MAX 0.23 -> 0.35.
  ['jungle-charm-t3', {
    id: 'jungle-charm-t3', name: 'Worldvine Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 7, slot: 'recovery',
    cost: { green: 100 }, stats: { hpRegen: 11 },
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.05,
      'defense.ramp-regen-max-pct': 0.14,
      'defense.ramp-regen-ramptime-ms': 10000,
    },
    tier: 3,
    icon: 'items/charms/wood-charm-2.png',
    description: 'It wakes slowly to a long fight, and by the end is pouring life back faster than it leaves.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 75 },  requiredBiomeLevel: 8 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 150 }, requiredBiomeLevel: 8 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 225 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['jungle-boots-t3', {
    id: 'jungle-boots-t3', name: 'Canopy Striders',
    recipeGroup: 'jungle', requiredBiomeLevel: 8, slot: 'mobility',
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

  // ── T4 ──
  ['jungle-deathfang-rapier', {
    id: 'jungle-deathfang-rapier', name: 'Deathfang Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 9, slot: 'weapon',
    cost: { green: 264 }, stats: { attack: 34, onHitDamage: 30 }, attacksPerSecond: 1.75, tier: 4,
    icon: 'items/weapons/rapier-4.png',
    description: 'Quick past seeing, and slick with something the deep jungle spent a long time perfecting.',
    upgrades: [
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 396 }, requiredBiomeLevel: 10 },
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 792 }, requiredBiomeLevel: 11 },
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 1584 }, requiredBiomeLevel: 12 },
    ],
  }],

  ['jungle-vest-t4', {
    id: 'jungle-vest-t4', name: 'Primal Canopy',
    recipeGroup: 'jungle', requiredBiomeLevel: 10, slot: 'armor',
    cost: { green: 220, yellow: 55 }, stats: { maxHp: 145, plating: 24, evasion: 0.55 },
    // Bonus evade-mitigation: increases the fraction of damage avoided on an evade
    // (the reload-class mechanic). Stacks on GAME_CONFIG.EVADE_MITIGATION_BASE.
    mechanicEffects: { 'defense.evade-mitigation': 0.2 },
    tier: 4,
    icon: 'items/armor/jungle-armor-2.png',
    description: 'The faster you move through the green, the less of you there is to strike.',
    upgrades: [
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 200, yellow: 100 }, requiredBiomeLevel: 11 },
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 450, yellow: 150 }, requiredBiomeLevel: 12 },
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 600, yellow: 300 }, requiredBiomeLevel: 12 },
    ],
  }],

  ['jungle-charm-t4', {
    id: 'jungle-charm-t4', name: 'Ancient Canopy',
    recipeGroup: 'jungle', requiredBiomeLevel: 11, slot: 'recovery',
    cost: { green: 200 }, stats: { hpRegen: 16 },
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.04, 'defense.ramp-regen-max-pct': 0.14, 'defense.ramp-regen-ramptime-ms': 9000,
    },
    tier: 4,
    icon: 'items/charms/wood-charm-3.png',
    description: 'Older than the trees around it, and by a long fight\'s end it is pouring life back faster than any blade can take it.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 150 }, requiredBiomeLevel: 12 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 300 }, requiredBiomeLevel: 12 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 450 }, requiredBiomeLevel: 12 },
    ],
  }],

  ['jungle-charm-t4-overgrowth', {
    id: 'jungle-charm-t4-overgrowth', name: 'Overgrowth Pulse',
    recipeGroup: 'jungle', requiredBiomeLevel: 11, slot: 'recovery',
    cost: { green: 200 }, stats: { hpRegen: 16 },
    // † overheal-shield-pct: regen beyond max HP converts to temp shield at 50%.
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.04, 'defense.ramp-regen-max-pct': 0.12, 'defense.ramp-regen-ramptime-ms': 9000,
      'defense.overheal-shield-pct': 0.25,
    },
    tier: 4,
    icon: 'items/charms/wood-charm-4.png',
    description: 'It grows past the wound and keeps growing, hardening the surplus into a living shell.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 150 }, requiredBiomeLevel: 12 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 300 }, requiredBiomeLevel: 12 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 450 }, requiredBiomeLevel: 12 },
    ],
  }],

  // T4 boots — aggro-pull (draws more aggro, suits the swarm). T3 0.65 → T4 0.80.
  ['jungle-boots-t4', {
    id: 'jungle-boots-t4', name: 'Warpath Treads',
    recipeGroup: 'jungle', requiredBiomeLevel: 12, slot: 'mobility',
    cost: { green: 198 }, stats: { speed: 66 }, tier: 4,
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.80 },
    icon: 'items/boots/plate-boots-7.png',
    description: 'They tear through the green loud enough to wake the whole canopy — and bring all of it to you at once.',
    upgrades: [
      { stats: { speed: 8 },  cost: { green: 55 },  requiredBiomeLevel: 12 },
      { stats: { speed: 10 }, cost: { green: 110 }, requiredBiomeLevel: 12 },
      { stats: { speed: 12 }, cost: { green: 220 }, requiredBiomeLevel: 12 },
    ],
  }],

] satisfies [string, Recipe][];
