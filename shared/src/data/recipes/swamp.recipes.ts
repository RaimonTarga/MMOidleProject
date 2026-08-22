import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// SWAMP — full lineage (T1→T3).
//
// Identity (design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md §5):
//   weapon  the foundational DoT-CONVERSION weapon. Swamp is the poison biome
//           and owns the poison line; frost DoT lives on Tundra (from T3), fire
//           DoT on Volcanic (from T4) — see item-identity-audit.md.
//   armor   DoT resistance / attrition defence
//   charm   periodic Recovery pulse — automatic, reliable, weaker per activation
//           than an active Recovery skill. It answers persistent health loss
//           regardless of what caused it, which is exactly the Swamp problem.
//   boots   SLOW RESISTANCE (magnitude), not tenacity (hard-CC duration)
//
// The rework SWAPPED Swamp's and Cave's charm mechanics: Swamp's old absorb did
// nothing against DoT, which is the biome's whole threat, so the periodic
// Recovery pulse moved here and absorb moved to Cave (philosophy §11.5, §13).
//
// hit-to-DoT conversion is deliberately absent at T1 (it benched extremely
// strong) and kept as the T2/T3 specialisation of the lineage.
//
// See the scaling rule in the header of `plains.recipes.ts` for how T2/T3
// numbers are derived from the T1 baseline.
// ─────────────────────────────────────────────────────────────────────────

export const swampRecipeEntries = [
  // ── T1 ──
  // The DoT package (convPct / drain / multiplier) is preserved AS-IS from before
  // the rework: the underlying DoT formula is an explicitly separate balance pass
  // (baseline §5.4). The weapon scales through Attack, and the converted DoT
  // follows automatically because it is derived from the direct damage.
  ['ashbrand-blade', {
    // Recipe id kept stable (persisted in saves); name/element/effect rethemed to poison.
    id: 'ashbrand-blade', name: 'Poison Dagger',
    recipeGroup: 'swamp', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { purple: 22 }, stats: { attack: 10 }, attacksPerSecond: 0.90, tier: 1,
    weaponDot: { effectId: 'poison-dagger-burn', convPct: 0.50, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'poison' },
    icon: 'items/weapons/poison-dagger.png',
    description: 'A short blade kept slick with mire-venom that refuses to dry.',
    upgrades: [
      { stats: { attack: 1 }, cost: { purple: 30 }, requiredBiomeLevel: 2 },
      { stats: { attack: 1 }, cost: { purple: 60 }, requiredBiomeLevel: 3 },
      { stats: { attack: 1 }, cost: { purple: 120 }, requiredBiomeLevel: 4 },
      { stats: { attack: 1 }, cost: { purple: 120 }, requiredBiomeLevel: 4 },
      { stats: { attack: 1 }, cost: { purple: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Substantially better in a DoT-heavy fight, and deliberately so — but it
  // carries enough HP/plating that wearing it outside one is not being naked.
  ['swamp-vest-t1', {
    id: 'swamp-vest-t1', name: 'Arcane Wrappings',
    recipeGroup: 'swamp', requiredBiomeLevel: 2, slot: 'armor',
    cost: { purple: 22 }, stats: { maxHp: 30, plating: 4 },
    mechanicEffects: { 'defense.dot-resistance': 0.20 },
    tier: 1,
    icon: 'items/armor/arcane-wrappings.png',
    description: 'Marsh-cloth steeped in old wardings against rot and fume.',
    upgrades: [
      { stats: { maxHp: 4 }, mechanicEffects: { 'defense.dot-resistance': 0.02 }, cost: { purple: 30 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 4, plating: 1 }, mechanicEffects: { 'defense.dot-resistance': 0.02 }, cost: { purple: 60 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4 }, mechanicEffects: { 'defense.dot-resistance': 0.02 }, cost: { purple: 120 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4, plating: 1 }, mechanicEffects: { 'defense.dot-resistance': 0.02 }, cost: { purple: 120 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4 }, mechanicEffects: { 'defense.dot-resistance': 0.02 }, cost: { purple: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  // CHARM — periodic attrition Recovery. Every 8s in combat, switch on 20→30% of
  // the Recovery RATE for 4s. Automatic and reliable; no trigger to miss and no
  // dependency on the damage source, which is what makes it the DoT answer.
  ['swamp-charm-t1', {
    id: 'swamp-charm-t1', name: 'Murk Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { purple: 18 }, stats: { recovery: 2 },
    mechanicEffects: {
      'defense.recovery-pulse-pct': 0.20,
      'defense.recovery-pulse-interval-ms': 8000,
      'defense.recovery-pulse-duration-ms': 4000,
    },
    tier: 1,
    icon: 'items/charms/murk-eye.png',
    description: 'A preserved golem eye, still weeping faint green light.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 15 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 33 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 63 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 63 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 63 }, requiredBiomeLevel: 4 },
    ],
  }],

  // BOOTS — Slow Resistance. Reduces the MAGNITUDE of soft movement slows (a 50%
  // slow at 25% resistance becomes a 37.5% slow). Deliberately not generic CC
  // immunity: hard control is answered by tenacity/control resistance instead.
  ['swamp-boots-t1', {
    id: 'swamp-boots-t1', name: 'Marsh Treads',
    recipeGroup: 'swamp', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { purple: 18 }, stats: { speed: 18 }, tier: 1,
    mechanicEffects: { 'mobility.slow-resistance': 0.25 },
    icon: 'items/boots/marsh-treads.png',
    description: 'Broad soles that ride the surface of soft, sucking ground.',
    upgrades: [
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.slow-resistance': 0.03 }, cost: { purple: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.slow-resistance': 0.03 }, cost: { purple: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.slow-resistance': 0.03 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.slow-resistance': 0.03 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.slow-resistance': 0.03 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  ['swamp-mirebrand', {
    // Recipe id kept stable (persisted); rethemed fire → poison (Venom Knife).
    id: 'swamp-mirebrand', name: 'Venom Knife',
    recipeGroup: 'swamp', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { purple: 52 }, catalystCost: { fortified: 2 }, stats: { attack: 18 }, attacksPerSecond: 1.0, tier: 2, // family-tag: poison DoT-conversion weapon → Fortified
    weaponDot: { effectId: 'swamp-mirebrand-burn', convPct: 0.50, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'poison' },
    icon: 'items/weapons/venom-knife.png',
    description: 'The venom runs deeper now; what it touches keeps rotting.',
    upgrades: [
      { stats: { attack: 2 }, cost: { purple: 78 }, requiredBiomeLevel: 8 },
      { stats: { attack: 2 }, cost: { purple: 156 }, requiredBiomeLevel: 9 },
      { stats: { attack: 2 }, cost: { purple: 312 }, requiredBiomeLevel: 10 },
      { stats: { attack: 2 }, cost: { purple: 312 }, requiredBiomeLevel: 10 },
      { stats: { attack: 1 }, cost: { purple: 312 }, requiredBiomeLevel: 10 },
    ],
  }],

  // (T2 Frostbrand removed — frost DoT now lives on Tundra. See item-identity-audit.md.)

  ['swamp-vest-t2', {
    id: 'swamp-vest-t2', name: 'Bog Wrappings',
    recipeGroup: 'swamp', requiredBiomeLevel: 8, slot: 'armor',
    cost: { purple: 54 }, catalystCost: { fortified: 2 }, stats: { maxHp: 54, plating: 7 }, // family-tag: dot-resistance armor → Fortified
    // hit-to-DoT is the T2+ specialisation of this lineage: deliberately held out
    // of the T1 baseline, kept here as the thing the tier upgrade actually buys.
    mechanicEffects: { 'defense.dot-resistance': 0.34, 'defense.hit-to-dot-pct': 0.08 },
    tier: 2,
    icon: 'items/armor/bog-wrappings.png',
    description: 'Cloth drawn from the deepest mire, where even the water has forgotten the sun.',
    upgrades: [
      { stats: { maxHp: 5, plating: 1 }, mechanicEffects: { 'defense.dot-resistance': 0.02 }, cost: { purple: 75 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 5 }, mechanicEffects: { 'defense.dot-resistance': 0.02 }, cost: { purple: 150 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 6, plating: 1 }, mechanicEffects: { 'defense.dot-resistance': 0.01 }, cost: { purple: 300 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 5, plating: 1 }, mechanicEffects: { 'defense.dot-resistance': 0.02 }, cost: { purple: 300 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 6, plating: 1 }, mechanicEffects: { 'defense.dot-resistance': 0.01 }, cost: { purple: 300 }, requiredBiomeLevel: 10 },
    ],
  }],

  // CHARM — periodic Recovery pulse, deepened. Same 8s / 4s cadence as the T1
  // Murk Eye; the tier buys a larger slice of the Recovery rate, not a faster one
  // (cadence is left as design space for future charms to specialise).
  ['swamp-charm-t2', {
    id: 'swamp-charm-t2', name: 'Bog Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { purple: 44 }, catalystCost: { fortified: 2 }, stats: { recovery: 4 }, // family-tag: attrition-Recovery charm → Fortified
    mechanicEffects: {
      'defense.recovery-pulse-pct': 0.32,
      'defense.recovery-pulse-interval-ms': 8000,
      'defense.recovery-pulse-duration-ms': 4000,
    },
    tier: 2,
    icon: 'items/charms/bog-eye.png',
    description: 'A bog-touched eye that drinks deep and gives quietly back.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 30 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 60 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 120 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 120 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 120 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['swamp-boots-t2', {
    id: 'swamp-boots-t2', name: 'Wetland Wraps',
    recipeGroup: 'swamp', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { purple: 44 }, catalystCost: { fortified: 2 }, stats: { speed: 32 }, tier: 2, // family-tag: swamp mobility → Fortified
    mechanicEffects: { 'mobility.slow-resistance': 0.45 },
    icon: 'items/boots/wetland-wraps.png',
    description: 'Enchanted bindings that find footing where there should be none.',
    upgrades: [
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.slow-resistance': 0.03 }, cost: { purple: 22 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.slow-resistance': 0.03 }, cost: { purple: 44 }, requiredBiomeLevel: 10 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.slow-resistance': 0.02 }, cost: { purple: 78 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.slow-resistance': 0.03 }, cost: { purple: 78 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.slow-resistance': 0.02 }, cost: { purple: 78 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── T3 ── (poison DoT weapon; the old frost variant moved to Tundra)
  ['swamp-blightbrand', {
    // Recipe id kept stable (persisted); the mis-named "Flamebrand" is now the
    // poison-themed Plague Fang (fire → poison).
    id: 'swamp-blightbrand', name: 'Plague Fang',
    recipeGroup: 'swamp', requiredBiomeLevel: 13, slot: 'weapon',
    cost: { purple: 116 }, catalystCost: { fortified: 3 }, stats: { attack: 32 }, attacksPerSecond: 1.00, tier: 3, // family-tag: poison DoT weapon → Fortified
    weaponDot: { effectId: 'swamp-blightbrand-burn', convPct: 0.50, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'poison' },
    icon: 'items/weapons/plague-fang.png',
    description: 'The rot it carries does more work than the edge ever could.',
    upgrades: [
      { stats: { attack: 3 }, cost: { purple: 170 },  requiredBiomeLevel: 14 },
      { stats: { attack: 3 }, cost: { purple: 340 }, requiredBiomeLevel: 15 },
      { stats: { attack: 3 }, cost: { purple: 696 }, requiredBiomeLevel: 16 },
      { stats: { attack: 3 }, cost: { purple: 696 }, requiredBiomeLevel: 16 },
      { stats: { attack: 4 }, cost: { purple: 696 }, requiredBiomeLevel: 16 },
    ],
  }],

  // (T3 Rimebrand removed from Swamp — relocated to Tundra as its T3 frost DoT
  //  weapon. See tundra.recipes.ts and item-identity-audit.md.)

  ['swamp-vest-t3', {
    id: 'swamp-vest-t3', name: 'Plaguebound Shroud',
    recipeGroup: 'swamp', requiredBiomeLevel: 14, slot: 'armor',
    cost: { purple: 140 }, catalystCost: { fortified: 3 }, stats: { maxHp: 97, plating: 13 }, // family-tag: dot-resistance armor → Fortified
    mechanicEffects: { 'defense.dot-resistance': 0.46, 'defense.hit-to-dot-pct': 0.10, 'defense.debuff-resistance': 0.20 },
    tier: 3,
    icon: 'items/armor/plaguebound-shroud.png',
    description: 'It turns the blows you take into a slow ache it then refuses to feel.',
    upgrades: [
      { stats: { maxHp: 10, plating: 1 }, mechanicEffects: { 'defense.dot-resistance': 0.01 }, cost: { purple: 180 },  requiredBiomeLevel: 15 },
      { stats: { maxHp: 10, plating: 1 }, mechanicEffects: { 'defense.dot-resistance': 0.01 }, cost: { purple: 360 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 10, plating: 1 }, mechanicEffects: { 'defense.dot-resistance': 0.01 }, cost: { purple: 720 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 9, plating: 2 }, mechanicEffects: { 'defense.dot-resistance': 0.01 }, cost: { purple: 720 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 10, plating: 1 }, mechanicEffects: { 'defense.dot-resistance': 0.02 }, cost: { purple: 720 }, requiredBiomeLevel: 16 },
    ],
  }],

  // CHARM — periodic Recovery pulse, T3.
  ['swamp-charm-t3', {
    id: 'swamp-charm-t3', name: 'Sorrow Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { purple: 100 }, catalystCost: { fortified: 3 }, stats: { recovery: 7 }, // family-tag: attrition-Recovery charm → Fortified
    mechanicEffects: {
      'defense.recovery-pulse-pct': 0.44,
      'defense.recovery-pulse-interval-ms': 8000,
      'defense.recovery-pulse-duration-ms': 4000,
    },
    tier: 3,
    icon: 'items/charms/sorrow-eye.png',
    description: 'It weeps for every wound, and gives the tears back as strength.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 75 },  requiredBiomeLevel: 16 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 150 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 300 }, requiredBiomeLevel: 16 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 300 }, requiredBiomeLevel: 16 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-pulse-pct': 0.02 }, cost: { purple: 300 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['swamp-boots-t3', {
    id: 'swamp-boots-t3', name: 'Mire Striders',
    recipeGroup: 'swamp', requiredBiomeLevel: 16, slot: 'mobility',
    cost: { purple: 100 }, catalystCost: { fortified: 3 }, stats: { speed: 58 }, tier: 3, // family-tag: swamp mobility → Fortified
    mechanicEffects: { 'mobility.slow-resistance': 0.62 },
    icon: 'items/boots/mire-striders.png',
    description: 'Nothing the bog grips holds them; they walk free of any mire that tries to keep them.',
    upgrades: [
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.slow-resistance': 0.02 }, cost: { purple: 30 },  requiredBiomeLevel: 16 },
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.slow-resistance': 0.02 }, cost: { purple: 60 },  requiredBiomeLevel: 16 },
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.slow-resistance': 0.02 }, cost: { purple: 105 }, requiredBiomeLevel: 16 },
      { stats: { speed: 4 }, mechanicEffects: { 'mobility.slow-resistance': 0.02 }, cost: { purple: 105 }, requiredBiomeLevel: 16 },
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.slow-resistance': 0.02 }, cost: { purple: 105 }, requiredBiomeLevel: 16 },
    ],
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Swamp owns AFFLICTION AND CONTROL —
  // it teaches Cleanse, so it is where the debuff amplifier comes from.

  // T3 unrestricted — Controller: your debuffs last longer and bite harder.
  // Only scales debuffs on the SCALABLE_DEBUFFS registry (shared/src/systems/
  // debuffScaling.ts); it is not a blanket multiplier over every status effect.
  ['core-controller', {
    id: 'core-controller', name: 'Controller Core',
    recipeGroup: 'swamp', requiredBiomeLevel: 15, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-controller',
    cost: { purple: 90 }, catalystCost: { fortified: 2 }, // family-tag: debuff/affliction → Fortified
    stats: {}, tier: 3,
    // Does nothing for a build that applies no debuffs. That is the intended
    // opportunity cost, so no direct-damage penalty is authored on top of it.
    mechanicEffects: { 'core.debuff-duration-mult': 0.25, 'core.debuff-potency-mult': 0.12 },
    icon: 'items/cores/controller.png',
    description: 'The swamp never kills quickly. It simply makes sure nothing leaves the way it came in.',
  }],

  ['relic-virulent-hourglass', {
    id: 'relic-virulent-hourglass', name: 'Virulent Hourglass',
    recipeGroup: 'swamp', requiredBiomeLevel: 24, slot: 'relic',
    lineageId: 'relic-virulent-hourglass',
    cost: { purple: 220 }, catalystCost: { fortified: 4 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': 0.20,
      'relic.mechanic-potency': -0.20,
      'relic.mechanic-debuff-effect': 0.25,
    },
    icon: 'items/relics/virulent-hourglass.png',
    description: 'The sand falls quickly; what it leaves behind grows harder to escape.',
  }],

] satisfies [string, Recipe][];
