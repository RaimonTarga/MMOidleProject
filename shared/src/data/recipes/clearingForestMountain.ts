import type { Recipe } from './types';

export const clearingForestMountainRecipeEntries = [
  // ── Clearing (tutorial tier 1) — single green essence ────────────────────
  ['primordial-club', {
    id: 'primordial-club', name: 'Primordial Club',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 8 }, stats: { attack: 5 }, attacksPerSecond: 0.70, tier: 1,
    description: 'A crude but reliable club — forged on the cheap, never lets you down.',
  }],
  ['clearing-vest-t1', {
    id: 'clearing-vest-t1', name: 'Bark Wrap',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'armor',
    cost: { green: 8 }, stats: { plating: 4 }, tier: 1,
    description: 'Strips of bark bound with twine.',
  }],
  ['clearing-boots-t1', {
    id: 'clearing-boots-t1', name: 'Soft Boots',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'mobility',
    cost: { green: 6 }, stats: { speed: 12 }, tier: 1,
    description: 'Comfortable footwear for early exploration.',
  }],
  ['clearing-charm-t1', {
    id: 'clearing-charm-t1', name: 'Herb Pouch',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'recovery',
    cost: { green: 6 }, stats: { hpRegen: 2 }, tier: 1,
    description: 'A cloth bag of common healing herbs.',
  }],

  // ── Forest T1 — green only ─────────────────────────────────────────────────
  ['flash-rapier', {
    id: 'flash-rapier', name: 'Flash Rapier',
    recipeGroup: 'forest', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 20 }, stats: { attack: 4 }, attacksPerSecond: 1.50, tier: 1,
    description: 'A needle-thin blade that strikes faster than the eye can follow, but each sting barely bites.',
  }],
  ['forest-vest-t1', {
    id: 'forest-vest-t1', name: 'Shaded Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 20 }, stats: { maxHp: 10, plating: 2, evasion: 6 }, tier: 1,
    description: 'Shadowweave wrappings that let you slip between strikes — every 6th incoming attack passes through you entirely.',
  }],
  ['forest-boots-t1', {
    id: 'forest-boots-t1', name: 'Sprinter Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { green: 15 }, stats: { speed: 20 }, tier: 1,
    description: 'Light wrappings that free the ankle.',
  }],
  ['forest-charm-t1', {
    id: 'forest-charm-t1', name: 'Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 15 }, stats: { hpRegen: 6 }, tier: 1,
    description: 'Dried heartroot steeped in forest spring water — the fastest out-of-combat recovery in ring 1.',
  }],

  // ── Forest T2 — green (primary) + yellow (wolves) ─────────────────────────
  ['forest-blade-t2', {
    id: 'forest-blade-t2', name: 'Ironwood Blade',
    recipeGroup: 'forest', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { green: 48, yellow: 12 }, stats: { attack: 18 }, attacksPerSecond: 1.0, tier: 2,
    description: 'Forged from the heartwood of an ancient iron-oak.',
  }],
  ['forest-vest-t2', {
    id: 'forest-vest-t2', name: 'Phantom Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { maxHp: 18, plating: 4, evasion: 5 },
    mechanicEffects: { 'defense.max-hit-pct': 0.25 },
    tier: 2,
    description: 'Illusion-woven cloth that evades every 5th attack and softens any single hit exceeding 25% of your HP.',
  }],
  ['forest-boots-t2', {
    id: 'forest-boots-t2', name: 'Windstep Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { green: 38, yellow: 10 }, stats: { speed: 40 }, tier: 2,
    description: 'Enchanted wraps that carry the speed of forest winds.',
  }],
  ['forest-charm-t2', {
    id: 'forest-charm-t2', name: 'Ancient Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { green: 38, yellow: 10 }, stats: { hpRegen: 10 }, tier: 2,
    description: 'A century-aged heartroot amulet — recovery so fast others mistake it for sorcery.',
  }],

  // ── Mountain T1 — blue only ────────────────────────────────────────────────
  ['heavy-hammer', {
    id: 'heavy-hammer', name: 'Heavy Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 22 }, stats: { attack: 16 }, attacksPerSecond: 0.40, tier: 1,
    description: 'A war hammer so heavy it takes both hands — but when it lands, it lands.',
  }],
  ['mountain-vest-t1', {
    id: 'mountain-vest-t1', name: 'Fallen Knight Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 2, slot: 'armor',
    cost: { blue: 22 }, stats: { maxHp: 8, plating: 10, damageReduction: 0.05 }, tier: 1,
    description: 'Heavy stone-forged plate that shrugs off small hits through sheer mass.',
  }],
  ['mountain-boots-t1', {
    id: 'mountain-boots-t1', name: 'Iron Treads',
    recipeGroup: 'mountain', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { blue: 18 }, stats: { speed: 18 }, tier: 1,
    description: 'Reinforced boots that grip loose rock.',
  }],
  ['mountain-charm-t1', {
    id: 'mountain-charm-t1', name: 'Granite Barrier',
    recipeGroup: 'mountain', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { blue: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.shield-pct': 0.10, 'defense.shield-interval-ms': 10000, 'defense.shield-duration-ms': 10000 },
    tier: 1,
    description: 'A carved granite ward — generates a 10% HP shield in combat, refreshing every 10 seconds.',
  }],

  // ── Mountain T2 — blue (primary) + purple (stone eagle) ───────────────────
  ['mountain-blade-t2', {
    id: 'mountain-blade-t2', name: 'Peak Blade',
    recipeGroup: 'mountain', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { blue: 52, purple: 13 }, stats: { attack: 22 }, attacksPerSecond: 1.0, tier: 2,
    description: 'Folded high-altitude steel; holds an edge in any cold.',
  }],
  ['mountain-vest-t2', {
    id: 'mountain-vest-t2', name: 'Iron Crusader Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 7, slot: 'armor',
    cost: { blue: 52, purple: 13 }, stats: { maxHp: 15, plating: 18, damageReduction: 0.08 },
    mechanicEffects: { 'defense.hit-to-dot-pct': 0.12 },
    tier: 2,
    description: 'Masterwork plate that distributes 12% of absorbed force into delayed damage — turns lethal bursts into survivable trickle.',
  }],
  ['mountain-boots-t2', {
    id: 'mountain-boots-t2', name: 'Mountain Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { blue: 42, purple: 10 }, stats: { speed: 45 }, tier: 2,
    description: 'Enchanted treads that turn slopes into flat ground.',
  }],
  ['mountain-charm-t2', {
    id: 'mountain-charm-t2', name: 'Iron Bulwark',
    recipeGroup: 'mountain', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { blue: 42, purple: 10 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.shield-pct': 0.15, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 2,
    description: 'Mountain-forged iron ward — 15% HP shield every 8 seconds, turning sustained assault into a war of attrition.',
  }],
] satisfies [string, Recipe][];
