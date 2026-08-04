import type { Recipe } from './types';

// JUNGLE (debuts T2; Forest successor). Identity: evasion + bulk armor / on-hit
// rapier / ramping-regen charm. Charm rework: upgrades ramp the mechanic, hpRegen flat
// (see mountain.recipes.ts header). MIGRATION: hardening stripped from the T2 armor
// (it now lives on Volcano) — Jungle armor is pure evasion+bulk at every tier.

export const jungleRecipeEntries = [
  // ── T2 ──
  ['jungle-stinger-rapier', {
    id: 'jungle-stinger-rapier', name: 'Stinger Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 55}, catalystCost: { alacrity: 2 }, stats: { attack: 10, onHitDamage: 8 }, attacksPerSecond: 1.55, tier: 2, // family-tag: fast on-hit rapier → Alacrity
    icon: 'items/weapons/stinger-rapier.png',
    description: 'A thin blade kept slick with something the jungle distilled and never named.',
    upgrades: [
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 66 }, requiredBiomeLevel: 2 },
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 132 }, requiredBiomeLevel: 3 },
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 264 }, requiredBiomeLevel: 4 },
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 264 }, requiredBiomeLevel: 4 },
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 264 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['jungle-vest-t2', {
    id: 'jungle-vest-t2', name: 'Verdant Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 48, yellow: 12 }, catalystCost: { alacrity: 2 }, stats: { maxHp: 44, plating: 6, evasion: 0.15 }, // family-tag: evasion armor (anti-fast-hit) → Alacrity
    tier: 2,
    icon: 'items/armor/verdant-weave.png',
    description: 'A living mesh of leaf and creeper, too quick and too giving to be struck square.',
    upgrades: [
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 55, yellow: 11 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 100, yellow: 44 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 200, yellow: 55 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 200, yellow: 55 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 200, yellow: 55 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp ramp-regen MAX 0.21 -> 0.30 (start/ramptime flat).
  ['jungle-charm-t2', {
    id: 'jungle-charm-t2', name: 'Canopy Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 45 }, catalystCost: { alacrity: 2 }, stats: { hpRegen: 6 }, // family-tag: jungle recovery → Alacrity
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.04,
      'defense.ramp-regen-max-pct': 0.10,
      'defense.ramp-regen-ramptime-ms': 10000,
    },
    tier: 2,
    icon: 'items/charms/canopy-heart.png',
    description: 'A knot of ancient vine that wakes, slowly, to the rhythm of a long fight.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 33 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 66 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['jungle-boots-t2', {
    id: 'jungle-boots-t2', name: 'Vine Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { green: 30 }, catalystCost: { alacrity: 2 }, stats: { speed: 22 }, tier: 2, // family-tag: jungle mobility → Alacrity
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.50 },
    icon: 'items/boots/vine-wraps.png',
    description: 'Springy growth lashed to the feet, always eager to be running.',
    upgrades: [
      { stats: { speed: 5 }, cost: { green: 20 }, requiredBiomeLevel: 4 },
      { stats: { speed: 7 }, cost: { green: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 9 }, cost: { green: 80 }, requiredBiomeLevel: 4 },
      { stats: { speed: 9 }, cost: { green: 80 }, requiredBiomeLevel: 4 },
      { stats: { speed: 9 }, cost: { green: 80 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T3 ──
  ['jungle-venomthorn-rapier', {
    id: 'jungle-venomthorn-rapier', name: 'Venomthorn Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { green: 120 }, catalystCost: { alacrity: 3 }, stats: { attack: 22, onHitDamage: 18 }, attacksPerSecond: 1.65, tier: 3, // family-tag: fast on-hit rapier → Alacrity
    icon: 'items/weapons/venomthorn-rapier.png',
    description: 'Thin and quick, and slick with a thorn-sap that bites a little more with every touch.',
    upgrades: [
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 180 },  requiredBiomeLevel: 8 },
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 270 }, requiredBiomeLevel: 9 },
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 360 }, requiredBiomeLevel: 10 },
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 360 }, requiredBiomeLevel: 10 },
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 360 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['jungle-vest-t3', {
    id: 'jungle-vest-t3', name: 'Wildgrowth Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 8, slot: 'armor',
    cost: { green: 90, yellow: 30 }, catalystCost: { alacrity: 3 }, stats: { maxHp: 80, plating: 13, evasion: 0.40 }, // family-tag: evasion armor → Alacrity
    tier: 3,
    icon: 'items/armor/wildgrowth-weave.png',
    description: 'A living mesh of leaf and vine, too quick and too giving to ever quite be struck square.',
    upgrades: [
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 100, yellow: 50 },  requiredBiomeLevel: 9 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 225, yellow: 75 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 300, yellow: 150 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 300, yellow: 150 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 300, yellow: 150 }, requiredBiomeLevel: 10 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp ramp-regen MAX 0.23 -> 0.35.
  ['jungle-charm-t3', {
    id: 'jungle-charm-t3', name: 'Worldvine Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { green: 100 }, catalystCost: { alacrity: 3 }, stats: { hpRegen: 11 }, // family-tag: jungle recovery → Alacrity
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.05,
      'defense.ramp-regen-max-pct': 0.14,
      'defense.ramp-regen-ramptime-ms': 10000,
    },
    tier: 3,
    icon: 'items/charms/worldvine-heart.png',
    description: 'It wakes slowly to a long fight, and by the end is pouring life back faster than it leaves.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 75 },  requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 150 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 225 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 225 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 225 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['jungle-boots-t3', {
    id: 'jungle-boots-t3', name: 'Canopy Striders',
    recipeGroup: 'jungle', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { green: 90 }, catalystCost: { alacrity: 3 }, stats: { speed: 44 }, tier: 3, // family-tag: jungle mobility → Alacrity
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.65 },
    icon: 'items/boots/canopy-striders.png',
    description: 'They crash through the green loud enough to turn every hungry thing your way.',
    upgrades: [
      { stats: { speed: 6 },  cost: { green: 25 }, requiredBiomeLevel: 10 },
      { stats: { speed: 8 },  cost: { green: 50 }, requiredBiomeLevel: 10 },
      { stats: { speed: 10 }, cost: { green: 100 }, requiredBiomeLevel: 10 },
      { stats: { speed: 10 }, cost: { green: 100 }, requiredBiomeLevel: 10 },
      { stats: { speed: 10 }, cost: { green: 100 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── T4 ──
  ['jungle-deathfang-rapier', {
    id: 'jungle-deathfang-rapier', name: 'Deathfang Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 13, slot: 'weapon',
    cost: { green: 264 }, catalystCost: { alacrity: 4 }, stats: { attack: 34, onHitDamage: 30 }, attacksPerSecond: 1.75, tier: 4, // family-tag: capstone fast on-hit rapier → Alacrity
    icon: 'items/weapons/deathfang-rapier.png',
    description: 'Quick past seeing, and slick with something the deep jungle spent a long time perfecting.',
    upgrades: [
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 396 }, requiredBiomeLevel: 14 },
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 792 }, requiredBiomeLevel: 15 },
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 1584 }, requiredBiomeLevel: 16 },
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 1584 }, requiredBiomeLevel: 16 },
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 1584 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['jungle-vest-t4', {
    id: 'jungle-vest-t4', name: 'Primal Canopy',
    recipeGroup: 'jungle', requiredBiomeLevel: 14, slot: 'armor',
    cost: { green: 220, yellow: 55 }, catalystCost: { alacrity: 4 }, stats: { maxHp: 145, plating: 24, evasion: 0.55 }, // family-tag: evasion armor → Alacrity
    // Bonus evade-mitigation: increases the fraction of damage avoided on an evade
    // (the reload-class mechanic). Stacks on GAME_CONFIG.EVADE_MITIGATION_BASE.
    mechanicEffects: { 'defense.evade-mitigation': 0.2 },
    tier: 4,
    icon: 'items/armor/primal-canopy.png',
    description: 'The faster you move through the green, the less of you there is to strike.',
    upgrades: [
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 200, yellow: 100 }, requiredBiomeLevel: 15 },
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 450, yellow: 150 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 600, yellow: 300 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 600, yellow: 300 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 600, yellow: 300 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['jungle-charm-t4', {
    id: 'jungle-charm-t4', name: 'Ancient Canopy',
    recipeGroup: 'jungle', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { green: 200 }, catalystCost: { alacrity: 4 }, stats: { hpRegen: 16 }, // family-tag: jungle recovery → Alacrity
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.04, 'defense.ramp-regen-max-pct': 0.14, 'defense.ramp-regen-ramptime-ms': 9000,
    },
    tier: 4,
    icon: 'items/charms/ancient-canopy.png',
    description: 'Older than the trees around it, and by a long fight\'s end it is pouring life back faster than any blade can take it.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 150 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 300 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 450 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 450 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 450 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['jungle-charm-t4-overgrowth', {
    id: 'jungle-charm-t4-overgrowth', name: 'Overgrowth Pulse',
    recipeGroup: 'jungle', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { green: 200 }, catalystCost: { alacrity: 4 }, stats: { hpRegen: 16 }, // family-tag: jungle recovery → Alacrity
    // † overheal-shield-pct: regen beyond max HP converts to temp shield at 50%.
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.04, 'defense.ramp-regen-max-pct': 0.12, 'defense.ramp-regen-ramptime-ms': 9000,
      'defense.overheal-shield-pct': 0.25,
    },
    tier: 4,
    icon: 'items/charms/overgrowth-pulse.png',
    description: 'It grows past the wound and keeps growing, hardening the surplus into a living shell.',
    upgrades: [
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 150 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 300 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 450 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 450 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.ramp-regen-max-pct': 0.02 }, cost: { green: 450 }, requiredBiomeLevel: 16 },
    ],
  }],

  // T4 boots — aggro-pull (draws more aggro, suits the swarm). T3 0.65 → T4 0.80.
  ['jungle-boots-t4', {
    id: 'jungle-boots-t4', name: 'Warpath Treads',
    recipeGroup: 'jungle', requiredBiomeLevel: 16, slot: 'mobility',
    cost: { green: 198 }, catalystCost: { alacrity: 4 }, stats: { speed: 66 }, tier: 4, // family-tag: jungle mobility → Alacrity
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.80 },
    icon: 'items/boots/warpath-treads.png',
    description: 'They tear through the green loud enough to wake the whole canopy — and bring all of it to you at once.',
    upgrades: [
      { stats: { speed: 8 },  cost: { green: 55 },  requiredBiomeLevel: 16 },
      { stats: { speed: 10 }, cost: { green: 110 }, requiredBiomeLevel: 16 },
      { stats: { speed: 12 }, cost: { green: 220 }, requiredBiomeLevel: 16 },
      { stats: { speed: 12 }, cost: { green: 220 }, requiredBiomeLevel: 16 },
      { stats: { speed: 12 }, cost: { green: 220 }, requiredBiomeLevel: 16 },
    ],
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Jungle owns MOMENTUM — dense packs
  // and ambushes, so it is where the kill-chain core comes from.

  // T3 melee — Bruiser: offence, bulk and movement, paid off by chaining kills.
  // Structurally weak against bosses, where there is no next kill to chain into.
  ['core-bruiser', {
    id: 'core-bruiser', name: 'Bruiser Core',
    recipeGroup: 'jungle', requiredBiomeLevel: 9, slot: 'core', coreEligibility: 'melee',
    lineageId: 'core-bruiser',
    cost: { green: 110 }, catalystCost: { brutality: 3 }, // family-tag: sustained melee pressure → Brutality
    stats: {}, tier: 3,
    // The refund is INERT without an ability tagged `mobility` (today: Charge). The
    // stat half is always on, so the slot is never dead — and the clause widens for
    // free as more mobility abilities are authored.
    mechanicEffects: {
      'core.attack-mult': 0.20, 'core.maxhp-mult': 0.15, 'core.speed-mult': 0.12,
      'core.mobility-refund-on-kill-pct': 0.40,
    },
    icon: 'items/cores/bruiser.png',
    description: 'Kill, and the jungle opens. Stop, and it closes. The core only knows how to do the first one.',
  }],

  ['relic-verdant-flywheel', {
    id: 'relic-verdant-flywheel', name: 'Verdant Flywheel',
    recipeGroup: 'jungle', requiredBiomeLevel: 18, slot: 'relic',
    lineageId: 'relic-verdant-flywheel',
    cost: { green: 220 }, catalystCost: { alacrity: 4 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': 0.20,
      'relic.mechanic-potency': -0.20,
      'relic.mechanic-buff-effect': 0.25,
    },
    icon: 'items/relics/verdant-flywheel.png',
    description: 'Its living spokes turn faster with every gift the mechanic gives back.',
  }],

] satisfies [string, Recipe][];
