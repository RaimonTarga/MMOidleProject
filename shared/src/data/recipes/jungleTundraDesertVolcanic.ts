import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// NEW Jungle-T2 + Desert-T2 entries (advanced biomes that DEBUT at global T2;
// they have no T1 line by design). These REPLACE the outdated jungle/desert
// entries in jungleTundraDesertVolcanicRecipeEntries. Tundra + Volcanic now have
// mobility (boot) entries — their boot mechanics are live in the combat engine;
// their armor/weapon/charm lines remain DEFERRED.
//
// ⚠ ENGINE-GATED: these carry NEW mechanics not yet in the combat engine, so the
//   items are a SPEC that must be implemented before they function:
//     jungle: 'defense.hardening-*' (ramping plating)
//     desert: 'defense.cleanse-empty-heal-pct'
//
// ✓ IMPLEMENTED: 'defense.cheat-death', 'defense.ramp-regen-*', 'weapon.first-strike-mult'.
//
// ⚠ OPEN DECISION (shipped as proposal — overrule freely):
//   • hardening ramp: +2 plating/sec, cap +16, resets when a hit exceeds 25% maxHP.
//
// Budget: same equal-budget spine as the starters (T2 = 68 HP-equiv pts), but these
// armors are RICHER (two mechanics each) per the "advanced biomes carry more" rule.
// Costs / requiredBiomeLevel are placeholders carried from the old file (economy = later).

export const jungleTundraDesertVolcanicRecipeEntries = [
  // ── Jungle (HIGH density) — on-hit rapier / hardening+evasion armor / ramp-regen charm ──
  ['jungle-stinger-rapier', {
    id: 'jungle-stinger-rapier', name: 'Stinger Rapier',
    recipeGroup: 'jungle', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 48, yellow: 12 }, stats: { attack: 12, onHitDamage: 8 }, attacksPerSecond: 1.55, tier: 2,
    mechanicEffects: {},
    icon: 'items/weapons/rapier-3.png',
    description: 'A thin blade kept slick with something the jungle distilled and never named.',
    upgrades: [
      { stats: { attack: 5, onHitDamage: 3 }, cost: { green: 22 }, requiredBiomeLevel: 2 },
      { stats: { attack: 5, onHitDamage: 3 }, cost: { green: 48 }, requiredBiomeLevel: 3 },
      { stats: { attack: 5, onHitDamage: 3 }, cost: { green: 85 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['jungle-vest-t2', {
    id: 'jungle-vest-t2', name: 'Verdant Hardplate',
    recipeGroup: 'jungle', requiredBiomeLevel: 3, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { maxHp: 44, plating: 6, evasion: 0.15 },
    mechanicEffects: {
      'defense.hardening-per-sec': 2,    // +2 plating per second in sustained combat
      'defense.hardening-max': 16,       // up to +16 plating on top of base
      'defense.hardening-reset-pct': 0.25, // resets to base when a hit exceeds 25% maxHP
    },
    tier: 2,
    icon: 'items/armor/leater-armor-2.png',
    description: 'Living bark coaxed into armor, still growing slowly against the skin.',
    upgrades: [
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 22 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 48 }, requiredBiomeLevel: 5 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.04 }, cost: { green: 85 }, requiredBiomeLevel: 6 },
    ],
  }],

  ['jungle-charm-t2', {
    id: 'jungle-charm-t2', name: 'Canopy Heart',
    recipeGroup: 'jungle', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { green: 38, yellow: 10 }, stats: { hpRegen: 6 },
    mechanicEffects: {
      'defense.ramp-regen-start-pct': 0.05,   // in-combat regen begins at 5% of regen rate
      'defense.ramp-regen-max-pct': 0.30,      // ramps to 30% over the ramp window
      'defense.ramp-regen-ramptime-ms': 10000, // full ramp after 10s of sustained combat
    },
    tier: 2,
    icon: 'items/charms/wood-charm-2.png',
    description: 'A knot of ancient vine that wakes, slowly, to the rhythm of a long fight.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { green: 18 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 2 }, cost: { green: 38 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { green: 68 }, requiredBiomeLevel: 5 },
    ],
  }],

  ['jungle-boots-t2', {
    id: 'jungle-boots-t2', name: 'Vine Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 1, slot: 'mobility',
    cost: { green: 18 }, stats: { speed: 22 }, tier: 2,
    mechanicEffects: { 'mobility.aggro-pull-pct': 0.50 },
    icon: 'items/boots/plate-boots-3.png',
    description: 'Springy growth lashed to the feet, always eager to be running.',
    upgrades: [
      { stats: { speed: 5 }, cost: { green: 10 }, requiredBiomeLevel: 2 },
      { stats: { speed: 7 }, cost: { green: 20 }, requiredBiomeLevel: 3 },
      { stats: { speed: 9 }, cost: { green: 36 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── Desert (LOW density, "the standoff") — ambush weapon / last-stand+cleanse armor / cleanse-or-burst charm ──
  ['desert-sunsteel-cross', {
    id: 'desert-sunsteel-cross', name: 'Sunsteel Cross',
    recipeGroup: 'desert', requiredBiomeLevel: 4, slot: 'weapon',
    cost: { yellow: 70 }, stats: { attack: 14 }, attacksPerSecond: 0.70, tier: 2,
    mechanicEffects: { 'weapon.first-strike-mult': 2.0 }, // first hit on a fresh monster entity deals 2x
    icon: 'items/weapons/sword-3.png',
    description: 'Sun-forged and ward-etched, it strikes the first blow as if it waited years for it.',
    upgrades: [
      { stats: { attack: 6 }, cost: { yellow: 34 }, requiredBiomeLevel: 5 },
      { stats: { attack: 6 }, cost: { yellow: 70 }, requiredBiomeLevel: 6 },
      { stats: { attack: 6 }, cost: { yellow: 115 }, requiredBiomeLevel: 7 },
    ],
  }],

  ['desert-vest-t2', {
    id: 'desert-vest-t2', name: 'Duneplate of the Last Stand',
    recipeGroup: 'desert', requiredBiomeLevel: 3, slot: 'armor',
    cost: { yellow: 70 }, stats: { maxHp: 44, plating: 10 },
    mechanicEffects: {
      'defense.cheat-death': 1,
      'defense.cleanse-stacks': 1,
      'defense.cleanse-interval-ms': 8000,
    },
    tier: 2,
    icon: 'items/armor/plate-armor-5.png',
    description: 'Plate of the standfast dead, who are said to have refused to fall even once.',
    upgrades: [
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 34 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 70 }, requiredBiomeLevel: 5 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 115 }, requiredBiomeLevel: 6 },
    ],
  }],

  ['desert-charm-t2', {
    id: 'desert-charm-t2', name: 'Mirage Core',
    recipeGroup: 'desert', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { yellow: 58 }, stats: { hpRegen: 6 },
    mechanicEffects: {
      'defense.cleanse-stacks': 1,
      'defense.cleanse-interval-ms': 6000,
      'defense.cleanse-empty-heal-pct': 0.06, // when nothing to cleanse, heal 6% maxHP instead
    },
    tier: 2,
    icon: 'items/charms/tear-charm-1.png',
    description: 'A shard of cooled glass that shows you water which is not there, and mends what is.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { yellow: 28 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 2 }, cost: { yellow: 58 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { yellow: 96 }, requiredBiomeLevel: 5 },
    ],
  }],

  ['desert-boots-t2', {
    id: 'desert-boots-t2', name: 'Sand Sprint',
    recipeGroup: 'desert', requiredBiomeLevel: 1, slot: 'mobility',
    cost: { yellow: 58 }, stats: { speed: 58 }, tier: 2,
    mechanicEffects: { 'mobility.kite-speed-pct': 0.40 },
    icon: 'items/boots/mage-boots-1.png',
    description: 'Wide and light, made to outpace a storm across open dune.',
    upgrades: [
      { stats: { speed: 8 },  cost: { yellow: 28 }, requiredBiomeLevel: 2 },
      { stats: { speed: 12 }, cost: { yellow: 58 }, requiredBiomeLevel: 3 },
      { stats: { speed: 16 }, cost: { yellow: 96 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── Tundra (T3) — continuous-move ramp boots (mobility engine now live) ──
  ['tundra-boots-t3', {
    id: 'tundra-boots-t3', name: 'Glacier Striders',
    recipeGroup: 'tundra', requiredBiomeLevel: 1, slot: 'mobility',
    cost: { blue: 60 }, stats: { speed: 30 }, tier: 3,
    // ramp: +0.30 speed/sec while moving, capped at +60% (reached after ~2s). Untuned placeholder.
    mechanicEffects: { 'mobility.ramp-speed-pct': 0.60, 'mobility.ramp-rate': 0.30 },
    icon: 'items/boots/plate-boots-4.png',
    description: 'They gather momentum across the ice and are loath to give it back.',
    upgrades: [
      { stats: { speed: 8 },  cost: { blue: 30 },  requiredBiomeLevel: 2 },
      { stats: { speed: 12 }, cost: { blue: 60 },  requiredBiomeLevel: 3 },
      { stats: { speed: 16 }, cost: { blue: 100 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── Volcanic (T3) — high passive speed, suppressed for 4s on a direct hit ──
  ['volcanic-boots-t3', {
    id: 'volcanic-boots-t3', name: 'Magma Walkers',
    recipeGroup: 'volcanic', requiredBiomeLevel: 1, slot: 'mobility',
    cost: { red: 62 }, stats: { speed: 36 }, tier: 3,
    // +55% passive move speed; a direct hit suppresses it for 4s. Untuned placeholder.
    mechanicEffects: { 'mobility.passive-speed-pct': 0.55, 'mobility.suppress-ms': 4000 },
    icon: 'items/boots/plate-boots-5.png',
    description: 'Quick as a thrown spark — until a solid blow knocks the wind from them.',
    upgrades: [
      { stats: { speed: 8 },  cost: { red: 30 },  requiredBiomeLevel: 2 },
      { stats: { speed: 12 }, cost: { red: 62 },  requiredBiomeLevel: 3 },
      { stats: { speed: 16 }, cost: { red: 104 }, requiredBiomeLevel: 4 },
    ],
  }],
] satisfies [string, Recipe][];