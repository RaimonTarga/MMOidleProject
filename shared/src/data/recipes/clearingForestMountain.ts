import type { Recipe } from './types';

export const clearingForestMountainRecipeEntries = [
  // ── Clearing (tutorial tier 1) — single green essence ────────────────────
  ['primordial-club', {
    id: 'primordial-club', name: 'Primordial Club',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 8 }, stats: { attack: 5 }, attacksPerSecond: 0.70, tier: 0,
    description: 'A crude but reliable club — forged on the cheap, never lets you down.',
    upgrades: [
      { stats: { attack: 1 }, cost: { green: 5  }, requiredBiomeLevel: 2 },
      { stats: { attack: 2 }, cost: { green: 10 }, requiredBiomeLevel: 3 },
      { stats: { attack: 3 }, cost: { green: 18 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['clearing-vest-t1', {
    id: 'clearing-vest-t1', name: 'Bark Wrap',
    recipeGroup: 'clearing', requiredBiomeLevel: 4, slot: 'armor',
    cost: { green: 8 }, stats: { plating: 4 }, tier: 0,
    description: 'Strips of bark bound with twine.',
    upgrades: [
      { stats: { plating: 1 }, cost: { green: 4 }, requiredBiomeLevel: 5 },
      { stats: { plating: 2 }, cost: { green: 8 }, requiredBiomeLevel: 6 },
      { stats: { plating: 2 }, cost: { green: 16 }, requiredBiomeLevel: 7 },
    ],
  }],

  ['clearing-boots-t1', {
    id: 'clearing-boots-t1', name: 'Soft Boots',
    recipeGroup: 'clearing', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { green: 6 }, stats: { speed: 12 }, tier: 0,
    description: 'Comfortable footwear for early exploration.',
    upgrades: [
      { stats: { speed: 3 }, cost: { green: 4 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { green: 8 }, requiredBiomeLevel: 5 },
      { stats: { speed: 5 }, cost: { green: 16 }, requiredBiomeLevel: 6 },
    ],
  }],

  ['clearing-charm-t1', {
    id: 'clearing-charm-t1', name: 'Herb Pouch',
    recipeGroup: 'clearing', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { green: 6 }, stats: { hpRegen: 2 }, tier: 0,
    description: 'A cloth bag of common healing herbs.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { green: 4 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 1 }, cost: { green: 8 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { green: 16 }, requiredBiomeLevel: 5 },
    ],
  }],

  ['flash-rapier', {
    id: 'flash-rapier', name: 'Flash Rapier',
    recipeGroup: 'forest', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 20 }, stats: { attack: 4 }, attacksPerSecond: 1.50, tier: 1,
    description: 'A needle-thin blade that strikes faster than the eye can follow, but each sting barely bites.',
    upgrades: [
      { stats: { attack: 1 }, cost: { green: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 2 }, cost: { green: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 3 }, cost: { green: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['forest-vest-t1', {
    id: 'forest-vest-t1', name: 'Shaded Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 4, slot: 'armor',
    cost: { green: 20 }, stats: { maxHp: 10, plating: 2, evasion: 6 }, tier: 1,
    description: 'Shadowweave wrappings that let you slip between strikes — every 6th incoming attack passes through you entirely.',
    upgrades: [
      { stats: { maxHp: 3, plating: 1 }, cost: { green: 10 }, requiredBiomeLevel: 5 },
      { stats: { maxHp: 4, plating: 1 }, cost: { green: 22 }, requiredBiomeLevel: 6 },
      { stats: { maxHp: 5, plating: 1 }, cost: { green: 42 }, requiredBiomeLevel: 7 },
    ],
  }],

  ['forest-boots-t1', {
    id: 'forest-boots-t1', name: 'Sprinter Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { green: 15 }, stats: { speed: 20 }, tier: 1,
    description: 'Light wrappings that free the ankle.',
    upgrades: [
      { stats: { speed: 4 }, cost: { green: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 6 }, cost: { green: 22 }, requiredBiomeLevel: 5 },
      { stats: { speed: 8 }, cost: { green: 42 }, requiredBiomeLevel: 6 },
    ],
  }],

  ['forest-charm-t1', {
    id: 'forest-charm-t1', name: 'Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { green: 15 }, stats: { hpRegen: 6 }, tier: 1,
    description: 'Dried heartroot steeped in forest spring water — the fastest out-of-combat recovery in ring 1.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { green: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 2 }, cost: { green: 22 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { green: 42 }, requiredBiomeLevel: 5 },
    ],
  }],


  ['forest-vest-t2', {
    id: 'forest-vest-t2', name: 'Phantom Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 8, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { maxHp: 18, plating: 4, evasion: 5 },
    mechanicEffects: { 'defense.max-hit-pct': 0.25 },
    tier: 2,
    description: 'Illusion-woven cloth that evades every 5th attack and softens any single hit exceeding 25% of your HP.',
    upgrades: [
      { stats: { maxHp: 5, plating: 1 }, cost: { green: 22 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 7, plating: 2 }, cost: { green: 45 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 9, plating: 2 }, cost: { green: 80 }, requiredBiomeLevel: 11 },
    ],
  }],

  ['forest-boots-t2', {
    id: 'forest-boots-t2', name: 'Windstep Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { green: 38, yellow: 10 }, stats: { speed: 40 }, tier: 2,
    description: 'Enchanted wraps that carry the speed of forest winds.',
    upgrades: [
      { stats: { speed: 6 }, cost: { green: 18 }, requiredBiomeLevel: 8 },
      { stats: { speed: 9 }, cost: { green: 38 }, requiredBiomeLevel: 9 },
      { stats: { speed: 12 }, cost: { green: 68 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['forest-charm-t2', {
    id: 'forest-charm-t2', name: 'Ancient Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { green: 38, yellow: 10 }, stats: { hpRegen: 10 }, tier: 2,
    description: 'A century-aged heartroot amulet — recovery so fast others mistake it for sorcery.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { green: 18 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 3 }, cost: { green: 38 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 4 }, cost: { green: 68 }, requiredBiomeLevel: 9 },
    ],
  }],

  ['heavy-hammer', {
    id: 'heavy-hammer', name: 'Heavy Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 22 }, stats: { attack: 16 }, attacksPerSecond: 0.40, tier: 1,
    description: 'A war hammer so heavy it takes both hands — but when it lands, it lands.',
    upgrades: [
      { stats: { attack: 2 }, cost: { blue: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 4 }, cost: { blue: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 6 }, cost: { blue: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['mountain-vest-t1', {
    id: 'mountain-vest-t1', name: 'Fallen Knight Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 4, slot: 'armor',
    cost: { blue: 22 }, stats: { maxHp: 8, plating: 10, damageReduction: 0.05 }, tier: 1,
    description: 'Heavy stone-forged plate that shrugs off small hits through sheer mass.',
    upgrades: [
      { stats: { maxHp: 2, plating: 2 }, cost: { blue: 10 }, requiredBiomeLevel: 5 },
      { stats: { maxHp: 3, plating: 3 }, cost: { blue: 22 }, requiredBiomeLevel: 6 },
      { stats: { maxHp: 4, plating: 4 }, cost: { blue: 42 }, requiredBiomeLevel: 7 },
    ],
  }],

  ['mountain-boots-t1', {
    id: 'mountain-boots-t1', name: 'Iron Treads',
    recipeGroup: 'mountain', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { blue: 18 }, stats: { speed: 18 }, tier: 1,
    description: 'Reinforced boots that grip loose rock.',
    upgrades: [
      { stats: { speed: 4 }, cost: { blue: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 6 }, cost: { blue: 22 }, requiredBiomeLevel: 5 },
      { stats: { speed: 8 }, cost: { blue: 42 }, requiredBiomeLevel: 6 },
    ],
  }],

  ['mountain-charm-t1', {
    id: 'mountain-charm-t1', name: 'Granite Barrier',
    recipeGroup: 'mountain', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { blue: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.shield-pct': 0.10, 'defense.shield-interval-ms': 10000, 'defense.shield-duration-ms': 10000 },
    tier: 1,
    description: 'A carved granite ward — generates a 10% HP shield in combat, refreshing every 10 seconds.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { blue: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 1 }, cost: { blue: 22 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { blue: 42 }, requiredBiomeLevel: 5 },
    ],
  }],


  ['mountain-vest-t2', {
    id: 'mountain-vest-t2', name: 'Iron Crusader Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 8, slot: 'armor',
    cost: { blue: 52, purple: 13 }, stats: { maxHp: 15, plating: 18, damageReduction: 0.08 },
    mechanicEffects: { 'defense.hit-to-dot-pct': 0.12 },
    tier: 2,
    description: 'Masterwork plate that distributes 12% of absorbed force into delayed damage — turns lethal bursts into survivable trickle.',
    upgrades: [
      { stats: { maxHp: 4, plating: 3 }, cost: { blue: 26 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 6, plating: 5 }, cost: { blue: 52 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 8, plating: 6 }, cost: { blue: 92 }, requiredBiomeLevel: 11 },
    ],
  }],

  ['mountain-boots-t2', {
    id: 'mountain-boots-t2', name: 'Mountain Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { blue: 42, purple: 10 }, stats: { speed: 45 }, tier: 2,
    description: 'Enchanted treads that turn slopes into flat ground.',
    upgrades: [
      { stats: { speed: 6 }, cost: { blue: 20 }, requiredBiomeLevel: 8 },
      { stats: { speed: 9 }, cost: { blue: 42 }, requiredBiomeLevel: 9 },
      { stats: { speed: 12 }, cost: { blue: 75 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['mountain-charm-t2', {
    id: 'mountain-charm-t2', name: 'Iron Bulwark',
    recipeGroup: 'mountain', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { blue: 42, purple: 10 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.shield-pct': 0.15, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 2,
    description: 'Mountain-forged iron ward — 15% HP shield every 8 seconds, turning sustained assault into a war of attrition.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { blue: 20 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 2 }, cost: { blue: 42 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 3 }, cost: { blue: 75 }, requiredBiomeLevel: 9 },
    ],
  }],

  // ── Master merge additions ─────────────────────────────────────────────

  ['forest-pulse-t1', {
    id: 'forest-pulse-t1', name: 'Vitalbloom Charm',
    recipeGroup: 'forest', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { green: 15 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.kill-burst-pct': 0.08 },
    tier: 1,
    description: 'A bloom that feeds on the life force of fallen prey — each kill restores 8% of your max HP over 4 seconds.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { green: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 1 }, cost: { green: 22 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { green: 42 }, requiredBiomeLevel: 5 },
    ],
  }],

  ['gale-needle', {
    id: 'gale-needle', name: 'Gale Needle',
    recipeGroup: 'forest', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { green: 48, yellow: 12 }, stats: { attack: 16 }, attacksPerSecond: 1.50, tier: 2,
    description: 'A precision-machined fencing blade — every technique from the Flash Rapier, refined and improved at every point.',
    upgrades: [
      { stats: { attack: 3 }, cost: { green: 22 }, requiredBiomeLevel: 6 },
      { stats: { attack: 5 }, cost: { green: 48 }, requiredBiomeLevel: 7 },
      { stats: { attack: 7 }, cost: { green: 85 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['quake-hammer', {
    id: 'quake-hammer', name: 'Quake Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { blue: 52, purple: 13 }, stats: { attack: 32 }, attacksPerSecond: 0.40, tier: 2,
    description: 'A quality war-hammer built for maximum force delivery — every landing sends tremors through whatever it strikes.',
    upgrades: [
      { stats: { attack: 4 }, cost: { blue: 26 }, requiredBiomeLevel: 6 },
      { stats: { attack: 7 }, cost: { blue: 52 }, requiredBiomeLevel: 7 },
      { stats: { attack: 10 }, cost: { blue: 92 }, requiredBiomeLevel: 8 },
    ],
  }],
] satisfies [string, Recipe][];
