import type { Recipe } from './types';

// DESERT (debuts T2). Identity: last-stand + cleanse armor / ambush weapon /
// cleanse-or-burst charm. Charm rework: upgrades ramp the empty-heal, recovery flat
// (cleanse stacks/interval stay flat — too chunky to ramp). See mountain.recipes.ts.

export const desertRecipeEntries = [
  // ── T2 ──
  // T2 economy pass (2026-08-29): Desert debuts at T2, so there is deliberately
  // NO T1 predecessor (§5) — this stays a plain craft. Catalyst removed from
  // base per §2 and moved to +4/+5 per §8.
  ['desert-sunsteel-cross', {
    id: 'desert-sunsteel-cross', name: 'Sunsteel Falchion',
    recipeGroup: 'desert', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { yellow: 70 }, stats: { attack: 24 }, attacksPerSecond: 0.80, tier: 2, // family-tag: first-strike ambush weapon → Dominion
    // Technique Power (abilities evolution §6.2) on Desert's opener weapon — it
    // pairs with Charge, whose whole point is converting a gap-close into one
    // big opening blow. Scales opted-in offensive payloads ONLY (never stun
    // duration or dash distance). PLACEHOLDER magnitude.
    mechanicEffects: {
      'weapon.first-strike-mult': 2.0,
      'technique.power-pct': 0.20,
    },
    icon: 'items/weapons/sunsteel-falchion.png',
    description: 'Sun-forged and ward-etched, it strikes the first blow as if it waited years for it.',
    upgrades: [
      { stats: { attack: 9 }, cost: { yellow: 48 }, requiredBiomeLevel: 2 },
      { stats: { attack: 9 }, cost: { yellow: 120 }, requiredBiomeLevel: 3 },
      { stats: { attack: 9 }, cost: { yellow: 192 }, requiredBiomeLevel: 4 },
      { stats: { attack: 9 }, cost: { yellow: 312 }, catalystCost: { dominion: 1 }, requiredBiomeLevel: 4 },
      { stats: { attack: 9 }, cost: { yellow: 528 }, catalystCost: { dominion: 2 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['desert-vest-t2', {
    id: 'desert-vest-t2', name: 'Duneplate of the Last Stand',
    recipeGroup: 'desert', requiredBiomeLevel: 2, slot: 'armor',
    cost: { yellow: 35, purple: 25 }, stats: { maxHp: 44, plating: 10 }, // family-tag: last-stand (cheat-death) armor → Dominion
    mechanicEffects: { 'defense.cheat-death': 1, 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 8000 },
    tier: 2,
    icon: 'items/armor/duneplate-last-stand.png',
    description: 'Plate of the standfast dead, who are said to have refused to fall even once.',
    upgrades: [
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 29, purple: 19 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 72, purple: 48 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 115, purple: 77 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 187, purple: 125 }, catalystCost: { dominion: 1 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 317, purple: 211 }, catalystCost: { dominion: 2 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: recovery flat; upgrades ramp cleanse empty-heal 0.03 -> 0.06 (stacks/interval flat).
  ['desert-charm-t2', {
    id: 'desert-charm-t2', name: 'Mirage Talisman',
    recipeGroup: 'desert', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { yellow: 50, purple: 25 }, stats: { recovery: 6 }, // family-tag: cleanse/last-stand recovery → Dominion
    mechanicEffects: { 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 6000, 'defense.cleanse-empty-heal-pct': 0.03 },
    tier: 2,
    icon: 'items/charms/mirage-talisman.png',
    description: 'A shard of cooled glass that shows you water which is not there, and mends what is.',
    upgrades: [
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 15, purple: 8 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 39, purple: 19 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 62, purple: 31 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 101, purple: 50 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 171, purple: 84 }, catalystCost: { dominion: 1 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['desert-boots-t2', {
    id: 'desert-boots-t2', name: 'Sand Sprint',
    recipeGroup: 'desert', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { yellow: 58 }, stats: { speed: 58 }, tier: 2, // family-tag: desert kite mobility → Dominion
    mechanicEffects: { 'mobility.kite-speed-pct': 0.20 },
    icon: 'items/boots/sand-sprint.png',
    description: 'Wide and light, made to outpace a storm across open dune.',
    upgrades: [
      { stats: { speed: 8 },  cost: { yellow: 15 }, requiredBiomeLevel: 4 },
      { stats: { speed: 12 }, cost: { yellow: 37 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { yellow: 60 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { yellow: 97 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { yellow: 165 }, catalystCost: { dominion: 1 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T3 ──
  ['desert-solar-cross', {
    id: 'desert-solar-cross', name: 'Solar Falchion',
    recipeGroup: 'desert', requiredBiomeLevel: 7, slot: 'weapon',
    // T3 economy pass (2026-08-30): EVOLUTION of desert-sunsteel-cross at +5.
    evolvesFrom: 'desert-sunsteel-cross',
    cost: { yellow: 116 }, stats: { attack: 42 }, attacksPerSecond: 0.80, tier: 3, // family-tag: opening-strike weapon → Dominion
    reconstructCost: { yellow: 406 }, reconstructCatalystCost: { dominion: 3 },
    mechanicEffects: { 'weapon.first-strike-mult': 2.5 },
    icon: 'items/weapons/solar-falchion.png',
    description: 'It saves its fury for the opening blow, and spends it all at once.',
    upgrades: [
      { stats: { attack: 12 }, cost: { yellow: 97 },  requiredBiomeLevel: 8 },
      { stats: { attack: 12 }, cost: { yellow: 242 }, requiredBiomeLevel: 9 },
      { stats: { attack: 12 }, cost: { yellow: 388 }, requiredBiomeLevel: 10 },
      { stats: { attack: 12 }, cost: { yellow: 630 }, catalystCost: { dominion: 2 }, requiredBiomeLevel: 10 },
      { stats: { attack: 12 }, cost: { yellow: 1067 }, catalystCost: { dominion: 3 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['desert-vest-t3', {
    id: 'desert-vest-t3', name: 'Eternal Duneplate',
    recipeGroup: 'desert', requiredBiomeLevel: 8, slot: 'armor',
    evolvesFrom: 'desert-vest-t2',
    cost: { yellow: 120, purple: 30 }, stats: { maxHp: 90, plating: 20 }, // family-tag: last-stand armor → Dominion
    reconstructCost: { yellow: 420, purple: 105 }, reconstructCatalystCost: { dominion: 3 },
    mechanicEffects: { 'defense.cheat-death': 1, 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 8000, 'defense.debuff-resistance': 0.20 },
    tier: 3,
    icon: 'items/armor/eternal-duneplate.png',
    description: 'Worn by the standfast dead, who shed curses like sand and refused, once, to die.',
    upgrades: [
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 76, purple: 19 },  requiredBiomeLevel: 9 },
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 190, purple: 47 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 303, purple: 76 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 493, purple: 123 }, catalystCost: { dominion: 2 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 834, purple: 209 }, catalystCost: { dominion: 3 }, requiredBiomeLevel: 10 },
    ],
  }],

  // Charm: recovery flat; upgrades ramp cleanse empty-heal 0.05 -> 0.08.
  ['desert-charm-t3', {
    id: 'desert-charm-t3', name: 'Oasis Heart',
    recipeGroup: 'desert', requiredBiomeLevel: 9, slot: 'recovery',
    evolvesFrom: 'desert-charm-t2',
    cost: { yellow: 100, purple: 25 }, stats: { recovery: 11 }, // family-tag: cleanse recovery → Dominion
    reconstructCost: { yellow: 350, purple: 88 }, reconstructCatalystCost: { dominion: 3 },
    mechanicEffects: { 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 6000, 'defense.cleanse-empty-heal-pct': 0.05 },
    tier: 3,
    icon: 'items/charms/oasis-heart.png',
    description: 'It strips the curse from your blood, or — finding none — gives you a swallow of water instead.',
    upgrades: [
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 38, purple: 9 },  requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 95, purple: 24 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 152, purple: 38 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 246, purple: 62 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 417, purple: 104 }, catalystCost: { dominion: 2 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['desert-boots-t3', {
    id: 'desert-boots-t3', name: 'Mirage Striders',
    recipeGroup: 'desert', requiredBiomeLevel: 10, slot: 'mobility',
    evolvesFrom: 'desert-boots-t2',
    cost: { yellow: 90 }, stats: { speed: 96 }, tier: 3, // family-tag: desert kite mobility → Dominion
    reconstructCost: { yellow: 315 }, reconstructCatalystCost: { dominion: 3 },
    mechanicEffects: { 'mobility.kite-speed-pct': 0.30 },
    icon: 'items/boots/mirage-striders.png',
    description: 'By the time the storm reaches where you stood, you are already a rumor on the next dune.',
    upgrades: [
      { stats: { speed: 10 }, cost: { yellow: 31 },  requiredBiomeLevel: 10 },
      { stats: { speed: 14 }, cost: { yellow: 77 },  requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { yellow: 124 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { yellow: 201 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { yellow: 341 }, catalystCost: { dominion: 2 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── T4 ──
  // T4 economy pass (2026-08-30): each item now EVOLVES from its T3 predecessor at
  // +5 (T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §3). Costs are 2.00× the
  // finalized T3 lifetime total on the shipped accelerating curve. Desert's T4
  // catalyst family is `dominion` (its own native family) — newly assigned by this
  // pass; Desert previously charged zero T4 catalysts anywhere.

  ['desert-zenith-cross', {
    id: 'desert-zenith-cross', name: 'Zenith Falchion',
    recipeGroup: 'desert', requiredBiomeLevel: 13, slot: 'weapon',
    evolvesFrom: 'desert-solar-cross',
    cost: { yellow: 255 }, stats: { attack: 110 }, attacksPerSecond: 0.80, tier: 4,
    reconstructCost: { yellow: 893 }, reconstructCatalystCost: { dominion: 4 },
    // first-strike-mult progressed: T2 2.0 → T3 2.5 → T4 3.0 (doc said 2.5, = T3)
    mechanicEffects: { 'weapon.first-strike-mult': 3.0 },
    icon: 'items/weapons/zenith-falchion.png',
    description: 'At the sun\'s height it draws all that light into a single, opening cut.',
    upgrades: [
      { stats: { attack: 20 }, cost: { yellow: 193 }, requiredBiomeLevel: 14 },
      { stats: { attack: 20 }, cost: { yellow: 483 }, requiredBiomeLevel: 15 },
      { stats: { attack: 20 }, cost: { yellow: 772 }, requiredBiomeLevel: 16 },
      { stats: { attack: 20 }, cost: { yellow: 1255 }, catalystCost: { dominion: 3 }, requiredBiomeLevel: 16 },
      { stats: { attack: 20 }, cost: { yellow: 2122 }, catalystCost: { dominion: 4 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['desert-vest-t4', {
    id: 'desert-vest-t4', name: 'Deathless Duneplate',
    recipeGroup: 'desert', requiredBiomeLevel: 14, slot: 'armor',
    evolvesFrom: 'desert-vest-t3',
    cost: { yellow: 220, purple: 55 }, stats: { maxHp: 165, plating: 38 },
    reconstructCost: { yellow: 770, purple: 193 }, reconstructCatalystCost: { dominion: 4 },
    // † post-cheat-death-heal: after cheat-death saves you, restore 30% max HP over 4s.
    mechanicEffects: {
      'defense.cheat-death': 1, 'defense.cleanse-stacks': 2, 'defense.cleanse-interval-ms': 8000,
      'defense.debuff-resistance': 0.30,
      'defense.post-cheat-death-heal-pct': 0.30, 'defense.post-cheat-death-heal-ms': 4000,
    },
    tier: 4,
    icon: 'items/armor/deathless-duneplate.png',
    description: 'The standfast dead refused to fall — and the wounds closed as the refusal held.',
    upgrades: [
      { stats: { maxHp: 40, plating: 9 }, cost: { yellow: 153, purple: 38 }, requiredBiomeLevel: 15 },
      { stats: { maxHp: 40, plating: 9 }, cost: { yellow: 382, purple: 95 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 40, plating: 9 }, cost: { yellow: 610, purple: 152 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 40, plating: 9 }, cost: { yellow: 991, purple: 248 }, catalystCost: { dominion: 3 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 40, plating: 9 }, cost: { yellow: 1677, purple: 419 }, catalystCost: { dominion: 4 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['desert-charm-t4', {
    id: 'desert-charm-t4', name: 'Last Oasis',
    recipeGroup: 'desert', requiredBiomeLevel: 15, slot: 'recovery',
    evolvesFrom: 'desert-charm-t3',
    cost: { yellow: 200, purple: 50 }, stats: { recovery: 16 },
    reconstructCost: { yellow: 700, purple: 175 }, reconstructCatalystCost: { dominion: 4 },
    // † cleanse-per-stack-heal-pct: heal 2% maxHP per debuff stack actually cleansed.
    mechanicEffects: {
      'defense.cleanse-stacks': 2, 'defense.cleanse-interval-ms': 6000,
      'defense.cleanse-empty-heal-pct': 0.07, 'defense.cleanse-per-stack-heal-pct': 0.02,
    },
    tier: 4,
    icon: 'items/charms/last-oasis.png',
    description: 'It draws the poison out and, finding the wound clean, leaves a swallow of cool water in its place.',
    upgrades: [
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.015 }, cost: { yellow: 76, purple: 19 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.015 }, cost: { yellow: 190, purple: 47 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.015 }, cost: { yellow: 303, purple: 76 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.015 }, cost: { yellow: 493, purple: 123 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.015 }, cost: { yellow: 834, purple: 209 }, catalystCost: { dominion: 3 }, requiredBiomeLevel: 16 },
    ],
  }],

  // T4 boots — kite-speed (faster while kiting). T3 0.30 → T4 0.40.
  ['desert-boots-t4', {
    id: 'desert-boots-t4', name: 'Simoom Striders',
    recipeGroup: 'desert', requiredBiomeLevel: 16, slot: 'mobility',
    evolvesFrom: 'desert-boots-t3',
    cost: { yellow: 198 }, stats: { speed: 134 }, tier: 4,
    reconstructCost: { yellow: 693 }, reconstructCatalystCost: { dominion: 4 },
    mechanicEffects: { 'mobility.kite-speed-pct': 0.40 },
    icon: 'items/boots/simoom-striders.png',
    description: 'Named for the desert wind that arrives only as the dust it already left behind.',
    upgrades: [
      { stats: { speed: 14 }, cost: { yellow: 61 },  requiredBiomeLevel: 16 },
      { stats: { speed: 18 }, cost: { yellow: 153 }, requiredBiomeLevel: 16 },
      { stats: { speed: 22 }, cost: { yellow: 245 }, requiredBiomeLevel: 16 },
      { stats: { speed: 22 }, cost: { yellow: 398 }, requiredBiomeLevel: 16 },
      { stats: { speed: 22 }, cost: { yellow: 673 }, catalystCost: { dominion: 3 }, requiredBiomeLevel: 16 },
    ],
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Desert owns DISTANCE AND SIGHTLINES —
  // it teaches Charge and the kiting boot, and it carries the T2 offensive capstone
  // before the ranged glass-cannon core.

  // T2 premium capstone — Force: a deliberate save through Desert's final mastery
  // level for the raw-offence tradeoff.
  ['core-force', {
    id: 'core-force', name: 'Force Core',
    recipeGroup: 'desert', requiredBiomeLevel: 6, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-force',
    cost: { yellow: 500 }, catalystCost: { dominion: 4 }, // family-tag: raw offence → Dominion
    stats: {}, tier: 2,
    mechanicEffects: { 'core.attack-mult': 0.22, 'core.maxhp-mult': -0.12 },
    icon: 'items/cores/force.png',
    description: 'It gives you the strike you wanted and takes the margin you were counting on.',
  }],

  // T3 premium ranged — Sniper: the largest raw damage number in the T3 cast,
  // paid for in eHP twice over. Struggles the moment anything closes the gap.
  // Its L12 gate and 1,300 yellow / 6 Dominion price make it Desert's late
  // capstone.
  ['core-sniper', {
    id: 'core-sniper', name: 'Sniper Core',
    recipeGroup: 'desert', requiredBiomeLevel: 12, slot: 'core', coreEligibility: 'ranged',
    lineageId: 'core-sniper',
    cost: { yellow: 1300 }, catalystCost: { dominion: 6 }, // family-tag: ranged alpha-strike → Dominion
    stats: {}, tier: 3,
    // Deliberately no mobility bonus — the Scout core is the one that buys spacing.
    mechanicEffects: { 'core.attack-mult': 0.40, 'core.maxhp-mult': -0.30, 'core.plating-mult': -0.25 },
    icon: 'items/cores/sniper.png',
    description: 'Focuses the eye to a needlepoint, and leaves the body that much more exposed.',
  }],

  ['relic-withering-lens', {
    id: 'relic-withering-lens', name: 'Withering Lens',
    recipeGroup: 'desert', requiredBiomeLevel: 18, slot: 'relic',
    lineageId: 'relic-withering-lens',
    cost: { yellow: 3300 }, catalystCost: { dominion: 9 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': -0.20,
      'relic.mechanic-potency': 0.25,
      'relic.mechanic-debuff-effect': 0.25,
    },
    icon: 'items/relics/withering-lens.png',
    description: 'It takes its time finding the flaw, then makes the flaw impossible to ignore.',
  }],

] satisfies [string, Recipe][];
