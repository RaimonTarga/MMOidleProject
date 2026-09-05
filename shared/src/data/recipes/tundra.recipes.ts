import type { Recipe } from './types';

// TUNDRA (debuts T3). Identity: stationary-ramp DR + cap armor / brittle weapon /
// barrier + absorb charm. Charm rework: upgrades ramp BOTH mechanics, recovery flat
// (see mountain.recipes.ts header).
// Tundra owns the FROST DoT weapon line: Rimebrand (T3) → Glacial Rimebrand (T4).
// What moved from Swamp was the DESIGN SLOT for a second DoT flavour, not an item
// chain: Swamp's own POISON DoT line is fully intact and continues inside Swamp
// (ashbrand-blade → swamp-mirebrand → swamp-blightbrand, all `element: 'poison'`).
// Rimebrand is a genuinely NEW T3 item with no predecessor. See item-identity-audit.md.
//
// T3 economy pass (2026-08-30): all five T3 items are new-item priced into their slot
// bands (Tundra debuts at T3, so nothing here carries `evolvesFrom`); the flat
// +3/+4/+5 plateau is replaced by the shipped accelerating curve; catalysts move off
// the base craft to +4/+5.

export const tundraRecipeEntries = [

  ['tundra-permafrost-maul', {
    id: 'tundra-permafrost-maul', name: 'Permafrost Maul',
    recipeGroup: 'tundra', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 124 }, stats: { attack: 120 }, attacksPerSecond: 0.50, tier: 3, // family-tag: slow heavy maul → Heavy
    mechanicEffects: { 'weapon.brittle-plating': 2, 'weapon.brittle-dr': 0.01, 'weapon.brittle-stacks': 8 },
    icon: 'items/weapons/permafrost-maul.png',
    description: 'Each blow leaves a deep frost-crack; armor that takes enough of them simply gives.',
    upgrades: [
      { stats: { attack: 30 }, cost: { blue: 93 },  requiredBiomeLevel: 2 },
      { stats: { attack: 30 }, cost: { blue: 233 }, requiredBiomeLevel: 3 },
      { stats: { attack: 30 }, cost: { blue: 372 }, requiredBiomeLevel: 4 },
      { stats: { attack: 30 }, cost: { blue: 605 }, catalystCost: { heavy: 2 }, requiredBiomeLevel: 4 },
      { stats: { attack: 30 }, cost: { blue: 1023 }, catalystCost: { heavy: 3 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Frost DoT weapon — relocated from Swamp (was `swamp-rimebrand`). The slow,
  // heavy chill-brand: converts more of each blow into a lingering frost DoT.
  // Evolves toward Glacial Rimebrand at T4. Numbers are placeholders (balance pass).
  ['tundra-rimebrand', {
    id: 'tundra-rimebrand', name: 'Rimebrand',
    recipeGroup: 'tundra', requiredBiomeLevel: 3, slot: 'weapon',
    cost: { blue: 120 }, stats: { attack: 96 }, attacksPerSecond: 0.60, tier: 3, // family-tag: frost DoT-conversion weapon → Fortified
    weaponDot: { effectId: 'tundra-rimebrand-burn', convPct: 0.70, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'frost' },
    icon: 'items/weapons/rimebrand.png',
    description: 'The first true frost-brand — slow and heavy, planting a cold in the wound that goes on biting after the blade is gone.',
    upgrades: [
      { stats: { attack: 24 }, cost: { blue: 93 }, requiredBiomeLevel: 3 },
      { stats: { attack: 24 }, cost: { blue: 232 }, requiredBiomeLevel: 4 },
      { stats: { attack: 24 }, cost: { blue: 372 }, requiredBiomeLevel: 4 },
      { stats: { attack: 24 }, cost: { blue: 604 }, catalystCost: { fortified: 2 }, requiredBiomeLevel: 4 },
      { stats: { attack: 24 }, cost: { blue: 1023 }, catalystCost: { fortified: 3 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['tundra-vest-t3', {
    id: 'tundra-vest-t3', name: 'Glacial Bulwark',
    recipeGroup: 'tundra', requiredBiomeLevel: 2, slot: 'armor',
    cost: { blue: 100, red: 25 }, stats: { maxHp: 100, plating: 15 }, // family-tag: DR + damage-cap armor → Heavy
    mechanicEffects: {
      'defense.stationary-dr-pct': 0.15, 'defense.stationary-dr-ramptime-ms': 6000,
      'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5,
    },
    tier: 3,
    icon: 'items/armor/glacial-bulwark.png',
    description: 'Stand still and the ice creeps over the plate, until you are part of the glacier itself.',
    upgrades: [
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 66, red: 17 },  requiredBiomeLevel: 3 },
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 166, red: 42 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 266, red: 66 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 432, red: 108 }, catalystCost: { heavy: 2 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 730, red: 182 }, catalystCost: { heavy: 3 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: recovery flat; upgrades ramp barrier 0.12 -> 0.18 AND absorb 0.08 -> 0.14.
  ['tundra-charm-t3', {
    id: 'tundra-charm-t3', name: 'Frostward Charm',
    recipeGroup: 'tundra', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { blue: 75, purple: 25 }, stats: { recovery: 11 }, // family-tag: barrier charm (anti-spike) → Heavy
    mechanicEffects: {
      'defense.barrier-pct': 0.12,
      'defense.absorb-pct': 0.08,
    },
    tier: 3,
    icon: 'items/charms/frostward-charm.png',
    description: 'A rime-cold ward that throws up a sheet of ice, and drinks the blows that get through.',
    upgrades: [
      { mechanicEffects: { 'defense.barrier-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 28, purple: 10 },  requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.barrier-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 71, purple: 24 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.barrier-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 114, purple: 38 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.barrier-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 185, purple: 62 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.barrier-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 314, purple: 104 }, catalystCost: { heavy: 2 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['tundra-boots-t3', {
    id: 'tundra-boots-t3', name: 'Glacier Striders',
    recipeGroup: 'tundra', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { blue: 80 }, stats: { speed: 30 }, tier: 3, // family-tag: tundra momentum mobility → Heavy
    mechanicEffects: { 'mobility.ramp-speed-pct': 0.60, 'mobility.ramp-rate': 0.30 },
    icon: 'items/boots/glacier-striders.png',
    description: 'They gather momentum across the ice and are loath to give it back.',
    upgrades: [
      { stats: { speed: 8 },  cost: { blue: 24 },  requiredBiomeLevel: 4 },
      { stats: { speed: 12 }, cost: { blue: 59 },  requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { blue: 94 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { blue: 153 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { blue: 260 }, catalystCost: { heavy: 2 }, requiredBiomeLevel: 4 },
    ],
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
    evolvesFrom: 'tundra-permafrost-maul',
    cost: { blue: 273 }, stats: { attack: 200 }, attacksPerSecond: 0.50, tier: 4, // family-tag: capstone heavy maul → Heavy
    reconstructCost: { blue: 956 }, reconstructCatalystCost: { heavy: 4 },
    // † brittle-shatter-threshold: at max brittle stacks (8), strip the target's
    //   DR for 2s (brittle-shatter-dr-strip-ms). (new key)
    mechanicEffects: {
      'weapon.brittle-plating': 3, 'weapon.brittle-dr': 0.015, 'weapon.brittle-stacks': 8,
      'weapon.brittle-shatter-threshold': 8, 'weapon.brittle-shatter-dr-strip-ms': 2000,
    },
    icon: 'items/weapons/glacial-tyrant-maul.png',
    description: 'Every blow leaves a deeper frost-crack; the eighth simply ends the argument about whether armor holds.',
    upgrades: [
      { stats: { attack: 50 }, cost: { blue: 185 },  requiredBiomeLevel: 8 },
      { stats: { attack: 50 }, cost: { blue: 463 },  requiredBiomeLevel: 9 },
      { stats: { attack: 50 }, cost: { blue: 740 }, requiredBiomeLevel: 10 },
      { stats: { attack: 50 }, cost: { blue: 1203 }, catalystCost: { heavy: 3 }, requiredBiomeLevel: 10 },
      { stats: { attack: 50 }, cost: { blue: 2036 }, catalystCost: { heavy: 4 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['tundra-glacial-rimebrand', {
    id: 'tundra-glacial-rimebrand', name: 'Glacial Rimebrand',
    recipeGroup: 'tundra', requiredBiomeLevel: 7, slot: 'weapon',
    evolvesFrom: 'tundra-rimebrand',
    // Evolves from Rimebrand (T3), Tundra's own genuinely-new frost-DoT weapon
    // line (no Swamp predecessor — see the file header). Base attack and mechanic
    // identity (`weaponDot`, convPct 0.70) are carried forward from the T3 item.
    cost: { blue: 258 }, stats: { attack: 155 }, attacksPerSecond: 0.60, tier: 4, // family-tag: frost DoT-conversion weapon → Fortified
    reconstructCost: { blue: 903 }, reconstructCatalystCost: { fortified: 4 },
    weaponDot: { effectId: 'rimebrand-burn', convPct: 0.70, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'frost' },
    icon: 'items/weapons/glacial-rimebrand.png',
    description: 'It does not cut so much as plant a cold that goes on spreading after the blade is gone.',
    upgrades: [
      { stats: { attack: 35 }, cost: { blue: 185 },  requiredBiomeLevel: 8 },
      { stats: { attack: 35 }, cost: { blue: 463 },  requiredBiomeLevel: 9 },
      { stats: { attack: 35 }, cost: { blue: 741 }, requiredBiomeLevel: 10 },
      { stats: { attack: 35 }, cost: { blue: 1204 }, catalystCost: { fortified: 3 }, requiredBiomeLevel: 10 },
      { stats: { attack: 35 }, cost: { blue: 2037 }, catalystCost: { fortified: 4 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['tundra-vest-t4', {
    id: 'tundra-vest-t4', name: 'Permafrost Sovereign',
    recipeGroup: 'tundra', requiredBiomeLevel: 8, slot: 'armor',
    evolvesFrom: 'tundra-vest-t3',
    cost: { blue: 256, red: 64 }, stats: { maxHp: 180, plating: 28 }, // family-tag: DR + damage-cap armor → Heavy
    reconstructCost: { blue: 896, red: 224 }, reconstructCatalystCost: { heavy: 4 },
    mechanicEffects: {
      'defense.stationary-dr-pct': 0.20, 'defense.stationary-dr-ramptime-ms': 5000,
      'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5,
    },
    tier: 4,
    icon: 'items/armor/permafrost-sovereign.png',
    description: 'Hold your ground and the glacier claims you for its own — and nothing moves a glacier.',
    upgrades: [
      { stats: { maxHp: 42, plating: 7 }, cost: { blue: 130, red: 33 },  requiredBiomeLevel: 9 },
      { stats: { maxHp: 42, plating: 7 }, cost: { blue: 326, red: 82 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 42, plating: 7 }, cost: { blue: 522, red: 131 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 42, plating: 7 }, cost: { blue: 849, red: 212 }, catalystCost: { heavy: 3 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 42, plating: 7 }, cost: { blue: 1436, red: 359 }, catalystCost: { heavy: 4 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['tundra-charm-t4', {
    id: 'tundra-charm-t4', name: 'Glacial Ward',
    recipeGroup: 'tundra', requiredBiomeLevel: 9, slot: 'recovery',
    evolvesFrom: 'tundra-charm-t3',
    cost: { blue: 220, purple: 30 }, stats: { recovery: 16 }, // family-tag: barrier charm (anti-spike) → Heavy
    reconstructCost: { blue: 770, purple: 105 }, reconstructCatalystCost: { heavy: 4 },
    mechanicEffects: {
      'defense.barrier-pct': 0.17,
      'defense.absorb-pct': 0.12,
    },
    tier: 4,
    icon: 'items/charms/glacial-ward.png',
    description: 'A sheet of ice thrown up against the blow, and a slow cold that drinks whatever slips past it.',
    upgrades: [
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-pct': 0.03 }, cost: { blue: 65, purple: 9 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-pct': 0.03 }, cost: { blue: 163, purple: 22 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-pct': 0.03 }, cost: { blue: 260, purple: 36 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-pct': 0.03 }, cost: { blue: 423, purple: 58 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-pct': 0.03 }, cost: { blue: 716, purple: 98 }, catalystCost: { heavy: 3 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['tundra-charm-t4-deepfreeze', {
    id: 'tundra-charm-t4-deepfreeze', name: 'Deepfreeze Ward',
    recipeGroup: 'tundra', requiredBiomeLevel: 9, slot: 'recovery',
    evolvesFrom: 'tundra-charm-t3',
    cost: { blue: 220, purple: 30 }, stats: { recovery: 16 }, // family-tag: barrier + absorb ward → Heavy
    reconstructCost: { blue: 770, purple: 105 }, reconstructCatalystCost: { heavy: 4 },
    // † absorb-ramp: absorb starts at 0.04 and climbs to 0.18 over 12s in combat
    //   (weaker early, stronger in long fights). (new keys)
    mechanicEffects: {
      'defense.barrier-pct': 0.14,
      'defense.absorb-ramp-start-pct': 0.04, 'defense.absorb-ramp-max-pct': 0.18, 'defense.absorb-ramptime-ms': 12000,
    },
    tier: 4,
    icon: 'items/charms/deepfreeze-ward.png',
    description: 'The longer the cold has to settle in, the more of the blow it swallows whole.',
    upgrades: [
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-ramp-max-pct': 0.03 }, cost: { blue: 65, purple: 9 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-ramp-max-pct': 0.03 }, cost: { blue: 163, purple: 22 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-ramp-max-pct': 0.03 }, cost: { blue: 260, purple: 36 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-ramp-max-pct': 0.03 }, cost: { blue: 423, purple: 58 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-ramp-max-pct': 0.03 }, cost: { blue: 716, purple: 98 }, catalystCost: { heavy: 3 }, requiredBiomeLevel: 10 },
    ],
  }],

  // T4 boots — ramp-speed (momentum builds while moving). T3 0.60/0.30 → T4 0.75/0.35.
  ['tundra-boots-t4', {
    id: 'tundra-boots-t4', name: 'Avalanche Striders',
    recipeGroup: 'tundra', requiredBiomeLevel: 10, slot: 'mobility',
    evolvesFrom: 'tundra-boots-t3',
    cost: { blue: 176 }, stats: { speed: 42 }, tier: 4, // family-tag: tundra momentum mobility → Heavy
    reconstructCost: { blue: 616 }, reconstructCatalystCost: { heavy: 4 },
    mechanicEffects: { 'mobility.ramp-speed-pct': 0.75, 'mobility.ramp-rate': 0.35 },
    icon: 'items/boots/avalanche-striders.png',
    description: 'Slow to start and impossible to stop — by the far end of the ice you are a thing that simply happens to whatever is in the way.',
    upgrades: [
      { stats: { speed: 10 }, cost: { blue: 47 },  requiredBiomeLevel: 10 },
      { stats: { speed: 14 }, cost: { blue: 116 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { blue: 186 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { blue: 303 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { blue: 512 }, catalystCost: { heavy: 3 }, requiredBiomeLevel: 10 },
    ],
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
    cost: { blue: 1200 }, catalystCost: { heavy: 5 }, // Alacrity is BANNED in Tundra; its native family is Heavy
    stats: {}, tier: 3,
    // The cooldown clause is INERT without an ability tagged `mobility` (today:
    // Charge); the damage and movement halves are always on.
    mechanicEffects: {
      'core.attack-mult': 0.24, 'core.speed-mult': 0.25,
      'core.mobility-cooldown-reduction-pct': 0.25, 'core.maxhp-mult': -0.20,
    },
    icon: 'items/cores/scout.png',
    description: 'Open ground and a long horizon. Nothing here helps you win a stand — only avoid one.',
  }],

  ['relic-glacial-bell', {
    id: 'relic-glacial-bell', name: 'Glacial Bell',
    recipeGroup: 'tundra', requiredBiomeLevel: 12, slot: 'relic',
    lineageId: 'relic-glacial-bell',
    cost: { blue: 3200 }, catalystCost: { heavy: 9 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': -0.20,
      'relic.mechanic-potency': 0.25,
      'relic.mechanic-buff-effect': 0.25,
    },
    icon: 'items/relics/glacial-bell.png',
    description: 'It rings only when the moment is ready, and every boon carries the note.',
  }],

] satisfies [string, Recipe][];
