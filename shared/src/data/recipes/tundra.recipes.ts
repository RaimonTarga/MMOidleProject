import type { Recipe } from './types';

// TUNDRA (debuts T3). Identity: stationary-ramp DR + cap armor / brittle weapon /
// barrier + absorb charm. Charm rework: upgrades ramp BOTH mechanics, recovery flat
// (see mountain.recipes.ts header).
// Tundra owns the FROST DoT weapon line (relocated from Swamp): Rimebrand (T3) →
// Glacial Rimebrand (T4). See item-identity-audit.md.

export const tundraRecipeEntries = [

  ['tundra-permafrost-maul', {
    id: 'tundra-permafrost-maul', name: 'Permafrost Maul',
    recipeGroup: 'tundra', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 124 }, catalystCost: { heavy: 3 }, stats: { attack: 120 }, attacksPerSecond: 0.50, tier: 3, // family-tag: slow heavy maul → Heavy
    mechanicEffects: { 'weapon.brittle-plating': 2, 'weapon.brittle-dr': 0.01, 'weapon.brittle-stacks': 8 },
    icon: 'items/weapons/permafrost-maul.png',
    description: 'Each blow leaves a deep frost-crack; armor that takes enough of them simply gives.',
    upgrades: [
      { stats: { attack: 30 }, cost: { blue: 186 },  requiredBiomeLevel: 2 },
      { stats: { attack: 30 }, cost: { blue: 372 }, requiredBiomeLevel: 3 },
      { stats: { attack: 30 }, cost: { blue: 744 }, requiredBiomeLevel: 4 },
      { stats: { attack: 30 }, cost: { blue: 744 }, requiredBiomeLevel: 4 },
      { stats: { attack: 30 }, cost: { blue: 744 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Frost DoT weapon — relocated from Swamp (was `swamp-rimebrand`). The slow,
  // heavy chill-brand: converts more of each blow into a lingering frost DoT.
  // Evolves toward Glacial Rimebrand at T4. Numbers are placeholders (balance pass).
  ['tundra-rimebrand', {
    id: 'tundra-rimebrand', name: 'Rimebrand',
    recipeGroup: 'tundra', requiredBiomeLevel: 3, slot: 'weapon',
    cost: { blue: 120 }, catalystCost: { fortified: 3 }, stats: { attack: 96 }, attacksPerSecond: 0.60, tier: 3, // family-tag: frost DoT-conversion weapon → Fortified
    weaponDot: { effectId: 'tundra-rimebrand-burn', convPct: 0.70, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'frost' },
    icon: 'items/weapons/rimebrand.png',
    description: 'The first true frost-brand — slow and heavy, planting a cold in the wound that goes on biting after the blade is gone.',
    upgrades: [
      { stats: { attack: 24 }, cost: { blue: 180 }, requiredBiomeLevel: 3 },
      { stats: { attack: 24 }, cost: { blue: 360 }, requiredBiomeLevel: 4 },
      { stats: { attack: 24 }, cost: { blue: 720 }, requiredBiomeLevel: 4 },
      { stats: { attack: 24 }, cost: { blue: 720 }, requiredBiomeLevel: 4 },
      { stats: { attack: 24 }, cost: { blue: 720 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['tundra-vest-t3', {
    id: 'tundra-vest-t3', name: 'Glacial Bulwark',
    recipeGroup: 'tundra', requiredBiomeLevel: 2, slot: 'armor',
    cost: { blue: 100, red: 25 }, catalystCost: { heavy: 3 }, stats: { maxHp: 100, plating: 15 }, // family-tag: DR + damage-cap armor → Heavy
    mechanicEffects: {
      'defense.stationary-dr-pct': 0.15, 'defense.stationary-dr-ramptime-ms': 6000,
      'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5,
    },
    tier: 3,
    icon: 'items/armor/glacial-bulwark.png',
    description: 'Stand still and the ice creeps over the plate, until you are part of the glacier itself.',
    upgrades: [
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 90, red: 40 },  requiredBiomeLevel: 3 },
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 180, red: 60 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 270, red: 80 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 270, red: 80 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 22, plating: 4 }, cost: { blue: 270, red: 80 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: recovery flat; upgrades ramp barrier 0.12 -> 0.18 AND absorb 0.08 -> 0.14.
  ['tundra-charm-t3', {
    id: 'tundra-charm-t3', name: 'Frostward Charm',
    recipeGroup: 'tundra', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { blue: 75, purple: 25 }, catalystCost: { heavy: 3 }, stats: { recovery: 11 }, // family-tag: barrier charm (anti-spike) → Heavy
    mechanicEffects: {
      'defense.barrier-pct': 0.12,
      'defense.absorb-pct': 0.08,
    },
    tier: 3,
    icon: 'items/charms/frostward-charm.png',
    description: 'A rime-cold ward that throws up a sheet of ice, and drinks the blows that get through.',
    upgrades: [
      { mechanicEffects: { 'defense.barrier-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 50, purple: 25 },  requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.barrier-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 100, purple: 50 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.barrier-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 200, purple: 100 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.barrier-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 200, purple: 100 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.barrier-pct': 0.02, 'defense.absorb-pct': 0.02 }, cost: { blue: 200, purple: 100 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['tundra-boots-t3', {
    id: 'tundra-boots-t3', name: 'Glacier Striders',
    recipeGroup: 'tundra', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { blue: 80 }, catalystCost: { heavy: 3 }, stats: { speed: 30 }, tier: 3, // family-tag: tundra momentum mobility → Heavy
    mechanicEffects: { 'mobility.ramp-speed-pct': 0.60, 'mobility.ramp-rate': 0.30 },
    icon: 'items/boots/glacier-striders.png',
    description: 'They gather momentum across the ice and are loath to give it back.',
    upgrades: [
      { stats: { speed: 8 },  cost: { blue: 30 },  requiredBiomeLevel: 4 },
      { stats: { speed: 12 }, cost: { blue: 60 },  requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { blue: 100 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { blue: 100 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { blue: 100 }, requiredBiomeLevel: 4 },
    ],
  }],

  // T4
  ['tundra-glacial-tyrant-maul', {
    id: 'tundra-glacial-tyrant-maul', name: 'Glacial Tyrant Maul',
    recipeGroup: 'tundra', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { blue: 273 }, catalystCost: { heavy: 4 }, stats: { attack: 200 }, attacksPerSecond: 0.50, tier: 4, // family-tag: capstone heavy maul → Heavy
    // † brittle-shatter-threshold: at max brittle stacks (8), strip the target's
    //   DR for 2s (brittle-shatter-dr-strip-ms). (new key)
    mechanicEffects: {
      'weapon.brittle-plating': 3, 'weapon.brittle-dr': 0.015, 'weapon.brittle-stacks': 8,
      'weapon.brittle-shatter-threshold': 8, 'weapon.brittle-shatter-dr-strip-ms': 2000,
    },
    icon: 'items/weapons/glacial-tyrant-maul.png',
    description: 'Every blow leaves a deeper frost-crack; the eighth simply ends the argument about whether armor holds.',
    upgrades: [
      { stats: { attack: 50 }, cost: { blue: 410 },  requiredBiomeLevel: 8 },
      { stats: { attack: 50 }, cost: { blue: 819 },  requiredBiomeLevel: 9 },
      { stats: { attack: 50 }, cost: { blue: 1638 }, requiredBiomeLevel: 10 },
      { stats: { attack: 50 }, cost: { blue: 1638 }, requiredBiomeLevel: 10 },
      { stats: { attack: 50 }, cost: { blue: 1638 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['tundra-glacial-rimebrand', {
    id: 'tundra-glacial-rimebrand', name: 'Glacial Rimebrand',
    recipeGroup: 'tundra', requiredBiomeLevel: 7, slot: 'weapon',
    // ⚠ INHERITED (Swamp slow-DoT lineage) — base attack carried from doc, not
    //   scaled from a T3 ancestor. VERIFY in the DoT-conversion budget pass.
    cost: { blue: 258 }, catalystCost: { fortified: 4 }, stats: { attack: 155 }, attacksPerSecond: 0.60, tier: 4, // family-tag: frost DoT-conversion weapon → Fortified
    weaponDot: { effectId: 'rimebrand-burn', convPct: 0.70, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'frost' },
    icon: 'items/weapons/glacial-rimebrand.png',
    description: 'It does not cut so much as plant a cold that goes on spreading after the blade is gone.',
    upgrades: [
      { stats: { attack: 35 }, cost: { blue: 387 },  requiredBiomeLevel: 8 },
      { stats: { attack: 35 }, cost: { blue: 774 },  requiredBiomeLevel: 9 },
      { stats: { attack: 35 }, cost: { blue: 1548 }, requiredBiomeLevel: 10 },
      { stats: { attack: 35 }, cost: { blue: 1548 }, requiredBiomeLevel: 10 },
      { stats: { attack: 35 }, cost: { blue: 1548 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['tundra-vest-t4', {
    id: 'tundra-vest-t4', name: 'Permafrost Sovereign',
    recipeGroup: 'tundra', requiredBiomeLevel: 8, slot: 'armor',
    cost: { blue: 256, red: 64 }, catalystCost: { heavy: 4 }, stats: { maxHp: 180, plating: 28 }, // family-tag: DR + damage-cap armor → Heavy
    mechanicEffects: {
      'defense.stationary-dr-pct': 0.20, 'defense.stationary-dr-ramptime-ms': 5000,
      'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5,
    },
    tier: 4,
    icon: 'items/armor/permafrost-sovereign.png',
    description: 'Hold your ground and the glacier claims you for its own — and nothing moves a glacier.',
    upgrades: [
      { stats: { maxHp: 42, plating: 7 }, cost: { blue: 290, red: 96 },  requiredBiomeLevel: 9 },
      { stats: { maxHp: 42, plating: 7 }, cost: { blue: 572, red: 192 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 42, plating: 7 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 42, plating: 7 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 42, plating: 7 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['tundra-charm-t4', {
    id: 'tundra-charm-t4', name: 'Glacial Ward',
    recipeGroup: 'tundra', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { blue: 220, purple: 30 }, catalystCost: { heavy: 4 }, stats: { recovery: 16 }, // family-tag: barrier charm (anti-spike) → Heavy
    mechanicEffects: {
      'defense.barrier-pct': 0.17,
      'defense.absorb-pct': 0.12,
    },
    tier: 4,
    icon: 'items/charms/glacial-ward.png',
    description: 'A sheet of ice thrown up against the blow, and a slow cold that drinks whatever slips past it.',
    upgrades: [
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-pct': 0.03 }, cost: { blue: 110, purple: 30 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-pct': 0.03 }, cost: { blue: 220, purple: 60 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-pct': 0.03 }, cost: { blue: 340, purple: 90 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-pct': 0.03 }, cost: { blue: 340, purple: 90 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-pct': 0.03 }, cost: { blue: 340, purple: 90 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['tundra-charm-t4-deepfreeze', {
    id: 'tundra-charm-t4-deepfreeze', name: 'Deepfreeze Ward',
    recipeGroup: 'tundra', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { blue: 220, purple: 30 }, catalystCost: { heavy: 4 }, stats: { recovery: 16 }, // family-tag: barrier + absorb ward → Heavy
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
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-ramp-max-pct': 0.03 }, cost: { blue: 110, purple: 30 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-ramp-max-pct': 0.03 }, cost: { blue: 220, purple: 60 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-ramp-max-pct': 0.03 }, cost: { blue: 340, purple: 90 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-ramp-max-pct': 0.03 }, cost: { blue: 340, purple: 90 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.03, 'defense.absorb-ramp-max-pct': 0.03 }, cost: { blue: 340, purple: 90 }, requiredBiomeLevel: 10 },
    ],
  }],

  // T4 boots — ramp-speed (momentum builds while moving). T3 0.60/0.30 → T4 0.75/0.35.
  ['tundra-boots-t4', {
    id: 'tundra-boots-t4', name: 'Avalanche Striders',
    recipeGroup: 'tundra', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { blue: 176 }, catalystCost: { heavy: 4 }, stats: { speed: 42 }, tier: 4, // family-tag: tundra momentum mobility → Heavy
    mechanicEffects: { 'mobility.ramp-speed-pct': 0.75, 'mobility.ramp-rate': 0.35 },
    icon: 'items/boots/avalanche-striders.png',
    description: 'Slow to start and impossible to stop — by the far end of the ice you are a thing that simply happens to whatever is in the way.',
    upgrades: [
      { stats: { speed: 10 }, cost: { blue: 66 },  requiredBiomeLevel: 10 },
      { stats: { speed: 14 }, cost: { blue: 132 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { blue: 220 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { blue: 220 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { blue: 220 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Tundra owns MOVEMENT — its boot
  // ramps speed over sustained travel, so it is where the spacing core comes from.

  // T3 ranged — Scout: reliable uptime instead of peak damage. Where Sniper wants
  // the fight to never reach it, Scout assumes it will and keeps moving.
  ['core-scout', {
    id: 'core-scout', name: 'Scout Core',
    recipeGroup: 'tundra', requiredBiomeLevel: 3, slot: 'core', coreEligibility: 'ranged',
    lineageId: 'core-scout',
    cost: { blue: 110 }, catalystCost: { heavy: 3 }, // Alacrity is BANNED in Tundra; its native family is Heavy
    stats: {}, tier: 3,
    // The cooldown clause is INERT without an ability tagged `mobility` (today:
    // Charge); the damage and movement halves are always on.
    mechanicEffects: {
      'core.attack-mult': 0.14, 'core.speed-mult': 0.16,
      'core.mobility-cooldown-reduction-pct': 0.20, 'core.maxhp-mult': -0.15,
    },
    icon: 'items/cores/scout.png',
    description: 'Open ground and a long horizon. Nothing here helps you win a stand — only avoid one.',
  }],

  ['relic-glacial-bell', {
    id: 'relic-glacial-bell', name: 'Glacial Bell',
    recipeGroup: 'tundra', requiredBiomeLevel: 12, slot: 'relic',
    lineageId: 'relic-glacial-bell',
    cost: { blue: 220 }, catalystCost: { heavy: 4 },
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
