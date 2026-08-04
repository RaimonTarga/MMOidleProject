import type { Recipe } from './types';

// VOLCANIC (debuts T3). Identity: hardening armor / flurry weapon / in-combat-regen
// + kill-burst charm. Charm rework: upgrades ramp BOTH mechanics, hpRegen flat
// (see mountain.recipes.ts header).

export const volcanicRecipeEntries = [

  ['volcanic-cinderlash', {
    id: 'volcanic-cinderlash', name: 'Cinderlash',
    recipeGroup: 'volcanic', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { red: 140 }, stats: { attack: 34 }, attacksPerSecond: 1.65, tier: 3,
    mechanicEffects: { 'weapon.flurry-pct': 0.03, 'weapon.flurry-stacks': 5 },
    icon: 'items/weapons/cinderlash.png',
    description: 'A whip of braided ember that strikes faster the longer it burns.',
    upgrades: [
      { stats: { attack: 6 }, cost: { red: 200 },  requiredBiomeLevel: 2 },
      { stats: { attack: 6 }, cost: { red: 400 }, requiredBiomeLevel: 3 },
      { stats: { attack: 6 }, cost: { red: 800 }, requiredBiomeLevel: 4 },
      { stats: { attack: 6 }, cost: { red: 800 }, requiredBiomeLevel: 4 },
      { stats: { attack: 6 }, cost: { red: 800 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['volcanic-vest-t3', {
    id: 'volcanic-vest-t3', name: 'Emberforge Plate',
    recipeGroup: 'volcanic', requiredBiomeLevel: 2, slot: 'armor',
    cost: { red: 120, yellow: 30 }, stats: { maxHp: 90, plating: 20 },
    mechanicEffects: { 'defense.hardening-per-sec': 3, 'defense.hardening-max': 24, 'defense.hardening-reset-pct': 0.25 },
    tier: 3,
    icon: 'items/armor/emberforge-plate.png',
    description: 'Plate quenched in a lava flow; it thickens against a steady fire and cracks only to a true blow.',
    upgrades: [
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 100, yellow: 50 },  requiredBiomeLevel: 3 },
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 200, yellow: 100 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 400, yellow: 200 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 400, yellow: 200 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 400, yellow: 200 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp in-combat-regen 0.14 -> 0.20 AND kill-burst 0.08 -> 0.14.
  ['volcanic-charm-t3', {
    id: 'volcanic-charm-t3', name: 'Magmaheart Stone',
    recipeGroup: 'volcanic', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { red: 75, yellow: 25 }, stats: { hpRegen: 11 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.06, 'defense.kill-burst-pct': 0.04 },
    tier: 3,
    icon: 'items/charms/magmaheart-stone.png',
    description: 'A still-molten heart that mends you mid-fight, and flares with every kill.',
    upgrades: [
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 50, yellow: 25 },  requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 100, yellow: 50 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 200, yellow: 100 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 200, yellow: 100 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 200, yellow: 100 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['volcanic-boots-t3', {
    id: 'volcanic-boots-t3', name: 'Magma Walkers',
    recipeGroup: 'volcanic', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { red: 74 }, stats: { speed: 36 }, tier: 3,
    mechanicEffects: { 'mobility.passive-speed-pct': 0.55, 'mobility.suppress-ms': 4000 },
    icon: 'items/boots/magma-walkers.png',
    description: 'Quick as a thrown spark — until a solid blow knocks the wind from them.',
    upgrades: [
      { stats: { speed: 8 },  cost: { red: 30 },  requiredBiomeLevel: 4 },
      { stats: { speed: 12 }, cost: { red: 62 },  requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { red: 104 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { red: 104 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { red: 104 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T4 ──
  ['volcanic-eruption-lash', {
    id: 'volcanic-eruption-lash', name: 'Eruption Lash',
    recipeGroup: 'volcanic', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { red: 308 }, stats: { attack: 58 }, attacksPerSecond: 1.80, tier: 4,
    mechanicEffects: { 'weapon.flurry-pct': 0.04, 'weapon.flurry-stacks': 5 },
    icon: 'items/weapons/eruption-lash.png',
    description: 'A braided whip of ember that strikes faster the longer it is allowed to burn.',
    upgrades: [
      { stats: { attack: 11 }, cost: { red: 462 }, requiredBiomeLevel: 8 },
      { stats: { attack: 11 }, cost: { red: 924 }, requiredBiomeLevel: 9 },
      { stats: { attack: 11 }, cost: { red: 1848 }, requiredBiomeLevel: 10 },
      { stats: { attack: 11 }, cost: { red: 1848 }, requiredBiomeLevel: 10 },
      { stats: { attack: 11 }, cost: { red: 1848 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['volcanic-blightbrand', {
    // Recipe id kept stable (persisted); renamed off "blight" (now poison-coded)
    // onto fire vocabulary — Volcanic owns the fire DoT line.
    id: 'volcanic-blightbrand', name: 'Cinderbrand',
    recipeGroup: 'volcanic', requiredBiomeLevel: 7, slot: 'weapon',
    // ⚠ INHERITED (fast-DoT lineage) — base attack carried from doc.
    //   VERIFY in the DoT-conversion budget pass.
    cost: { red: 290 }, stats: { attack: 70 }, attacksPerSecond: 1.20, tier: 4,
    weaponDot: { effectId: 'cinderbrand-burn', convPct: 0.50, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'fire' },
    icon: 'items/weapons/cinderbrand.png',
    description: 'It leaves a fire under the skin that does the rest of the work while you move on.',
    upgrades: [
      { stats: { attack: 20 }, cost: { red: 435 }, requiredBiomeLevel: 8 },
      { stats: { attack: 20 }, cost: { red: 870 }, requiredBiomeLevel: 9 },
      { stats: { attack: 20 }, cost: { red: 1740 }, requiredBiomeLevel: 10 },
      { stats: { attack: 20 }, cost: { red: 1740 }, requiredBiomeLevel: 10 },
      { stats: { attack: 20 }, cost: { red: 1740 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['volcanic-vest-t4', {
    id: 'volcanic-vest-t4', name: 'Pyroclasm Mantle',
    recipeGroup: 'volcanic', requiredBiomeLevel: 8, slot: 'armor',
    cost: { red: 220, yellow: 55 }, stats: { maxHp: 165, plating: 38 },
    // † hardening-max-dr-bonus: at max hardening, +6% DR for 3s before reset.
    mechanicEffects: {
      'defense.hardening-per-sec': 4, 'defense.hardening-max': 32, 'defense.hardening-reset-pct': 0.25,
      'defense.hardening-max-dr-bonus': 0.06, 'defense.hardening-max-dr-ms': 3000,
    },
    tier: 4,
    icon: 'items/armor/pyroclasm-mantle.png',
    description: 'It thickens against a steady fire until, at its hardest, it shrugs off even a true blow — once.',
    upgrades: [
      { stats: { maxHp: 40, plating: 10 }, cost: { red: 200, yellow: 100 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 40, plating: 10 }, cost: { red: 400, yellow: 200 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 40, plating: 10 }, cost: { red: 800, yellow: 300 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 40, plating: 10 }, cost: { red: 800, yellow: 300 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 40, plating: 10 }, cost: { red: 800, yellow: 300 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['volcanic-vest-t4-lavatempered', {
    id: 'volcanic-vest-t4-lavatempered', name: 'Lava-Tempered Hide',
    recipeGroup: 'volcanic', requiredBiomeLevel: 8, slot: 'armor',
    cost: { red: 220, yellow: 55 }, stats: { maxHp: 150, plating: 28 },
    // † overheal-shield-pct: overheal from in-combat-regen becomes temp shield.
    //   Pairs naturally with Inferno Heart. (new key)
    mechanicEffects: {
      'defense.hardening-per-sec': 3, 'defense.hardening-max': 24, 'defense.hardening-reset-pct': 0.25,
      'defense.overheal-shield-pct': 0.50,
    },
    tier: 4,
    icon: 'items/armor/lava-tempered-hide.png',
    description: 'Quenched in a living flow, it banks the overflow of your own healing into a crust of fresh stone.',
    upgrades: [
      { stats: { maxHp: 36, plating: 7 }, cost: { red: 200, yellow: 100 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 36, plating: 7 }, cost: { red: 400, yellow: 200 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 36, plating: 7 }, cost: { red: 800, yellow: 300 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 36, plating: 7 }, cost: { red: 800, yellow: 300 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 36, plating: 7 }, cost: { red: 800, yellow: 300 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['volcanic-charm-t4', {
    id: 'volcanic-charm-t4', name: 'Inferno Heart',
    recipeGroup: 'volcanic', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { red: 200, yellow: 50 }, stats: { hpRegen: 16 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.06, 'defense.kill-burst-pct': 0.04 },
    tier: 4,
    icon: 'items/charms/inferno-heart.png',
    description: 'A heart that never fully cools — it mends you mid-swing and flares brighter with every fallen foe.',
    upgrades: [
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 110, yellow: 30 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 220, yellow: 60 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 340, yellow: 90 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 340, yellow: 90 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.in-combat-regen-pct': 0.02, 'defense.kill-burst-pct': 0.02 }, cost: { red: 340, yellow: 90 }, requiredBiomeLevel: 10 },
    ],
  }],

  // T4 boots — passive-speed (fast, suppressed when hit). T3 0.55/4000 → T4 0.70/3500.
  ['volcanic-boots-t4', {
    id: 'volcanic-boots-t4', name: 'Pyroclast Treads',
    recipeGroup: 'volcanic', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { red: 163 }, stats: { speed: 50 }, tier: 4,
    mechanicEffects: { 'mobility.passive-speed-pct': 0.70, 'mobility.suppress-ms': 3500 },
    icon: 'items/boots/pyroclast-treads.png',
    description: 'Swift as a thrown ember — until a solid blow stalls them, and the heat must build again.',
    upgrades: [
      { stats: { speed: 10 }, cost: { red: 66 },  requiredBiomeLevel: 10 },
      { stats: { speed: 14 }, cost: { red: 136 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { red: 229 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { red: 229 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { red: 229 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Volcanic owns THE STRIKE ITSELF —
  // burn weapons and heat, so it is where the on-hit amplifier comes from.

  // T3 unrestricted — Catalyst: scales the flat on-hit term, which lands AFTER
  // plating and DR. That unmitigated placement is what makes it a real axis rather
  // than a second attack multiplier, and it is why it shines against armour.
  ['core-catalyst', {
    id: 'core-catalyst', name: 'Catalyst Core',
    recipeGroup: 'volcanic', requiredBiomeLevel: 3, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-catalyst',
    cost: { red: 90 }, catalystCost: { volatility: 2 }, // family-tag: on-hit proc amplifier → Volatility
    stats: {}, tier: 3,
    // Trading attack (mitigated) for on-hit (unmitigated) is the actual shape here:
    // better against heavily armoured targets, worse against soft ones. Worth little
    // to a build carrying no on-hit damage — the specialisation is the cost.
    mechanicEffects: { 'core.onhit-mult': 0.28, 'core.attack-mult': -0.12 },
    icon: 'items/cores/catalyst.png',
    description: 'Heat finds the seams that force cannot. Armour is no comfort against something already inside it.',
  }],

] satisfies [string, Recipe][];
