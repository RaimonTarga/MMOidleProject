import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// CAVE — full lineage (T1→T3). Identity: %DR armor / regen-burst charm /
// above-curve chaotic-axe (dead-swing tax). Charm rework: upgrades ramp the
// recovery mechanic(s); hpRegen flat (see mountain.recipes.ts header).
// ─────────────────────────────────────────────────────────────────────────

export const caveRecipeEntries = [
  // ── T1 ──
  ['chaotic-axe', {
    id: 'chaotic-axe', name: 'Chaotic Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { red: 22 }, stats: { attack: 25 }, attacksPerSecond: 1.10, tier: 1,
    mechanicEffects: { 'weapon.dead-swing-interval': 3 },
    icon: 'items/weapons/axe-1.png',
    description: 'A wild, top-heavy thing that fights as much as it is wielded.',
    upgrades: [
      { stats: { attack: 10 }, cost: { red: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 10 }, cost: { red: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 10 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  // CHARM (regen-burst): base 0.05 -> +0.01/step -> 0.08 at +3. hpRegen 3 flat.
  ['cave-charm-t1', {
    id: 'cave-charm-t1', name: 'Pulse Stone',
    recipeGroup: 'cave', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { red: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.05, 'defense.regen-burst-interval-ms': 8000 },
    tier: 1,
    icon: 'items/charms/bright-charm-1.png',
    description: 'A cave-crystal that beats, slow and steady, like a sleeping heart.',
    upgrades: [
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01 }, cost: { red: 10 }, requiredBiomeLevel: 3 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01 }, cost: { red: 22 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-boots-t1', {
    id: 'cave-boots-t1', name: 'Bat Wing Boots',
    recipeGroup: 'cave', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { red: 18 }, stats: { speed: 28 }, tier: 1,
    mechanicEffects: { 'mobility.stealth-pct': 0.30 },
    icon: 'items/boots/leather-boots-5.png',
    description: 'Stretched membrane that falls on stone without a whisper.',
    upgrades: [
      { stats: { speed: 3 }, cost: { red: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { red: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-vest-t1', {
    id: 'cave-vest-t1', name: 'Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 4, slot: 'armor',
    cost: { red: 22 }, stats: { maxHp: 16, plating: 2, damageReduction: 0.06 }, tier: 1,
    icon: 'items/armor/bone-armor.png',
    description: 'The hide of something large and unlucky, cured to a stubborn toughness.',
    upgrades: [
      { stats: { maxHp: 4, plating: 1, damageReduction: 0.01 }, cost: { red: 10 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4, plating: 1, damageReduction: 0.01 }, cost: { red: 22 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4, plating: 1, damageReduction: 0.01 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  ['ruinous-axe', {
    id: 'ruinous-axe', name: 'Ruinous Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { red: 54, purple: 13 }, stats: { attack: 40 }, attacksPerSecond: 1.20, tier: 2,
    mechanicEffects: { 'weapon.dead-swing-interval': 4 },
    icon: 'items/weapons/axe-2.png',
    description: 'Bigger, meaner, and somehow better balanced — chaos with the faintest thread of discipline.',
    upgrades: [
      { stats: { attack: 16 }, cost: { red: 26 }, requiredBiomeLevel: 6 },
      { stats: { attack: 16 }, cost: { red: 54 }, requiredBiomeLevel: 7 },
      { stats: { attack: 16 }, cost: { red: 96 }, requiredBiomeLevel: 8 },
    ],
  }],

  // CHARM (regen-burst): base 0.09 -> +0.02/step -> 0.15 at +3. hpRegen 6 flat.
  ['cave-charm-t2', {
    id: 'cave-charm-t2', name: 'Resonant Gem',
    recipeGroup: 'cave', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { red: 44, purple: 11 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.09, 'defense.regen-burst-interval-ms': 8000 },
    tier: 2,
    icon: 'items/charms/bright-charm-2.png',
    description: 'A gem that rings on its own in the dark, answering a song no one else hears.',
    upgrades: [
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02 }, cost: { red: 22 }, requiredBiomeLevel: 7 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02 }, cost: { red: 44 }, requiredBiomeLevel: 8 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02 }, cost: { red: 78 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['cave-boots-t2', {
    id: 'cave-boots-t2', name: 'Cavern Sprints',
    recipeGroup: 'cave', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { red: 44, purple: 11 }, stats: { speed: 39 }, tier: 2,
    mechanicEffects: { 'mobility.stealth-pct': 0.45 },
    icon: 'items/boots/leather-boots-6.png',
    description: 'Worn smooth on tunnel floors no map has ever charted.',
    upgrades: [
      { stats: { speed: 3 }, cost: { red: 22 }, requiredBiomeLevel: 8 },
      { stats: { speed: 4 }, cost: { red: 44 }, requiredBiomeLevel: 8 },
      { stats: { speed: 5 }, cost: { red: 78 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['cave-vest-t2', {
    id: 'cave-vest-t2', name: 'Dire Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 7, slot: 'armor',
    cost: { red: 54, purple: 14 }, stats: { maxHp: 30, plating: 4, damageReduction: 0.10 }, tier: 2,
    icon: 'items/armor/plate-armor-4.png',
    description: 'From a beast the deep-cavern folk name only in low voices.',
    upgrades: [
      { stats: { maxHp: 8, plating: 1, damageReduction: 0.01 }, cost: { red: 26 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 8, plating: 1, damageReduction: 0.01 }, cost: { red: 54 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 8, plating: 1, damageReduction: 0.01 }, cost: { red: 96 }, requiredBiomeLevel: 8 },
    ],
  }],

  // ── T3 ──
  ['cave-cataclysm-axe', {
    id: 'cave-cataclysm-axe', name: 'Cataclysm Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 9, slot: 'weapon',
    cost: { red: 116 }, stats: { attack: 92 }, attacksPerSecond: 1.20, tier: 3,
    mechanicEffects: { 'weapon.dead-swing-interval': 5 },
    icon: 'items/weapons/axe-2.png',
    description: 'Chaos given an edge — and, at last, a little rhythm. Every fifth swing still finds only air.',
    upgrades: [
      { stats: { attack: 20 }, cost: { red: 58 },  requiredBiomeLevel: 10 },
      { stats: { attack: 20 }, cost: { red: 116 }, requiredBiomeLevel: 11 },
      { stats: { attack: 20 }, cost: { red: 196 }, requiredBiomeLevel: 12 },
    ],
  }],

  // CHARM (regen-burst + in-combat-regen): both ramp.
  //   regen-burst 0.13 -> +0.03/step -> 0.22 ; in-combat 0.07 -> +0.01/step -> 0.10. hpRegen 11 flat.
  ['cave-charm-t3', {
    id: 'cave-charm-t3', name: 'Echo Geode',
    recipeGroup: 'cave', requiredBiomeLevel: 10, slot: 'recovery',
    cost: { red: 100 }, stats: { hpRegen: 11 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.13, 'defense.regen-burst-interval-ms': 8000, 'defense.in-combat-regen-pct': 0.07 },
    tier: 3,
    icon: 'items/charms/bright-charm-2.png',
    description: 'It pulses on its own clock, and hums a low, steady mending between the beats.',
    upgrades: [
      { mechanicEffects: { 'defense.regen-burst-pct': 0.03, 'defense.in-combat-regen-pct': 0.01 }, cost: { red: 50 },  requiredBiomeLevel: 11 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.03, 'defense.in-combat-regen-pct': 0.01 }, cost: { red: 100 }, requiredBiomeLevel: 12 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.03, 'defense.in-combat-regen-pct': 0.01 }, cost: { red: 175 }, requiredBiomeLevel: 12 },
    ],
  }],

  // cave.recipes.ts
  ['cave-boots-t3', {
    id: 'cave-boots-t3', name: 'Echostep Treads',
    recipeGroup: 'cave', requiredBiomeLevel: 11, slot: 'mobility',
    cost: { red: 60, purple: 15 }, stats: { speed: 52 }, tier: 3,
    mechanicEffects: { 'mobility.stealth-pct': 0.60 },
    icon: 'items/boots/leather-boots-7.png',
    description: 'They give back no sound at all — not even the echo the deep stone expects.',
    upgrades: [
      { stats: { speed: 4 }, cost: { red: 30 },  requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { red: 60 },  requiredBiomeLevel: 11 },
      { stats: { speed: 6 }, cost: { red: 105 }, requiredBiomeLevel: 12 },
    ],
  }],

  ['cave-vest-t3', {
    id: 'cave-vest-t3', name: 'Deepscale Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 12, slot: 'armor',
    cost: { red: 116 }, stats: { maxHp: 50, plating: 10, damageReduction: 0.20 },
    tier: 3,
    icon: 'items/armor/plate-armor-4.png',
    description: 'Layered scale over thick hide — nothing fancy, just the most of everything that stops a blow.',
    upgrades: [
      { stats: { maxHp: 10, plating: 2, damageReduction: 0.02 }, cost: { red: 58 },  requiredBiomeLevel: 12 },
      { stats: { maxHp: 10, plating: 2, damageReduction: 0.02 }, cost: { red: 116 }, requiredBiomeLevel: 12 },
      { stats: { maxHp: 10, plating: 2, damageReduction: 0.02 }, cost: { red: 196 }, requiredBiomeLevel: 12 },
    ],
  }],

  
] satisfies [string, Recipe][];
