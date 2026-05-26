import type { Recipe } from './types';

export const jungleTundraDesertVolcanicRecipeEntries = [
  // ── Jungle T1 — green only (jungle first appears T2; unlocks from any jungle node) ──
  ['jungle-vest-t1', {
    id: 'jungle-vest-t1', name: 'Verdant Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 1, slot: 'armor',
    cost: { green: 22 }, stats: { maxHp: 10, plating: 2, evasion: 6 }, tier: 1,
    description: 'Flexible jungle bindings that let you slip between strikes — every 6th incoming attack passes through you.',
  }],
  ['jungle-boots-t1', {
    id: 'jungle-boots-t1', name: 'Vine Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 2, slot: 'mobility',
    cost: { green: 18 }, stats: { speed: 22 }, tier: 1,
    description: 'Elastic jungle vines that spring with each step.',
  }],
  ['jungle-charm-t1', {
    id: 'jungle-charm-t1', name: 'Verdant Amulet',
    recipeGroup: 'jungle', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 18 }, stats: { hpRegen: 5 }, tier: 1,
    description: 'Carved jade saturated with jungle life energy — pure recovery, nothing wasted on secondary effects.',
  }],

  // ── Jungle T2 — green (primary) + yellow (apes) ───────────────────────────
  ['jungle-blade-t2', {
    id: 'jungle-blade-t2', name: 'Anaconda Fang',
    recipeGroup: 'jungle', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { green: 54, yellow: 14 }, stats: { attack: 26 }, attacksPerSecond: 1.0, tier: 2,
    description: 'An anaconda fang the length of a shortsword.',
  }],
  ['jungle-vest-t2', {
    id: 'jungle-vest-t2', name: 'Primal Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 7, slot: 'armor',
    cost: { green: 54, yellow: 14 }, stats: { maxHp: 22, plating: 5, evasion: 5 },
    mechanicEffects: { 'defense.absorb-pct': 0.06 },
    tier: 2,
    description: 'Reactive jungle wrappings that evade every 5th attack and convert 6% of remaining damage into healing over 4 seconds.',
  }],
  ['jungle-boots-t2', {
    id: 'jungle-boots-t2', name: 'Predator Boots',
    recipeGroup: 'jungle', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { green: 44, yellow: 11 }, stats: { speed: 52 }, tier: 2,
    description: 'Fitted from anaconda scale — silent and swift.',
  }],
  ['jungle-charm-t2', {
    id: 'jungle-charm-t2', name: 'Life Weave Amulet',
    recipeGroup: 'jungle', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { green: 44, yellow: 11 }, stats: { hpRegen: 8 }, tier: 2,
    description: 'A living amulet woven from thousand-year jungle vines — exceptional raw recovery for those who want no strings attached.',
  }],

  // ── Tundra T1 (ring 2) — blue only ────────────────────────────────────────
  ['tundra-blade-t1', {
    id: 'tundra-blade-t1', name: 'Frost Blade',
    recipeGroup: 'tundra', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 70 }, stats: { attack: 28 }, attacksPerSecond: 1.25, tier: 1,
    description: 'Tempered in glacial water until the edge never dulls.',
  }],
  ['tundra-vest-t1', {
    id: 'tundra-vest-t1', name: 'Frost-Forged Plate',
    recipeGroup: 'tundra', requiredBiomeLevel: 2, slot: 'armor',
    cost: { blue: 70 }, stats: { maxHp: 18, plating: 22, damageReduction: 0.08 }, tier: 1,
    description: 'Arctic-tempered full plate forged in glacial vents — brutal in mass and mitigation.',
  }],
  ['tundra-boots-t1', {
    id: 'tundra-boots-t1', name: 'Snowstep Boots',
    recipeGroup: 'tundra', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { blue: 58 }, stats: { speed: 55 }, tier: 1,
    description: 'Enchanted to leave no tracks and lose no speed.',
  }],
  ['tundra-charm-t1', {
    id: 'tundra-charm-t1', name: 'Frost Barrier',
    recipeGroup: 'tundra', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { blue: 58 }, stats: { hpRegen: 10 },
    mechanicEffects: { 'defense.shield-pct': 0.18, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 1,
    description: 'An arctic ward that crystallises an 18% HP ice shield in combat, refreshing every 8 seconds.',
  }],

  // ── Tundra T2 — blue + purple + green (cross-biome, 3 types) ──────────────
  ['tundra-blade-t2', {
    id: 'tundra-blade-t2', name: 'Blizzard Edge',
    recipeGroup: 'tundra', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { blue: 84, purple: 24, green: 12 }, stats: { attack: 50 }, attacksPerSecond: 1.5, tier: 2,
    description: 'Forged from the eye of a permanent tundra blizzard.',
  }],
  ['tundra-vest-t2', {
    id: 'tundra-vest-t2', name: 'Glacial Crusader Plate',
    recipeGroup: 'tundra', requiredBiomeLevel: 7, slot: 'armor',
    cost: { blue: 84, purple: 24, green: 12 }, stats: { maxHp: 35, plating: 36, damageReduction: 0.12 },
    mechanicEffects: { 'defense.hit-to-dot-pct': 0.18 },
    tier: 2,
    description: 'Apex arctic plate that channels 18% of absorbed impact into delayed frost debt — extreme hits are spread across 4 seconds.',
  }],
  ['tundra-boots-t2', {
    id: 'tundra-boots-t2', name: 'Frost Wind Wraps',
    recipeGroup: 'tundra', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { blue: 68, purple: 20, green: 10 }, stats: { speed: 92 }, tier: 2,
    description: 'Woven from the breath of a permafrost storm.',
  }],
  ['tundra-charm-t2', {
    id: 'tundra-charm-t2', name: 'Glacial Bulwark',
    recipeGroup: 'tundra', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { blue: 68, purple: 20, green: 10 }, stats: { hpRegen: 16 },
    mechanicEffects: { 'defense.shield-pct': 0.22, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 2,
    description: 'An ancient glacier ward — 22% HP glacial shield every 8 seconds; virtually impenetrable to sustained assault.',
  }],

  // ── Desert T1 (ring 2) — yellow only ──────────────────────────────────────
  ['desert-blade-t1', {
    id: 'desert-blade-t1', name: 'Scorpion Blade',
    recipeGroup: 'desert', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { yellow: 70 }, stats: { attack: 28 }, attacksPerSecond: 1.25, tier: 1,
    description: 'A sand-scorpion stinger sharpened to a piercing point.',
  }],
  ['desert-vest-t1', {
    id: 'desert-vest-t1', name: 'Sunbaked Wrappings',
    recipeGroup: 'desert', requiredBiomeLevel: 2, slot: 'armor',
    cost: { yellow: 70 }, stats: { maxHp: 25, plating: 14 },
    mechanicEffects: { 'defense.dot-resistance': 0.28, 'defense.debuff-resistance': 0.10 },
    tier: 1,
    description: 'Heat-hardened desert cloth that resists burns, poisons, and curses of the wastes — 28% DoT resistance and 10% debuff reduction.',
  }],
  ['desert-boots-t1', {
    id: 'desert-boots-t1', name: 'Sand Sprint',
    recipeGroup: 'desert', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { yellow: 58 }, stats: { speed: 58 }, tier: 1,
    description: 'Broad-soled boots that turn loose sand into a track.',
  }],
  ['desert-charm-t1', {
    id: 'desert-charm-t1', name: 'Sand Golem Eye',
    recipeGroup: 'desert', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { yellow: 58 }, stats: { hpRegen: 10 },
    mechanicEffects: { 'defense.absorb-pct': 0.22 },
    tier: 1,
    description: 'A preserved desert golem eye — 22% of all damage taken converts to healing over 4 seconds.',
  }],

  // ── Desert T2 — yellow + red + blue (cross-biome, 3 types) ───────────────
  ['desert-blade-t2', {
    id: 'desert-blade-t2', name: 'Sandstorm Blade',
    recipeGroup: 'desert', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { yellow: 84, red: 24, blue: 12 }, stats: { attack: 50 }, attacksPerSecond: 1.5, tier: 2,
    description: 'A blade shaped by a thousand-year sandstorm.',
  }],
  ['desert-vest-t2', {
    id: 'desert-vest-t2', name: 'Ancient Sunbaked Wrappings',
    recipeGroup: 'desert', requiredBiomeLevel: 7, slot: 'armor',
    cost: { yellow: 84, red: 24, blue: 12 }, stats: { maxHp: 42, plating: 24 },
    mechanicEffects: { 'defense.dot-resistance': 0.42, 'defense.debuff-resistance': 0.22, 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 8000 },
    tier: 2,
    description: 'Mystically sealed wrappings that resist 42% of DoT, reduce debuff potency by 22%, and cleanse 1 stack of every active debuff every 8 seconds.',
  }],
  ['desert-boots-t2', {
    id: 'desert-boots-t2', name: 'Dune Stride',
    recipeGroup: 'desert', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { yellow: 68, red: 20, blue: 10 }, stats: { speed: 92 }, tier: 2,
    description: 'Worn by desert nomads who outrun storms on foot.',
  }],
  ['desert-charm-t2', {
    id: 'desert-charm-t2', name: 'Stone Colossus Eye',
    recipeGroup: 'desert', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { yellow: 68, red: 20, blue: 10 }, stats: { hpRegen: 16 },
    mechanicEffects: { 'defense.absorb-pct': 0.28 },
    tier: 2,
    description: 'The eye of an ancient desert colossus — 28% of damage taken becomes a healing stream; the harder the fight, the faster you recover.',
  }],

  // ── Volcanic T1 (ring 2) — red only ───────────────────────────────────────
  ['volcanic-blade-t1', {
    id: 'volcanic-blade-t1', name: 'Ember Blade',
    recipeGroup: 'volcanic', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { red: 72 }, stats: { attack: 30 }, attacksPerSecond: 1.25, tier: 1,
    description: 'Quenched in volcanic slag — stays warm to the touch.',
  }],
  ['volcanic-vest-t1', {
    id: 'volcanic-vest-t1', name: 'Magma-Cured Hide',
    recipeGroup: 'volcanic', requiredBiomeLevel: 2, slot: 'armor',
    cost: { red: 72 }, stats: { maxHp: 40, plating: 14, damageReduction: 0.10 }, tier: 1,
    description: 'Fire-beast hide cooled to near-steel hardness — volcanic density provides extraordinary bulk.',
  }],
  ['volcanic-boots-t1', {
    id: 'volcanic-boots-t1', name: 'Lava Step',
    recipeGroup: 'volcanic', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { red: 60 }, stats: { speed: 60 }, tier: 1,
    description: 'Heat-sealed soles that treat lava like cool stone.',
  }],
  ['volcanic-charm-t1', {
    id: 'volcanic-charm-t1', name: 'Ember Core',
    recipeGroup: 'volcanic', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { red: 60 }, stats: { hpRegen: 12 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.35 },
    tier: 1,
    description: 'A volcanic core that feeds on combat heat — 35% of your regen rate applies while fighting.',
  }],

  // ── Volcanic T2 — red + yellow + purple (cross-biome, 3 types) ────────────
  ['volcanic-blade-t2', {
    id: 'volcanic-blade-t2', name: 'Inferno Edge',
    recipeGroup: 'volcanic', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { red: 88, yellow: 25, purple: 12 }, stats: { attack: 55 }, attacksPerSecond: 1.5, tier: 2,
    description: 'Folded in a live magma vent a thousand times over.',
  }],
  ['volcanic-vest-t2', {
    id: 'volcanic-vest-t2', name: 'Infernal Bestial Plate',
    recipeGroup: 'volcanic', requiredBiomeLevel: 7, slot: 'armor',
    cost: { red: 88, yellow: 25, purple: 12 }, stats: { maxHp: 65, plating: 22, damageReduction: 0.14 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.25, 'defense.shield-pct': 0.08, 'defense.shield-interval-ms': 12000 },
    tier: 2,
    description: 'Living volcanic armor that regenerates in battle (25% of your regen rate) and forms an 8% maxHp shield every 12 seconds in combat.',
  }],
  ['volcanic-boots-t2', {
    id: 'volcanic-boots-t2', name: 'Magma Stride',
    recipeGroup: 'volcanic', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { red: 74, yellow: 21, purple: 10 }, stats: { speed: 98 }, tier: 2,
    description: 'Boots from the oldest magma-golem — carries volcanic fury.',
  }],
  ['volcanic-charm-t2', {
    id: 'volcanic-charm-t2', name: 'Infernal Core',
    recipeGroup: 'volcanic', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { red: 74, yellow: 21, purple: 10 }, stats: { hpRegen: 20 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.45 },
    tier: 2,
    description: 'An infernal volcanic core of immense endurance — 45% of your regen rate applies in combat; the ultimate attrition charm.',
  }],
] satisfies [string, Recipe][];
