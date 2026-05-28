import type { Recipe } from './types';

export const jungleTundraDesertVolcanicRecipeEntries = [
  // ── Jungle T1 — green only (jungle first appears T2; unlocks from any jungle node) ──
  ['jungle-vest-t1', {
    id: 'jungle-vest-t1', name: 'Verdant Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 3, slot: 'armor',
    cost: { green: 22 }, stats: { maxHp: 10, plating: 2, evasion: 6 }, tier: 2,
    description: 'Flexible jungle bindings that let you slip between strikes — every 6th incoming attack passes through you.',
    upgrades: [
      { stats: { maxHp: 3, plating: 1 }, cost: { green: 12 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 5, plating: 1 }, cost: { green: 24 }, requiredBiomeLevel: 5 },
      { stats: { maxHp: 6, plating: 1 }, cost: { green: 44 }, requiredBiomeLevel: 6 },
    ],
  }],

  ['jungle-boots-t1', {
    id: 'jungle-boots-t1', name: 'Vine Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 1, slot: 'mobility',
    cost: { red: 18 }, stats: { speed: 22 }, tier: 2,
    description: 'Elastic jungle vines that spring with each step.',
    upgrades: [
      { stats: { speed: 5 }, cost: { red: 10 }, requiredBiomeLevel: 2 },
      { stats: { speed: 7 }, cost: { red: 20 }, requiredBiomeLevel: 3 },
      { stats: { speed: 9 }, cost: { red: 36 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['jungle-charm-t1', {
    id: 'jungle-charm-t1', name: 'Verdant Amulet',
    recipeGroup: 'jungle', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { green: 18 }, stats: { hpRegen: 5 }, tier: 2,
    description: 'Carved jade saturated with jungle life energy — pure recovery, nothing wasted on secondary effects.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { green: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 2 }, cost: { green: 20 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { green: 36 }, requiredBiomeLevel: 5 },
    ],
  }],

  ['jungle-vest-t2', {
    id: 'jungle-vest-t2', name: 'Primal Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 7, slot: 'armor',
    cost: { green: 54, yellow: 14 }, stats: { maxHp: 22, plating: 5, evasion: 5 },
    mechanicEffects: { 'defense.absorb-pct': 0.06 },
    tier: 3,
    description: 'Reactive jungle wrappings that evade every 5th attack and convert 6% of remaining damage into healing over 4 seconds.',
    upgrades: [
      { stats: { maxHp: 5, plating: 1 }, cost: { green: 26 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 8, plating: 2 }, cost: { green: 54 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 10, plating: 2 }, cost: { green: 96 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['jungle-boots-t2', {
    id: 'jungle-boots-t2', name: 'Predator Boots',
    recipeGroup: 'jungle', requiredBiomeLevel: 5, slot: 'mobility',
    cost: { green: 44, yellow: 11 }, stats: { speed: 52 }, tier: 3,
    description: 'Fitted from anaconda scale — silent and swift.',
    upgrades: [
      { stats: { speed: 8 },  cost: { green: 22 }, requiredBiomeLevel: 6 },
      { stats: { speed: 11 }, cost: { green: 44 }, requiredBiomeLevel: 7 },
      { stats: { speed: 15 }, cost: { green: 78 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['jungle-charm-t2', {
    id: 'jungle-charm-t2', name: 'Life Weave Amulet',
    recipeGroup: 'jungle', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { green: 44, yellow: 11 }, stats: { hpRegen: 8 }, tier: 3,
    description: 'A living amulet woven from thousand-year jungle vines — exceptional raw recovery for those who want no strings attached.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { green: 22 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 3 }, cost: { green: 44 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 4 }, cost: { green: 78 }, requiredBiomeLevel: 9 },
    ],
  }],

  ['tundra-blade-t1', {
    id: 'tundra-blade-t1', name: 'Permafrost Edge',
    recipeGroup: 'tundra', requiredBiomeLevel: 4, slot: 'weapon',
    cost: { blue: 70 }, stats: { attack: 28 }, attacksPerSecond: 1.25, tier: 3,
    description: 'A masterwork blade cycled through glacial freeze and thaw until each edge is immovable — never dulls, never yields.',
    upgrades: [
      { stats: { attack: 4 }, cost: { blue: 34 }, requiredBiomeLevel: 5 },
      { stats: { attack: 7 }, cost: { blue: 70 }, requiredBiomeLevel: 6 },
      { stats: { attack: 10 }, cost: { blue: 115 }, requiredBiomeLevel: 7 },
    ],
  }],

  ['tundra-vest-t1', {
    id: 'tundra-vest-t1', name: 'Frost-Forged Plate',
    recipeGroup: 'tundra', requiredBiomeLevel: 3, slot: 'armor',
    cost: { blue: 70 }, stats: { maxHp: 18, plating: 22, damageReduction: 0.08 }, tier: 3,
    description: 'Arctic-tempered full plate forged in glacial vents — brutal in mass and mitigation.',
    upgrades: [
      { stats: { maxHp: 4, plating: 4 }, cost: { blue: 34 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 6 }, cost: { blue: 70 }, requiredBiomeLevel: 5 },
      { stats: { maxHp: 8, plating: 8 }, cost: { blue: 115 }, requiredBiomeLevel: 6 },
    ],
  }],

  ['tundra-boots-t1', {
    id: 'tundra-boots-t1', name: 'Snowstep Boots',
    recipeGroup: 'tundra', requiredBiomeLevel: 1, slot: 'mobility',
    cost: { blue: 58 }, stats: { speed: 55 }, tier: 3,
    description: 'Enchanted to leave no tracks and lose no speed.',
    upgrades: [
      { stats: { speed: 8 },  cost: { blue: 28 }, requiredBiomeLevel: 2 },
      { stats: { speed: 12 }, cost: { blue: 58 }, requiredBiomeLevel: 3 },
      { stats: { speed: 16 }, cost: { blue: 96 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['tundra-charm-t1', {
    id: 'tundra-charm-t1', name: 'Frost Barrier',
    recipeGroup: 'tundra', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { blue: 58 }, stats: { hpRegen: 10 },
    mechanicEffects: { 'defense.shield-pct': 0.18, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 3,
    description: 'An arctic ward that crystallises an 18% HP ice shield in combat, refreshing every 8 seconds.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { blue: 28 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 3 }, cost: { blue: 58 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 4 }, cost: { blue: 96 }, requiredBiomeLevel: 5 },
    ],
  }],

  ['tundra-blade-t2', {
    id: 'tundra-blade-t2', name: 'Blizzard Edge',
    recipeGroup: 'tundra', requiredBiomeLevel: 8, slot: 'weapon',
    cost: { blue: 84, purple: 24, green: 12 }, stats: { attack: 50 }, attacksPerSecond: 1.5, tier: 4,
    description: 'Shaped at the heart of a permanent tundra blizzard — a pinnacle of arctic smithing, impossible to replicate elsewhere.',
    upgrades: [
      { stats: { attack: 6 },  cost: { blue: 42 }, requiredBiomeLevel: 9 },
      { stats: { attack: 10 }, cost: { blue: 84 }, requiredBiomeLevel: 10 },
      { stats: { attack: 14 }, cost: { blue: 136 }, requiredBiomeLevel: 11 },
    ],
  }],

  ['tundra-vest-t2', {
    id: 'tundra-vest-t2', name: 'Glacial Crusader Plate',
    recipeGroup: 'tundra', requiredBiomeLevel: 7, slot: 'armor',
    cost: { blue: 84, purple: 24, green: 12 }, stats: { maxHp: 35, plating: 36, damageReduction: 0.12 },
    mechanicEffects: { 'defense.hit-to-dot-pct': 0.18 },
    tier: 4,
    description: 'Apex arctic plate that channels 18% of absorbed impact into delayed frost debt — extreme hits are spread across 4 seconds.',
    upgrades: [
      { stats: { maxHp: 6, plating: 6 },  cost: { blue: 42 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 10, plating: 9 }, cost: { blue: 84 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 12, plating: 12 }, cost: { blue: 136 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['tundra-boots-t2', {
    id: 'tundra-boots-t2', name: 'Frost Wind Wraps',
    recipeGroup: 'tundra', requiredBiomeLevel: 5, slot: 'mobility',
    cost: { blue: 68, purple: 20, green: 10 }, stats: { speed: 92 }, tier: 4,
    description: 'Woven from the breath of a permafrost storm.',
    upgrades: [
      { stats: { speed: 10 }, cost: { blue: 34 }, requiredBiomeLevel: 6 },
      { stats: { speed: 15 }, cost: { blue: 68 }, requiredBiomeLevel: 7 },
      { stats: { speed: 20 }, cost: { blue: 108 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['tundra-charm-t2', {
    id: 'tundra-charm-t2', name: 'Glacial Bulwark',
    recipeGroup: 'tundra', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { blue: 68, purple: 20, green: 10 }, stats: { hpRegen: 16 },
    mechanicEffects: { 'defense.shield-pct': 0.22, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 4,
    description: 'An ancient glacier ward — 22% HP glacial shield every 8 seconds; virtually impenetrable to sustained assault.',
    upgrades: [
      { stats: { hpRegen: 3 }, cost: { blue: 34 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 4 }, cost: { blue: 68 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 5 }, cost: { blue: 108 }, requiredBiomeLevel: 9 },
    ],
  }],

  ['desert-blade-t1', {
    id: 'desert-blade-t1', name: 'Scorpion Blade',
    recipeGroup: 'desert', requiredBiomeLevel: 4, slot: 'weapon',
    cost: { yellow: 70 }, stats: { attack: 28 }, attacksPerSecond: 1.25, tier: 2,
    description: 'A sand-scorpion stinger sharpened to a piercing point.',
    upgrades: [
      { stats: { attack: 4 }, cost: { yellow: 34 }, requiredBiomeLevel: 5 },
      { stats: { attack: 7 }, cost: { yellow: 70 }, requiredBiomeLevel: 6 },
      { stats: { attack: 10 }, cost: { yellow: 115 }, requiredBiomeLevel: 7 },
    ],
  }],

  ['desert-vest-t1', {
    id: 'desert-vest-t1', name: 'Sunbaked Wrappings',
    recipeGroup: 'desert', requiredBiomeLevel: 3, slot: 'armor',
    cost: { yellow: 70 }, stats: { maxHp: 25, plating: 14 },
    mechanicEffects: { 'defense.dot-resistance': 0.28, 'defense.debuff-resistance': 0.10 },
    tier: 2,
    description: 'Heat-hardened desert cloth that resists burns, poisons, and curses of the wastes — 28% DoT resistance and 10% debuff reduction.',
    upgrades: [
      { stats: { maxHp: 5, plating: 2 }, cost: { yellow: 34 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 8, plating: 3 }, cost: { yellow: 70 }, requiredBiomeLevel: 5 },
      { stats: { maxHp: 10, plating: 4 }, cost: { yellow: 115 }, requiredBiomeLevel: 6 },
    ],
  }],

  ['desert-boots-t1', {
    id: 'desert-boots-t1', name: 'Sand Sprint',
    recipeGroup: 'desert', requiredBiomeLevel: 1, slot: 'mobility',
    cost: { yellow: 58 }, stats: { speed: 58 }, tier: 2,
    description: 'Broad-soled boots that turn loose sand into a track.',
    upgrades: [
      { stats: { speed: 8 },  cost: { yellow: 28 }, requiredBiomeLevel: 2 },
      { stats: { speed: 12 }, cost: { yellow: 58 }, requiredBiomeLevel: 3 },
      { stats: { speed: 16 }, cost: { yellow: 96 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['desert-charm-t1', {
    id: 'desert-charm-t1', name: 'Sand Golem Eye',
    recipeGroup: 'desert', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { yellow: 58 }, stats: { hpRegen: 10 },
    mechanicEffects: { 'defense.absorb-pct': 0.22 },
    tier: 2,
    description: 'A preserved desert golem eye — 22% of all damage taken converts to healing over 4 seconds.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { yellow: 28 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 3 }, cost: { yellow: 58 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 4 }, cost: { yellow: 96 }, requiredBiomeLevel: 5 },
    ],
  }],

  ['desert-blade-t2', {
    id: 'desert-blade-t2', name: 'Sandstorm Blade',
    recipeGroup: 'desert', requiredBiomeLevel: 8, slot: 'weapon',
    cost: { yellow: 84, red: 24, blue: 12 }, stats: { attack: 50 }, attacksPerSecond: 1.5, tier: 3,
    description: 'A blade shaped by a thousand-year sandstorm.',
    upgrades: [
      { stats: { attack: 6 },  cost: { yellow: 42 }, requiredBiomeLevel: 9 },
      { stats: { attack: 10 }, cost: { yellow: 84 }, requiredBiomeLevel: 10 },
      { stats: { attack: 14 }, cost: { yellow: 136 }, requiredBiomeLevel: 11 },
    ],
  }],

  ['desert-vest-t2', {
    id: 'desert-vest-t2', name: 'Ancient Sunbaked Wrappings',
    recipeGroup: 'desert', requiredBiomeLevel: 7, slot: 'armor',
    cost: { yellow: 84, red: 24, blue: 12 }, stats: { maxHp: 42, plating: 24 },
    mechanicEffects: { 'defense.dot-resistance': 0.42, 'defense.debuff-resistance': 0.22, 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 8000 },
    tier: 3,
    description: 'Mystically sealed wrappings that resist 42% of DoT, reduce debuff potency by 22%, and cleanse 1 stack of every active debuff every 8 seconds.',
    upgrades: [
      { stats: { maxHp: 7, plating: 3 },  cost: { yellow: 42 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 11, plating: 5 }, cost: { yellow: 84 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 14, plating: 6 }, cost: { yellow: 136 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['desert-boots-t2', {
    id: 'desert-boots-t2', name: 'Dune Stride',
    recipeGroup: 'desert', requiredBiomeLevel: 5, slot: 'mobility',
    cost: { yellow: 68, red: 20, blue: 10 }, stats: { speed: 92 }, tier: 3,
    description: 'Worn by desert nomads who outrun storms on foot.',
    upgrades: [
      { stats: { speed: 10 }, cost: { yellow: 34 }, requiredBiomeLevel: 6 },
      { stats: { speed: 15 }, cost: { yellow: 68 }, requiredBiomeLevel: 7 },
      { stats: { speed: 20 }, cost: { yellow: 108 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['desert-charm-t2', {
    id: 'desert-charm-t2', name: 'Stone Colossus Eye',
    recipeGroup: 'desert', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { yellow: 68, red: 20, blue: 10 }, stats: { hpRegen: 16 },
    mechanicEffects: { 'defense.absorb-pct': 0.28 },
    tier: 3,
    description: 'The eye of an ancient desert colossus — 28% of damage taken becomes a healing stream; the harder the fight, the faster you recover.',
    upgrades: [
      { stats: { hpRegen: 3 }, cost: { yellow: 34 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 4 }, cost: { yellow: 68 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 5 }, cost: { yellow: 108 }, requiredBiomeLevel: 9 },
    ],
  }],

  ['volcanic-blade-t1', {
    id: 'volcanic-blade-t1', name: 'Magma-Cast Blade',
    recipeGroup: 'volcanic', requiredBiomeLevel: 4, slot: 'weapon',
    cost: { red: 72 }, stats: { attack: 30 }, attacksPerSecond: 1.25, tier: 3,
    description: 'Cast in an active lava vent and folded over obsidian — a masterwork blade that holds residual volcanic heat long after the forge.',
    upgrades: [
      { stats: { attack: 4 }, cost: { red: 36 }, requiredBiomeLevel: 5 },
      { stats: { attack: 7 }, cost: { red: 72 }, requiredBiomeLevel: 6 },
      { stats: { attack: 11 }, cost: { red: 118 }, requiredBiomeLevel: 7 },
    ],
  }],

  ['volcanic-vest-t1', {
    id: 'volcanic-vest-t1', name: 'Magma-Cured Hide',
    recipeGroup: 'volcanic', requiredBiomeLevel: 3, slot: 'armor',
    cost: { red: 72 }, stats: { maxHp: 40, plating: 14, damageReduction: 0.10 }, tier: 3,
    description: 'Fire-beast hide cooled to near-steel hardness — volcanic density provides extraordinary bulk.',
    upgrades: [
      { stats: { maxHp: 6, plating: 2 }, cost: { red: 36 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 9, plating: 3 }, cost: { red: 72 }, requiredBiomeLevel: 5 },
      { stats: { maxHp: 12, plating: 4 }, cost: { red: 118 }, requiredBiomeLevel: 6 },
    ],
  }],

  ['volcanic-boots-t1', {
    id: 'volcanic-boots-t1', name: 'Lava Step',
    recipeGroup: 'volcanic', requiredBiomeLevel: 1, slot: 'mobility',
    cost: { red: 60 }, stats: { speed: 60 }, tier: 3,
    description: 'Heat-sealed soles that treat lava like cool stone.',
    upgrades: [
      { stats: { speed: 8 },  cost: { red: 30 }, requiredBiomeLevel: 2 },
      { stats: { speed: 12 }, cost: { red: 60 }, requiredBiomeLevel: 3 },
      { stats: { speed: 16 }, cost: { red: 98 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['volcanic-charm-t1', {
    id: 'volcanic-charm-t1', name: 'Ember Core',
    recipeGroup: 'volcanic', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { red: 60 }, stats: { hpRegen: 12 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.35 },
    tier: 3,
    description: 'A volcanic core that feeds on combat heat — 35% of your regen rate applies while fighting.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { red: 30 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 3 }, cost: { red: 60 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 4 }, cost: { red: 98 }, requiredBiomeLevel: 5 },
    ],
  }],

  ['volcanic-blade-t2', {
    id: 'volcanic-blade-t2', name: 'Inferno Edge',
    recipeGroup: 'volcanic', requiredBiomeLevel: 8, slot: 'weapon',
    cost: { red: 88, yellow: 25, purple: 12 }, stats: { attack: 55 }, attacksPerSecond: 1.5, tier: 4,
    description: 'Folded in a live magma vent a thousand times over — an elite weapon that carries a fragment of volcanic fury in every swing.',
    upgrades: [
      { stats: { attack: 7 },  cost: { red: 44 }, requiredBiomeLevel: 9 },
      { stats: { attack: 11 }, cost: { red: 88 }, requiredBiomeLevel: 10 },
      { stats: { attack: 16 }, cost: { red: 144 }, requiredBiomeLevel: 11 },
    ],
  }],

  ['volcanic-vest-t2', {
    id: 'volcanic-vest-t2', name: 'Infernal Bestial Plate',
    recipeGroup: 'volcanic', requiredBiomeLevel: 7, slot: 'armor',
    cost: { red: 88, yellow: 25, purple: 12 }, stats: { maxHp: 65, plating: 22, damageReduction: 0.14 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.25, 'defense.shield-pct': 0.08, 'defense.shield-interval-ms': 12000 },
    tier: 4,
    description: 'Living volcanic armor that regenerates in battle (25% of your regen rate) and forms an 8% maxHp shield every 12 seconds in combat.',
    upgrades: [
      { stats: { maxHp: 8, plating: 3 },  cost: { red: 44 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 12, plating: 5 }, cost: { red: 88 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 16, plating: 6 }, cost: { red: 144 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['volcanic-boots-t2', {
    id: 'volcanic-boots-t2', name: 'Magma Stride',
    recipeGroup: 'volcanic', requiredBiomeLevel: 5, slot: 'mobility',
    cost: { red: 74, yellow: 21, purple: 10 }, stats: { speed: 98 }, tier: 4,
    description: 'Boots from the oldest magma-golem — carries volcanic fury.',
    upgrades: [
      { stats: { speed: 11 }, cost: { red: 37 }, requiredBiomeLevel: 6 },
      { stats: { speed: 16 }, cost: { red: 74 }, requiredBiomeLevel: 7 },
      { stats: { speed: 22 }, cost: { red: 120 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['volcanic-charm-t2', {
    id: 'volcanic-charm-t2', name: 'Infernal Core',
    recipeGroup: 'volcanic', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { red: 74, yellow: 21, purple: 10 }, stats: { hpRegen: 20 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.45 },
    tier: 4,
    description: 'An infernal volcanic core of immense endurance — 45% of your regen rate applies in combat; the ultimate attrition charm.',
    upgrades: [
      { stats: { hpRegen: 3 }, cost: { red: 37 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 5 }, cost: { red: 74 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 6 }, cost: { red: 120 }, requiredBiomeLevel: 9 },
    ],
  }],

  // ── Master merge additions ─────────────────────────────────────────────

  ['jungle-hunter-t2', {
    id: 'jungle-hunter-t2', name: "Hunter's Talisman",
    recipeGroup: 'jungle', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { green: 44, yellow: 11 }, stats: { hpRegen: 5 },
    mechanicEffects: { 'defense.kill-burst-pct': 0.12 },
    tier: 3,
    description: "A predator's trophy that floods the wearer with life energy on each kill — 12% of max HP healed over 4 seconds per kill. Stacks with rapid kills.",
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { green: 22 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 2 }, cost: { green: 44 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 2 }, cost: { green: 78 }, requiredBiomeLevel: 9 },
    ],
  }],

  ['stinger-fang', {
    id: 'stinger-fang', name: 'Stinger Fang',
    recipeGroup: 'jungle', requiredBiomeLevel: 8, slot: 'weapon',
    cost: { green: 64, yellow: 18 }, stats: { attack: 7, onHitDamage: 11 }, attacksPerSecond: 1.50, tier: 2,
    description: 'A slender blade coated in with magic, dealing significant damage on hit.',
    upgrades: [
      { stats: { attack: 1, onHitDamage: 2 }, cost: { green: 32 }, requiredBiomeLevel: 9 },
      { stats: { attack: 1, onHitDamage: 3 }, cost: { green: 64 }, requiredBiomeLevel: 10 },
      { stats: { attack: 2, onHitDamage: 4 }, cost: { green: 104 }, requiredBiomeLevel: 11 },
    ],
  }],
] satisfies [string, Recipe][];
