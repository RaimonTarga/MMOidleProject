import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// Graveyard (T4) — extreme-high-density undead swarm biome (renamed from
// necropolis). Only the mobility (boot) line is authored so far: its on-kill
// stacking speed + tenacity ramp is live in the combat engine and suits the
// dense pack-clearing identity. Armor / weapon / charm / new-mechanic mobs
// remain DEFERRED. Essence: purple (necrotic). Values are untuned placeholders.

export const graveyardRecipeEntries = [
  ['graveyard-plague-axe', {
    id: 'graveyard-plague-axe', name: 'Plague Axe',
    recipeGroup: 'graveyard', requiredBiomeLevel: 1, slot: 'weapon',
    // ⚠ INHERITED (Cave debuff-branch axe) — base attack carried from doc.
    //   VERIFY in dead-swing budget pass.
    // INVARIANT: the dead swing must NOT consume class mechanic resources
    //   (no cadence count, no energy, no cooldown progress).
    cost: { purple: 270 }, stats: { attack: 150 }, attacksPerSecond: 1.10, tier: 4,
    mechanicEffects: {
      'weapon.dead-swing-interval': 3,
      'weapon.dead-swing-vuln-pct': 0.20, 'weapon.dead-swing-vuln-ms': 4000,
    },
    icon: 'items/weapons/plague-axe.png',
    description: 'Every third stroke lands flat and harmless — and leaves the rot to make the next one count double.',
    upgrades: [
      { stats: { attack: 30 }, cost: { purple: 405 }, requiredBiomeLevel: 2 },
      { stats: { attack: 30 }, cost: { purple: 810 }, requiredBiomeLevel: 3 },
      { stats: { attack: 30 }, cost: { purple: 1620 }, requiredBiomeLevel: 4 },
      { stats: { attack: 30 }, cost: { purple: 1620 }, requiredBiomeLevel: 4 },
      { stats: { attack: 30 }, cost: { purple: 1620 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['graveyard-vest-t4', {
    id: 'graveyard-vest-t4', name: 'Plaguebound Mantle',
    recipeGroup: 'graveyard', requiredBiomeLevel: 2, slot: 'armor',
    cost: { purple: 220 }, stats: { maxHp: 150, plating: 16 },
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
      { stats: { maxHp: 36, plating: 6 }, cost: { purple: 200 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 36, plating: 6 }, cost: { purple: 400 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 6 }, cost: { purple: 700 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 6 }, cost: { purple: 700 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 6 }, cost: { purple: 700 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['graveyard-vest-t4-debtward', {
    id: 'graveyard-vest-t4-debtward', name: 'Grave Ward',
    recipeGroup: 'graveyard', requiredBiomeLevel: 2, slot: 'armor',
    cost: { purple: 220 }, stats: { maxHp: 150, plating: 20 },
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
      { stats: { maxHp: 36, plating: 4 }, cost: { purple: 200 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 36, plating: 4 }, cost: { purple: 400 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 4 }, cost: { purple: 700 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 4 }, cost: { purple: 700 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 36, plating: 4 }, cost: { purple: 700 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['graveyard-charm-t4', {
    id: 'graveyard-charm-t4', name: 'Necrotic Pulse',
    recipeGroup: 'graveyard', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { purple: 150 }, stats: { hpRegen: 16 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.11, 'defense.regen-burst-interval-ms': 6000 },
    tier: 4,
    icon: 'items/charms/necrotic-pulse.png',
    description: 'A slow, certain throb of returning life, timed like a tired heart that refuses to stop.',
    upgrades: [
      { mechanicEffects: { 'defense.regen-burst-pct': 0.03 }, cost: { purple: 100 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.03 }, cost: { purple: 200 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.03 }, cost: { purple: 330 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.03 }, cost: { purple: 330 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.03 }, cost: { purple: 330 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['graveyard-charm-t4-gravetide', {
    id: 'graveyard-charm-t4-gravetide', name: 'Grave-Tide Pulse',
    recipeGroup: 'graveyard', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { purple: 150 }, stats: { hpRegen: 16 },
    // Combined: slower burst, compensated by a baseline in-combat trickle.
    mechanicEffects: {
      'defense.regen-burst-pct': 0.04, 'defense.regen-burst-interval-ms': 8000,
      'defense.in-combat-regen-pct': 0.04,
    },
    tier: 4,
    icon: 'items/charms/grave-tide-pulse.png',
    description: 'A tide that never fully goes out — it gives back in a steady seep between the larger swells.',
    upgrades: [
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01, 'defense.in-combat-regen-pct': 0.01 }, cost: { purple: 100 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01, 'defense.in-combat-regen-pct': 0.01 }, cost: { purple: 200 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01, 'defense.in-combat-regen-pct': 0.01 }, cost: { purple: 330 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01, 'defense.in-combat-regen-pct': 0.01 }, cost: { purple: 330 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.regen-burst-pct': 0.01, 'defense.in-combat-regen-pct': 0.01 }, cost: { purple: 330 }, requiredBiomeLevel: 4 },
    ],
  }],

  // T4 boots — on-kill stacking speed + tenacity (max 3, 4s). Suits the dense swarm.
  ['graveyard-boots-t4', {
    id: 'graveyard-boots-t4', name: 'Gravewalker Boots',
    recipeGroup: 'graveyard', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { purple: 80 }, stats: { speed: 30 }, tier: 4,
    mechanicEffects: {
      'mobility.kill-stack-speed-pct': 0.12,
      'mobility.kill-stack-tenacity-pct': 0.12,
      'mobility.kill-stack-ms': 4000,
    },
    icon: 'items/boots/gravewalker-boots.png',
    description: 'Each fallen foe lends a little of its lingering haste — and the more that fall, the harder it becomes to hold you down.',
    upgrades: [
      { stats: { speed: 8 },  cost: { purple: 40 },  requiredBiomeLevel: 4 },
      { stats: { speed: 12 }, cost: { purple: 80 },  requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { purple: 132 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { purple: 132 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { purple: 132 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['relic-haunted-prism', {
    id: 'relic-haunted-prism', name: 'Haunted Prism',
    recipeGroup: 'graveyard', requiredBiomeLevel: 6, slot: 'relic',
    lineageId: 'relic-haunted-prism',
    cost: { purple: 240 }, catalystCost: { fortified: 4 },
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
