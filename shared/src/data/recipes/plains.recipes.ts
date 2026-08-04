import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// PLAINS — full lineage (T1→T2; retires after T2). Identity: plating armor /
// kill-burst charm / honest no-mechanic broadsword. Charm rework: see header
// in mountain.recipes.ts (upgrades ramp the mechanic; hpRegen flat).
// ─────────────────────────────────────────────────────────────────────────

export const plainsRecipeEntries = [
  // ── T1 ──
  // cheaper than other weapons in the same tier, below average DPS
  ['iron-broadsword', {
    id: 'iron-broadsword', name: 'Iron Broadsword',
    recipeGroup: 'plains', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { yellow: 10 }, stats: { attack: 10 }, attacksPerSecond: 0.75, tier: 1,
    icon: 'items/weapons/iron-broadsword.png',
    description: 'Mass-forged for the ranks, dependable as sunrise. Ten thousand like it have won quiet wars.',
    upgrades: [
      { stats: { attack: 4 }, cost: { yellow: 20 }, requiredBiomeLevel: 2 },
      { stats: { attack: 4 }, cost: { yellow: 30 }, requiredBiomeLevel: 3 },
      { stats: { attack: 4 }, cost: { yellow: 60 }, requiredBiomeLevel: 4 },
      { stats: { attack: 4 }, cost: { yellow: 60 }, requiredBiomeLevel: 4 },
      { stats: { attack: 4 }, cost: { yellow: 60 }, requiredBiomeLevel: 4 },
    ],
  }],

  // silently the hero of tier 1
  ['plains-vest-t1', {
    id: 'plains-vest-t1', name: "Survivor's Robe",
    recipeGroup: 'plains', requiredBiomeLevel: 2, slot: 'armor',
    cost: { yellow: 20 }, stats: { maxHp: 14, plating: 9 }, tier: 1,
    icon: 'items/armor/survivors-robe.png',
    description: 'Field plate patched and repatched by those who lived to patch it.',
    upgrades: [
      { stats: { maxHp: 4, plating: 3 }, cost: { yellow: 30 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 4, plating: 3 }, cost: { yellow: 60 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4, plating: 3 }, cost: { yellow: 120 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4, plating: 3 }, cost: { yellow: 120 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4, plating: 3 }, cost: { yellow: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  // CHARM (kill-burst): base 0.05 -> +0.01/step -> 0.08 at +3. hpRegen 4 flat.
  // + Guard amplifier (Step 8): potency — makes the Guard effect hit harder. PLACEHOLDER.
  ['plains-charm-t1', {
    id: 'plains-charm-t1', name: 'Plains Stone',
    recipeGroup: 'plains', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { yellow: 10 }, stats: { hpRegen: 4 },
    mechanicEffects: { 'defense.kill-burst-pct': 0.05, 'guard.potency-pct': 0.20 },
    tier: 1,
    icon: 'items/charms/plains-stone.png',
    description: 'A sun-warmed stone from the heart of the grasslands, humming with quiet vigor.',
    upgrades: [
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 12 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 24 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 48 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 48 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 48 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['plains-boots-t1', {
    id: 'plains-boots-t1', name: 'Fleet Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { yellow: 10 }, stats: { speed: 25 }, tier: 1,
    mechanicEffects: { 'mobility.ooc-speed-pct': 0.40 },
    icon: 'items/boots/fleet-boots.png',
    description: 'Open sandals built for crossing flat ground at a dead run.',
    upgrades: [
      { stats: { speed: 3 }, cost: { yellow: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { yellow: 20 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { yellow: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { yellow: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { yellow: 40 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  ['knight-steelsword', {
    id: 'knight-steelsword', name: "Knight's Steelsword",
    recipeGroup: 'plains', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { yellow: 45 }, stats: { attack: 25 }, attacksPerSecond: 1.00, tier: 2,
    icon: 'items/weapons/knight-steelsword.png',
    // Technique cooldown reduction (abilities evolution §6.3): the offensive
    // sibling of the charm-borne `guard.*` amplifiers. Plains is the generalist
    // biome, so its T2 sidearm carries the generalist Technique stat. PLACEHOLDER.
    mechanicEffects: { 'technique.cooldown-reduction-pct': 0.12 },
    description: 'A knight sidearm kept keen by habit and pride — plain, proven, never flashy.',
    upgrades: [
      { stats: { attack: 10 }, cost: { yellow: 45 }, requiredBiomeLevel: 8 },
      { stats: { attack: 10 }, cost: { yellow: 90 }, requiredBiomeLevel: 9 },
      { stats: { attack: 10 }, cost: { yellow: 180 }, requiredBiomeLevel: 10 },
      { stats: { attack: 10 }, cost: { yellow: 180 }, requiredBiomeLevel: 10 },
      { stats: { attack: 10 }, cost: { yellow: 180 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['plains-vest-t2', {
    id: 'plains-vest-t2', name: 'Enduring Robe',
    recipeGroup: 'plains', requiredBiomeLevel: 8, slot: 'armor',
    cost: { yellow: 60 }, catalystCost: { alacrity: 2 }, stats: { maxHp: 24, plating: 16 }, tier: 2, // family-tag: plating answers frequent light hits → Alacrity
    icon: 'items/armor/enduring-robe.png',
    description: 'Plate that has outlasted the wars it was made for, and the smith who made it.',
    upgrades: [
      { stats: { maxHp: 6, plating: 4 }, cost: { yellow: 60 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 6, plating: 4 }, cost: { yellow: 120 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 6, plating: 4 }, cost: { yellow: 240 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 6, plating: 4 }, cost: { yellow: 240 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 6, plating: 4 }, cost: { yellow: 240 }, requiredBiomeLevel: 10 },
    ],
  }],

  // CHARM (kill-burst): base 0.09 -> +0.01/step -> 0.12 at +3. hpRegen 7 flat.
  ['plains-charm-t2', {
    id: 'plains-charm-t2', name: 'Stalwart Heart',
    recipeGroup: 'plains', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { yellow: 50 }, catalystCost: { alacrity: 2 }, stats: { hpRegen: 7 }, // family-tag: kill-burst answers swarm attrition → Alacrity
    mechanicEffects: { 'defense.kill-burst-pct': 0.09 },
    tier: 2,
    icon: 'items/charms/stalwart-heart.png',
    description: 'A greater plains-stone, its warmth swelling with every foe laid low.',
    upgrades: [
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 30 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 60 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 120 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 120 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 120 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['plains-boots-t2', {
    id: 'plains-boots-t2', name: 'Gale Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { yellow: 40 }, catalystCost: { alacrity: 2 }, stats: { speed: 36 }, tier: 2, // family-tag: plains speed → Alacrity (Broadsword weapon stays neutral — flexible payment, deferred)
    mechanicEffects: { 'mobility.ooc-speed-pct': 0.55 },
    icon: 'items/boots/gale-boots.png',
    description: 'Wind-cured leather that seems to lean into every stride.',
    upgrades: [
      { stats: { speed: 3 }, cost: { yellow: 20 }, requiredBiomeLevel: 10 },
      { stats: { speed: 4 }, cost: { yellow: 40 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { yellow: 80 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { yellow: 80 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { yellow: 80 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────
  //
  // CANONICAL HEADER FOR THE WHOLE CORE CAST — other biomes' core blocks point here.
  // Design source: design_docs/CORE_DESIGN_PHILOSOPHY.md + CORE_CAST_REVIEW_DRAFT.md.
  //
  // WHAT A CORE IS: the 5th equipment slot, one at a time. A core MAGNIFIES what a
  // build already does — it does not add a new attack, resource, or payoff loop
  // (those belong to Techniques and Paths). Effects are percentage multipliers on
  // your FINAL summed stats (`core.*-mult`, summed across sources, applied once),
  // plus a few keys with their own consumers. Negative values are tradeoffs.
  //
  // ELIGIBILITY is binary — full effect or nothing at all, including the tradeoffs:
  //   melee        — close-range builds only
  //   ranged       — mid AND far builds (one pool)
  //   unrestricted — every build; lower ceiling, no commitment
  //
  // TIER PLACEMENT IS LOad-BEARING. A range is not chosen until PLAYER TIER 3, so a
  // restricted core placed in a T2 biome-level band is craftable but permanently
  // inert — which is exactly the bug the original placeholder cast shipped with.
  //   T2 starters   -> unrestricted only, T1 biomes at level 7-8
  //   T3 cores      -> T1 biomes level 13-18 | T2 biomes level 7-12 | T3 biomes level 1-6
  // Each T3 core sits MID-band so the biome's challenge is met before its answer is
  // earned (same convention as ability placement).
  //
  // Cores are OFF the +N upgrade track. They grow by EVOLVING into one of several
  // named branches at the next tier — one evolve, one decision. Every core therefore
  // carries a `lineageId` for those future branches to hang from.
  //
  // ALL NUMBERS ARE PLACEHOLDERS inside the design doc's bands, pending the balance pass.
  //
  // The cast, one core per biome (forest/cave/mountain carry two):
  //   plains   Tempered      swamp    Controller     tundra   Scout
  //   forest   Survivalist   jungle   Bruiser        volcanic Catalyst
  //            Accelerant    desert   Sniper
  //   cave     Force         mountain Juggernaut
  //            Duelist                Arcanist

  // T2 starter — Tempered: the benchmark. Deliberately simple and never a trap,
  // so specialising stays a choice rather than a requirement.
  ['core-tempered', {
    id: 'core-tempered', name: 'Tempered Core',
    recipeGroup: 'plains', requiredBiomeLevel: 7, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-tempered',
    cost: { yellow: 45 }, catalystCost: { volatility: 1 }, // family-tag: reliable always-on generalist → Volatility
    stats: {}, tier: 2,
    mechanicEffects: { 'core.attack-mult': 0.09, 'core.maxhp-mult': 0.09 },
    icon: 'items/cores/tempered.png',
    description: 'Balanced for any hand. It asks no commitment, and rewards none in particular.',
  }],

  ['relic-equilibrium-shard', {
    id: 'relic-equilibrium-shard', name: 'Equilibrium Shard',
    recipeGroup: 'plains', requiredBiomeLevel: 24, slot: 'relic',
    lineageId: 'relic-equilibrium-shard',
    cost: { yellow: 200 }, catalystCost: { volatility: 4 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': 0.10,
      'relic.mechanic-potency': 0.10,
    },
    icon: 'items/relics/equilibrium-shard.png',
    description: 'A clean answer with no hidden edge: a little more rhythm, a little more force.',
  }],

] satisfies [string, Recipe][];
