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
    icon: 'items/weapons/sword-1.png',
    description: 'Mass-forged for the ranks, dependable as sunrise. Ten thousand like it have won quiet wars.',
    upgrades: [
      { stats: { attack: 4 }, cost: { yellow: 20 }, requiredBiomeLevel: 2 },
      { stats: { attack: 4 }, cost: { yellow: 30 }, requiredBiomeLevel: 3 },
      { stats: { attack: 4 }, cost: { yellow: 60 }, requiredBiomeLevel: 4 },
    ],
  }],

  // CHARM (kill-burst): base 0.05 -> +0.01/step -> 0.08 at +3. hpRegen 4 flat.
  ['plains-charm-t1', {
    id: 'plains-charm-t1', name: 'Plains Core',
    recipeGroup: 'plains', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { yellow: 10 }, stats: { hpRegen: 4 },
    mechanicEffects: { 'defense.kill-burst-pct': 0.05 },
    tier: 1,
    icon: 'items/charms/jewel-charm-1.png',
    description: 'A sun-warmed stone from the heart of the grasslands, humming with quiet vigor.',
    upgrades: [
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 12 }, requiredBiomeLevel: 3 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 24 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 48 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['plains-boots-t1', {
    id: 'plains-boots-t1', name: 'Fleet Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { yellow: 10 }, stats: { speed: 25 }, tier: 1,
    mechanicEffects: { 'mobility.ooc-speed-pct': 0.40 },
    icon: 'items/boots/sandals-1.png',
    description: 'Open sandals built for crossing flat ground at a dead run.',
    upgrades: [
      { stats: { speed: 3 }, cost: { yellow: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { yellow: 20 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { yellow: 40 }, requiredBiomeLevel: 4 },
    ],
  }],

  // silently the hero of tier 1
  ['plains-vest-t1', {
    id: 'plains-vest-t1', name: "Survivor's Robe",
    recipeGroup: 'plains', requiredBiomeLevel: 4, slot: 'armor',
    cost: { yellow: 20 }, stats: { maxHp: 10, plating: 13 }, tier: 1,
    icon: 'items/armor/leather-armor-1.png',
    description: 'Field plate patched and repatched by those who lived to patch it.',
    upgrades: [
      { stats: { maxHp: 3, plating: 4 }, cost: { yellow: 30 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, plating: 4 }, cost: { yellow: 60 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, plating: 4 }, cost: { yellow: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  ['knight-steelsword', {
    id: 'knight-steelsword', name: "Knight's Steelsword",
    recipeGroup: 'plains', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { yellow: 45 }, stats: { attack: 25 }, attacksPerSecond: 1.00, tier: 2,
    icon: 'items/weapons/sword-2.png',
    description: 'A knight sidearm kept keen by habit and pride — plain, proven, never flashy.',
    upgrades: [
      { stats: { attack: 10 }, cost: { yellow: 45 }, requiredBiomeLevel: 6 },
      { stats: { attack: 10 }, cost: { yellow: 90 }, requiredBiomeLevel: 7 },
      { stats: { attack: 10 }, cost: { yellow: 180 }, requiredBiomeLevel: 8 },
    ],
  }],

  // CHARM (kill-burst): base 0.09 -> +0.01/step -> 0.12 at +3. hpRegen 7 flat.
  ['plains-charm-t2', {
    id: 'plains-charm-t2', name: 'Stalwart Core',
    recipeGroup: 'plains', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { yellow: 50 }, stats: { hpRegen: 7 },
    mechanicEffects: { 'defense.kill-burst-pct': 0.09 },
    tier: 2,
    icon: 'items/charms/jewel-charm-2.png',
    description: 'A greater plains-stone, its warmth swelling with every foe laid low.',
    upgrades: [
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 30 }, requiredBiomeLevel: 7 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 60 }, requiredBiomeLevel: 8 },
      { mechanicEffects: { 'defense.kill-burst-pct': 0.01 }, cost: { yellow: 120 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['plains-boots-t2', {
    id: 'plains-boots-t2', name: 'Gale Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { yellow: 40 }, stats: { speed: 36 }, tier: 2,
    mechanicEffects: { 'mobility.ooc-speed-pct': 0.55 },
    icon: 'items/boots/sandals-2.png',
    description: 'Wind-cured leather that seems to lean into every stride.',
    upgrades: [
      { stats: { speed: 3 }, cost: { yellow: 20 }, requiredBiomeLevel: 8 },
      { stats: { speed: 4 }, cost: { yellow: 40 }, requiredBiomeLevel: 8 },
      { stats: { speed: 5 }, cost: { yellow: 80 }, requiredBiomeLevel: 8 },
    ],
  }],
  
  ['plains-vest-t2', {
    id: 'plains-vest-t2', name: 'Enduring Robe',
    recipeGroup: 'plains', requiredBiomeLevel: 8, slot: 'armor',
    cost: { yellow: 60 }, stats: { maxHp: 20, plating: 24 }, tier: 2,
    icon: 'items/armor/plate-armor-2.png',
    description: 'Plate that has outlasted the wars it was made for, and the smith who made it.',
    upgrades: [
      { stats: { maxHp: 5, plating: 6 }, cost: { yellow: 60 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 5, plating: 6 }, cost: { yellow: 120 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 5, plating: 6 }, cost: { yellow: 240 }, requiredBiomeLevel: 8 },
    ],
  }],
  
] satisfies [string, Recipe][];
