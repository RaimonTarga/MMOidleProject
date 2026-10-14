import type { Recipe } from './types';

// TUNDRA (debuts T3). Identity: stationary-ramp DR armor / brittle weapon /
// barrier + absorb charm. Charm rework: upgrades ramp BOTH mechanics, recovery flat
// (see mountain.recipes.ts header).
// Tundra owns the FROST DoT weapon line: Rimebrand (T3) → Glacial Rimebrand (T4).
// What moved from Swamp was the DESIGN SLOT for a second DoT flavour, not an item
// chain: Swamp's own POISON DoT line is fully intact and continues inside Swamp
// (ashbrand-blade → swamp-mirebrand → swamp-blightbrand, all `element: 'poison'`).
// Rimebrand is a genuinely NEW T3 item with no predecessor. See item-identity-audit.md.
//
// T3 economy pass (2026-08-30): all five T3 items are new-item priced into their slot
// bands (Tundra debuts at T3, so nothing here has a predecessor); the flat
// +3/+4/+5 plateau is replaced by the shipped accelerating curve; catalysts move off
// the base craft to +4/+5.

export const tundraRecipeEntries = [

  ['tundra-permafrost-maul', {
    id: 'tundra-permafrost-maul', name: 'Permafrost Maul',
    recipeGroup: 'tundra', requiredBiomeLevel: 1, slot: 'weapon',
    // 2026-09-26 T2-T4 weapon normalization: Attack 120->98 (+5: 270->162).
    cost: { blue: 124 }, stats: { attack: 162 }, attacksPerSecond: 0.50, tier: 3, // family-tag: slow heavy maul → Heavy
    mechanicEffects: { 'weapon.brittle-plating': 2, 'weapon.brittle-dr': 0.01, 'weapon.brittle-stacks': 8 },
    icon: 'items/weapons/permafrost-maul.png',
    element: 'frost',   // cosmetic attack tint only
    description: 'Each blow leaves a deep frost-crack; armor that takes enough of them simply gives.',
  }],

  // Frost DoT weapon — relocated from Swamp (was `swamp-rimebrand`). The slow,
  // heavy chill-brand: converts more of each blow into a lingering frost DoT.
  // Evolves toward Glacial Rimebrand at T4. Numbers are placeholders (balance pass).
  ['tundra-rimebrand', {
    id: 'tundra-rimebrand', name: 'Rimebrand',
    recipeGroup: 'tundra', requiredBiomeLevel: 3, slot: 'weapon',
    // 2026-09-26 T2-T4 weapon normalization: Attack 96->84 (+5: 216->132).
    cost: { blue: 120 }, stats: { attack: 132 }, attacksPerSecond: 0.60, tier: 3, // family-tag: frost DoT-conversion weapon → Fortified
    weaponDot: { effectId: 'tundra-rimebrand-burn', convPct: 0.70, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'frost' },
    icon: 'items/weapons/rimebrand.png',
    description: 'The first true frost-brand — slow and heavy, planting a cold in the wound that goes on biting after the blade is gone.',
  }],

  ['tundra-vest-t3', {
    id: 'tundra-vest-t3', name: 'Glacial Bulwark',
    recipeGroup: 'tundra', requiredBiomeLevel: 2, slot: 'armor',
    cost: { blue: 100, red: 25 }, stats: { "maxHp": 270, "plating": 3, "damageReduction": 0.14 }, // family-tag: stationary DR armor → Heavy
    mechanicEffects: {"defense.stationary-dr-pct": 0.12, "defense.stationary-dr-ramptime-ms": 4000},
    tier: 3,
    icon: 'items/armor/glacial-bulwark.png',
    description: "Build damage reduction over 4 seconds while holding position under attack. Moving sheds it over 1 second; once the attacks stop it fades over 2 seconds.",
  }],

  // Charm: recovery flat; upgrades ramp barrier 0.12 -> 0.18 AND absorb 0.08 -> 0.14.
  ['tundra-charm-t3', {
    id: 'tundra-charm-t3', name: 'Frostward Charm',
    recipeGroup: 'tundra', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { blue: 75, purple: 25 }, stats: { "recovery": 68.3 }, // family-tag: barrier charm (anti-spike) → Heavy
    mechanicEffects: { "defense.barrier-pct": 0.28, "defense.barrier-stationary-recharge-pct": 0.02, "guard.barrier-refill-on-control-pct": 0.5 },
    tier: 3,
    icon: 'items/charms/frostward-charm.png',
    description: 'A rime-cold ward that thickens while you hold your ground, and shatters back into place when you break free.',
  }],

  ['tundra-boots-t3', {
    id: 'tundra-boots-t3', name: 'Glacier Striders',
    recipeGroup: 'tundra', requiredBiomeLevel: 4, slot: 'mobility',
    // 2026-09-26 T2-T4 boots curve normalization: Speed 30->68 (+5: 98->88).
    cost: { blue: 80 }, stats: { "speed": 88 }, tier: 3, // family-tag: tundra momentum mobility → Heavy
    mechanicEffects: { 'mobility.ramp-speed-pct': 0.60, 'mobility.ramp-rate': 0.30 },
    icon: 'items/boots/glacier-striders.png',
    description: 'They gather momentum across the ice and are loath to give it back.',
  }],

  // T4
  // T4 economy pass (2026-08-30): each item now EVOLVES from its T3 predecessor at
  // +5 (T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §3.1 — Tundra's two weapons
  // were investigated as a possible branch and rejected: Permafrost Maul (brittle)
  // and Rimebrand (frost DoT) are mechanically distinct T3 items with distinct T4
  // heirs, not one parent with two children). Costs are 2.00× the finalized T3
  // lifetime total on the shipped accelerating curve.
  ['tundra-glacial-tyrant-maul', {
    id: 'tundra-glacial-tyrant-maul', name: 'Glacial Tyrant Maul',
    recipeGroup: 'tundra', requiredBiomeLevel: 7, slot: 'weapon',
    // 2026-09-26 T2-T4 weapon normalization: Attack 200->204 (+5: 450->378).
    cost: { blue: 273 }, stats: { attack: 378 }, attacksPerSecond: 0.50, tier: 4, // family-tag: capstone heavy maul → Heavy
    // † brittle-shatter-threshold: at max brittle stacks (8), strip the target's
    //   DR for 2s (brittle-shatter-dr-strip-ms). (new key)
    mechanicEffects: {
      'weapon.brittle-plating': 3, 'weapon.brittle-dr': 0.015, 'weapon.brittle-stacks': 8,
      'weapon.brittle-shatter-threshold': 8, 'weapon.brittle-shatter-dr-strip-ms': 2000,
    },
    icon: 'items/weapons/glacial-tyrant-maul.png',
    element: 'frost',   // cosmetic attack tint only
    description: 'Every blow leaves a deeper frost-crack; the eighth simply ends the argument about whether armor holds.',
  }],

  ['tundra-glacial-rimebrand', {
    id: 'tundra-glacial-rimebrand', name: 'Glacial Rimebrand',
    recipeGroup: 'tundra', requiredBiomeLevel: 7, slot: 'weapon',
    // Evolves from Rimebrand (T3), Tundra's own genuinely-new frost-DoT weapon
    // line (no Swamp predecessor — see the file header). Base attack and mechanic
    // identity (`weaponDot`, convPct 0.70) are carried forward from the T3 item.
    // 2026-09-26 T2-T4 weapon normalization: Attack 155->165 (+5: 330->310).
    cost: { blue: 258 }, stats: { attack: 310 }, attacksPerSecond: 0.60, tier: 4, // family-tag: frost DoT-conversion weapon → Fortified
    // 2026-09-28 T4 outlier pass: convPct 0.70 -> 0.60. It was the best T4 weapon for most specs (its
    // plating-free conversion) and, with Detonate, every class's damage ceiling (1.2-1.38x).
    weaponDot: { effectId: 'rimebrand-burn', convPct: 0.60, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'frost' },
    icon: 'items/weapons/glacial-rimebrand.png',
    description: 'It does not cut so much as plant a cold that goes on spreading after the blade is gone.',
  }],

  ['tundra-vest-t4', {
    id: 'tundra-vest-t4', name: 'Permafrost Sovereign',
    recipeGroup: 'tundra', requiredBiomeLevel: 8, slot: 'armor',
    cost: { blue: 256, red: 64 }, stats: { "maxHp": 519, "plating": 5, "damageReduction": 0.18 }, // family-tag: stationary DR armor → Heavy
    mechanicEffects: {"defense.stationary-dr-pct": 0.16, "defense.stationary-dr-ramptime-ms": 4000},
    tier: 4,
    icon: 'items/armor/permafrost-sovereign.png',
    description: "Build damage reduction over 4 seconds while holding position under attack. Moving sheds it over 1 second; once the attacks stop it fades over 2 seconds.",
  }],

  ['tundra-charm-t4', {
    id: 'tundra-charm-t4', name: 'Glacial Ward',
    recipeGroup: 'tundra', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { blue: 220, purple: 30 }, stats: { "recovery": 168.2 }, // family-tag: barrier charm (anti-spike) → Heavy
    mechanicEffects: { "defense.barrier-pct": 0.37, "defense.barrier-stationary-recharge-pct": 0.025, "guard.barrier-refill-on-control-pct": 1 },
    tier: 4,
    icon: 'items/charms/glacial-ward.png',
    description: 'A glacier in miniature: it never stops growing while you stand, and breaking free raises it whole again.',
  }],

  ['tundra-charm-t4-deepfreeze', {
    id: 'tundra-charm-t4-deepfreeze', name: 'Deepfreeze Ward',
    recipeGroup: 'tundra', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { blue: 220, purple: 30 }, stats: { "recovery": 168.2 }, // family-tag: ramping absorb ward → Heavy
    // † absorb-ramp: absorb starts at 0.04 and climbs to 0.18 over 12s in combat
    //   (weaker early, stronger in long fights). (new keys)
    mechanicEffects: { "defense.absorb-ramp-start-pct": 0.06, "defense.absorb-ramp-max-pct": 0.45, "defense.absorb-ramptime-ms": 12000 },
    tier: 4,
    icon: 'items/charms/deepfreeze-ward.png',
    description: 'The longer the cold has to settle in, the more of the blow it swallows whole.',
  }],

  // T4 boots — ramp-speed (momentum builds while moving). T3 0.60/0.30 → T4 0.75/0.35.
  ['tundra-boots-t4', {
    id: 'tundra-boots-t4', name: 'Avalanche Striders',
    recipeGroup: 'tundra', requiredBiomeLevel: 10, slot: 'mobility',
    // 2026-09-26 T2-T4 boots curve normalization: Speed 42->97 (+5: 120->118).
    cost: { blue: 176 }, stats: { "speed": 118 }, tier: 4, // family-tag: tundra momentum mobility → Heavy
    mechanicEffects: { 'mobility.ramp-speed-pct': 0.75, 'mobility.ramp-rate': 0.35 },
    icon: 'items/boots/avalanche-striders.png',
    description: 'Slow to start and impossible to stop — by the far end of the ice you are a thing that simply happens to whatever is in the way.',
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Tundra owns MOVEMENT — its boot
  // ramps speed over sustained travel, so it is where the spacing core comes from.

  // T3 premium ranged — Scout: reliable uptime instead of peak damage. Where
  // Sniper wants the fight to never reach it, Scout assumes it will and keeps
  // moving. L6 and 1,200 blue / 5 Heavy make this a late debut-biome capstone.
  ['core-scout', {
    id: 'core-scout', name: 'Scout Core',
    recipeGroup: 'tundra', requiredBiomeLevel: 6, slot: 'core', coreEligibility: 'ranged',
    lineageId: 'core-scout',
    cost: { blue: 1200 }, // Alacrity is BANNED in Tundra; its native family is Heavy
    stats: {}, tier: 3,
    // The cooldown clause is INERT without an ability tagged `mobility` (today:
    // Charge); the damage and movement halves are always on.
    mechanicEffects: {"core.damage-dealt-pct": 0.18, "core.speed-mult": 0.25, "core.mobility-cooldown-reduction-pct": 0.25},
    icon: 'items/cores/scout.png',
    description: "Amplifies movement and mobility abilities, with a modest damage bonus.",
  }],

] satisfies [string, Recipe][];
