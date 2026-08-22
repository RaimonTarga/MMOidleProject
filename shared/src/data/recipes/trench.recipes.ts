import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// Graveyard (T4) — extreme-high-density undead swarm biome (renamed from
// necropolis). Only the mobility (boot) line is authored so far: its on-kill
// stacking speed + tenacity ramp is live in the combat engine and suits the
// dense pack-clearing identity. Armor / weapon / charm / new-mechanic mobs
// remain DEFERRED. Essence: purple (necrotic). Values are untuned placeholders.

export const trenchRecipeEntries = [
  ['trench-abyssal-axe', {
    id: 'trench-abyssal-axe', name: 'Abyssal Axe',
    recipeGroup: 'trench', requiredBiomeLevel: 1, slot: 'weapon',
    // ⚠ INHERITED (Cave sustained-DPS axe branch) — base attack carried from doc.
    //   VERIFY in dead-swing/execute budget pass.
    // INVARIANT: dead swing must NOT consume class mechanic resources.
    cost: { green: 270 }, stats: { attack: 120 }, attacksPerSecond: 1.15, tier: 4,
    // † execute-threshold-pct / execute-dmg-mult: vs targets below 20% HP, ×2.5.
    mechanicEffects: {
      'weapon.dead-swing-interval': 4,
      'weapon.execute-threshold-pct': 0.20, 'weapon.execute-dmg-mult': 2.5,
    },
    icon: 'items/weapons/abyssal-axe.png',
    description: 'Patient through the long fight, merciless at the end of it: when the abyss-thing finally weakens, it disappears.',
    upgrades: [
      { stats: { attack: 24 }, cost: { green: 405 }, requiredBiomeLevel: 2 },
      { stats: { attack: 24 }, cost: { green: 810 }, requiredBiomeLevel: 3 },
      { stats: { attack: 24 }, cost: { green: 1620 }, requiredBiomeLevel: 4 },
      { stats: { attack: 24 }, cost: { green: 1620 }, requiredBiomeLevel: 4 },
      { stats: { attack: 24 }, cost: { green: 1620 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['trench-vest-t4', {
    id: 'trench-vest-t4', name: 'Deep Sea Carapace',
    recipeGroup: 'trench', requiredBiomeLevel: 2, slot: 'armor',
    // Premium-DR tank profile (Cave inheritor): low HP, high DR.
    cost: { green: 220 }, stats: { maxHp: 90, plating: 24, damageReduction: 0.22 },
    // † sustained-fight-dr-bonus: +1% DR per ~2s of sustained combat, cap +5% at 10s.
    mechanicEffects: {
      'defense.sustained-fight-dr-bonus': 0.01, 'defense.sustained-fight-dr-max': 0.05, 'defense.sustained-fight-ramptime-ms': 10000,
    },
    tier: 4,
    icon: 'items/armor/deep-sea-carapace.png',
    description: 'Pressure-forged over an age in the dark; the longer the fight, the more of the deep\'s weight it turns against your foe.',
    upgrades: [
      { stats: { maxHp: 22, plating: 6, damageReduction: 0.02 }, cost: { green: 200 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 22, plating: 6, damageReduction: 0.02 }, cost: { green: 400 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 22, plating: 6, damageReduction: 0.02 }, cost: { green: 700 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 22, plating: 6, damageReduction: 0.02 }, cost: { green: 700 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 22, plating: 6, damageReduction: 0.02 }, cost: { green: 700 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['trench-charm-t4', {
    id: 'trench-charm-t4', name: 'Pressure Vessel',
    recipeGroup: 'trench', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 150 }, stats: { recovery: 16 },
    mechanicEffects: {
      'defense.absorb-pct': 0.16,
      'defense.recovery-pulse-pct': 0.10, 'defense.recovery-pulse-interval-ms': 8000,
    },
    tier: 4,
    icon: 'items/charms/pressure-vessel.png',
    description: 'Built to hold against a crushing deep — it softens the one enormous blow and breathes life back on a slow count.',
    upgrades: [
      { mechanicEffects: { 'defense.absorb-pct': 0.03, 'defense.recovery-pulse-pct': 0.02 }, cost: { green: 100 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.absorb-pct': 0.03, 'defense.recovery-pulse-pct': 0.02 }, cost: { green: 200 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.absorb-pct': 0.03, 'defense.recovery-pulse-pct': 0.02 }, cost: { green: 330 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.absorb-pct': 0.03, 'defense.recovery-pulse-pct': 0.02 }, cost: { green: 330 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.absorb-pct': 0.03, 'defense.recovery-pulse-pct': 0.02 }, cost: { green: 330 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['trench-boots-t4-stalkers', {
    id: 'trench-boots-t4-stalkers', name: 'Abyssal Stalkers',
    recipeGroup: 'trench', requiredBiomeLevel: 4, slot: 'mobility',
    // Cave stealth-boot inheritor — soft stealth: reduces enemy detection radius.
    cost: { green: 80 }, stats: { speed: 52 }, tier: 4,
    mechanicEffects: { 'mobility.stealth-pct': 0.72 },
    icon: 'items/boots/abyssal-stalkers.png',
    description: 'They take you past the great blind hunters unseen — and lend the first strike, when it comes, a killing edge.',
    upgrades: [
      { stats: { speed: 6 }, cost: { green: 40 },  requiredBiomeLevel: 4 },
      { stats: { speed: 6 }, cost: { green: 80 },  requiredBiomeLevel: 4 },
      { stats: { speed: 6 }, cost: { green: 132 }, requiredBiomeLevel: 4 },
      { stats: { speed: 6 }, cost: { green: 132 }, requiredBiomeLevel: 4 },
      { stats: { speed: 6 }, cost: { green: 132 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['trench-boots-t4-treaders', {
    id: 'trench-boots-t4-treaders', name: 'Abyssal Treaders',
    recipeGroup: 'trench', requiredBiomeLevel: 4, slot: 'mobility',
    // † tenacity-pct: flat, always-on CC duration reduction (distinct from
    //   Graveyard's kill-stack tenacity). Suits the Trench's slow heavy hitters.
    cost: { green: 80 }, stats: { speed: 48 }, tier: 4,
    mechanicEffects: { 'mobility.tenacity-pct': 0.55 },
    icon: 'items/boots/abyssal-treaders.png',
    description: 'Ballasted for the deep — slows and snares and stuns wash over them and recede twice as fast.',
    upgrades: [
      { stats: { speed: 5 }, cost: { green: 40 },  requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 80 },  requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 132 }, requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 132 }, requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 132 }, requiredBiomeLevel: 4 },
    ],
  }],


] satisfies [string, Recipe][];
