import type { Recipe } from './types';

// VOLCANIC (debuts T3). Identity: hardening armor / flurry weapon / always-active
// + on-kill Recovery charm. Charm rework: upgrades ramp BOTH mechanics, recovery flat
// (see mountain.recipes.ts header).
//
// T3 economy pass (2026-08-30):
//  · Volcanic is the game's FIRST cross-biome lineage. Emberforge Plate evolves from
//    the PLAINS vest and Magmaheart Stone from the PLAINS charm — the retiring starter
//    biome's plating and kill-chain-Recovery mechanics matured here. Priced at 2.2× the
//    predecessor (Plains' T2 costs are deliberately depressed for early accessibility,
//    so a flat 2.0× would land them under every other T3 item in their slot).
//  · Home essence follows the BIOME (red); the splash follows the BORROWED MECHANIC
//    (yellow, from Plains). Both rules hold at once — Volcanic staying red while paying
//    a yellow splash is the hybrid model working, not a colour bug.
//  · Catalyst families assigned for the first time (this file previously charged none
//    anywhere). Family follows the ITEM, not the biome: the two Plains-derived items
//    inherit their parents' `alacrity` tag; the two genuinely-new items take Volcanic's
//    native `swarming`.

export const volcanicRecipeEntries = [

  ['volcanic-cinderlash', {
    id: 'volcanic-cinderlash', name: 'Cinderlash',
    recipeGroup: 'volcanic', requiredBiomeLevel: 1, slot: 'weapon',
    // GENUINELY NEW (no T2 flurry weapon exists). Knight's Steelsword is NOT its
    // parent: that item's whole identity is technique CDR, which was retired to the
    // Arcanist Core, not to a weapon. Priced at the top of the T3 weapon band.
    cost: { red: 140 }, stats: { attack: 34 }, attacksPerSecond: 1.65, tier: 3, // family-tag: new Volcanic item → Swarming (native)
    mechanicEffects: { 'weapon.flurry-pct': 0.03, 'weapon.flurry-stacks': 5 },
    icon: 'items/weapons/cinderlash.png',
    description: 'A whip of braided ember that strikes faster the longer it burns.',
    upgrades: [
      { stats: { attack: 6 }, cost: { red: 96 },  requiredBiomeLevel: 2 },
      { stats: { attack: 6 }, cost: { red: 240 }, requiredBiomeLevel: 3 },
      { stats: { attack: 6 }, cost: { red: 384 }, requiredBiomeLevel: 4 },
      { stats: { attack: 6 }, cost: { red: 624 }, catalystCost: { swarming: 2 }, requiredBiomeLevel: 4 },
      { stats: { attack: 6 }, cost: { red: 1056 }, catalystCost: { swarming: 3 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['volcanic-vest-t3', {
    id: 'volcanic-vest-t3', name: 'Emberforge Plate',
    recipeGroup: 'volcanic', requiredBiomeLevel: 2, slot: 'armor',
    // CROSS-BIOME LINEAGE: evolves from the Plains vest (Enduring Robe). Plating is
    // carried forward literally, on the same stat key, and matured with the hardening ramp.
    evolvesFrom: 'plains-vest-t2',
    cost: { red: 120, yellow: 30 }, stats: { maxHp: 90, plating: 20 }, // family-tag: inherits plains-vest-t2's Alacrity (plating answers frequent light hits)
    reconstructCost: { red: 420, yellow: 105 }, reconstructCatalystCost: { alacrity: 3 },
    mechanicEffects: { 'defense.hardening-per-sec': 3, 'defense.hardening-max': 24, 'defense.hardening-reset-pct': 0.25 },
    tier: 3,
    icon: 'items/armor/emberforge-plate.png',
    description: 'Plate quenched in a lava flow; it thickens against a steady fire and cracks only to a true blow.',
    upgrades: [
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 58, yellow: 20 },  requiredBiomeLevel: 3 },
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 146, yellow: 50 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 234, yellow: 80 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 380, yellow: 130 }, catalystCost: { alacrity: 2 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 20, plating: 5 }, cost: { red: 646, yellow: 218 }, catalystCost: { alacrity: 3 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Charm: recovery flat; upgrades ramp active Recovery 0.14 -> 0.20 AND on-kill 0.08 -> 0.14.
  ['volcanic-charm-t3', {
    id: 'volcanic-charm-t3', name: 'Magmaheart Stone',
    recipeGroup: 'volcanic', requiredBiomeLevel: 3, slot: 'recovery',
    // CROSS-BIOME LINEAGE: evolves from the Plains charm (Stalwart Heart). Identical
    // `defense.recovery-on-kill-pct` key, extended with an always-active half.
    evolvesFrom: 'plains-charm-t2',
    cost: { red: 75, yellow: 25 }, stats: { recovery: 11 }, // family-tag: inherits plains-charm-t2's Alacrity
    reconstructCost: { red: 263, yellow: 88 }, reconstructCatalystCost: { alacrity: 3 },
    mechanicEffects: { 'defense.recovery-active-pct': 0.06, 'defense.recovery-on-kill-pct': 0.04 },
    tier: 3,
    icon: 'items/charms/magmaheart-stone.png',
    description: 'A still-molten heart that mends you mid-fight, and flares with every kill.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-active-pct': 0.02, 'defense.recovery-on-kill-pct': 0.02 }, cost: { red: 30, yellow: 10 },  requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-active-pct': 0.02, 'defense.recovery-on-kill-pct': 0.02 }, cost: { red: 75, yellow: 25 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-active-pct': 0.02, 'defense.recovery-on-kill-pct': 0.02 }, cost: { red: 120, yellow: 40 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-active-pct': 0.02, 'defense.recovery-on-kill-pct': 0.02 }, cost: { red: 195, yellow: 65 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-active-pct': 0.02, 'defense.recovery-on-kill-pct': 0.02 }, cost: { red: 330, yellow: 110 }, catalystCost: { alacrity: 2 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['volcanic-boots-t3', {
    id: 'volcanic-boots-t3', name: 'Magma Walkers',
    recipeGroup: 'volcanic', requiredBiomeLevel: 4, slot: 'mobility',
    // GENUINELY NEW. Plains' Gale Boots are NOT its parent: kill-momentum
    // (`mobility.kill-speed-pct`) is the opposite shape to a standing bonus that is
    // SUPPRESSED on being hit. Kill momentum genuinely ends at T2.
    cost: { red: 74 }, stats: { speed: 36 }, tier: 3, // family-tag: new Volcanic item → Swarming (native)
    mechanicEffects: { 'mobility.passive-speed-pct': 0.55, 'mobility.suppress-ms': 4000 },
    icon: 'items/boots/magma-walkers.png',
    description: 'Quick as a thrown spark — until a solid blow knocks the wind from them.',
    upgrades: [
      { stats: { speed: 8 },  cost: { red: 24 },  requiredBiomeLevel: 4 },
      { stats: { speed: 12 }, cost: { red: 61 },  requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { red: 97 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { red: 158 }, requiredBiomeLevel: 4 },
      { stats: { speed: 16 }, cost: { red: 266 }, catalystCost: { swarming: 2 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T4 ──
  // T4 economy pass (2026-08-30): each item now EVOLVES from its T3 predecessor at
  // +5 (T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §4/§11). Costs are 2.00× the
  // finalized T3 lifetime total on the shipped accelerating curve. Catalyst family
  // inheritance is deliberately non-native for two of the three slots: the weapon
  // and boots inherit Cinderlash/Magma Walkers' own `swarming` family; the two
  // armor branches and the charm inherit Emberforge Plate/Magmaheart Stone's
  // `alacrity` family (itself inherited from their Plains ancestors) — NOT
  // Volcanic's native `swarming` — verified present at Volcanic T4 nodes.
  ['volcanic-eruption-lash', {
    id: 'volcanic-eruption-lash', name: 'Eruption Lash',
    recipeGroup: 'volcanic', requiredBiomeLevel: 7, slot: 'weapon',
    evolvesFrom: 'volcanic-cinderlash',
    cost: { red: 308 }, stats: { attack: 58 }, attacksPerSecond: 1.80, tier: 4, // family-tag: flurry weapon → Swarming
    reconstructCost: { red: 1078 }, reconstructCatalystCost: { swarming: 4 },
    mechanicEffects: { 'weapon.flurry-pct': 0.04, 'weapon.flurry-stacks': 5 },
    icon: 'items/weapons/eruption-lash.png',
    description: 'A braided whip of ember that strikes faster the longer it is allowed to burn.',
    upgrades: [
      { stats: { attack: 11 }, cost: { red: 191 }, requiredBiomeLevel: 8 },
      { stats: { attack: 11 }, cost: { red: 477 }, requiredBiomeLevel: 9 },
      { stats: { attack: 11 }, cost: { red: 764 }, requiredBiomeLevel: 10 },
      { stats: { attack: 11 }, cost: { red: 1241 }, catalystCost: { swarming: 3 }, requiredBiomeLevel: 10 },
      { stats: { attack: 11 }, cost: { red: 2099 }, catalystCost: { swarming: 4 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['volcanic-blightbrand', {
    // Recipe id kept stable (persisted); renamed off "blight" (now poison-coded)
    // onto fire vocabulary — Volcanic owns the fire DoT line.
    id: 'volcanic-blightbrand', name: 'Cinderbrand',
    recipeGroup: 'volcanic', requiredBiomeLevel: 7, slot: 'weapon',
    evolvesFrom: 'volcanic-cinderlash',
    // Evolves from Cinderlash (T3), continuing its `weapon.flurry-pct` family.
    // Economy resolved by the T4 pass; base `attack` value has NOT been
    // revalidated against current combat formulas — that remains a separate
    // balance question.
    cost: { red: 290 }, stats: { attack: 70 }, attacksPerSecond: 1.20, tier: 4, // family-tag: fast-DoT weapon → Swarming
    reconstructCost: { red: 1015 }, reconstructCatalystCost: { swarming: 4 },
    weaponDot: { effectId: 'cinderbrand-burn', convPct: 0.50, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'fire' },
    icon: 'items/weapons/cinderbrand.png',
    description: 'It leaves a fire under the skin that does the rest of the work while you move on.',
    upgrades: [
      { stats: { attack: 20 }, cost: { red: 192 }, requiredBiomeLevel: 8 },
      { stats: { attack: 20 }, cost: { red: 479 }, requiredBiomeLevel: 9 },
      { stats: { attack: 20 }, cost: { red: 766 }, requiredBiomeLevel: 10 },
      { stats: { attack: 20 }, cost: { red: 1245 }, catalystCost: { swarming: 3 }, requiredBiomeLevel: 10 },
      { stats: { attack: 20 }, cost: { red: 2108 }, catalystCost: { swarming: 4 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['volcanic-vest-t4', {
    id: 'volcanic-vest-t4', name: 'Pyroclasm Mantle',
    recipeGroup: 'volcanic', requiredBiomeLevel: 8, slot: 'armor',
    evolvesFrom: 'volcanic-vest-t3',
    cost: { red: 220, yellow: 55 }, stats: { maxHp: 165, plating: 38 }, // family-tag: hardening armor → Alacrity
    reconstructCost: { red: 770, yellow: 193 }, reconstructCatalystCost: { alacrity: 4 },
    // † hardening-max-dr-bonus: at max hardening, +6% DR for 3s before reset.
    mechanicEffects: {
      'defense.hardening-per-sec': 4, 'defense.hardening-max': 32, 'defense.hardening-reset-pct': 0.25,
      'defense.hardening-max-dr-bonus': 0.06, 'defense.hardening-max-dr-ms': 3000,
    },
    tier: 4,
    icon: 'items/armor/pyroclasm-mantle.png',
    description: 'It thickens against a steady fire until, at its hardest, it shrugs off even a true blow — once.',
    upgrades: [
      { stats: { maxHp: 40, plating: 10 }, cost: { red: 126, yellow: 32 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 40, plating: 10 }, cost: { red: 316, yellow: 79 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 40, plating: 10 }, cost: { red: 506, yellow: 126 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 40, plating: 10 }, cost: { red: 822, yellow: 205 }, catalystCost: { alacrity: 3 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 40, plating: 10 }, cost: { red: 1390, yellow: 347 }, catalystCost: { alacrity: 4 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['volcanic-vest-t4-lavatempered', {
    id: 'volcanic-vest-t4-lavatempered', name: 'Lava-Tempered Hide',
    recipeGroup: 'volcanic', requiredBiomeLevel: 8, slot: 'armor',
    evolvesFrom: 'volcanic-vest-t3',
    cost: { red: 220, yellow: 55 }, stats: { maxHp: 150, plating: 28 }, // family-tag: hardening armor → Alacrity
    reconstructCost: { red: 770, yellow: 193 }, reconstructCatalystCost: { alacrity: 4 },
    // † overheal-ward-pct: overheal from always-active Recovery becomes a temporary ward.
    //   Pairs naturally with Inferno Heart. (new key)
    mechanicEffects: {
      'defense.hardening-per-sec': 3, 'defense.hardening-max': 24, 'defense.hardening-reset-pct': 0.25,
      'defense.overheal-ward-pct': 0.50,
    },
    tier: 4,
    icon: 'items/armor/lava-tempered-hide.png',
    description: 'Quenched in a living flow, it banks the overflow of your own healing into a crust of fresh stone.',
    upgrades: [
      { stats: { maxHp: 36, plating: 7 }, cost: { red: 126, yellow: 32 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 36, plating: 7 }, cost: { red: 316, yellow: 79 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 36, plating: 7 }, cost: { red: 506, yellow: 126 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 36, plating: 7 }, cost: { red: 822, yellow: 205 }, catalystCost: { alacrity: 3 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 36, plating: 7 }, cost: { red: 1390, yellow: 347 }, catalystCost: { alacrity: 4 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['volcanic-charm-t4', {
    id: 'volcanic-charm-t4', name: 'Inferno Heart',
    recipeGroup: 'volcanic', requiredBiomeLevel: 9, slot: 'recovery',
    evolvesFrom: 'volcanic-charm-t3',
    cost: { red: 200, yellow: 50 }, stats: { recovery: 16 }, // family-tag: on-kill Recovery charm → Alacrity
    reconstructCost: { red: 700, yellow: 175 }, reconstructCatalystCost: { alacrity: 4 },
    mechanicEffects: { 'defense.recovery-active-pct': 0.06, 'defense.recovery-on-kill-pct': 0.04 },
    tier: 4,
    icon: 'items/charms/inferno-heart.png',
    description: 'A heart that never fully cools — it mends you mid-swing and flares brighter with every fallen foe.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-active-pct': 0.02, 'defense.recovery-on-kill-pct': 0.02 }, cost: { red: 62, yellow: 16 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-active-pct': 0.02, 'defense.recovery-on-kill-pct': 0.02 }, cost: { red: 156, yellow: 39 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-active-pct': 0.02, 'defense.recovery-on-kill-pct': 0.02 }, cost: { red: 250, yellow: 62 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-active-pct': 0.02, 'defense.recovery-on-kill-pct': 0.02 }, cost: { red: 406, yellow: 101 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-active-pct': 0.02, 'defense.recovery-on-kill-pct': 0.02 }, cost: { red: 686, yellow: 172 }, catalystCost: { alacrity: 3 }, requiredBiomeLevel: 10 },
    ],
  }],

  // T4 boots — passive-speed (fast, suppressed when hit). T3 0.55/4000 → T4 0.70/3500.
  ['volcanic-boots-t4', {
    id: 'volcanic-boots-t4', name: 'Pyroclast Treads',
    recipeGroup: 'volcanic', requiredBiomeLevel: 10, slot: 'mobility',
    evolvesFrom: 'volcanic-boots-t3',
    cost: { red: 163 }, stats: { speed: 50 }, tier: 4, // family-tag: volcanic passive-speed mobility → Swarming
    reconstructCost: { red: 571 }, reconstructCatalystCost: { swarming: 4 },
    mechanicEffects: { 'mobility.passive-speed-pct': 0.70, 'mobility.suppress-ms': 3500 },
    icon: 'items/boots/pyroclast-treads.png',
    description: 'Swift as a thrown ember — until a solid blow stalls them, and the heat must build again.',
    upgrades: [
      { stats: { speed: 10 }, cost: { red: 48 },  requiredBiomeLevel: 10 },
      { stats: { speed: 14 }, cost: { red: 120 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { red: 192 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { red: 311 }, requiredBiomeLevel: 10 },
      { stats: { speed: 18 }, cost: { red: 526 }, catalystCost: { swarming: 3 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Volcanic owns THE STRIKE ITSELF —
  // burn weapons and heat, so it is where the on-hit amplifier comes from.

  // T3 unrestricted — Catalyst: scales the flat on-hit term, which lands AFTER
  // plating and DR. That unmitigated placement is what makes it a real axis rather
  // than a second attack multiplier, and it is why it shines against armour.
  ['core-catalyst', {
    id: 'core-catalyst', name: 'Catalyst Core',
    recipeGroup: 'volcanic', requiredBiomeLevel: 3, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-catalyst',
    cost: { red: 90 }, catalystCost: { swarming: 2 }, // family-tag: on-hit proc amplifier → Swarming
    stats: {}, tier: 3,
    // Trading attack (mitigated) for on-hit (unmitigated) is the actual shape here:
    // better against heavily armoured targets, worse against soft ones. Worth little
    // to a build carrying no on-hit damage — the specialisation is the cost.
    mechanicEffects: { 'core.onhit-mult': 1.15, 'core.attack-mult': -0.15 },
    icon: 'items/cores/catalyst.png',
    description: 'Amplifies on-hit damage you already have; it grants none by itself. Armour is no comfort against something already inside it.',
  }],

  // Frequency-forward Relic (many small mechanic events) in the biome whose native
  // family is Swarming. Moved off Forest, which has no T4 nodes: its level-24 gate
  // cost ~7,000 kills of T2 content that a T4 character has long outgrown.
  // Volcanic starts at T3, so its T4 band is levels 7-12.
  ['relic-hastebound-dial', {
    id: 'relic-hastebound-dial', name: 'Hastebound Dial',
    recipeGroup: 'volcanic', requiredBiomeLevel: 11, slot: 'relic',
    lineageId: 'relic-hastebound-dial',
    cost: { red: 220 }, catalystCost: { swarming: 4 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': 0.35,
      'relic.mechanic-potency': -0.25,
    },
    icon: 'items/relics/hastebound-dial.png',
    description: 'The dial runs ahead of every rhythm, trading weight for relentless motion.',
  }],

] satisfies [string, Recipe][];
