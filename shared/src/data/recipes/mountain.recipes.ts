import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// MOUNTAIN — full lineage (T1→T3). Identity: damage-cap armor / shield charm /
// slow big-hit hammer. (Reorg: per-biome files; see index.recipes.ts.)
//
// CHARM REWORK (this pass): charm upgrades now ramp the SECONDARY EFFECT, not the
// low-value hpRegen stat. Base mechanic ≈70% of the old flat value; three steps
// bring it to the old value at +3. hpRegen is now a flat per-tier base (no upgrade).
// ⚠ Engine: upgrade `mechanicEffects` are additive deltas onto the base mechanic.
// ─────────────────────────────────────────────────────────────────────────

export const mountainRecipeEntries = [
  // ── T1 ──
  ['heavy-hammer', {
    id: 'heavy-hammer', name: 'Heavy Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 22 }, stats: { attack: 16 }, attacksPerSecond: 0.40, tier: 1,
    icon: 'items/weapons/hammer-2.png',
    description: 'Two-handed, brutal, and honest. It asks only that you find the time to swing it.',
    upgrades: [
      { stats: { attack: 6 }, cost: { blue: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 6 }, cost: { blue: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 6 }, cost: { blue: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['mountain-vest-t1', {
    id: 'mountain-vest-t1', name: 'Fallen Knight Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 4, slot: 'armor',
    cost: { blue: 22 }, stats: { maxHp: 22, plating: 7 },
    mechanicEffects: { 'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5 },
    tier: 1,
    icon: 'items/armor/plate-armor-1.png',
    description: 'Stripped from a knight who fell at the high pass and was never named.',
    upgrades: [
      { stats: { maxHp: 6, plating: 2 }, cost: { blue: 10 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 2 }, cost: { blue: 22 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 2 }, cost: { blue: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['mountain-boots-t1', {
    id: 'mountain-boots-t1', name: 'Iron Treads',
    recipeGroup: 'mountain', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { blue: 18 }, stats: { speed: 18 }, tier: 1,
    mechanicEffects: { 'mobility.acquire-speed-pct': 0.50, 'mobility.acquire-speed-ms': 1500, 'mobility.acquire-cooldown-ms': 8000 },
    icon: 'items/boots/plate-boots-1.png',
    description: 'Heavy soles that bite into scree and loose rock alike.',
    upgrades: [
      { stats: { speed: 3 }, cost: { blue: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { blue: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { blue: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  // CHARM (shield): base 0.09 -> +0.01/step -> 0.12 at +3. hpRegen 3 flat.
  ['mountain-charm-t1', {
    id: 'mountain-charm-t1', name: 'Granite Barrier',
    recipeGroup: 'mountain', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { blue: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.shield-pct': 0.09, 'defense.shield-interval-ms': 10000, 'defense.shield-duration-ms': 10000 },
    tier: 1,
    icon: 'items/charms/stone-hand-charm-1.png',
    description: 'A palm of carved granite, cold and patient as the peak it came from.',
    upgrades: [
      { mechanicEffects: { 'defense.shield-pct': 0.01 }, cost: { blue: 10 }, requiredBiomeLevel: 3 },
      { mechanicEffects: { 'defense.shield-pct': 0.01 }, cost: { blue: 22 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.shield-pct': 0.01 }, cost: { blue: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  ['mountain-vest-t2', {
    id: 'mountain-vest-t2', name: 'Iron Crusader Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 8, slot: 'armor',
    cost: { blue: 52, purple: 13 }, stats: { maxHp: 29, plating: 12, damageReduction: 0.05 },
    mechanicEffects: { 'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5 },
    tier: 2,
    icon: 'items/armor/plate-armor-3.png',
    description: 'Masterwork plate of the old crusades, dented in a hundred places, breached in none.',
    upgrades: [
      { stats: { maxHp: 8, plating: 3 }, cost: { blue: 26 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 8, plating: 3 }, cost: { blue: 52 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 8, plating: 3 }, cost: { blue: 92 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['mountain-boots-t2', {
    id: 'mountain-boots-t2', name: 'Mountain Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { blue: 42, purple: 10 }, stats: { speed: 29 }, tier: 2,
    mechanicEffects: { 'mobility.acquire-speed-pct': 0.65, 'mobility.acquire-speed-ms': 1500, 'mobility.acquire-cooldown-ms': 8000 },
    icon: 'items/boots/plate-boots-2.png',
    description: 'Forged for those who treat a sheer slope as a road.',
    upgrades: [
      { stats: { speed: 3 }, cost: { blue: 20 }, requiredBiomeLevel: 8 },
      { stats: { speed: 4 }, cost: { blue: 42 }, requiredBiomeLevel: 8 },
      { stats: { speed: 5 }, cost: { blue: 75 }, requiredBiomeLevel: 8 },
    ],
  }],

  // CHARM (shield): base 0.12 -> +0.02/step -> 0.18 at +3. hpRegen 6 flat.
  ['mountain-charm-t2', {
    id: 'mountain-charm-t2', name: 'Iron Bulwark',
    recipeGroup: 'mountain', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { blue: 42, purple: 10 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.shield-pct': 0.12, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 2,
    icon: 'items/charms/stone-hand-charm-2.png',
    description: 'A ward-stone the mountainfolk pass down, hand to weathered hand.',
    upgrades: [
      { mechanicEffects: { 'defense.shield-pct': 0.02 }, cost: { blue: 20 }, requiredBiomeLevel: 7 },
      { mechanicEffects: { 'defense.shield-pct': 0.02 }, cost: { blue: 42 }, requiredBiomeLevel: 8 },
      { mechanicEffects: { 'defense.shield-pct': 0.02 }, cost: { blue: 75 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['quake-hammer', {
    id: 'quake-hammer', name: 'Quake Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { blue: 52, purple: 13 }, stats: { attack: 32 }, attacksPerSecond: 0.40, tier: 2,
    icon: 'items/weapons/hammer-2.png',
    description: 'When it lands, the ground remembers it longer than the foe does.',
    upgrades: [
      { stats: { attack: 13 }, cost: { blue: 26 }, requiredBiomeLevel: 6 },
      { stats: { attack: 13 }, cost: { blue: 52 }, requiredBiomeLevel: 7 },
      { stats: { attack: 13 }, cost: { blue: 92 }, requiredBiomeLevel: 8 },
    ],
  }],

  // ── T3 ──
  ['mountain-avalanche-maul', {
    id: 'mountain-avalanche-maul', name: 'Avalanche Maul',
    recipeGroup: 'mountain', requiredBiomeLevel: 9, slot: 'weapon',
    cost: { blue: 116 }, stats: { attack: 74 }, attacksPerSecond: 0.40, tier: 3,
    icon: 'items/weapons/hammer-2.png',
    description: 'It does not so much strike as arrive, the way a slope arrives on a village.',
    upgrades: [
      { stats: { attack: 24 }, cost: { blue: 58 },  requiredBiomeLevel: 10 },
      { stats: { attack: 24 }, cost: { blue: 116 }, requiredBiomeLevel: 11 },
      { stats: { attack: 24 }, cost: { blue: 196 }, requiredBiomeLevel: 12 },
    ],
  }],

  ['mountain-vest-t3', {
    id: 'mountain-vest-t3', name: 'Summit Aegis',
    recipeGroup: 'mountain', requiredBiomeLevel: 12, slot: 'armor',
    cost: { blue: 116 }, stats: { maxHp: 55, plating: 23, damageReduction: 0.10 },
    mechanicEffects: { 'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5 },
    tier: 3,
    icon: 'items/armor/plate-armor-3.png',
    description: 'Forged for those who plan to be hit by something the size of a house and walk on.',
    upgrades: [
      { stats: { maxHp: 14, plating: 6 }, cost: { blue: 58 },  requiredBiomeLevel: 12 },
      { stats: { maxHp: 14, plating: 6 }, cost: { blue: 116 }, requiredBiomeLevel: 12 },
      { stats: { maxHp: 14, plating: 6 }, cost: { blue: 196 }, requiredBiomeLevel: 12 },
    ],
  }],

  // CHARM (shield): base 0.17 -> +0.03/step -> 0.26 at +3. hpRegen 11 flat.
  ['mountain-charm-t3', {
    id: 'mountain-charm-t3', name: 'Bastion Heart',
    recipeGroup: 'mountain', requiredBiomeLevel: 10, slot: 'recovery',
    cost: { blue: 100 }, stats: { hpRegen: 11 },
    mechanicEffects: { 'defense.shield-pct': 0.17, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 3,
    icon: 'items/charms/stone-hand-charm-2.png',
    description: 'A core of mountain-heart stone that raises a wall of itself, over and over.',
    upgrades: [
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 50 },  requiredBiomeLevel: 11 },
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 100 }, requiredBiomeLevel: 12 },
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 175 }, requiredBiomeLevel: 12 },
    ],
  }],

  ['mountain-boots-t3', {
    id: 'mountain-boots-t3', name: 'Peak Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { blue: 42, purple: 10 }, stats: { speed: 42 }, tier: 3,
    mechanicEffects: { 'mobility.acquire-speed-pct': 0.75, 'mobility.acquire-speed-ms': 1500, 'mobility.acquire-cooldown-ms': 8000 },
    icon: 'items/boots/plate-boots-3.png',
    description: 'Not even the mountain can keep you from your prey.',
    upgrades: [
      { stats: { speed: 3 }, cost: { blue: 20 }, requiredBiomeLevel: 8 },
      { stats: { speed: 4 }, cost: { blue: 42 }, requiredBiomeLevel: 8 },
      { stats: { speed: 5 }, cost: { blue: 75 }, requiredBiomeLevel: 8 },
    ],
  }],
] satisfies [string, Recipe][];
