import type { Recipe } from './types';
import {
  ULTIMATE_CLEAR_VOID_OVERLORD,
  ULTIMATE_RECIPE_GROUP,
} from '../../ultimate/gear';

export const trenchUltimateRecipeEntries: [string, Recipe][] = [
  ['trenchal-plate', {
    id: 'trenchal-plate',
    name: 'trenchal Plate',
    recipeGroup: ULTIMATE_RECIPE_GROUP,
    requiredBiomeLevel: -6,
    requiredBossClear: ULTIMATE_CLEAR_VOID_OVERLORD,
    ultimate: true,
    tier: 4,
    slot: 'armor',
    cost: { purple: 1400 },
    stats: { maxHp: 72, plating: 26, damageReduction: 0.16 },
    icon: 'items/armor/plate-armor-9.png',
    description: 'Forged from the Void Overlord\'s collapsed core — apex trenchal protection.',
  }],

  ['voidstride-greaves', {
    id: 'voidstride-greaves',
    name: 'Voidstride Greaves',
    recipeGroup: ULTIMATE_RECIPE_GROUP,
    requiredBiomeLevel: -6,
    requiredBossClear: ULTIMATE_CLEAR_VOID_OVERLORD,
    ultimate: true,
    tier: 4,
    slot: 'mobility',
    cost: { purple: 1200 },
    stats: { speed: 108, attackRange: 25 },
    icon: 'items/boots/trench-boots-2.png',
    description: 'Boots that slip between void rifts — unmatched speed and reach.',
  }],

  ['heart-of-the-trench', {
    id: 'heart-of-the-trench',
    name: 'Heart of the trench',
    recipeGroup: ULTIMATE_RECIPE_GROUP,
    requiredBiomeLevel: -6,
    requiredBossClear: ULTIMATE_CLEAR_VOID_OVERLORD,
    ultimate: true,
    tier: 4,
    slot: 'recovery',
    cost: { purple: 1300 },
    stats: { hpRegen: 24 },
    mechanicEffects: {
      'defense.shield-pct': 0.24,
      'defense.shield-interval-ms': 7000,
      'defense.shield-duration-ms': 7000,
    },
    icon: 'items/charms/depths-charm-1.png',
    description: 'A pulsing void heart — 24% max HP shield every 7 seconds in combat.',
  }],

  ['edge-of-oblivion', {
    id: 'edge-of-oblivion',
    name: 'Edge of Oblivion',
    recipeGroup: ULTIMATE_RECIPE_GROUP,
    requiredBiomeLevel: -6,
    requiredBossClear: ULTIMATE_CLEAR_VOID_OVERLORD,
    ultimate: true,
    tier: 4,
    slot: 'weapon',
    cost: { purple: 1800 },
    stats: { attack: 34 },
    attacksPerSecond: 1.1,
    icon: 'items/weapons/dark-blade.png',
    description: 'Each hit converts part of remaining direct damage into a corruption reservoir that drains as void damage. Corruption stacks also slow the target.',
  }],
];
