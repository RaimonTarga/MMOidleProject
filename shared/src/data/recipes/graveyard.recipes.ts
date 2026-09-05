import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// Graveyard (T4). All five ordinary slots authored, plus the Controller Core:
// weapon (Cave dead-swing-axe
// inheritance), two armor branches and two recovery branches (Swamp
// dot-resistance/recovery-pulse inheritance), one mobility item (genuinely
// new kill-stack identity, no predecessor). Renamed from necropolis. Essence:
// purple (necrotic). T4 economy pass (2026-08-30): lineage, catalyst
// schedule/family, and the accelerating upgrade curve were normalized — see
// T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §5/§6/§7.6/§11.

export const graveyardRecipeEntries = [
  ['graveyard-plague-axe', {
    id: 'graveyard-plague-axe', name: 'Plague Axe',
    recipeGroup: 'graveyard', requiredBiomeLevel: 1, slot: 'weapon',
    evolvesFrom: 'cave-cataclysm-axe',
    // Evolves from Cataclysm Axe (Cave), continuing the
    // `weapon.dead-swing-interval` family (see
    // T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §5). Economy resolved by
    // that pass; base `attack` value has NOT been revalidated against current
    // combat formulas — that remains a separate balance question.
    // INVARIANT: the dead swing must NOT consume class mechanic resources
    //   (no cadence count, no energy, no cooldown progress).
    cost: { purple: 270 }, stats: { attack: 150 }, attacksPerSecond: 1.10, tier: 4, // family-tag: dead-swing axe → Swarming
    reconstructCost: { purple: 945 }, reconstructCatalystCost: { swarming: 4 },
    mechanicEffects: {
      'weapon.dead-swing-interval': 3,
      'weapon.dead-swing-vuln-pct': 0.20, 'weapon.dead-swing-vuln-ms': 4000,
    },
    icon: 'items/weapons/plague-axe.png',
    description: 'Every third stroke lands flat and harmless — and leaves the rot to make the next one count double.',
    upgrades: [
      { stats: { attack: 30 }, cost: { purple: 175 }, requiredBiomeLevel: 2 },
      { stats: { attack: 30 }, cost: { purple: 439 }, requiredBiomeLevel: 3 },
      { stats: { attack: 30 }, cost: { purple: 702 }, requiredBiomeLevel: 4 },
      { stats: { attack: 30 }, cost: { purple: 1140 }, catalystCost: { swarming: 3 }, requiredBiomeLevel: 4 },
      { stats: { attack: 30 }, cost: { purple: 1930 }, catalystCost: { swarming: 4 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['graveyard-vest-t4', {
    id: 'graveyard-vest-t4', name: 'Plaguebound Mantle',
    recipeGroup: 'graveyard', requiredBiomeLevel: 2, slot: 'armor',
    evolvesFrom: 'swamp-vest-t3',
    cost: { purple: 220 }, stats: { maxHp: 150, plating: 16 }, // family-tag: dot-resistance armor (Swamp inheritance) → Fortified
    reconstructCost: { purple: 770 }, reconstructCatalystCost: { fortified: 4 },
    // Reactive plating: each hit taken grants +2 plating for 4s, stacking (refreshes
    // duration) up to 15 stacks (+30 plating at full).
    mechanicEffects: {
      'defense.dot-resistance': 0.35, 'defense.hit-to-dot-pct': 0.08, 'defense.debuff-resistance': 0.25,
      'defense.hit-plating-per-stack': 1, 'defense.hit-plating-max-stacks': 5, 'defense.hit-plating-duration-ms': 4000,
    },
    tier: 4,
    icon: 'items/armor/plaguebound-mantle.png',
    description: 'The denser the swarm, the thicker the crust of clinging filth — and the harder you are to bite.',
    upgrades: [
      { stats: { maxHp: 36, plating: 6 }, cost: { purple: 180 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 36, plating: 6 }, cost: { purple: 450 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 6 }, cost: { purple: 719 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 6 }, cost: { purple: 1169 }, catalystCost: { fortified: 3 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 6 }, cost: { purple: 1978 }, catalystCost: { fortified: 4 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['graveyard-vest-t4-debtward', {
    id: 'graveyard-vest-t4-debtward', name: 'Grave Ward',
    recipeGroup: 'graveyard', requiredBiomeLevel: 2, slot: 'armor',
    evolvesFrom: 'swamp-vest-t3',
    cost: { purple: 220 }, stats: { maxHp: 150, plating: 20 }, // family-tag: dot-resistance armor (Swamp inheritance) → Fortified
    reconstructCost: { purple: 770 }, reconstructCatalystCost: { fortified: 4 },
    // † debt-cheat-death: once per combat, if accumulated damage debt would
    //   exceed current HP, the debt clears completely. (new key, no shield needed)
    mechanicEffects: {
      'defense.dot-resistance': 0.40, 'defense.hit-to-dot-pct': 0.08,
      'defense.debt-cheat-death': 1,
    },
    tier: 4,
    icon: 'items/armor/grave-ward.png',
    description: 'It lets the debt of a hundred small wounds come due all at once — and then forgives it, once.',
    upgrades: [
      { stats: { maxHp: 36, plating: 4 }, cost: { purple: 180 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 36, plating: 4 }, cost: { purple: 450 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 4 }, cost: { purple: 719 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 4 }, cost: { purple: 1169 }, catalystCost: { fortified: 3 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 4 }, cost: { purple: 1978 }, catalystCost: { fortified: 4 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['graveyard-charm-t4', {
    id: 'graveyard-charm-t4', name: 'Necrotic Pulse',
    recipeGroup: 'graveyard', requiredBiomeLevel: 3, slot: 'recovery',
    evolvesFrom: 'swamp-charm-t3',
    cost: { purple: 150 }, stats: { recovery: 16 }, // family-tag: recovery-pulse charm (Swamp inheritance) → Fortified
    reconstructCost: { purple: 525 }, reconstructCatalystCost: { fortified: 4 },
    mechanicEffects: { 'defense.recovery-pulse-pct': 0.11, 'defense.recovery-pulse-interval-ms': 6000 },
    tier: 4,
    icon: 'items/charms/necrotic-pulse.png',
    description: 'A slow, certain throb of returning life, timed like a tired heart that refuses to stop.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.03 }, cost: { purple: 73 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.03 }, cost: { purple: 183 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.03 }, cost: { purple: 292 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.03 }, cost: { purple: 475 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.03 }, cost: { purple: 803 }, catalystCost: { fortified: 3 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['graveyard-charm-t4-gravetide', {
    id: 'graveyard-charm-t4-gravetide', name: 'Grave-Tide Pulse',
    recipeGroup: 'graveyard', requiredBiomeLevel: 3, slot: 'recovery',
    evolvesFrom: 'swamp-charm-t3',
    cost: { purple: 150 }, stats: { recovery: 16 }, // family-tag: recovery-pulse charm (Swamp inheritance) → Fortified
    reconstructCost: { purple: 525 }, reconstructCatalystCost: { fortified: 4 },
    // Combined: slower burst, compensated by a baseline in-combat trickle.
    mechanicEffects: {
      'defense.recovery-pulse-pct': 0.04, 'defense.recovery-pulse-interval-ms': 8000,
      'defense.recovery-active-pct': 0.04,
    },
    tier: 4,
    icon: 'items/charms/grave-tide-pulse.png',
    description: 'A tide that never fully goes out — it gives back in a steady seep between the larger swells.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.01, 'defense.recovery-active-pct': 0.01 }, cost: { purple: 73 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.01, 'defense.recovery-active-pct': 0.01 }, cost: { purple: 183 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.01, 'defense.recovery-active-pct': 0.01 }, cost: { purple: 292 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.01, 'defense.recovery-active-pct': 0.01 }, cost: { purple: 475 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-pulse-pct': 0.01, 'defense.recovery-active-pct': 0.01 }, cost: { purple: 803 }, catalystCost: { fortified: 3 }, requiredBiomeLevel: 4 },
    ],
  }],

  // T4 boots — on-kill stacking speed + tenacity (max 3, 4s). Suits the dense swarm.
  // No evolvesFrom: `mobility.kill-stack-speed-pct`/`-tenacity-pct` matches
  // neither Cave (`mobility.stealth-pct`) nor Swamp (`mobility.slow-resistance`)
  // — a genuine T4-only kill-momentum identity (see the proposal §6).
  ['graveyard-boots-t4', {
    id: 'graveyard-boots-t4', name: 'Gravewalker Boots',
    recipeGroup: 'graveyard', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { purple: 80 }, stats: { speed: 30 }, tier: 4, // family-tag: Graveyard native mobility → Swarming
    mechanicEffects: {
      'mobility.kill-stack-speed-pct': 0.12,
      'mobility.kill-stack-tenacity-pct': 0.12,
      'mobility.kill-stack-ms': 4000,
    },
    icon: 'items/boots/gravewalker-boots.png',
    description: 'Each fallen foe lends a little of its lingering haste — and the more that fall, the harder it becomes to hold you down.',
    upgrades: [
      { stats: { speed: 8 },  cost: { purple: 50 },  requiredBiomeLevel: 4 },
      { stats: { speed: 12 }, cost: { purple: 125 },  requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { purple: 200 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { purple: 326 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { purple: 551 }, catalystCost: { swarming: 3 }, requiredBiomeLevel: 4 },
    ],
  }],

  // T4 premium unrestricted — Controller: Graveyard's mature control capstone.
  // The L4 gate and 2,100 purple / 7 Fortified price keep the debuff package
  // premium without requiring a boss clear.
  // Only scales debuffs on the SCALABLE_DEBUFFS registry (shared/src/systems/
  // debuffScaling.ts); it is not a blanket multiplier over every status effect.
  ['core-controller', {
    id: 'core-controller', name: 'Controller Core',
    recipeGroup: 'graveyard', requiredBiomeLevel: 4, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-controller',
    cost: { purple: 2100 }, catalystCost: { fortified: 7 }, // family-tag: debuff/affliction → Fortified
    stats: {}, tier: 4,
    // Does nothing for a build that applies no debuffs. That is the intended
    // opportunity cost, so no direct-damage penalty is authored on top of it.
    mechanicEffects: { 'core.debuff-duration-mult': 0.35, 'core.debuff-potency-mult': 0.25 },
    icon: 'items/cores/controller.png',
    description: 'The swamp never kills quickly. It simply makes sure nothing leaves the way it came in.',
  }],

  ['relic-haunted-prism', {
    id: 'relic-haunted-prism', name: 'Haunted Prism',
    recipeGroup: 'graveyard', requiredBiomeLevel: 6, slot: 'relic',
    lineageId: 'relic-haunted-prism',
    cost: { purple: 3500 }, catalystCost: { fortified: 10 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': -0.10,
      'relic.mechanic-potency': -0.10,
      'relic.mechanic-buff-effect': 0.35,
      'relic.mechanic-debuff-effect': 0.35,
    },
    icon: 'items/relics/haunted-prism.png',
    description: 'The prism weakens the pulse itself so every blessing and affliction can linger with greater force.',
  }],
] satisfies [string, Recipe][];
