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
    cost: { red: 26 }, stats: { attack: 24 }, attacksPerSecond: 1.10, tier: 1,
    mechanicEffects: { 'weapon.dead-swing-interval': 3 },
    icon: 'items/weapons/chaotic-axe.png',
    description: 'A wild, top-heavy thing that fights as much as it is wielded.',
    upgrades: [
      { stats: { attack: 7 }, cost: { red: 30 }, requiredBiomeLevel: 2 },
      { stats: { attack: 7}, cost: { red: 66 }, requiredBiomeLevel: 3 },
      { stats: { attack: 8 }, cost: { red: 126 }, requiredBiomeLevel: 4 },
      { stats: { attack: 8 }, cost: { red: 126 }, requiredBiomeLevel: 4 },
      { stats: { attack: 8 }, cost: { red: 126 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-vest-t1', {
    id: 'cave-vest-t1', name: 'Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 2, slot: 'armor',
    cost: { red: 22 }, stats: { maxHp: 28, plating: 2, damageReduction: 0.06 }, tier: 1,
    icon: 'items/armor/bestial-hide.png',
    description: 'The hide of something large and unlucky, cured to a stubborn toughness.',
    upgrades: [
      { stats: { maxHp: 7, plating: 1, damageReduction: 0.02 }, cost: { red: 50 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 7, plating: 1, damageReduction: 0.02 }, cost: { red: 100 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 7, plating: 1, damageReduction: 0.02 }, cost: { red: 150 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 7, plating: 1, damageReduction: 0.02 }, cost: { red: 150 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 7, plating: 1, damageReduction: 0.02 }, cost: { red: 150 }, requiredBiomeLevel: 4 },
    ],
  }],

  // CHARM (regen-burst): base 0.05 -> +0.01/step -> 0.08 at +3. hpRegen 3 flat.
  ['cave-charm-t1', {
    id: 'cave-charm-t1', name: 'Pulse Stone',
    recipeGroup: 'cave', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { red: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.05, 'defense.regen-burst-interval-ms': 6000 },
    tier: 1,
    icon: 'items/charms/pulse-stone.png',
    description: 'A cave-crystal that beats, slow and steady, like a sleeping heart.',
    upgrades: [
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01 }, cost: { red: 15 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01 }, cost: { red: 33 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01 }, cost: { red: 63 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01 }, cost: { red: 63 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01 }, cost: { red: 63 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-boots-t1', {
    id: 'cave-boots-t1', name: 'Bat Wing Boots',
    recipeGroup: 'cave', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { red: 18 }, stats: { speed: 28 }, tier: 1,
    mechanicEffects: { 'mobility.stealth-pct': 0.30 },
    icon: 'items/boots/bat-wing-boots.png',
    description: 'Stretched membrane that falls on stone without a whisper.',
    upgrades: [
      { stats: { speed: 3 }, cost: { red: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { red: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  ['ruinous-axe', {
    id: 'ruinous-axe', name: 'Ruinous Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { red: 60 }, catalystCost: { volatility: 2 }, stats: { attack: 40 }, attacksPerSecond: 1.20, tier: 2, // family-tag: chaotic-axe (counted disruption) → Volatility
    mechanicEffects: { 'weapon.dead-swing-interval': 4 },
    icon: 'items/weapons/ruinous-axe.png',
    description: 'Bigger, meaner, and somehow better balanced — chaos with the faintest thread of discipline.',
    upgrades: [
      { stats: { attack: 14 }, cost: { red: 78 }, requiredBiomeLevel: 8 },
      { stats: { attack: 14 }, cost: { red: 162 }, requiredBiomeLevel: 9 },
      { stats: { attack: 14 }, cost: { red: 288 }, requiredBiomeLevel: 10 },
      { stats: { attack: 14 }, cost: { red: 288 }, requiredBiomeLevel: 10 },
      { stats: { attack: 14 }, cost: { red: 288 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['cave-vest-t2', {
    id: 'cave-vest-t2', name: 'Dire Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 8, slot: 'armor',
    cost: { red: 54 }, catalystCost: { volatility: 2 }, stats: { maxHp: 46, plating: 5, damageReduction: 0.12 }, tier: 2, // family-tag: premium %DR generalist wall → Volatility
    icon: 'items/armor/dire-bestial-hide.png',
    description: 'From a beast the deep-cavern folk name only in low voices.',
    upgrades: [
      { stats: { maxHp: 10, plating: 2, damageReduction: 0.02 }, cost: { red: 80 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 10, plating: 2, damageReduction: 0.02 }, cost: { red: 175 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 10, plating: 2, damageReduction: 0.02 }, cost: { red: 300 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 10, plating: 2, damageReduction: 0.02 }, cost: { red: 300 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 10, plating: 2, damageReduction: 0.02 }, cost: { red: 300 }, requiredBiomeLevel: 10 },
    ],
  }],

  // CHARM (regen-burst): base 0.09 -> +0.02/step -> 0.15 at +3. hpRegen 6 flat.
  ['cave-charm-t2', {
    id: 'cave-charm-t2', name: 'Resonant Gem',
    recipeGroup: 'cave', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { red: 44 }, catalystCost: { volatility: 2 }, stats: { hpRegen: 6 }, // family-tag: reliable generalist recovery → Volatility
    mechanicEffects: { 'defense.regen-burst-pct': 0.06, 'defense.regen-burst-interval-ms': 6000 },
    tier: 2,
    icon: 'items/charms/resonant-gem.png',
    description: 'A gem that rings on its own in the dark, answering a song no one else hears.',
    upgrades: [
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02 }, cost: { red: 33 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02 }, cost: { red: 66 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02 }, cost: { red: 120 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02 }, cost: { red: 120 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02 }, cost: { red: 120 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['cave-boots-t2', {
    id: 'cave-boots-t2', name: 'Cavern Sprints',
    recipeGroup: 'cave', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { red: 33 }, catalystCost: { volatility: 2 }, stats: { speed: 39 }, tier: 2, // family-tag: cave generalist mobility → Volatility
    mechanicEffects: { 'mobility.stealth-pct': 0.35 },
    icon: 'items/boots/cavern-sprints.png',
    description: 'Worn smooth on tunnel floors no map has ever charted.',
    upgrades: [
      { stats: { speed: 3 }, cost: { red: 22 }, requiredBiomeLevel: 10 },
      { stats: { speed: 4 }, cost: { red: 44 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { red: 78 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { red: 78 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { red: 78 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── T3 ──
  ['cave-cataclysm-axe', {
    id: 'cave-cataclysm-axe', name: 'Cataclysm Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 13, slot: 'weapon',
    cost: { red: 120 }, catalystCost: { volatility: 3 }, stats: { attack: 82 }, attacksPerSecond: 1.20, tier: 3, // family-tag: chaotic-axe → Volatility
    mechanicEffects: { 'weapon.dead-swing-interval': 5 },
    icon: 'items/weapons/cataclysm-axe.png',
    description: 'Chaos given an edge — and, at last, a little rhythm. Every fifth swing still finds only air.',
    upgrades: [
      { stats: { attack: 16 }, cost: { red: 174 },  requiredBiomeLevel: 14 },
      { stats: { attack: 16 }, cost: { red: 348 }, requiredBiomeLevel: 15 },
      { stats: { attack: 16 }, cost: { red: 588 }, requiredBiomeLevel: 16 },
      { stats: { attack: 16 }, cost: { red: 588 }, requiredBiomeLevel: 16 },
      { stats: { attack: 16 }, cost: { red: 588 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['cave-vest-t3', {
    id: 'cave-vest-t3', name: 'Deepscale Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 14, slot: 'armor',
    cost: { red: 116, yellow: 29 }, catalystCost: { volatility: 3 }, stats: { maxHp: 65, plating: 14, damageReduction: 0.20 }, // family-tag: premium %DR wall → Volatility
    tier: 3,
    icon: 'items/armor/deepscale-hide.png',
    description: 'Layered scale over thick hide — nothing fancy, just the most of everything that stops a blow.',
    upgrades: [
      { stats: { maxHp: 15, plating: 2, damageReduction: 0.02 }, cost: { red: 135, yellow: 45 },  requiredBiomeLevel: 15 },
      { stats: { maxHp: 15, plating: 2, damageReduction: 0.02 }, cost: { red: 270, yellow: 90 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 15, plating: 2, damageReduction: 0.02 }, cost: { red: 450, yellow: 150 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 15, plating: 2, damageReduction: 0.02 }, cost: { red: 450, yellow: 150 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 15, plating: 2, damageReduction: 0.02 }, cost: { red: 450, yellow: 150 }, requiredBiomeLevel: 16 },
    ],
  }],

  // CHARM (regen-burst + in-combat-regen): both ramp.
  //   regen-burst 0.13 -> +0.03/step -> 0.22 ; in-combat 0.07 -> +0.01/step -> 0.10. hpRegen 11 flat.
  ['cave-charm-t3', {
    id: 'cave-charm-t3', name: 'Echo Geode',
    recipeGroup: 'cave', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { red: 100, green: 25 }, catalystCost: { volatility: 3 }, stats: { hpRegen: 11 }, // family-tag: reliable generalist recovery → Volatility
    mechanicEffects: { 'defense.regen-burst-pct': 0.07, 'defense.regen-burst-interval-ms': 6000, 'defense.in-combat-regen-pct': 0.02 },
    tier: 3,
    icon: 'items/charms/echo-geode.png',
    description: 'It pulses on its own clock, and hums a low, steady mending between the beats.',
    upgrades: [
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02, 'defense.in-combat-regen-pct': 0.01 }, cost: { red: 50, green: 25 },  requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02, 'defense.in-combat-regen-pct': 0.01 }, cost: { red: 112, green: 38}, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02, 'defense.in-combat-regen-pct': 0.01 }, cost: { red: 200, green: 50 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02, 'defense.in-combat-regen-pct': 0.01 }, cost: { red: 200, green: 50 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.02, 'defense.in-combat-regen-pct': 0.01 }, cost: { red: 200, green: 50 }, requiredBiomeLevel: 16 },
    ],
  }],

  // cave.recipes.ts
  ['cave-boots-t3', {
    id: 'cave-boots-t3', name: 'Echostep Treads',
    recipeGroup: 'cave', requiredBiomeLevel: 16, slot: 'mobility',
    cost: { red: 100 }, catalystCost: { volatility: 3 }, stats: { speed: 52 }, tier: 3, // family-tag: cave generalist mobility → Volatility
    mechanicEffects: { 'mobility.stealth-pct': 0.40 },
    icon: 'items/boots/echostep-treads.png',
    description: 'They give back no sound at all — not even the echo the deep stone expects.',
    upgrades: [
      { stats: { speed: 4 }, cost: { red: 30 },  requiredBiomeLevel: 16 },
      { stats: { speed: 5 }, cost: { red: 60 },  requiredBiomeLevel: 16 },
      { stats: { speed: 6 }, cost: { red: 105 }, requiredBiomeLevel: 16 },
      { stats: { speed: 6 }, cost: { red: 105 }, requiredBiomeLevel: 16 },
      { stats: { speed: 6 }, cost: { red: 105 }, requiredBiomeLevel: 16 },
    ],
  }],


  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Cave owns SINGLE-TARGET PRESSURE —
  // it teaches Expose Weakness, so it is where the elite-killer core comes from.

  // T2 starter — Force: the first real tradeoff a player is offered. All upside is
  // paid for in HP, which is the lesson the whole restricted tier is built on.
  ['core-force', {
    id: 'core-force', name: 'Force Core',
    recipeGroup: 'cave', requiredBiomeLevel: 8, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-force',
    cost: { red: 45 }, catalystCost: { predation: 1 }, // family-tag: raw offence → Predation
    stats: {}, tier: 2,
    mechanicEffects: { 'core.attack-mult': 0.13, 'core.maxhp-mult': -0.07 },
    icon: 'items/cores/force.png',
    description: 'It gives you the strike you wanted and takes the margin you were counting on.',
  }],

  // T3 melee — Duelist: commitment to one big target. Its opportunity cost is
  // structural rather than a stated penalty: it does very little against a crowd.
  ['core-duelist', {
    id: 'core-duelist', name: 'Duelist Core',
    recipeGroup: 'cave', requiredBiomeLevel: 15, slot: 'core', coreEligibility: 'melee',
    lineageId: 'core-duelist',
    cost: { red: 110 }, catalystCost: { predation: 3 }, // family-tag: single-target alpha → Predation
    stats: {}, tier: 3,
    mechanicEffects: { 'core.attack-mult': 0.12, 'core.maxhp-mult': 0.10, 'core.elite-damage-mult': 0.15 },
    icon: 'items/cores/duelist.png',
    description: 'Nothing here helps against a crowd. Against the one thing worth killing, it is everything.',
  }],

] satisfies [string, Recipe][];
