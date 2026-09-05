import type { Recipe } from './types';

// JUNGLE (debuts T2; Forest successor). Identity: evasion + bulk armor / on-hit
// rapier / ramping-regen charm. Charm rework: upgrades ramp the mechanic, recovery flat
// (see mountain.recipes.ts header). MIGRATION: hardening stripped from the T2 armor
// (it now lives on Volcano) — Jungle armor is pure evasion+bulk at every tier.

export const jungleRecipeEntries = [
  // ── T2 ──
  // T2 economy pass (2026-08-29): Jungle debuts at T2, so there is deliberately
  // NO T1 predecessor (§5) — this stays a plain craft. Catalyst removed from
  // base per §2 and moved to +4/+5 per §8.
  ['jungle-stinger-rapier', {
    id: 'jungle-stinger-rapier', name: 'Stinger Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 55}, stats: { attack: 10, onHitDamage: 8 }, attacksPerSecond: 1.55, tier: 2, // family-tag: fast on-hit rapier → Alacrity
    icon: 'items/weapons/stinger-rapier.png',
    description: 'A thin blade kept slick with something the jungle distilled and never named.',
    upgrades: [
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 40 }, requiredBiomeLevel: 2 },
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 99 }, requiredBiomeLevel: 3 },
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 158 }, requiredBiomeLevel: 4 },
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 257 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 4 },
      { stats: { attack: 4, onHitDamage: 3 }, cost: { green: 436 }, catalystCost: { alacrity: 2 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['jungle-vest-t2', {
    id: 'jungle-vest-t2', name: 'Verdant Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { maxHp: 44, plating: 6, evasion: 0.15 }, // family-tag: evasion armor (anti-fast-hit) → Alacrity
    tier: 2,
    icon: 'items/armor/verdant-weave.png',
    description: 'A living mesh of leaf and creeper, too quick and too giving to be struck square.',
    upgrades: [
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 31, yellow: 8 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 78, yellow: 20 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 125, yellow: 31 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 203, yellow: 51 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 342, yellow: 86 }, catalystCost: { alacrity: 2 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: recovery flat; upgrades ramp ramp-regen MAX 0.21 -> 0.30 (start/ramptime flat).
  ['jungle-charm-t2', {
    id: 'jungle-charm-t2', name: 'Canopy Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 45 }, stats: { recovery: 6 }, // family-tag: jungle recovery → Alacrity
    mechanicEffects: {
      'defense.recovery-ramp-start-pct': 0.04,
      'defense.recovery-ramp-max-pct': 0.10,
      'defense.recovery-ramp-ramptime-ms': 10000,
    },
    tier: 2,
    icon: 'items/charms/canopy-heart.png',
    description: 'A knot of ancient vine that wakes, slowly, to the rhythm of a long fight.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 18 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 46 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 73 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 119 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 203 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['jungle-boots-t2', {
    id: 'jungle-boots-t2', name: 'Vine Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { green: 30 }, stats: { speed: 22 }, tier: 2, // family-tag: jungle mobility → Alacrity
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.50 },
    icon: 'items/boots/vine-wraps.png',
    description: 'Springy growth lashed to the feet, always eager to be running.',
    upgrades: [
      { stats: { speed: 5 }, cost: { green: 12 }, requiredBiomeLevel: 4 },
      { stats: { speed: 7 }, cost: { green: 30 }, requiredBiomeLevel: 4 },
      { stats: { speed: 9 }, cost: { green: 48 }, requiredBiomeLevel: 4 },
      { stats: { speed: 9 }, cost: { green: 78 }, requiredBiomeLevel: 4 },
      { stats: { speed: 9 }, cost: { green: 132 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T3 ──
  ['jungle-venomthorn-rapier', {
    id: 'jungle-venomthorn-rapier', name: 'Venomthorn Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 7, slot: 'weapon',
    // T3 economy pass (2026-08-30): EVOLUTION of jungle-stinger-rapier at +5 — same
    // biome, same mechanic keys, same cadence. The Forest needles (gale-needle /
    // thorn-needle) are deliberate DEAD ENDS: `evolvesFrom` is single-parent by design
    // and Jungle authored its own unambiguous T2 predecessor. Forest players take the
    // reconstruct path.
    evolvesFrom: 'jungle-stinger-rapier',
    cost: { green: 120 }, stats: { attack: 22, onHitDamage: 18 }, attacksPerSecond: 1.65, tier: 3, // family-tag: fast on-hit rapier → Alacrity
    reconstructCost: { green: 420 }, reconstructCatalystCost: { alacrity: 3 },
    icon: 'items/weapons/venomthorn-rapier.png',
    description: 'Thin and quick, and slick with a thorn-sap that bites a little more with every touch.',
    upgrades: [
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 79 },  requiredBiomeLevel: 8 },
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 197 }, requiredBiomeLevel: 9 },
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 315 }, requiredBiomeLevel: 10 },
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 512 }, catalystCost: { alacrity: 2 }, requiredBiomeLevel: 10 },
      { stats: { attack: 4, onHitDamage: 4 }, cost: { green: 867 }, catalystCost: { alacrity: 3 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['jungle-vest-t3', {
    id: 'jungle-vest-t3', name: 'Wildgrowth Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 8, slot: 'armor',
    evolvesFrom: 'jungle-vest-t2',
    cost: { green: 90, yellow: 30 }, stats: { maxHp: 80, plating: 13, evasion: 0.40 }, // family-tag: evasion armor → Alacrity
    reconstructCost: { green: 315, yellow: 105 }, reconstructCatalystCost: { alacrity: 3 },
    tier: 3,
    icon: 'items/armor/wildgrowth-weave.png',
    description: 'A living mesh of leaf and vine, too quick and too giving to ever quite be struck square.',
    upgrades: [
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 59, yellow: 19 },  requiredBiomeLevel: 9 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 146, yellow: 49 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 234, yellow: 78 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 380, yellow: 127 }, catalystCost: { alacrity: 2 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 18, plating: 3, evasion: 0.05 }, cost: { green: 644, yellow: 214 }, catalystCost: { alacrity: 3 }, requiredBiomeLevel: 10 },
    ],
  }],

  // Charm: recovery flat; upgrades ramp ramp-regen MAX 0.23 -> 0.35.
  ['jungle-charm-t3', {
    id: 'jungle-charm-t3', name: 'Worldvine Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 9, slot: 'recovery',
    // PURE green by design: the ramping-Recovery foundation is the Forest→Jungle
    // inheritance and green followed it, so mechanic and home colour are the same
    // colour — there is nothing left to splash.
    evolvesFrom: 'jungle-charm-t2',
    cost: { green: 100 }, stats: { recovery: 11 }, // family-tag: jungle recovery → Alacrity
    reconstructCost: { green: 350 }, reconstructCatalystCost: { alacrity: 3 },
    mechanicEffects: {
      'defense.recovery-ramp-start-pct': 0.05,
      'defense.recovery-ramp-max-pct': 0.14,
      'defense.recovery-ramp-ramptime-ms': 10000,
    },
    tier: 3,
    icon: 'items/charms/worldvine-heart.png',
    description: 'It wakes slowly to a long fight, and by the end is pouring life back faster than it leaves.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 36 },  requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 91 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 145 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 236 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 400 }, catalystCost: { alacrity: 2 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['jungle-boots-t3', {
    id: 'jungle-boots-t3', name: 'Canopy Striders',
    recipeGroup: 'jungle', requiredBiomeLevel: 10, slot: 'mobility',
    evolvesFrom: 'jungle-boots-t2',
    cost: { green: 90 }, stats: { speed: 44 }, tier: 3, // family-tag: jungle mobility → Alacrity
    reconstructCost: { green: 315 }, reconstructCatalystCost: { alacrity: 3 },
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.65 },
    icon: 'items/boots/canopy-striders.png',
    description: 'They crash through the green loud enough to turn every hungry thing your way.',
    upgrades: [
      { stats: { speed: 6 },  cost: { green: 23 }, requiredBiomeLevel: 10 },
      { stats: { speed: 8 },  cost: { green: 57 }, requiredBiomeLevel: 10 },
      { stats: { speed: 10 }, cost: { green: 91 }, requiredBiomeLevel: 10 },
      { stats: { speed: 10 }, cost: { green: 148 }, requiredBiomeLevel: 10 },
      { stats: { speed: 10 }, cost: { green: 251 }, catalystCost: { alacrity: 2 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── T4 ──
  // T4 economy pass (2026-08-30): each item now EVOLVES from its T3 predecessor at
  // +5 (see T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §3). Costs are 2.00× the
  // finalized T3 lifetime total on the shipped accelerating curve; catalysts move
  // to the weapon/armor 0/0/0/0/3/4, recovery/mobility 0/0/0/0/0/3 schedule.
  ['jungle-deathfang-rapier', {
    id: 'jungle-deathfang-rapier', name: 'Deathfang Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 13, slot: 'weapon',
    evolvesFrom: 'jungle-venomthorn-rapier',
    cost: { green: 264 }, stats: { attack: 34, onHitDamage: 30 }, attacksPerSecond: 1.75, tier: 4, // family-tag: capstone fast on-hit rapier → Alacrity
    reconstructCost: { green: 924 }, reconstructCatalystCost: { alacrity: 4 },
    icon: 'items/weapons/deathfang-rapier.png',
    description: 'Quick past seeing, and slick with something the deep jungle spent a long time perfecting.',
    upgrades: [
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 157 }, requiredBiomeLevel: 14 },
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 392 }, requiredBiomeLevel: 15 },
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 627 }, requiredBiomeLevel: 16 },
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 1018 }, catalystCost: { alacrity: 3 }, requiredBiomeLevel: 16 },
      { stats: { attack: 10, onHitDamage: 8 }, cost: { green: 1722 }, catalystCost: { alacrity: 4 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['jungle-vest-t4', {
    id: 'jungle-vest-t4', name: 'Primal Canopy',
    recipeGroup: 'jungle', requiredBiomeLevel: 14, slot: 'armor',
    evolvesFrom: 'jungle-vest-t3',
    cost: { green: 220, yellow: 55 }, stats: { maxHp: 145, plating: 24, evasion: 0.55 }, // family-tag: evasion armor → Alacrity
    reconstructCost: { green: 770, yellow: 193 }, reconstructCatalystCost: { alacrity: 4 },
    // Bonus evade-mitigation: increases the fraction of damage avoided on an evade
    // (the reload-class mechanic). Stacks on GAME_CONFIG.EVADE_MITIGATION_BASE.
    mechanicEffects: { 'defense.evade-mitigation': 0.2 },
    tier: 4,
    icon: 'items/armor/primal-canopy.png',
    description: 'The faster you move through the green, the less of you there is to strike.',
    upgrades: [
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 124, yellow: 31 }, requiredBiomeLevel: 15 },
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 310, yellow: 77 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 494, yellow: 124 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 804, yellow: 201 }, catalystCost: { alacrity: 3 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 35, plating: 6, evasion: 0.03 }, cost: { green: 1360, yellow: 340 }, catalystCost: { alacrity: 4 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['jungle-charm-t4', {
    id: 'jungle-charm-t4', name: 'Ancient Canopy',
    recipeGroup: 'jungle', requiredBiomeLevel: 15, slot: 'recovery',
    evolvesFrom: 'jungle-charm-t3',
    cost: { green: 200 }, stats: { recovery: 16 }, // family-tag: jungle recovery → Alacrity
    reconstructCost: { green: 700 }, reconstructCatalystCost: { alacrity: 4 },
    mechanicEffects: {
      'defense.recovery-ramp-start-pct': 0.04, 'defense.recovery-ramp-max-pct': 0.14, 'defense.recovery-ramp-ramptime-ms': 9000,
    },
    tier: 4,
    icon: 'items/charms/ancient-canopy.png',
    description: 'Older than the trees around it, and by a long fight\'s end it is pouring life back faster than any blade can take it.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 73 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 182 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 291 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 472 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 798 }, catalystCost: { alacrity: 3 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['jungle-charm-t4-overgrowth', {
    id: 'jungle-charm-t4-overgrowth', name: 'Overgrowth Pulse',
    recipeGroup: 'jungle', requiredBiomeLevel: 15, slot: 'recovery',
    evolvesFrom: 'jungle-charm-t3',
    cost: { green: 200 }, stats: { recovery: 16 }, // family-tag: jungle recovery → Alacrity
    reconstructCost: { green: 700 }, reconstructCatalystCost: { alacrity: 4 },
    // † overheal-ward-pct: regen beyond max HP converts to a temporary ward.
    mechanicEffects: {
      'defense.recovery-ramp-start-pct': 0.04, 'defense.recovery-ramp-max-pct': 0.12, 'defense.recovery-ramp-ramptime-ms': 9000,
      'defense.overheal-ward-pct': 0.25,
    },
    tier: 4,
    icon: 'items/charms/overgrowth-pulse.png',
    description: 'It grows past the wound and keeps growing, hardening the surplus into a living shell.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 73 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 182 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 291 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 472 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.recovery-ramp-max-pct': 0.02 }, cost: { green: 798 }, catalystCost: { alacrity: 3 }, requiredBiomeLevel: 16 },
    ],
  }],

  // T4 boots — aggro-pull (draws more aggro, suits the swarm). T3 0.65 → T4 0.80.
  ['jungle-boots-t4', {
    id: 'jungle-boots-t4', name: 'Warpath Treads',
    recipeGroup: 'jungle', requiredBiomeLevel: 16, slot: 'mobility',
    evolvesFrom: 'jungle-boots-t3',
    cost: { green: 198 }, stats: { speed: 66 }, tier: 4, // family-tag: jungle mobility → Alacrity
    reconstructCost: { green: 693 }, reconstructCatalystCost: { alacrity: 4 },
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.80 },
    icon: 'items/boots/warpath-treads.png',
    description: 'They tear through the green loud enough to wake the whole canopy — and bring all of it to you at once.',
    upgrades: [
      { stats: { speed: 8 },  cost: { green: 45 },  requiredBiomeLevel: 16 },
      { stats: { speed: 10 }, cost: { green: 112 }, requiredBiomeLevel: 16 },
      { stats: { speed: 12 }, cost: { green: 180 }, requiredBiomeLevel: 16 },
      { stats: { speed: 12 }, cost: { green: 292 }, requiredBiomeLevel: 16 },
      { stats: { speed: 12 }, cost: { green: 493 }, catalystCost: { alacrity: 3 }, requiredBiomeLevel: 16 },
    ],
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Jungle owns MOMENTUM — dense packs
  // and ambushes, and it carries the T2 sustain capstone before its T3 momentum
  // cores.

  // T2 premium capstone — Survivalist: save through Jungle's final mastery level
  // for the recovery core.
  ['core-survivalist', {
    id: 'core-survivalist', name: 'Survivalist Core',
    recipeGroup: 'jungle', requiredBiomeLevel: 6, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-survivalist',
    cost: { green: 500 }, catalystCost: { fortified: 4 }, // family-tag: attrition survival → Fortified
    stats: {}, tier: 2,
    // recovery-mult scales the Recovery RATE, and every in-combat regen effect
    // activates a fraction of that rate — so this lifts OOC regen and all active
    // sustain at once, rather than the near-nothing a flat regen bump would give.
    mechanicEffects: { 'core.recovery-mult': 0.30, 'core.maxhp-mult': 0.15 },
    icon: 'items/cores/survivalist.png',
    description: 'Wound-knit heartwood. It does not stop the blow — it shortens the time you spend regretting it.',
  }],

  // T3 premium melee — Bruiser: offence, bulk and movement, paid off by chaining
  // kills. Structurally weak against bosses, where there is no next kill to chain
  // into. L11 and 1,350 green / 6 Alacrity keep it late in Jungle's T3 band.
  ['core-bruiser', {
    id: 'core-bruiser', name: 'Bruiser Core',
    recipeGroup: 'jungle', requiredBiomeLevel: 11, slot: 'core', coreEligibility: 'melee',
    lineageId: 'core-bruiser',
    cost: { green: 1350 }, catalystCost: { alacrity: 6 }, // Heavy is BANNED in Jungle; its native family is Alacrity
    stats: {}, tier: 3,
    // The refund is INERT without an ability tagged `mobility` (today: Charge). The
    // stat half is always on, so the slot is never dead — and the clause widens for
    // free as more mobility abilities are authored.
    mechanicEffects: {
      'core.attack-mult': 0.28, 'core.maxhp-mult': 0.20, 'core.speed-mult': 0.18,
      'core.mobility-refund-on-kill-pct': 0.50,
    },
    icon: 'items/cores/bruiser.png',
    description: 'Kill, and the jungle opens. Stop, and it closes. The core only knows how to do the first one.',
  }],

  // T3 premium unrestricted — Accelerant: tempo. Trades hit size for hit count, which is
  // why it reads so differently on an on-hit build than on a big-swing one.
  // Homed here because Alacrity is Jungle's native family and Jungle is the only
  // biome carrying it past T2 — Forest, where this used to live, stops at T2, so a
  // T3 character had to grind ~1,000 kills of outgrown content to reach forest 15.
  ['core-accelerant', {
    id: 'core-accelerant', name: 'Accelerant Core',
    recipeGroup: 'jungle', requiredBiomeLevel: 12, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-accelerant',
    cost: { green: 1150 }, catalystCost: { alacrity: 5 }, // family-tag: attack-speed tempo → Alacrity
    stats: {}, tier: 3,
    mechanicEffects: { 'core.attack-speed-mult': 0.55, 'core.attack-mult': -0.18 },
    icon: 'items/cores/accelerant.png',
    description: 'The canopy keeps a fast rhythm. Match it, and you will find you are swinging before you decide to.',
  }],

  ['relic-verdant-flywheel', {
    id: 'relic-verdant-flywheel', name: 'Verdant Flywheel',
    recipeGroup: 'jungle', requiredBiomeLevel: 18, slot: 'relic',
    lineageId: 'relic-verdant-flywheel',
    cost: { green: 3000 }, catalystCost: { alacrity: 8 },
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
