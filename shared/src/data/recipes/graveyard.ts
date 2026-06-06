import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// Graveyard (T4) — extreme-high-density undead swarm biome (renamed from
// necropolis). Only the mobility (boot) line is authored so far: its on-kill
// stacking speed + tenacity ramp is live in the combat engine and suits the
// dense pack-clearing identity. Armor / weapon / charm / new-mechanic mobs
// remain DEFERRED. Essence: purple (necrotic). Values are untuned placeholders.

export const graveyardRecipeEntries = [
  ['graveyard-boots-t4', {
    id: 'graveyard-boots-t4', name: 'Gravewalker Boots',
    recipeGroup: 'graveyard', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { purple: 80 }, stats: { speed: 30 }, tier: 4,
    // Each kill adds a stack (max 3, 4s): +12% move speed and +12% tenacity per stack.
    mechanicEffects: {
      'mobility.kill-stack-speed-pct': 0.12,
      'mobility.kill-stack-tenacity-pct': 0.12,
      'mobility.kill-stack-ms': 4000,
    },
    icon: 'items/boots/plate-boots-6.png',
    description: 'Each fallen foe lends a little of its lingering haste to the wearer.',
    upgrades: [
      { stats: { speed: 8 },  cost: { purple: 40 },  requiredBiomeLevel: 4 },
      { stats: { speed: 12 }, cost: { purple: 80 },  requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { purple: 132 }, requiredBiomeLevel: 4 },
    ],
  }],
] satisfies [string, Recipe][];
