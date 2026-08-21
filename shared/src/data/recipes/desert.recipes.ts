import type { Recipe } from './types';

// DESERT (debuts T2). Identity: last-stand + cleanse armor / ambush weapon /
// cleanse-or-burst charm. Charm rework: upgrades ramp the empty-heal, hpRegen flat
// (cleanse stacks/interval stay flat — too chunky to ramp). See mountain.recipes.ts.

export const desertRecipeEntries = [
  // ── T2 ──
  ['desert-sunsteel-cross', {
    id: 'desert-sunsteel-cross', name: 'Sunsteel Falchion',
    recipeGroup: 'desert', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { yellow: 70 }, catalystCost: { dominion: 2 }, stats: { attack: 24 }, attacksPerSecond: 0.80, tier: 2, // family-tag: first-strike ambush weapon → Dominion
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
      { stats: { attack: 9 }, cost: { yellow: 100 }, requiredBiomeLevel: 2 },
      { stats: { attack: 9 }, cost: { yellow: 200 }, requiredBiomeLevel: 3 },
      { stats: { attack: 9 }, cost: { yellow: 300 }, requiredBiomeLevel: 4 },
      { stats: { attack: 9 }, cost: { yellow: 300 }, requiredBiomeLevel: 4 },
      { stats: { attack: 9 }, cost: { yellow: 300 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['desert-vest-t2', {
    id: 'desert-vest-t2', name: 'Duneplate of the Last Stand',
    recipeGroup: 'desert', requiredBiomeLevel: 2, slot: 'armor',
    cost: { yellow: 35, purple: 25 }, catalystCost: { dominion: 2 }, stats: { maxHp: 44, plating: 10 }, // family-tag: last-stand (cheat-death) armor → Dominion
    mechanicEffects: { 'defense.cheat-death': 1, 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 8000 },
    tier: 2,
    icon: 'items/armor/duneplate-last-stand.png',
    description: 'Plate of the standfast dead, who are said to have refused to fall even once.',
    upgrades: [
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 75, purple: 25 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 150, purple: 50 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 200, purple: 100 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 200, purple: 100 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 12, plating: 3 }, cost: { yellow: 200, purple: 100 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp cleanse empty-heal 0.03 -> 0.06 (stacks/interval flat).
  ['desert-charm-t2', {
    id: 'desert-charm-t2', name: 'Mirage Talisman',
    recipeGroup: 'desert', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { yellow: 50, purple: 25 }, catalystCost: { dominion: 2 }, stats: { hpRegen: 6 }, // family-tag: cleanse/last-stand recovery → Dominion
    mechanicEffects: { 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 6000, 'defense.cleanse-empty-heal-pct': 0.03 },
    tier: 2,
    icon: 'items/charms/mirage-talisman.png',
    description: 'A shard of cooled glass that shows you water which is not there, and mends what is.',
    upgrades: [
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 25, purple: 15 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 60, purple: 30 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 100, purple: 50 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 100, purple: 50 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 100, purple: 50 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['desert-boots-t2', {
    id: 'desert-boots-t2', name: 'Sand Sprint',
    recipeGroup: 'desert', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { yellow: 58 }, catalystCost: { dominion: 2 }, stats: { speed: 58 }, tier: 2, // family-tag: desert kite mobility → Dominion
    mechanicEffects: { 'mobility.kite-speed-pct': 0.20 },
    icon: 'items/boots/sand-sprint.png',
    description: 'Wide and light, made to outpace a storm across open dune.',
    upgrades: [
      { stats: { speed: 8 },  cost: { yellow: 28 }, requiredBiomeLevel: 4 },
      { stats: { speed: 12 }, cost: { yellow: 58 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { yellow: 96 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { yellow: 96 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { yellow: 96 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T3 ──
  ['desert-solar-cross', {
    id: 'desert-solar-cross', name: 'Solar Falchion',
    recipeGroup: 'desert', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { yellow: 116 }, catalystCost: { dominion: 3 }, stats: { attack: 42 }, attacksPerSecond: 0.80, tier: 3, // family-tag: opening-strike weapon → Dominion
    mechanicEffects: { 'weapon.first-strike-mult': 2.5 },
    icon: 'items/weapons/solar-falchion.png',
    description: 'It saves its fury for the opening blow, and spends it all at once.',
    upgrades: [
      { stats: { attack: 12 }, cost: { yellow: 170 },  requiredBiomeLevel: 8 },
      { stats: { attack: 12 }, cost: { yellow: 340 }, requiredBiomeLevel: 9 },
      { stats: { attack: 12 }, cost: { yellow: 570 }, requiredBiomeLevel: 10 },
      { stats: { attack: 12 }, cost: { yellow: 570 }, requiredBiomeLevel: 10 },
      { stats: { attack: 12 }, cost: { yellow: 570 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['desert-vest-t3', {
    id: 'desert-vest-t3', name: 'Eternal Duneplate',
    recipeGroup: 'desert', requiredBiomeLevel: 8, slot: 'armor',
    cost: { yellow: 120, purple: 30 }, catalystCost: { dominion: 3 }, stats: { maxHp: 90, plating: 20 }, // family-tag: last-stand armor → Dominion
    mechanicEffects: { 'defense.cheat-death': 1, 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 8000, 'defense.debuff-resistance': 0.20 },
    tier: 3,
    icon: 'items/armor/eternal-duneplate.png',
    description: 'Worn by the standfast dead, who shed curses like sand and refused, once, to die.',
    upgrades: [
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 100, purple: 50 },  requiredBiomeLevel: 9 },
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 200, purple: 100 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 450, purple: 150 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 450, purple: 150 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 20, plating: 5 }, cost: { yellow: 450, purple: 150 }, requiredBiomeLevel: 10 },
    ],
  }],

  // Charm: hpRegen flat; upgrades ramp cleanse empty-heal 0.05 -> 0.08.
  ['desert-charm-t3', {
    id: 'desert-charm-t3', name: 'Oasis Heart',
    recipeGroup: 'desert', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { yellow: 100, purple: 25 }, catalystCost: { dominion: 3 }, stats: { hpRegen: 11 }, // family-tag: cleanse recovery → Dominion
    mechanicEffects: { 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 6000, 'defense.cleanse-empty-heal-pct': 0.05 },
    tier: 3,
    icon: 'items/charms/oasis-heart.png',
    description: 'It strips the curse from your blood, or — finding none — gives you a swallow of water instead.',
    upgrades: [
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 35, purple: 25 },  requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 140, purple: 35 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 280, purple: 70 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 280, purple: 70 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.01 }, cost: { yellow: 280, purple: 70 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['desert-boots-t3', {
    id: 'desert-boots-t3', name: 'Mirage Striders',
    recipeGroup: 'desert', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { yellow: 90 }, catalystCost: { dominion: 3 }, stats: { speed: 96 }, tier: 3, // family-tag: desert kite mobility → Dominion
    mechanicEffects: { 'mobility.kite-speed-pct': 0.30 },
    icon: 'items/boots/mirage-striders.png',
    description: 'By the time the storm reaches where you stood, you are already a rumor on the next dune.',
    upgrades: [
      { stats: { speed: 10 }, cost: { yellow: 40 },  requiredBiomeLevel: 10 },
      { stats: { speed: 14 }, cost: { yellow: 80 },  requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { yellow: 138 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { yellow: 138 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { yellow: 138 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── T4 ──

  ['desert-zenith-cross', {
    id: 'desert-zenith-cross', name: 'Zenith Falchion',
    recipeGroup: 'desert', requiredBiomeLevel: 13, slot: 'weapon',
    cost: { yellow: 255 }, stats: { attack: 110 }, attacksPerSecond: 0.80, tier: 4,
    // first-strike-mult progressed: T2 2.0 → T3 2.5 → T4 3.0 (doc said 2.5, = T3)
    mechanicEffects: { 'weapon.first-strike-mult': 3.0 },
    icon: 'items/weapons/zenith-falchion.png',
    description: 'At the sun\'s height it draws all that light into a single, opening cut.',
    upgrades: [
      { stats: { attack: 20 }, cost: { yellow: 383 }, requiredBiomeLevel: 14 },
      { stats: { attack: 20 }, cost: { yellow: 765 }, requiredBiomeLevel: 15 },
      { stats: { attack: 20 }, cost: { yellow: 1530 }, requiredBiomeLevel: 16 },
      { stats: { attack: 20 }, cost: { yellow: 1530 }, requiredBiomeLevel: 16 },
      { stats: { attack: 20 }, cost: { yellow: 1530 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['desert-vest-t4', {
    id: 'desert-vest-t4', name: 'Deathless Duneplate',
    recipeGroup: 'desert', requiredBiomeLevel: 14, slot: 'armor',
    cost: { yellow: 220, purple: 55 }, stats: { maxHp: 165, plating: 38 },
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
      { stats: { maxHp: 40, plating: 9 }, cost: { yellow: 200, purple: 100 }, requiredBiomeLevel: 15 },
      { stats: { maxHp: 40, plating: 9 }, cost: { yellow: 400, purple: 200 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 40, plating: 9 }, cost: { yellow: 900, purple: 300 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 40, plating: 9 }, cost: { yellow: 900, purple: 300 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 40, plating: 9 }, cost: { yellow: 900, purple: 300 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['desert-charm-t4', {
    id: 'desert-charm-t4', name: 'Last Oasis',
    recipeGroup: 'desert', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { yellow: 200, purple: 50 }, stats: { hpRegen: 16 },
    // † cleanse-per-stack-heal-pct: heal 2% maxHP per debuff stack actually cleansed.
    mechanicEffects: {
      'defense.cleanse-stacks': 2, 'defense.cleanse-interval-ms': 6000,
      'defense.cleanse-empty-heal-pct': 0.07, 'defense.cleanse-per-stack-heal-pct': 0.02,
    },
    tier: 4,
    icon: 'items/charms/last-oasis.png',
    description: 'It draws the poison out and, finding the wound clean, leaves a swallow of cool water in its place.',
    upgrades: [
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.015 }, cost: { yellow: 100, purple: 40 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.015 }, cost: { yellow: 280, purple: 70 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.015 }, cost: { yellow: 480, purple: 120 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.015 }, cost: { yellow: 480, purple: 120 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.cleanse-empty-heal-pct': 0.015 }, cost: { yellow: 480, purple: 120 }, requiredBiomeLevel: 16 },
    ],
  }],

  // T4 boots — kite-speed (faster while kiting). T3 0.30 → T4 0.40.
  ['desert-boots-t4', {
    id: 'desert-boots-t4', name: 'Simoom Striders',
    recipeGroup: 'desert', requiredBiomeLevel: 16, slot: 'mobility',
    cost: { yellow: 198 }, stats: { speed: 134 }, tier: 4,
    mechanicEffects: { 'mobility.kite-speed-pct': 0.40 },
    icon: 'items/boots/simoom-striders.png',
    description: 'Named for the desert wind that arrives only as the dust it already left behind.',
    upgrades: [
      { stats: { speed: 14 }, cost: { yellow: 88 },  requiredBiomeLevel: 16 },
      { stats: { speed: 18 }, cost: { yellow: 176 }, requiredBiomeLevel: 16 },
      { stats: { speed: 22 }, cost: { yellow: 304 }, requiredBiomeLevel: 16 },
      { stats: { speed: 22 }, cost: { yellow: 304 }, requiredBiomeLevel: 16 },
      { stats: { speed: 22 }, cost: { yellow: 304 }, requiredBiomeLevel: 16 },
    ],
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Desert owns DISTANCE AND SIGHTLINES —
  // it teaches Charge and the kiting boot, so it is where the ranged glass cannon lives.

  // T3 ranged — Sniper: the largest raw damage number in the T3 cast, paid for in
  // eHP twice over. Struggles the moment anything closes the gap.
  ['core-sniper', {
    id: 'core-sniper', name: 'Sniper Core',
    recipeGroup: 'desert', requiredBiomeLevel: 9, slot: 'core', coreEligibility: 'ranged',
    lineageId: 'core-sniper',
    cost: { yellow: 110 }, catalystCost: { dominion: 3 }, // family-tag: ranged alpha-strike → Dominion
    stats: {}, tier: 3,
    // Deliberately no mobility bonus — the Scout core is the one that buys spacing.
    mechanicEffects: { 'core.attack-mult': 0.26, 'core.maxhp-mult': -0.20, 'core.plating-mult': -0.15 },
    icon: 'items/cores/sniper.png',
    description: 'Focuses the eye to a needlepoint, and leaves the body that much more exposed.',
  }],

  ['relic-withering-lens', {
    id: 'relic-withering-lens', name: 'Withering Lens',
    recipeGroup: 'desert', requiredBiomeLevel: 18, slot: 'relic',
    lineageId: 'relic-withering-lens',
    cost: { yellow: 220 }, catalystCost: { dominion: 4 },
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
