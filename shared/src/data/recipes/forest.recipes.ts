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

  // ── Cores ───────────────────────────────────────────────────────────────────
  // The 5th equipment slot. See the CORES header in plains.recipes.ts for how the
  // slot works and how eligibility/tier placement is decided.
  //
  // Forest owns SUSTAIN — it is where Second Wind is learned, so it is also where
  // the recovery core comes from.

  // T2 starter — Survivalist: outlast rather than out-trade.
  ['core-survivalist', {
    id: 'core-survivalist', name: 'Survivalist Core',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-survivalist',
    cost: { green: 45 }, catalystCost: { blight: 1 }, // family-tag: attrition survival → Blight
    stats: {}, tier: 2,
    // recovery-mult scales the passive regen stat AND every heal, so this is real
    // sustain rather than the near-nothing a regen-stat-only core would give.
    mechanicEffects: { 'core.recovery-mult': 0.20, 'core.maxhp-mult': 0.10 },
    icon: 'items/charms/heart-charm-1.png',
    description: 'Wound-knit heartwood. It does not stop the blow — it shortens the time you spend regretting it.',
  }],

  // T3 unrestricted — Accelerant: tempo. Trades hit size for hit count, which is
  // why it reads so differently on an on-hit build than on a big-swing one.
  ['core-accelerant', {
    id: 'core-accelerant', name: 'Accelerant Core',
    recipeGroup: 'forest', requiredBiomeLevel: 15, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-accelerant',
    cost: { green: 90 }, catalystCost: { alacrity: 2 }, // family-tag: attack-speed tempo → Alacrity
    stats: {}, tier: 3,
    mechanicEffects: { 'core.attack-speed-mult': 0.25, 'core.attack-mult': -0.12 },
    icon: 'items/charms/bright-charm-2.png',
    description: 'The forest keeps a fast rhythm. Match it, and you will find you are swinging before you decide to.',
  }],


] satisfies [string, Recipe][];
