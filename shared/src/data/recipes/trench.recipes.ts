import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// Trench (T4). All four slots authored: weapon, armor, and one mobility
// branch inherit Cave's dead-swing-axe/DR-wall/stealth-boots identities; the
// recovery item (Pressure Vessel) and the second mobility item (Abyssal
// Treaders) are genuinely new T4 identities with no predecessor. Essence:
// green (matches Trench's own gear home colour — see the T4 economy pass's
// monster essence-colour correction, T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md
// §17). T4 economy pass (2026-08-30): lineage, catalyst schedule/family, and
// the accelerating upgrade curve were normalized — see that proposal's §5/§6/§7.7/§11.

export const trenchRecipeEntries = [
  ['trench-abyssal-axe', {
    id: 'trench-abyssal-axe', name: 'Abyssal Axe',
    recipeGroup: 'trench', requiredBiomeLevel: 1, slot: 'weapon',
    evolvesFrom: 'cave-cataclysm-axe',
    // Evolves from Cataclysm Axe (Cave), continuing the
    // `weapon.dead-swing-interval` family (see
    // T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §5). Economy resolved by
    // that pass; base `attack` value has NOT been revalidated against current
    // combat formulas — that remains a separate balance question.
    // INVARIANT: dead swing must NOT consume class mechanic resources.
    // 2026-09-26 T2-T4 weapon normalization: Attack 120->140 (+5: 240->257).
    cost: { green: 270 }, stats: { attack: 140 }, attacksPerSecond: 1.15, tier: 4, // family-tag: dead-swing/execute axe → Swarming
    reconstructCost: { green: 945 }, reconstructCatalystCost: { swarming: 4 },
    // † execute-threshold-pct / execute-dmg-mult: vs targets below 20% HP, ×2.5.
    mechanicEffects: {
      'weapon.dead-swing-interval': 4,
      'weapon.execute-threshold-pct': 0.20, 'weapon.execute-dmg-mult': 2.5,
    },
    icon: 'items/weapons/abyssal-axe.png',
    description: 'Patient through the long fight, merciless at the end of it: when the abyss-thing finally weakens, it disappears.',
    upgrades: [
      { stats: { attack: 24 }, cost: { green: 175 }, requiredBiomeLevel: 2 },
      { stats: { attack: 24 }, cost: { green: 439 }, requiredBiomeLevel: 3 },
      { stats: { attack: 23 }, cost: { green: 702 }, requiredBiomeLevel: 4 },
      { stats: { attack: 23 }, cost: { green: 1140 }, catalystCost: { swarming: 3 }, requiredBiomeLevel: 4 },
      { stats: { attack: 23 }, cost: { green: 1930 }, catalystCost: { swarming: 4 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['trench-vest-t4', {
    id: 'trench-vest-t4', name: 'Deep Sea Carapace',
    recipeGroup: 'trench', requiredBiomeLevel: 2, slot: 'armor',
    evolvesFrom: 'cave-vest-t3',
    // Elite-fighting profile (Cave inheritor), 2026-09-26 armor niches: raw stats —
    // high DR, high HP — plus the game's debuff resistance (moved here from the
    // Swamp/Wasteland line). Tundra stays the best stand-and-trade vest when debuffs
    // don't matter; this is the one for elites that shred, slow and mark you.
    cost: { green: 220 }, stats: {"maxHp": 330, "damageReduction": 0.26}, // family-tag: elite (raw stats + debuff resist) armor → Swarming
    reconstructCost: { green: 770 }, reconstructCatalystCost: { swarming: 4 },
    mechanicEffects: {"defense.debuff-resistance": 0.3},
    tier: 4,
    icon: 'items/armor/deep-sea-carapace.png',
    description: "Heavy all-round protection that also weakens enemy debuffs: slows, plating shred, anti-heal and damage-taken marks.",
    upgrades: [
      {"cost": {"green": 185}, "requiredBiomeLevel": 3, "stats": {"maxHp": 29, "damageReduction": 0.008}, "mechanicEffects": {"defense.debuff-resistance": 0.02}},
      {"cost": {"green": 462}, "requiredBiomeLevel": 4, "stats": {"maxHp": 29, "damageReduction": 0.008}, "mechanicEffects": {"defense.debuff-resistance": 0.02}},
      {"cost": {"green": 739}, "requiredBiomeLevel": 4, "stats": {"maxHp": 29, "damageReduction": 0.008}, "mechanicEffects": {"defense.debuff-resistance": 0.02}},
      {"cost": {"green": 1200}, "catalystCost": {"swarming": 3}, "requiredBiomeLevel": 4, "stats": {"maxHp": 29, "damageReduction": 0.008}, "mechanicEffects": {"defense.debuff-resistance": 0.02}},
      {"cost": {"green": 2030}, "catalystCost": {"swarming": 4}, "requiredBiomeLevel": 4, "stats": {"maxHp": 29, "damageReduction": 0.008}, "mechanicEffects": {"defense.debuff-resistance": 0.02}}
    ],
  }],

  // No evolvesFrom: blends Cave's charm identity (`defense.absorb-pct`) and
  // Swamp's charm identity (`defense.recovery-pulse-pct`) with neither
  // clearly primary — per the proposal's tie-break rule, an ambiguous blend
  // becomes a genuinely-new item rather than an arbitrary single parent.
  ['trench-charm-t4', {
    id: 'trench-charm-t4', name: 'Pressure Vessel',
    recipeGroup: 'trench', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 150 }, stats: { recovery: 14 }, // family-tag: Trench native recovery → Dominion
    mechanicEffects: {
      'defense.recovery-skill-potency': 0.30,
      'recovery.cooldown-reduction-pct': 0.15,
    },
    tier: 4,
    icon: 'items/charms/pressure-vessel.png',
    description: 'Built for the long breath held under a crushing deep: every second wind comes sooner, and fills you deeper.',
    upgrades: [
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.02, 'recovery.cooldown-reduction-pct': 0.02 }, cost: { green: 73 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 1.5 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.02, 'recovery.cooldown-reduction-pct': 0.02 }, cost: { green: 183 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 1.5 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.02, 'recovery.cooldown-reduction-pct': 0.02 }, cost: { green: 292 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 1.5 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.02, 'recovery.cooldown-reduction-pct': 0.02 }, cost: { green: 475 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 1.5 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.02, 'recovery.cooldown-reduction-pct': 0.02 }, cost: { green: 803 }, catalystCost: { dominion: 3 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['trench-boots-t4-stalkers', {
    id: 'trench-boots-t4-stalkers', name: 'Abyssal Stalkers',
    recipeGroup: 'trench', requiredBiomeLevel: 4, slot: 'mobility',
    evolvesFrom: 'cave-boots-t3',
    // Cave stealth-boot inheritor — soft stealth: reduces enemy detection radius.
    // 2026-09-26 T2-T4 boots curve normalization: Speed 52->92 (+5: 82->118).
    cost: { green: 80 }, stats: { speed: 92 }, tier: 4, // family-tag: stealth mobility (Cave inheritance) → Swarming
    reconstructCost: { green: 280 }, reconstructCatalystCost: { swarming: 4 },
    mechanicEffects: { 'mobility.stealth-pct': 0.72 },
    icon: 'items/boots/abyssal-stalkers.png',
    description: 'They take you past the great blind hunters unseen — and lend the first strike, when it comes, a killing edge.',
    upgrades: [
      { stats: { speed: 6 }, cost: { green: 50 },  requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 125 },  requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 200 }, requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 326 }, requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 551 }, catalystCost: { swarming: 3 }, requiredBiomeLevel: 4 },
    ],
  }],

  // No evolvesFrom: `mobility.tenacity-pct` matches neither Cave nor Swamp —
  // a genuine T4-only identity (self-identifying comment below predates this
  // pass and is left as-is).
  ['trench-boots-t4-treaders', {
    id: 'trench-boots-t4-treaders', name: 'Abyssal Treaders',
    recipeGroup: 'trench', requiredBiomeLevel: 4, slot: 'mobility',
    // † tenacity-pct: flat, always-on CC duration reduction (distinct from
    //   Graveyard's kill-stack tenacity). Suits the Trench's slow heavy hitters.
    // 2026-09-26 T2-T4 boots curve normalization: Speed 48->57 (+5: 73->73).
    cost: { green: 80 }, stats: { speed: 57 }, tier: 4, // family-tag: Trench native mobility → Dominion
    mechanicEffects: { 'mobility.tenacity-pct': 0.55 },
    icon: 'items/boots/abyssal-treaders.png',
    description: 'Ballasted for the deep — slows and snares and stuns wash over them and recede twice as fast.',
    upgrades: [
      { stats: { speed: 4 }, cost: { green: 50 },  requiredBiomeLevel: 4 },
      { stats: { speed: 3 }, cost: { green: 125 },  requiredBiomeLevel: 4 },
      { stats: { speed: 3 }, cost: { green: 200 }, requiredBiomeLevel: 4 },
      { stats: { speed: 3 }, cost: { green: 326 }, requiredBiomeLevel: 4 },
      { stats: { speed: 3 }, cost: { green: 551 }, catalystCost: { dominion: 3 }, requiredBiomeLevel: 4 },
    ],
  }],


  // Debuff-forward Relic in the abyss: what the trench leaves on you is the point.
  // Moved off Swamp, which stops at T3 — its level-24 gate cost ~1,500 kills of
  // outgrown content. Trench starts at T4, so its whole T4 band is levels 1-6.
  ['relic-virulent-hourglass', {
    id: 'relic-virulent-hourglass', name: 'Virulent Hourglass',
    recipeGroup: 'trench', requiredBiomeLevel: 5, slot: 'relic',
    lineageId: 'relic-virulent-hourglass',
    cost: { green: 3400 }, catalystCost: { dominion: 9 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': 0.20,
      'relic.mechanic-potency': -0.20,
      'relic.mechanic-debuff-effect': 0.25,
    },
    icon: 'items/relics/virulent-hourglass.png',
    description: 'The sand falls quickly; what it leaves behind grows harder to escape.',
  }],

] satisfies [string, Recipe][];
