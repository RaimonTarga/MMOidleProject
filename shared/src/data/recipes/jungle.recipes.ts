import type { Recipe } from './types';

// JUNGLE (debuts T2; Forest successor). Identity: evasion + bulk armor / on-hit
// rapier / ramping-regen charm. Charm rework: upgrades ramp the mechanic, recovery flat
// (see mountain.recipes.ts header). MIGRATION: hardening stripped from the T2 armor
// (it now lives on Volcano) — Jungle armor is pure evasion+bulk at every tier.

// 2026-09-26 armor niches: Jungle is the evasion weave that holds up against
// poison. Its plating went (flat plating is Plains/Desert's answer to small hits)
// and damage-over-time resistance came in: only a full dodge blocks ailments, so
// pure evasion folds to the Jungle's poison. It keeps a stronger graze and more
// HP than Forest, and slightly less evasion.
// T2 weave per-upgrade HP stays at its pre-rebudget +12: less left ranged/caster
// wearers short in near-miss T2 boss fights (rebudget 2026-09-25, and re-measured by
// the 2026-09-26 niches matrix: +6 lost 9 of 32 T2 ranged boss wins).
const JUNGLE_T2_UPGRADE_HP = 12;

export const jungleRecipeEntries = [
  // ── T2 ──
  // T2 economy pass (2026-08-29): Jungle debuts at T2, so there is deliberately
  // NO T1 predecessor (§5) — this stays a plain craft. Catalyst removed from
  // base per §2 and moved to +4/+5 per §8.
  ['jungle-stinger-rapier', {
    id: 'jungle-stinger-rapier', name: 'Stinger Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 1, slot: 'weapon',
    // 2026-09-26 T2-T4 weapon normalization: Attack 10->11 (+5: 30->24). On-hit unchanged.
    cost: { green: 55}, stats: { attack: 24, onHitDamage: 23 }, attacksPerSecond: 1.55, tier: 2, // family-tag: fast on-hit rapier → Alacrity
    icon: 'items/weapons/stinger-rapier.png',
    element: 'poison',   // cosmetic attack tint only
    description: 'A thin blade kept slick with something the jungle distilled and never named.',
  }],

  ['jungle-vest-t2', {
    id: 'jungle-vest-t2', name: 'Verdant Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { "maxHp": 112, "evasion": 0.36, "damageReduction": 0.04 }, // family-tag: evasion armor (anti-fast-hit) → Alacrity
    tier: 2,
    icon: 'items/armor/verdant-weave.png',
    description: "Evades soften direct hits; a full dodge also prevents on-hit ailments. Jungle weave strengthens each evade and resists damage over time.",

mechanicEffects: { "defense.evade-mitigation": 0.2, "defense.dot-resistance": 0.25 },
}],

  // Charm: recovery flat; upgrades ramp ramp-regen MAX 0.21 -> 0.30 (start/ramptime flat).
  ['jungle-charm-t2', {
    id: 'jungle-charm-t2', name: 'Canopy Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 45 }, stats: { "recovery": 19.4 }, // family-tag: jungle recovery → Alacrity
    mechanicEffects: { "defense.recovery-ramp-start-pct": 0.04, "defense.recovery-ramp-max-pct": 0.2, "defense.recovery-ramp-ramptime-ms": 10000, "guard.recovery-ramp-advance-ms": 3000 },
    tier: 2,
    icon: 'items/charms/canopy-heart.png',
    description: 'A knot of ancient vine that wakes, slowly, to the rhythm of a long fight.',
  }],

  ['jungle-boots-t2', {
    id: 'jungle-boots-t2', name: 'Vine Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 4, slot: 'mobility',
    // 2026-09-26 T2-T4 boots curve normalization: Speed 22->47 (+5: 61->61).
    cost: { green: 30 }, stats: { "speed": 61 }, tier: 2, // family-tag: jungle mobility → Alacrity
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.50 },
    icon: 'items/boots/vine-wraps.png',
    description: 'Springy growth lashed to the feet, always eager to be running.',
  }],

  // ── T3 ──
  ['jungle-venomthorn-rapier', {
    id: 'jungle-venomthorn-rapier', name: 'Venomthorn Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 7, slot: 'weapon',
    // T3 economy pass (2026-08-30): EVOLUTION of jungle-stinger-rapier at +5 — same
    // biome, same mechanic keys, same cadence. The Forest needle (gale-needle) is a
    // deliberate DEAD END: Jungle authored its own unambiguous T2 predecessor.
    // 2026-09-26 T2-T4 weapon normalization: Attack 22->29 (+5: 42->50). On-hit unchanged.
    cost: { green: 120 }, stats: { attack: 50, onHitDamage: 38 }, attacksPerSecond: 1.65, tier: 3, // family-tag: fast on-hit rapier → Alacrity
    icon: 'items/weapons/venomthorn-rapier.png',
    element: 'poison',   // cosmetic attack tint only
    description: 'Thin and quick, and slick with a thorn-sap that bites a little more with every touch.',
  }],

  ['jungle-vest-t3', {
    id: 'jungle-vest-t3', name: 'Wildgrowth Weave',
    recipeGroup: 'jungle', requiredBiomeLevel: 8, slot: 'armor',
    cost: { green: 90, yellow: 30 }, stats: { "maxHp": 216, "evasion": 0.4, "damageReduction": 0.07 }, // family-tag: evasion armor → Alacrity
    tier: 3,
    icon: 'items/armor/wildgrowth-weave.png',
    description: "Evades soften direct hits; a full dodge also prevents on-hit ailments. Jungle weave strengthens each evade and resists damage over time.",

mechanicEffects: { "defense.evade-mitigation": 0.25, "defense.dot-resistance": 0.3 },
}],

  // Charm: recovery flat; upgrades ramp ramp-regen MAX 0.23 -> 0.35.
  ['jungle-charm-t3', {
    id: 'jungle-charm-t3', name: 'Worldvine Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 9, slot: 'recovery',
    // PURE green by design: the ramping-Recovery foundation is the Forest→Jungle
    // inheritance and green followed it, so mechanic and home colour are the same
    // colour — there is nothing left to splash.
    cost: { green: 100 }, stats: { "recovery": 68.3 }, // family-tag: jungle recovery → Alacrity
    mechanicEffects: { "defense.recovery-ramp-start-pct": 0.05, "defense.recovery-ramp-max-pct": 0.24, "defense.recovery-ramp-ramptime-ms": 10000, "guard.recovery-ramp-advance-ms": 3000 },
    tier: 3,
    icon: 'items/charms/worldvine-heart.png',
    description: 'It wakes slowly to a long fight, and by the end is pouring life back faster than it leaves.',
  }],

  ['jungle-boots-t3', {
    id: 'jungle-boots-t3', name: 'Canopy Striders',
    recipeGroup: 'jungle', requiredBiomeLevel: 10, slot: 'mobility',
    // 2026-09-26 T2-T4 boots curve normalization: Speed 44->68 (+5: 88->88).
    cost: { green: 90 }, stats: { "speed": 88 }, tier: 3, // family-tag: jungle mobility → Alacrity
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.65 },
    icon: 'items/boots/canopy-striders.png',
    description: 'They crash through the green loud enough to turn every hungry thing your way.',
  }],

  // ── T4 ──
  // T4 economy pass (2026-08-30): each item now EVOLVES from its T3 predecessor at
  // +5 (see T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §3). Costs are 2.00× the
  // finalized T3 lifetime total on the shipped accelerating curve; catalysts move
  // to the weapon/armor 0/0/0/0/3/4, recovery/mobility 0/0/0/0/0/3 schedule.
  ['jungle-deathfang-rapier', {
    id: 'jungle-deathfang-rapier', name: 'Deathfang Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 13, slot: 'weapon',
    // 2026-09-26 T2-T4 weapon normalization: Attack 34->59 (+5: 84->108). On-hit unchanged.
    cost: { green: 264 }, stats: { attack: 108, onHitDamage: 70 }, attacksPerSecond: 1.75, tier: 4, // family-tag: capstone fast on-hit rapier → Alacrity
    icon: 'items/weapons/deathfang-rapier.png',
    element: 'poison',   // cosmetic attack tint only
    description: 'Quick past seeing, and slick with something the deep jungle spent a long time perfecting.',
  }],

  ['jungle-vest-t4', {
    id: 'jungle-vest-t4', name: 'Primal Canopy',
    recipeGroup: 'jungle', requiredBiomeLevel: 14, slot: 'armor',
    cost: { green: 220, yellow: 55 }, stats: { "maxHp": 411, "evasion": 0.44, "damageReduction": 0.1 }, // family-tag: evasion armor → Alacrity
    // Bonus evade-mitigation: increases the fraction of damage avoided on an evade
    // (the reload-class mechanic). Stacks on GAME_CONFIG.EVADE_MITIGATION_BASE.
    mechanicEffects: { "defense.evade-mitigation": 0.3, "defense.dot-resistance": 0.35 },
    tier: 4,
    icon: 'items/armor/primal-canopy.png',
    description: "Evades soften direct hits; a full dodge also prevents on-hit ailments. Jungle weave strengthens each evade and resists damage over time.",
  }],

  ['jungle-charm-t4', {
    id: 'jungle-charm-t4', name: 'Ancient Canopy',
    recipeGroup: 'jungle', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { green: 200 }, stats: { "recovery": 168.2 }, // family-tag: jungle recovery → Alacrity
    mechanicEffects: { "defense.recovery-ramp-start-pct": 0.04, "defense.recovery-ramp-max-pct": 0.24, "defense.recovery-ramp-ramptime-ms": 9000, "guard.recovery-ramp-advance-ms": 4000 },
    tier: 4,
    icon: 'items/charms/ancient-canopy.png',
    description: 'Older than the trees around it, and by a long fight\'s end it is pouring life back faster than any blade can take it.',
  }],

  ['jungle-charm-t4-overgrowth', {
    id: 'jungle-charm-t4-overgrowth', name: 'Overgrowth Pulse',
    recipeGroup: 'jungle', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { green: 200 }, stats: { "recovery": 168.2 }, // family-tag: jungle recovery → Alacrity
    // † overheal-ward-pct: regen beyond max HP converts to a temporary ward.
    mechanicEffects: { "defense.recovery-ramp-start-pct": 0.04, "defense.recovery-ramp-max-pct": 0.22, "defense.recovery-ramp-ramptime-ms": 9000, "defense.overheal-ward-pct": 0.1, "defense.overheal-ward-cap-pct": 0.05, "guard.recovery-ramp-advance-ms": 4000 },
    tier: 4,
    icon: 'items/charms/overgrowth-pulse.png',
    description: 'It grows past the wound and keeps growing, hardening the surplus into a living shell.',
  }],

  // T4 boots — aggro-pull (draws more aggro, suits the swarm). T3 0.65 → T4 0.80.
  ['jungle-boots-t4', {
    id: 'jungle-boots-t4', name: 'Warpath Treads',
    recipeGroup: 'jungle', requiredBiomeLevel: 16, slot: 'mobility',
    // 2026-09-26 T2-T4 boots curve normalization: Speed 66->97 (+5: 120->120).
    cost: { green: 198 }, stats: { "speed": 120 }, tier: 4, // family-tag: jungle mobility → Alacrity
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.80 },
    icon: 'items/boots/warpath-treads.png',
    description: 'They tear through the green loud enough to wake the whole canopy — and bring all of it to you at once.',
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
    cost: { green: 500 }, // family-tag: attrition survival → Fortified
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
    cost: { green: 1350 }, // Heavy is BANNED in Jungle; its native family is Alacrity
    stats: {}, tier: 3,
    // The refund is INERT without an ability tagged `mobility` (today: Charge). The
    // stat half is always on, so the slot is never dead — and the clause widens for
    // free as more mobility abilities are authored.
    mechanicEffects: {
      'core.damage-dealt-pct': 0.28, 'core.maxhp-mult': 0.20, 'core.speed-mult': 0.18,
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
    cost: { green: 1150 }, // family-tag: attack-speed tempo → Alacrity
    stats: {}, tier: 3,
    mechanicEffects: { 'core.attack-speed-mult': 0.55, 'core.damage-dealt-pct': -0.18 },
    icon: 'items/cores/accelerant.png',
    description: 'The canopy keeps a fast rhythm. Match it, and you will find you are swinging before you decide to.',
  }],

  ['relic-verdant-flywheel', {
    id: 'relic-verdant-flywheel', name: 'Verdant Flywheel',
    recipeGroup: 'jungle', requiredBiomeLevel: 18, slot: 'relic',
    cost: { green: 3000 },
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
