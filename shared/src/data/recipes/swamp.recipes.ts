import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// SWAMP — full lineage (T1→T3). Identity: dot-resist (+debt at T2/T3) armor /
// absorb charm / DoT-conversion weapon (+ the Frost variant at T3). Charm rework:
// upgrades ramp absorb; hpRegen flat (see mountain.recipes.ts header).
// ⚠ Rimebrand (frost variant) rebuilt from archetype — adjust if it drifted.
// ─────────────────────────────────────────────────────────────────────────

export const swampRecipeEntries = [
  // ── T1 ──
  ['ashbrand-blade', {
    id: 'ashbrand-blade', name: 'Ashbrand Blade',
    recipeGroup: 'swamp', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { purple: 22 }, stats: { attack: 10 }, attacksPerSecond: 0.85, tier: 1,
    weaponDot: { effectId: 'ashbrand-burn', convPct: 0.50, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'fire' },
    icon: 'items/weapons/rune-sword-hot-1.png',
    description: 'Crude iron scratched with heat-runes that never quite cool.',
    upgrades: [
      { stats: { attack: 4 }, cost: { purple: 30 }, requiredBiomeLevel: 2 },
      { stats: { attack: 4 }, cost: { purple: 60 }, requiredBiomeLevel: 3 },
      { stats: { attack: 4 }, cost: { purple: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['swamp-vest-t1', {
    id: 'swamp-vest-t1', name: 'Arcane Wrappings',
    recipeGroup: 'swamp', requiredBiomeLevel: 2, slot: 'armor',
    cost: { purple: 22 }, stats: { maxHp: 24, plating: 6 },
    mechanicEffects: { 'defense.dot-resistance': 0.18 },
    tier: 1,
    icon: 'items/armor/leather-armor-4.png',
    description: 'Marsh-cloth steeped in old wardings against rot and fume.',
    upgrades: [
      { stats: { maxHp: 6, plating: 2 }, cost: { purple: 30 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 6, plating: 2 }, cost: { purple: 60 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 2 }, cost: { purple: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  // CHARM (absorb): base 0.07 -> +0.01/step -> 0.10 at +3. hpRegen 3 flat.
  ['swamp-charm-t1', {
    id: 'swamp-charm-t1', name: 'Murk Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { purple: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.absorb-pct': 0.07 },
    tier: 1,
    icon: 'items/charms/eye-charm-1.png',
    description: 'A preserved golem eye, still weeping faint green light.',
    upgrades: [
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { purple: 15 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { purple: 33 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.absorb-pct': 0.01 }, cost: { purple: 63 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['swamp-boots-t1', {
    id: 'swamp-boots-t1', name: 'Marsh Treads',
    recipeGroup: 'swamp', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { purple: 18 }, stats: { speed: 20 }, tier: 1,
    mechanicEffects: { 'mobility.tenacity-pct': 0.20 },
    icon: 'items/boots/wraps-1.png',
    description: 'Broad soles that ride the surface of soft, sucking ground.',
    upgrades: [
      { stats: { speed: 3 }, cost: { purple: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { purple: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  ['swamp-mirebrand', {
    id: 'swamp-mirebrand', name: 'Mirebrand',
    recipeGroup: 'swamp', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { purple: 52 }, stats: { attack: 22 }, attacksPerSecond: 1.0, tier: 2,
    weaponDot: { effectId: 'swamp-mirebrand-burn', convPct: 0.50, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'fire' },
    icon: 'items/weapons/rune-sword-hot-1.png',
    description: 'The runes burn hotter now; what they touch keeps smouldering.',
    upgrades: [
      { stats: { attack: 10 }, cost: { purple: 78 }, requiredBiomeLevel: 8 },
      { stats: { attack: 10 }, cost: { purple: 156 }, requiredBiomeLevel: 9 },
      { stats: { attack: 10 }, cost: { purple: 312 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['swamp-frostbrand', {
    id: 'swamp-frostbrand', name: 'Frostbrand',
    recipeGroup: 'swamp', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { purple: 54}, stats: { attack: 32 }, attacksPerSecond: 0.75, tier: 2,
    weaponDot: { effectId: 'swamp-frostbrand-burn', convPct: 0.70, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'frost' },
    icon: 'items/weapons/rune-sword-cold-1.png',
    description: 'The first of the cold brands — slower and heavier, biting deep instead of often.',
    upgrades: [
      { stats: { attack: 12 }, cost: { purple: 80 }, requiredBiomeLevel: 8 },
      { stats: { attack: 12 }, cost: { purple: 160 }, requiredBiomeLevel: 9 },
      { stats: { attack: 12 }, cost: { purple: 320 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['swamp-vest-t2', {
    id: 'swamp-vest-t2', name: 'Bog Wrappings',
    recipeGroup: 'swamp', requiredBiomeLevel: 8, slot: 'armor',
    cost: { purple: 54 }, stats: { maxHp: 44, plating: 6 },
    mechanicEffects: { 'defense.dot-resistance': 0.30, 'defense.hit-to-dot-pct': 0.08 },
    tier: 2,
    icon: 'items/armor/leather-armor-5.png',
    description: 'Cloth drawn from the deepest mire, where even the water has forgotten the sun.',
    upgrades: [
      { stats: { maxHp: 12, plating: 2 }, cost: { purple: 75 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 12, plating: 2 }, cost: { purple: 150 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 12, plating: 2 }, cost: { purple: 300 }, requiredBiomeLevel: 10 },
    ],
  }],

  // CHARM (absorb): base 0.09 -> +0.02/step -> 0.15 at +3. hpRegen 6 flat.
  ['swamp-charm-t2', {
    id: 'swamp-charm-t2', name: 'Bog Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { purple: 44 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.absorb-pct': 0.09 },
    tier: 2,
    icon: 'items/charms/eye-charm-2.png',
    description: 'A bog-touched eye that drinks deep and gives quietly back.',
    upgrades: [
      { mechanicEffects: { 'defense.absorb-pct': 0.02 }, cost: { purple: 30 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.absorb-pct': 0.02 }, cost: { purple: 60 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.absorb-pct': 0.02 }, cost: { purple: 120 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['swamp-boots-t2', {
    id: 'swamp-boots-t2', name: 'Wetland Wraps',
    recipeGroup: 'swamp', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { purple: 44 }, stats: { speed: 31 }, tier: 2,
    mechanicEffects: { 'mobility.tenacity-pct': 0.25 },
    icon: 'items/boots/wraps-2.png',
    description: 'Enchanted bindings that find footing where there should be none.',
    upgrades: [
      { stats: { speed: 3 }, cost: { purple: 22 }, requiredBiomeLevel: 10 },
      { stats: { speed: 4 }, cost: { purple: 44 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { purple: 78 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── T3 ── (base DoT weapon + Frost variant)
  ['swamp-blightbrand', {
    id: 'swamp-blightbrand', name: 'Flamebrand',
    recipeGroup: 'swamp', requiredBiomeLevel: 13, slot: 'weapon',
    cost: { purple: 116 }, stats: { attack: 46 }, attacksPerSecond: 1.00, tier: 3,
    weaponDot: { effectId: 'swamp-blightbrand-burn', convPct: 0.50, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'fire' },
    icon: 'items/weapons/rune-sword-hot-2.png',
    description: 'The flame it carries does more work than the edge ever could.',
    upgrades: [
      { stats: { attack: 14 }, cost: { purple: 170 },  requiredBiomeLevel: 14 },
      { stats: { attack: 14 }, cost: { purple: 340 }, requiredBiomeLevel: 15 },
      { stats: { attack: 14 }, cost: { purple: 696 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['swamp-rimebrand', {
    id: 'swamp-rimebrand', name: 'Rimebrand',
    recipeGroup: 'swamp', requiredBiomeLevel: 13, slot: 'weapon',
    cost: { purple: 116 }, stats: { attack: 58 }, attacksPerSecond: 0.75, tier: 3,
    weaponDot: { effectId: 'swamp-rimebrand-burn', convPct: 0.70, tickIntervalMs: 1000, drainDurationMs: 4500, dotMultiplier: 1.50, element: 'frost' },
    icon: 'items/weapons/rune-sword-cold-2.png',
    description: 'Slower, colder, and heavier — it converts more of each blow into a deep, biting chill.',
    upgrades: [
      { stats: { attack: 18 }, cost: { purple: 180 },  requiredBiomeLevel: 14 },
      { stats: { attack: 18 }, cost: { purple: 360 }, requiredBiomeLevel: 15 },
      { stats: { attack: 18 }, cost: { purple: 720 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['swamp-vest-t3', {
    id: 'swamp-vest-t3', name: 'Plaguebound Shroud',
    recipeGroup: 'swamp', requiredBiomeLevel: 14, slot: 'armor',
    cost: { purple: 140 }, stats: { maxHp: 86, plating: 12 },
    mechanicEffects: { 'defense.dot-resistance': 0.35, 'defense.hit-to-dot-pct': 0.10, 'defense.debuff-resistance': 0.20 },
    tier: 3,
    icon: 'items/armor/dark-armor-1.png',
    description: 'It turns the blows you take into a slow ache it then refuses to feel.',
    upgrades: [
      { stats: { maxHp: 18, plating: 3 }, cost: { purple: 180 },  requiredBiomeLevel: 15 },
      { stats: { maxHp: 18, plating: 3 }, cost: { purple: 360 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 18, plating: 3 }, cost: { purple: 720 }, requiredBiomeLevel: 16 },
    ],
  }],

  // CHARM (absorb): base 0.13 -> +0.03/step -> 0.22 at +3. hpRegen 11 flat.
  ['swamp-charm-t3', {
    id: 'swamp-charm-t3', name: 'Sorrow Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { purple: 100 }, stats: { hpRegen: 11 },
    mechanicEffects: { 'defense.absorb-pct': 0.18 },
    tier: 3,
    icon: 'items/charms/eye-charm-3.png',
    description: 'It weeps for every wound, and gives the tears back as strength.',
    upgrades: [
      { mechanicEffects: { 'defense.absorb-pct': 0.04 }, cost: { purple: 75 },  requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.absorb-pct': 0.04 }, cost: { purple: 150 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.absorb-pct': 0.04 }, cost: { purple: 300 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['swamp-boots-t3', {
    id: 'swamp-boots-t3', name: 'Mire Striders',
    recipeGroup: 'swamp', requiredBiomeLevel: 16, slot: 'mobility',
    cost: { purple: 100 }, stats: { speed: 44 }, tier: 3,
    mechanicEffects: { 'mobility.tenacity-pct': 0.30 },
    icon: 'items/boots/leather-boots-6.png',
    description: 'Nothing the bog grips holds them; they walk free of any mire that tries to keep them.',
    upgrades: [
      { stats: { speed: 4 }, cost: { purple: 30 },  requiredBiomeLevel: 16 },
      { stats: { speed: 5 }, cost: { purple: 60 },  requiredBiomeLevel: 16 },
      { stats: { speed: 6 }, cost: { purple: 105 }, requiredBiomeLevel: 16 },
    ],
  }],

] satisfies [string, Recipe][];
