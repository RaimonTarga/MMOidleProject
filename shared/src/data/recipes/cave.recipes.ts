import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// CAVE — full lineage (T1→T3).
//
// Identity (design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md §5):
//   weapon  chaotic HIGH-OUTPUT weapon with a structural drawback. Above-curve
//           offence paid for in dead swings — dangerous, not merely efficient.
//   armor   premium generalist %DR. "Premium" means BREADTH, not a bigger total
//           budget: rarely the best specialist answer, rarely a bad choice.
//   charm   ABSORB — its own defensive mechanic, scaling from damage processed,
//           never from max HP, Recovery or Barrier.
//   boots   stealth / reduced detection. Intentionally niche: its value is
//           avoiding unwanted Cave overpulls, not throughput.
//
// The rework SWAPPED Cave's and Swamp's charm mechanics: the periodic Recovery
// pulse went to Swamp (it answers attrition regardless of damage source) and
// Cave took the dedicated Absorb hook (philosophy §11.5, §13, §22).
//
// See the scaling rule in the header of `plains.recipes.ts` for how T2/T3
// numbers are derived from the T1 baseline.
// ─────────────────────────────────────────────────────────────────────────

export const caveRecipeEntries = [
  // ── T1 ──
  // Every 3rd swing is dead. NOT equivalent to a flat ×2/3 DPS tax in every
  // build: it is harsher when a wasted swing blows a timing window or when a
  // class mechanic counts landed hits, and milder when resources advance on
  // attempts. The implementation must stay explicit about which combat events a
  // dead swing fires (baseline §5.6).
  ['chaotic-axe', {
    id: 'chaotic-axe', name: 'Chaotic Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { red: 26 }, stats: { attack: 22 }, attacksPerSecond: 1.10, tier: 1,
    mechanicEffects: { 'weapon.dead-swing-interval': 3 },
    icon: 'items/weapons/chaotic-axe.png',
    description: 'A wild, top-heavy thing that fights as much as it is wielded.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~501 (was 500).
    // +5 catalyst from its own T2 successor's tag ("chaotic-axe (counted
    // disruption) → Swarming").
    upgrades: [
      { stats: { attack: 1 }, cost: { red: 25 }, requiredBiomeLevel: 2 },
      { stats: { attack: 2 }, cost: { red: 45 }, requiredBiomeLevel: 3 },
      { stats: { attack: 2 }, cost: { red: 75 }, requiredBiomeLevel: 4 },
      { stats: { attack: 3 }, cost: { red: 125 }, requiredBiomeLevel: 4 },
      { stats: { attack: 2 }, cost: { red: 205 }, catalystCost: { swarming: 1 }, requiredBiomeLevel: 4 },
    ],
  }],

  // %DR is kept well below runaway values on purpose: percentage mitigation
  // compounds hard with HP, plating, class damage-taken affinities and every
  // other defensive layer (baseline §7.6).
  ['cave-vest-t1', {
    id: 'cave-vest-t1', name: 'Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 2, slot: 'armor',
    cost: { red: 22 }, stats: { maxHp: 28, plating: 4, damageReduction: 0.06 }, tier: 1,
    icon: 'items/armor/bestial-hide.png',
    description: 'The hide of something large and unlucky, cured to a stubborn toughness.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (622).
    // +5 catalyst from cave-vest-t2's own tag ("premium %DR generalist wall →
    // Swarming").
    upgrades: [
      { stats: { maxHp: 3, damageReduction: 0.01 }, cost: { red: 30 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 3, plating: 1, damageReduction: 0.01 }, cost: { red: 60 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, damageReduction: 0.01 }, cost: { red: 95 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, plating: 1, damageReduction: 0.01 }, cost: { red: 155 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 2, damageReduction: 0.01 }, cost: { red: 260 }, catalystCost: { swarming: 1 }, requiredBiomeLevel: 4 },
    ],
  }],

  // CHARM — Absorb. Converts a fraction of damage taken into a pool that drains
  // back as healing. It scales from DAMAGE PROCESSED, not from max HP, Recovery
  // or Barrier — that separation is the whole reason Absorb is its own mechanic.
  ['cave-charm-t1', {
    id: 'cave-charm-t1', name: 'Pulse Stone',
    recipeGroup: 'cave', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { red: 18 }, stats: { recovery: 2 },
    mechanicEffects: { 'defense.absorb-pct': 0.08 },
    tier: 1,
    icon: 'items/charms/pulse-stone.png',
    description: 'A cave-crystal that beats, slow and steady, like a sleeping heart.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~253 (was 255).
    upgrades: [
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 10 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 25 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 1 }, cost: { red: 40 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 60 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 100 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-boots-t1', {
    id: 'cave-boots-t1', name: 'Bat Wing Boots',
    recipeGroup: 'cave', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { red: 18 }, stats: { speed: 20 }, tier: 1,
    mechanicEffects: { 'mobility.stealth-pct': 0.25 },
    icon: 'items/boots/bat-wing-boots.png',
    description: 'Stretched membrane that falls on stone without a whisper.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~178 (was 176).
    upgrades: [
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 15 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 25 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 70 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  // T2 economy pass (2026-08-29): now an EVOLUTION of chaotic-axe at +5.
  ['ruinous-axe', {
    id: 'ruinous-axe', name: 'Ruinous Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 7, slot: 'weapon',
    evolvesFrom: 'chaotic-axe',
    cost: { red: 60 }, stats: { attack: 43 }, attacksPerSecond: 1.20, tier: 2, // family-tag: chaotic-axe (counted disruption) → Swarming
    reconstructCost: { red: 210 }, reconstructCatalystCost: { swarming: 2 },
    mechanicEffects: { 'weapon.dead-swing-interval': 4 },
    icon: 'items/weapons/ruinous-axe.png',
    description: 'Bigger, meaner, and somehow better balanced — chaos with the faintest thread of discipline.',
    upgrades: [
      { stats: { attack: 4 }, cost: { red: 44 }, requiredBiomeLevel: 8 },
      { stats: { attack: 4 }, cost: { red: 110 }, requiredBiomeLevel: 9 },
      { stats: { attack: 5 }, cost: { red: 177 }, requiredBiomeLevel: 10 },
      { stats: { attack: 4 }, cost: { red: 287 }, catalystCost: { swarming: 1 }, requiredBiomeLevel: 10 },
      { stats: { attack: 5 }, cost: { red: 486 }, catalystCost: { swarming: 2 }, requiredBiomeLevel: 10 },
    ],
  }],

  // T2 economy pass (2026-08-29): now an EVOLUTION of cave-vest-t1 at +5.
  ['cave-vest-t2', {
    id: 'cave-vest-t2', name: 'Dire Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 8, slot: 'armor',
    evolvesFrom: 'cave-vest-t1',
    cost: { red: 54 }, stats: { maxHp: 50, plating: 7, damageReduction: 0.13 }, tier: 2, // family-tag: premium %DR generalist wall → Swarming
    reconstructCost: { red: 189 }, reconstructCatalystCost: { swarming: 2 },
    icon: 'items/armor/dire-bestial-hide.png',
    description: 'From a beast the deep-cavern folk name only in low voices.',
    upgrades: [
      { stats: { maxHp: 5, plating: 1, damageReduction: 0.01 }, cost: { red: 46 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 5, plating: 1, damageReduction: 0.01 }, cost: { red: 116 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 5, plating: 1, damageReduction: 0.01 }, cost: { red: 185 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 5, plating: 1, damageReduction: 0.01 }, cost: { red: 300 }, catalystCost: { swarming: 1 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 6 }, cost: { red: 508 }, catalystCost: { swarming: 2 }, requiredBiomeLevel: 10 },
    ],
  }],

  // CHARM — Absorb, deepened. T2 economy pass (2026-08-29): now an EVOLUTION of
  // cave-charm-t1 at +5.
  ['cave-charm-t2', {
    id: 'cave-charm-t2', name: 'Resonant Gem',
    recipeGroup: 'cave', requiredBiomeLevel: 9, slot: 'recovery',
    evolvesFrom: 'cave-charm-t1',
    cost: { red: 44 }, stats: { recovery: 4 }, // family-tag: reliable generalist recovery → Swarming
    reconstructCost: { red: 154 }, reconstructCatalystCost: { swarming: 2 },
    mechanicEffects: { 'defense.absorb-pct': 0.14 },
    tier: 2,
    icon: 'items/charms/resonant-gem.png',
    description: 'A gem that rings on its own in the dark, answering a song no one else hears.',
    upgrades: [
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 18 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 46 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 73 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 119 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 203 }, catalystCost: { swarming: 1 }, requiredBiomeLevel: 10 },
    ],
  }],

  // T2 economy pass (2026-08-29): now an EVOLUTION of cave-boots-t1 at +5.
  ['cave-boots-t2', {
    id: 'cave-boots-t2', name: 'Cavern Sprints',
    recipeGroup: 'cave', requiredBiomeLevel: 10, slot: 'mobility',
    evolvesFrom: 'cave-boots-t1',
    cost: { red: 33 }, stats: { speed: 36 }, tier: 2, // family-tag: cave generalist mobility → Swarming
    reconstructCost: { red: 116 }, reconstructCatalystCost: { swarming: 2 },
    mechanicEffects: { 'mobility.stealth-pct': 0.38 },
    icon: 'items/boots/cavern-sprints.png',
    description: 'Worn smooth on tunnel floors no map has ever charted.',
    upgrades: [
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 12 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 30 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 48 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 78 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 132 }, catalystCost: { swarming: 1 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── T3 ──
  ['cave-cataclysm-axe', {
    id: 'cave-cataclysm-axe', name: 'Cataclysm Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 13, slot: 'weapon',
    // T3 economy pass (2026-08-30): EVOLUTION of ruinous-axe at +5; 2.00× its lifetime
    // total on the shipped accelerating curve; catalysts moved to +4/+5.
    evolvesFrom: 'ruinous-axe',
    cost: { red: 120 }, stats: { attack: 78 }, attacksPerSecond: 1.20, tier: 3, // family-tag: chaotic-axe → Swarming
    reconstructCost: { red: 420 }, reconstructCatalystCost: { swarming: 3 },
    mechanicEffects: { 'weapon.dead-swing-interval': 5 },
    icon: 'items/weapons/cataclysm-axe.png',
    description: 'Chaos given an edge — and, at last, a little rhythm. Every fifth swing still finds only air.',
    upgrades: [
      { stats: { attack: 8 }, cost: { red: 88 },  requiredBiomeLevel: 14 },
      { stats: { attack: 8 }, cost: { red: 221 }, requiredBiomeLevel: 15 },
      { stats: { attack: 8 }, cost: { red: 353 }, requiredBiomeLevel: 16 },
      { stats: { attack: 7 }, cost: { red: 574 }, catalystCost: { swarming: 2 }, requiredBiomeLevel: 16 },
      { stats: { attack: 8 }, cost: { red: 972 }, catalystCost: { swarming: 3 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['cave-vest-t3', {
    id: 'cave-vest-t3', name: 'Deepscale Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 14, slot: 'armor',
    evolvesFrom: 'cave-vest-t2',
    cost: { red: 116, yellow: 29 }, stats: { maxHp: 91, plating: 13, damageReduction: 0.19 }, // family-tag: premium %DR wall → Swarming
    reconstructCost: { red: 406, yellow: 102 }, reconstructCatalystCost: { swarming: 3 },
    tier: 3,
    icon: 'items/armor/deepscale-hide.png',
    description: 'Layered scale over thick hide — nothing fancy, just the most of everything that stops a blow.',
    upgrades: [
      { stats: { maxHp: 9, plating: 1, damageReduction: 0.01 }, cost: { red: 73, yellow: 18 },  requiredBiomeLevel: 15 },
      { stats: { maxHp: 9, plating: 1, damageReduction: 0.01 }, cost: { red: 182, yellow: 45 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 9, plating: 1, damageReduction: 0.01 }, cost: { red: 291, yellow: 73 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 9, plating: 2, damageReduction: 0.01 }, cost: { red: 473, yellow: 118 }, catalystCost: { swarming: 2 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 9, plating: 1 }, cost: { red: 800, yellow: 200 }, catalystCost: { swarming: 3 }, requiredBiomeLevel: 16 },
    ],
  }],

  // CHARM — Absorb, T3. The old always-on Recovery trickle came off with the
  // pulse identity that moved to Swamp: Cave's charm is the Absorb hook, and
  // mixing a second sustain mechanic into it blurs the distinction the
  // Recovery/Barrier/Absorb split exists to draw.
  ['cave-charm-t3', {
    id: 'cave-charm-t3', name: 'Echo Geode',
    recipeGroup: 'cave', requiredBiomeLevel: 15, slot: 'recovery',
    evolvesFrom: 'cave-charm-t2',
    cost: { red: 100, green: 25 }, stats: { recovery: 7 }, // family-tag: reliable generalist recovery → Swarming
    reconstructCost: { red: 350, green: 88 }, reconstructCatalystCost: { swarming: 3 },
    mechanicEffects: { 'defense.absorb-pct': 0.20 },
    tier: 3,
    icon: 'items/charms/echo-geode.png',
    description: 'It pulses on its own clock, and hums a low, steady mending between the beats.',
    upgrades: [
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 28, green: 7 },  requiredBiomeLevel: 16 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 70, green: 18 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 113, green: 28 }, requiredBiomeLevel: 16 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { red: 183, green: 46 }, requiredBiomeLevel: 16 },
      { stats: { recovery: 1 }, cost: { red: 310, green: 78 }, catalystCost: { swarming: 2 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['cave-boots-t3', {
    id: 'cave-boots-t3', name: 'Echostep Treads',
    recipeGroup: 'cave', requiredBiomeLevel: 16, slot: 'mobility',
    evolvesFrom: 'cave-boots-t2',
    cost: { red: 100 }, stats: { speed: 65 }, tier: 3, // family-tag: cave generalist mobility → Swarming
    reconstructCost: { red: 350 }, reconstructCatalystCost: { swarming: 3 },
    mechanicEffects: { 'mobility.stealth-pct': 0.50 },
    icon: 'items/boots/echostep-treads.png',
    description: 'They give back no sound at all — not even the echo the deep stone expects.',
    upgrades: [
      { stats: { speed: 4 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 23 },  requiredBiomeLevel: 16 },
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 57 },  requiredBiomeLevel: 16 },
      { stats: { speed: 4 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 91 }, requiredBiomeLevel: 16 },
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 147 }, requiredBiomeLevel: 16 },
      { stats: { speed: 4 }, mechanicEffects: { 'mobility.stealth-pct': 0.02 }, cost: { red: 248 }, catalystCost: { swarming: 2 }, requiredBiomeLevel: 16 },
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
    cost: { red: 45 }, catalystCost: { dominion: 1 }, // family-tag: raw offence → Dominion
    stats: {}, tier: 2,
    mechanicEffects: { 'core.attack-mult': 0.22, 'core.maxhp-mult': -0.12 },
    icon: 'items/cores/force.png',
    description: 'It gives you the strike you wanted and takes the margin you were counting on.',
  }],

  // T3 melee — Duelist: commitment to one big target. Its opportunity cost is
  // structural rather than a stated penalty: it does very little against a crowd.
  ['core-duelist', {
    id: 'core-duelist', name: 'Duelist Core',
    recipeGroup: 'cave', requiredBiomeLevel: 15, slot: 'core', coreEligibility: 'melee',
    lineageId: 'core-duelist',
    cost: { red: 110 }, catalystCost: { dominion: 3 }, // family-tag: single-target alpha → Dominion
    stats: {}, tier: 3,
    mechanicEffects: {
      'core.attack-mult': 0.18, 'core.maxhp-mult': 0.10,
      'core.focus-damage-per-hit-mult': 0.05, 'core.focus-max-stacks': 5,
    },
    icon: 'items/cores/duelist.png',
    description: 'Each direct hit on the same target sharpens your focus. Change targets, and the edge must be honed again.',
  }],

] satisfies [string, Recipe][];
