import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// BALANCE PASS (T0–T2 starters). Rules applied:
//  - Equal defensive BUDGET per tier across biomes (strict sidegrade):
//      nominal HP-equiv  HP=1 · PLT=2 · DR%=3 · evade-rate/0.01≈0.6
//      budget  T0≈12 · T1=36 · T2=68
//  - Identity stat per biome: Forest=evasion, Mountain=damage-cap, (Plains=plating).
//  - Weapons NOT equalized: fast=highest raw + higher APS; slow=lowest raw + big per-hit.
//  - Upgrades: CONSTANT stat per step (linear benefit); costs unchanged (economy = later pass).
//  - DR is armor-only (never on charms). Mechanic %s do NOT ramp on upgrade; raw stats do.
//  - Boots untouched (deferred). Costs / requiredBiomeLevel untouched (economy = later pass).
// ─────────────────────────────────────────────────────────────────────────

export const clearingForestMountainRecipeEntries = [
  // ── Clearing (tutorial T0) — single green essence ────────────────────────
  ['primordial-club', {
    id: 'primordial-club', name: 'Primordial Club',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 8 }, stats: { attack: 3 }, attacksPerSecond: 0.65, tier: 0,
    description: 'Whittled from ironwood in a single evening, and it has not snapped since.',
    upgrades: [
      { stats: { attack: 1 }, cost: { green: 5  }, requiredBiomeLevel: 2 },
      { stats: { attack: 1 }, cost: { green: 10 }, requiredBiomeLevel: 3 },
      { stats: { attack: 1 }, cost: { green: 18 }, requiredBiomeLevel: 4 },
    ],
  }],


  ['clearing-vest-t1', {
    id: 'clearing-vest-t1', name: 'Bark Wrap',
    recipeGroup: 'clearing', requiredBiomeLevel: 4, slot: 'armor',
    cost: { green: 8 }, stats: { maxHp: 4, plating: 4 }, tier: 0,
    description: 'Bound bark and twine, smelling of sap and rain — the first armor any wanderer learns to make.',
    upgrades: [
      { stats: { maxHp: 1, plating: 1 }, cost: { green: 4 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 1, plating: 1 }, cost: { green: 8 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 1, plating: 1 }, cost: { green: 16 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['clearing-boots-t1', {
    id: 'clearing-boots-t1', name: 'Soft Boots',
    recipeGroup: 'clearing', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { green: 6 }, stats: { speed: 12 }, tier: 0,
    description: 'Worn soft by a hundred miles of easy trail.',
    upgrades: [
      { stats: { speed: 3 }, cost: { green: 4 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { green: 8 }, requiredBiomeLevel: 4 },
      { stats: { speed: 5 }, cost: { green: 16 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['clearing-charm-t1', {
    id: 'clearing-charm-t1', name: 'Herb Pouch',
    recipeGroup: 'clearing', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { green: 6 }, stats: { hpRegen: 2 }, tier: 0,
    description: 'A drawstring pouch of bruised green leaves, gathered at the forest edge.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { green: 4 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 1 }, cost: { green: 8 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { green: 16 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── Forest — identity: EVASION armor / raw OOC-regen charm / fast weapon ──
  ['flash-rapier', {
    id: 'flash-rapier', name: 'Flash Rapier',
    recipeGroup: 'forest', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 20 }, stats: { attack: 5 }, attacksPerSecond: 1.50, tier: 1,
    description: 'Forged thin as a reed by duelists who prized speed above all.',
    upgrades: [
      { stats: { attack: 2 }, cost: { green: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 2 }, cost: { green: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 2 }, cost: { green: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['forest-vest-t1', {
    id: 'forest-vest-t1', name: 'Shaded Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 4, slot: 'armor',
    cost: { green: 20 }, stats: { maxHp: 20, plating: 2, evasion: 0.20 }, tier: 1,
    description: 'Woven in the dappled dark beneath the canopy, where shadow clings to cloth.',
    upgrades: [
      { stats: { maxHp: 5, plating: 1, evasion: 0.05 }, cost: { green: 10 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 5, plating: 1, evasion: 0.05 }, cost: { green: 22 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 5, plating: 1, evasion: 0.05 }, cost: { green: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['forest-boots-t1', {
    id: 'forest-boots-t1', name: 'Sprinter Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { green: 15 }, stats: { speed: 20 }, tier: 1,
    mechanicEffects: { 'mobility.kill-speed-pct': 0.25, 'mobility.kill-speed-ms': 3000 },
    description: 'Strips of supple hide that move when you move, and never before.',
    upgrades: [
      { stats: { speed: 4 }, cost: { green: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 6 }, cost: { green: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 8 }, cost: { green: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['forest-charm-t1', {
    id: 'forest-charm-t1', name: 'Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { green: 15 }, stats: { hpRegen: 6 }, tier: 1,
    description: 'Heartroot drawn from the oldest tree in the grove, still faintly warm.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { green: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 2 }, cost: { green: 22 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { green: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['forest-vest-t2', {
    id: 'forest-vest-t2', name: 'Phantom Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 8, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { maxHp: 43, plating: 4, evasion: 0.28 }, tier: 2,
    description: 'They say the weaver vanished the day it was finished. The cloth remembers the trick.',
    upgrades: [
      { stats: { maxHp: 12, plating: 1, evasion: 0.06 }, cost: { green: 22 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 12, plating: 1, evasion: 0.06 }, cost: { green: 45 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 12, plating: 1, evasion: 0.06 }, cost: { green: 80 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['forest-boots-t2', {
    id: 'forest-boots-t2', name: 'Windstep Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { green: 38, yellow: 10 }, stats: { speed: 40 }, tier: 2,
    mechanicEffects: { 'mobility.kill-speed-pct': 0.35, 'mobility.kill-speed-ms': 3000 },
    description: 'Light enough that the wind mistakes the wearer for one of its own.',
    upgrades: [
      { stats: { speed: 6 }, cost: { green: 18 }, requiredBiomeLevel: 8 },
      { stats: { speed: 9 }, cost: { green: 38 }, requiredBiomeLevel: 8 },
      { stats: { speed: 12 }, cost: { green: 68 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['forest-charm-t2', {
    id: 'forest-charm-t2', name: 'Ancient Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { green: 38, yellow: 10 }, stats: { hpRegen: 10 }, tier: 2,
    description: 'A relic of a grove that burned an age ago, its life somehow undimmed.',
    upgrades: [
      { stats: { hpRegen: 3 }, cost: { green: 18 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 3 }, cost: { green: 38 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 3 }, cost: { green: 68 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['gale-needle', {
    id: 'gale-needle', name: 'Gale Needle',
    recipeGroup: 'forest', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { green: 48, yellow: 12 }, stats: { attack: 16 }, attacksPerSecond: 1.60, tier: 2,
    description: 'A fencing blade machined to an impossible point, humming faintly when drawn.',
    upgrades: [
      { stats: { attack: 6 }, cost: { green: 22 }, requiredBiomeLevel: 6 },
      { stats: { attack: 6 }, cost: { green: 48 }, requiredBiomeLevel: 7 },
      { stats: { attack: 6 }, cost: { green: 85 }, requiredBiomeLevel: 8 },
    ],
  }],

  // ── Mountain — identity: DAMAGE-CAP armor / shield charm / slow weapon ────
  // NOTE: Mountain is NOT a plating biome (that's Plains). Its budget sits in
  // HP; the cap is the identity. Off-matchup it reads as high-HP plate; vs big
  // hits the cap makes it the best anti-burst armor. (Cap barely matters early —
  // intended; it matures as hit sizes grow.)
  ['heavy-hammer', {
    id: 'heavy-hammer', name: 'Heavy Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 22 }, stats: { attack: 16 }, attacksPerSecond: 0.40, tier: 1,
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
    description: 'Heavy soles that bite into scree and loose rock alike.',
    upgrades: [
      { stats: { speed: 4 }, cost: { blue: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 6 }, cost: { blue: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 8 }, cost: { blue: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['mountain-charm-t1', {
    id: 'mountain-charm-t1', name: 'Granite Barrier',
    recipeGroup: 'mountain', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { blue: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.shield-pct': 0.12, 'defense.shield-interval-ms': 10000, 'defense.shield-duration-ms': 10000 },
    tier: 1,
    description: 'A palm of carved granite, cold and patient as the peak it came from.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { blue: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 1 }, cost: { blue: 22 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { blue: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['mountain-vest-t2', {
    id: 'mountain-vest-t2', name: 'Iron Crusader Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 8, slot: 'armor',
    cost: { blue: 52, purple: 13 }, stats: { maxHp: 29, plating: 12, damageReduction: 0.05 },
    mechanicEffects: { 'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5 },
    tier: 2,
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
    cost: { blue: 42, purple: 10 }, stats: { speed: 45 }, tier: 2,
    mechanicEffects: { 'mobility.acquire-speed-pct': 0.65, 'mobility.acquire-speed-ms': 1500, 'mobility.acquire-cooldown-ms': 8000 },
    description: 'Forged for those who treat a sheer slope as a road.',
    upgrades: [
      { stats: { speed: 6 }, cost: { blue: 20 }, requiredBiomeLevel: 8 },
      { stats: { speed: 9 }, cost: { blue: 42 }, requiredBiomeLevel: 8 },
      { stats: { speed: 12 }, cost: { blue: 75 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['mountain-charm-t2', {
    id: 'mountain-charm-t2', name: 'Iron Bulwark',
    recipeGroup: 'mountain', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { blue: 42, purple: 10 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.shield-pct': 0.18, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 2,
    description: 'A ward-stone the mountainfolk pass down, hand to weathered hand.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { blue: 20 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 2 }, cost: { blue: 42 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 2 }, cost: { blue: 75 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['quake-hammer', {
    id: 'quake-hammer', name: 'Quake Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { blue: 52, purple: 13 }, stats: { attack: 32 }, attacksPerSecond: 0.40, tier: 2,
    description: 'When it lands, the ground remembers it longer than the foe does.',
    upgrades: [
      { stats: { attack: 13 }, cost: { blue: 26 }, requiredBiomeLevel: 6 },
      { stats: { attack: 13 }, cost: { blue: 52 }, requiredBiomeLevel: 7 },
      { stats: { attack: 13 }, cost: { blue: 92 }, requiredBiomeLevel: 8 },
    ],
  }],
] satisfies [string, Recipe][];