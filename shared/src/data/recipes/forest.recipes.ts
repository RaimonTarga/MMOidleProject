import type { Recipe } from './types';

// FOREST (T1-T2; retires at T2). Identity: EVASION armor / raw OOC-regen charm /
// fast weapon. The charm is pure-regen -> it keeps upgrading hpRegen (its identity).

export const forestRecipeEntries = [
  ['flash-rapier', {
    id: 'flash-rapier', name: 'Flash Rapier',
    recipeGroup: 'forest', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 20 }, stats: { attack: 5 }, attacksPerSecond: 1.50, tier: 1,
    icon: 'items/weapons/rapier-1.png',
    description: 'Forged thin as a reed by duelists who prized speed above all.',
    upgrades: [
      { stats: { attack: 2 }, cost: { green: 30 }, requiredBiomeLevel: 2 },
      { stats: { attack: 2 }, cost: { green: 60 }, requiredBiomeLevel: 3 },
      { stats: { attack: 2 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['forest-vest-t1', {
    id: 'forest-vest-t1', name: 'Shaded Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 20 }, stats: { maxHp: 24, plating: 4, evasion: 0.18 }, tier: 1,
    icon: 'items/armor/forest-armor-1.png',
    description: 'Woven in the dappled dark beneath the canopy, where shadow clings to cloth.',
    upgrades: [
      { stats: { maxHp: 6, plating: 1, evasion: 0.04 }, cost: { green: 30 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 6, plating: 1, evasion: 0.04 }, cost: { green: 60 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 1, evasion: 0.04 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Pure-regen charm: keeps upgrading hpRegen.
  ['forest-charm-t1', {
    id: 'forest-charm-t1', name: 'Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 15 }, stats: { hpRegen: 6 }, tier: 1,
    icon: 'items/charms/heart-charm-1.png',
    description: 'Heartroot drawn from the oldest tree in the grove, still faintly warm.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { green: 15 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { green: 30 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { green: 60 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['forest-boots-t1', {
    id: 'forest-boots-t1', name: 'Sprinter Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { green: 10 }, stats: { speed: 20 }, tier: 1,
    mechanicEffects: { 'mobility.kill-speed-pct': 0.25, 'mobility.kill-speed-ms': 2000 },
    icon: 'items/boots/forest-boots-1.png',
    description: 'Strips of supple hide that move when you move, and never before.',
    upgrades: [
      { stats: { speed: 3 }, cost: { green: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { green: 20 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { green: 40 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  ['gale-needle', {
    id: 'gale-needle', name: 'Gale Needle',
    recipeGroup: 'forest', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { green: 60 }, stats: { attack: 18 }, attacksPerSecond: 1.60, tier: 2,
    icon: 'items/weapons/rapier-2.png',
    description: 'A fencing blade machined to an impossible point, humming faintly when drawn.',
    upgrades: [
      { stats: { attack: 6 }, cost: { green: 60 }, requiredBiomeLevel: 6 },
      { stats: { attack: 6 }, cost: { green: 120 }, requiredBiomeLevel: 7 },
      { stats: { attack: 6 }, cost: { green: 240 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['forest-vest-t2', {
    id: 'forest-vest-t2', name: 'Phantom Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 6, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { maxHp: 43, plating: 6, evasion: 0.28 }, tier: 2,
    icon: 'items/armor/leather-armor-3.png',
    description: 'They say the weaver vanished the day it was finished. The cloth remembers the trick.',
    upgrades: [
      { stats: { maxHp: 12, plating: 2, evasion: 0.06 }, cost: { green: 45, yellow: 15 }, requiredBiomeLevel: 7 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.06 }, cost: { green: 90, yellow: 30 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.06 }, cost: { green: 180, yellow: 60 }, requiredBiomeLevel: 8 },
    ],
  }],

  // Pure-regen charm: keeps upgrading hpRegen.
  ['forest-charm-t2', {
    id: 'forest-charm-t2', name: 'Ancient Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'recovery',
    cost: { green: 50 }, stats: { hpRegen: 10 }, tier: 2,
    icon: 'items/charms/heart-charm-2.png',
    description: 'A relic of a grove that burned an age ago, its life somehow undimmed.',
    upgrades: [
      { stats: { hpRegen: 3 }, cost: { green: 30 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 3 }, cost: { green: 60 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 3 }, cost: { green: 120 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['forest-boots-t2', {
    id: 'forest-boots-t2', name: 'Windstep Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 8, slot: 'mobility',
    cost: { green: 40 }, stats: { speed: 31 }, tier: 2,
    mechanicEffects: { 'mobility.kill-speed-pct': 0.35, 'mobility.kill-speed-ms': 2000 },
    icon: 'items/boots/leather-boots-3.png',
    description: 'Light enough that the wind mistakes the wearer for one of its own.',
    upgrades: [
      { stats: { speed: 3 }, cost: { green: 20 }, requiredBiomeLevel: 8 },
      { stats: { speed: 4 }, cost: { green: 40 }, requiredBiomeLevel: 8 },
      { stats: { speed: 5 }, cost: { green: 80 }, requiredBiomeLevel: 8 },
    ],
  }],


] satisfies [string, Recipe][];
