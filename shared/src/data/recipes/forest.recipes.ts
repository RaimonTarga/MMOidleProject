import type { Recipe } from './types';

// FOREST (T1-T2; retires at T2). Identity: EVASION armor / raw OOC-regen charm /
// fast weapon. The charm is pure-regen -> it keeps upgrading hpRegen (its identity).

export const forestRecipeEntries = [
  // ── Rapier lineage (system rework Step 6 worked example) ───────────────────
  // Flash Rapier (base) → Gale Needle / Thorn Needle (branches). Evolve consumes
  // the +3 predecessor; reconstruction skips the chain for a higher cost. All
  // numbers below are PLACEHOLDERS for the balance pass.
  ['flash-rapier', {
    id: 'flash-rapier', name: 'Flash Rapier',
    recipeGroup: 'forest', requiredBiomeLevel: 1, slot: 'weapon',
    lineageId: 'rapier',
    cost: { green: 20 }, stats: { attack: 5 }, attacksPerSecond: 1.50, tier: 1,
    icon: 'items/weapons/flash-rapier.png',
    description: 'Forged thin as a reed by duelists who prized speed above all.',
    upgrades: [
      { stats: { attack: 2 }, cost: { green: 30 }, requiredBiomeLevel: 2 },
      { stats: { attack: 2 }, cost: { green: 60 }, requiredBiomeLevel: 3 },
      { stats: { attack: 2 }, cost: { green: 120 }, requiredBiomeLevel: 4 }, // +3 = evolution-ready
      { stats: { attack: 2 }, cost: { green: 240 }, requiredBiomeLevel: 5 }, // +4 comfort (placeholder)
      { stats: { attack: 3 }, cost: { green: 480 }, requiredBiomeLevel: 6 }, // +5 premium (placeholder)
    ],
  }],

  ['forest-vest-t1', {
    id: 'forest-vest-t1', name: 'Shaded Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 20 }, stats: { maxHp: 24, plating: 4, evasion: 0.18 }, tier: 1,
    icon: 'items/armor/shaded-bindings.png',
    description: 'Woven in the dappled dark beneath the canopy, where shadow clings to cloth.',
    upgrades: [
      { stats: { maxHp: 6, plating: 1, evasion: 0.04 }, cost: { green: 30 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 6, plating: 1, evasion: 0.04 }, cost: { green: 60 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 1, evasion: 0.04 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 1, evasion: 0.04 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 1, evasion: 0.04 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Pure-regen charm + recovery-themed Guard amplifier (Step 8): faster Guard +
  // a heal when it fires. Pairs with the forest Guard ability (Brace). PLACEHOLDER numbers.
  ['forest-charm-t1', {
    id: 'forest-charm-t1', name: 'Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 15 }, stats: { hpRegen: 6 }, tier: 1,
    mechanicEffects: { 'guard.cooldown-reduction-pct': 0.15, 'guard.heal-on-fire-pct': 0.08 },
    icon: 'items/charms/heartroot-amulet.png',
    description: 'Heartroot drawn from the oldest tree in the grove, still faintly warm.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { green: 15 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { green: 30 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { green: 60 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { green: 60 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { green: 60 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['forest-boots-t1', {
    id: 'forest-boots-t1', name: 'Sprinter Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { green: 10 }, stats: { speed: 20 }, tier: 1,
    mechanicEffects: { 'mobility.kill-speed-pct': 0.25, 'mobility.kill-speed-ms': 2000 },
    icon: 'items/boots/sprinter-wraps.png',
    description: 'Strips of supple hide that move when you move, and never before.',
    upgrades: [
      { stats: { speed: 3 }, cost: { green: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { green: 20 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { green: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { green: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { green: 40 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 — Rapier lineage evolved forms (system rework Step 6) ───────────────
  // Gale Needle = the primary evolution of Flash Rapier; Thorn Needle = a branch.
  // Evolve consumes the predecessor at +3; reconstruct skips it for a higher cost.
  // Evolution/reconstruct numbers are PLACEHOLDERS for the balance pass.
  ['gale-needle', {
    id: 'gale-needle', name: 'Gale Needle',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'weapon',
    lineageId: 'rapier', evolvesFrom: 'flash-rapier',
    cost: { green: 60 }, catalystCost: { alacrity: 2 },           // family-tag: fast rapier → Alacrity
    reconstructCost: { green: 240 }, reconstructCatalystCost: { alacrity: 5 }, // RECONSTRUCT (no predecessor)
    stats: { attack: 18 }, attacksPerSecond: 1.60, tier: 2,
    icon: 'items/weapons/gale-needle.png',
    description: 'A fencing blade machined to an impossible point, humming faintly when drawn.',
    upgrades: [
      { stats: { attack: 6 }, cost: { green: 60 }, requiredBiomeLevel: 8 },
      { stats: { attack: 6 }, cost: { green: 120 }, requiredBiomeLevel: 9 },
      { stats: { attack: 6 }, cost: { green: 240 }, requiredBiomeLevel: 10 }, // +3 evolution-ready
      { stats: { attack: 6 }, cost: { green: 480 }, requiredBiomeLevel: 11 }, // +4 comfort (placeholder)
      { stats: { attack: 8 }, cost: { green: 960 }, requiredBiomeLevel: 12 }, // +5 premium (placeholder)
    ],
  }],

  ['thorn-needle', {
    id: 'thorn-needle', name: 'Thorn Needle',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'weapon',
    lineageId: 'rapier', evolvesFrom: 'flash-rapier',         // branch B of the rapier lineage
    cost: { green: 50, purple: 20 }, catalystCost: { alacrity: 2 }, // family-tag: rapid on-hit rapier → Alacrity (bleed flavor could argue Blight)
    reconstructCost: { green: 200, purple: 80 }, reconstructCatalystCost: { alacrity: 5 },
    stats: { attack: 13, onHitDamage: 4 }, attacksPerSecond: 1.50, tier: 2,
    icon: 'items/weapons/thorn-needle.png',
    description: 'The same blade, barbed — it bites and lets the wound do the rest.',
    upgrades: [
      { stats: { onHitDamage: 2 }, cost: { green: 60, purple: 20 }, requiredBiomeLevel: 8 },
      { stats: { onHitDamage: 2 }, cost: { green: 120, purple: 40 }, requiredBiomeLevel: 9 },
      { stats: { attack: 4 }, cost: { green: 240, purple: 80 }, requiredBiomeLevel: 10 }, // +3 evolution-ready
      { stats: { onHitDamage: 3 }, cost: { green: 480, purple: 160 }, requiredBiomeLevel: 11 }, // +4
      { stats: { attack: 4, onHitDamage: 2 }, cost: { green: 960, purple: 320 }, requiredBiomeLevel: 12 }, // +5
    ],
  }],

  ['forest-vest-t2', {
    id: 'forest-vest-t2', name: 'Phantom Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 8, slot: 'armor',
    cost: { green: 48, yellow: 12 }, catalystCost: { alacrity: 2 }, stats: { maxHp: 43, plating: 6, evasion: 0.28 }, tier: 2, // family-tag: evasion armor answers frequent light hits → Alacrity
    icon: 'items/armor/phantom-bindings.png',
    description: 'They say the weaver vanished the day it was finished. The cloth remembers the trick.',
    upgrades: [
      { stats: { maxHp: 12, plating: 2, evasion: 0.06 }, cost: { green: 45, yellow: 15 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.06 }, cost: { green: 90, yellow: 30 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.06 }, cost: { green: 180, yellow: 60 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.06 }, cost: { green: 180, yellow: 60 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 12, plating: 2, evasion: 0.06 }, cost: { green: 180, yellow: 60 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 10 },
    ],
  }],

  // Pure-regen charm: keeps upgrading hpRegen.
  ['forest-charm-t2', {
    id: 'forest-charm-t2', name: 'Ancient Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { green: 50 }, stats: { hpRegen: 10 }, tier: 2,
    icon: 'items/charms/ancient-heartroot-amulet.png',
    description: 'A relic of a grove that burned an age ago, its life somehow undimmed.',
    upgrades: [
      { stats: { hpRegen: 3 }, cost: { green: 30 }, requiredBiomeLevel: 10 },
      { stats: { hpRegen: 3 }, cost: { green: 60 }, requiredBiomeLevel: 10 },
      { stats: { hpRegen: 3 }, cost: { green: 120 }, requiredBiomeLevel: 10 },
      { stats: { hpRegen: 3 }, cost: { green: 120 }, requiredBiomeLevel: 10 },
      { stats: { hpRegen: 3 }, cost: { green: 120 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['forest-boots-t2', {
    id: 'forest-boots-t2', name: 'Windstep Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { green: 40 }, stats: { speed: 31 }, tier: 2,
    mechanicEffects: { 'mobility.kill-speed-pct': 0.35, 'mobility.kill-speed-ms': 2000 },
    icon: 'items/boots/windstep-wraps.png',
    description: 'Light enough that the wind mistakes the wearer for one of its own.',
    upgrades: [
      { stats: { speed: 3 }, cost: { green: 20 }, requiredBiomeLevel: 10 },
      { stats: { speed: 4 }, cost: { green: 40 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { green: 80 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { green: 80 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { green: 80 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── T2 — Cores (system rework Step 9, worked examples) ─────────────────────
  // The 5th equipment slot: a role/range amplifier. Cores apply as PERCENTAGE
  // MULTIPLIERS on your overall stats (`core.*-mult`, summed across sources then
  // applied once), plus a SEPARATE multiplicative damage-reduction layer
  // (`core.dr-layer-pct`: final = base × (1−DR) × (1−layer), so 50%+50% ⇒ 25% taken).
  // Negative multipliers reduce a stat (tradeoffs). Restricted cores (melee/ranged)
  // deliver their FULL effect ONLY when the player's selectedRange qualifies —
  // otherwise they contribute nothing at all (dimmed in the UI). Unrestricted cores
  // are weaker but always-on. Cores are OFF the +N upgrade track.
  //
  // ⚠ SUPERSEDED — these five are the original placeholder cast and are scheduled for
  // deletion in Phase C of `docs/cores-rework-implementation-plan.md`. They are also
  // TIER-MISPLACED: they sit in the T2 biome-level band, but a range is not chosen
  // until player tier 3, so the three restricted ones are craftable-but-inert for the
  // whole of T2. Do not author new cores against this block — the replacement cast is
  // spread one core per biome with correct tier bands.

  // Close — Bastion: durability under melee risk (the anti-ranged-dominance lever).
  ['forest-core-bastion', {
    id: 'forest-core-bastion', name: 'Bastion Core',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'core', coreEligibility: 'melee',
    lineageId: 'forest-core-bastion',
    cost: { green: 60 }, catalystCost: { brutality: 2 }, // family-tag: anti-spike durability wall → Brutality
    stats: {}, tier: 2,
    mechanicEffects: { 'core.maxhp-mult': 0.20, 'core.plating-mult': 0.30, 'core.dr-layer-pct': 0.10 },
    icon: 'items/charms/jewel-charm-1.png',
    description: 'A dense knot of heartwood that drinks blows meant for the one who carries it.',
  }],

  // Far — Sniper: ranged offence with a real tradeoff (lower HP).
  ['forest-core-sniper', {
    id: 'forest-core-sniper', name: 'Sniper Core',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'core', coreEligibility: 'ranged',
    cost: { green: 60 }, catalystCost: { predation: 2 }, // family-tag: ranged alpha-strike amplifier → Predation
    stats: {}, tier: 2,
    mechanicEffects: { 'core.attack-mult': 0.25, 'core.maxhp-mult': -0.15 },
    icon: 'items/charms/eye-charm-1.png',
    description: 'Focuses the eye to a needlepoint — and leaves the body that much more exposed.',
  }],

  // Mid — Arcanist: tempo (faster attacks) for the hybrid/skill range.
  ['forest-core-arcanist', {
    id: 'forest-core-arcanist', name: 'Arcanist Core',
    recipeGroup: 'forest', requiredBiomeLevel: 8, slot: 'core', coreEligibility: 'ranged',
    cost: { green: 50, purple: 15 }, catalystCost: { alacrity: 2 }, // family-tag: attack-speed tempo core → Alacrity
    stats: {}, tier: 2,
    mechanicEffects: { 'core.attack-speed-mult': 0.15, 'core.attack-mult': 0.05 },
    icon: 'items/charms/jewel-charm-2.png',
    description: 'Keeps a rhythm in the wielder’s hands that the battle has to match.',
  }],

  // Universal — weaker, always-on regardless of range.
  ['forest-core-universal', {
    id: 'forest-core-universal', name: 'Tempered Core',
    recipeGroup: 'forest', requiredBiomeLevel: 8, slot: 'core', coreEligibility: 'unrestricted',
    cost: { green: 45 }, catalystCost: { volatility: 1 }, // family-tag: reliable always-on generalist → Volatility
    stats: {}, tier: 2,
    mechanicEffects: { 'core.attack-mult': 0.08, 'core.maxhp-mult': 0.08 },
    icon: 'items/charms/pearl-1.png',
    description: 'Balanced for any hand — it asks no commitment, and rewards none in particular.',
  }],

  // Bastion rank 2 — evolves from the rank-1 Bastion Core (own it, no +N required).
  // Reconstruct skips the chain for a higher cost. "Improved budget" per the rank model.
  ['forest-core-bastion-2', {
    id: 'forest-core-bastion-2', name: 'Bastion Core II',
    recipeGroup: 'forest', requiredBiomeLevel: 10, slot: 'core', coreEligibility: 'melee',
    lineageId: 'forest-core-bastion', evolvesFrom: 'forest-core-bastion',
    cost: { green: 90 }, catalystCost: { brutality: 3 }, // family-tag: anti-spike durability wall (rank 2) → Brutality
    reconstructCost: { green: 300 }, reconstructCatalystCost: { brutality: 7 },
    stats: {}, tier: 2,
    mechanicEffects: { 'core.maxhp-mult': 0.30, 'core.plating-mult': 0.45, 'core.dr-layer-pct': 0.15 },
    icon: 'items/charms/jewel-charm-3.png',
    description: 'The heartwood, hardened by a second season of storms — and a second of scars.',
  }],


] satisfies [string, Recipe][];
