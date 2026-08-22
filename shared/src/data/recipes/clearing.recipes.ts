import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// CLEARING (T0 tutorial). Source: design_docs/T1_ITEM_NUMERICAL_BASELINE.md §4.
//
// FIXED-POWER EQUIPMENT. The tutorial set is deliberately OFF the +0…+5 track:
// `upgrades: []` makes getMaxUpgrade() return 0, so crafting/upgrade refuse it.
// Its job is literacy — teach the four slots, make the Clearing trivial once
// assembled, and hand the player enough shell to get a foothold in early Plains.
// It is meant to be replaced wholesale by T1 specialist gear, not invested in.
//
// Sanity check (before class affinity), with the full set equipped:
//   HP 100 → 120 · plating 2 → 6 · Recovery 10 → 12 · raw DPS (15+8) × 0.75 ≈ 17
//   A 50 HP Plains Slime therefore takes three clean Club hits.
// ─────────────────────────────────────────────────────────────────────────

export const clearingRecipeEntries = [
  ['primordial-club', {
    id: 'primordial-club', name: 'Primordial Club',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 4 }, stats: { attack: 8 }, attacksPerSecond: 0.75, tier: 0,
    icon: 'items/weapons/primordial-club.png',
    description: 'Whittled from ironwood in a single evening, and it has not snapped since.',
    upgrades: [],
  }],

  ['clearing-vest-t1', {
    id: 'clearing-vest-t1', name: 'Bark Wrap',
    recipeGroup: 'clearing', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 4 }, stats: { maxHp: 20, plating: 4 }, tier: 0,
    icon: 'items/armor/bark-wrap.png',
    description: 'Bound bark and twine, smelling of sap and rain — the first armor any wanderer learns to make.',
    upgrades: [],
  }],

  ['clearing-charm-t1', {
    id: 'clearing-charm-t1', name: 'Herb Pouch',
    recipeGroup: 'clearing', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 3 }, stats: { recovery: 2 }, tier: 0,
    icon: 'items/charms/herb-pouch.png',
    description: 'A drawstring pouch of bruised green leaves, gathered at the forest edge.',
    upgrades: [],
  }],

  ['clearing-boots-t1', {
    id: 'clearing-boots-t1', name: 'Soft Boots',
    recipeGroup: 'clearing', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { green: 3 }, stats: { speed: 12 }, tier: 0,
    icon: 'items/boots/soft-boots.png',
    description: 'Worn soft by a hundred miles of easy trail.',
    upgrades: [],
  }],

] satisfies [string, Recipe][];
