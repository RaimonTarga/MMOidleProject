import type { Recipe } from './types';

// BALANCE PASS (T0–T2 starters) — see header in clearingForestMountain.recipes.ts
// for the shared rules (equal budget, constant upgrades, DR armor-only, etc.).
//
// Biome identities in this file:
//   Plains  — plating armor / kill-burst charm / broadsword (no-mechanic floor weapon)
//   Swamp   — dot-resist (+debt at T2) armor / absorb charm / DoT-conversion weapon
//   Cave    — %DR armor / regen-burst charm / chaotic-axe (above-curve "puzzle" weapon)
//
// Removed this pass: Sacred Cross + Consecrated Cross (the timer-buff is broken in
//   auto-combat; the reworked full-HP-ambush version now lives in Desert).
// Added this pass: cave T2 weapon "Ruinous Axe" (the missing chaotic-axe T2).

export const plainsSwampCaveRecipeEntries = [
  // ── Plains — plating wall + kill-burst; the honest, low-flair all-rounder ──
  ['iron-broadsword', {
    id: 'iron-broadsword', name: 'Iron Broadsword',
    recipeGroup: 'plains', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { yellow: 14 }, stats: { attack: 8 }, attacksPerSecond: 0.65, tier: 1,
    icon: 'items/weapons/sword-1.png',
    description: 'Mass-forged for the ranks, dependable as sunrise. Ten thousand like it have won quiet wars.',
    upgrades: [
      { stats: { attack: 3 }, cost: { yellow: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 3 }, cost: { yellow: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 3 }, cost: { yellow: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['plains-vest-t1', {
    id: 'plains-vest-t1', name: "Survivor's Robe",
    recipeGroup: 'plains', requiredBiomeLevel: 4, slot: 'armor',
    cost: { yellow: 20 }, stats: { maxHp: 10, plating: 13 }, tier: 1,
    icon: 'items/armor/leather-armor-1.png',
    description: 'Field plate patched and repatched by those who lived to patch it.',
    upgrades: [
      { stats: { maxHp: 3, plating: 4 }, cost: { yellow: 10 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, plating: 4 }, cost: { yellow: 22 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, plating: 4 }, cost: { yellow: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['plains-boots-t1', {
    id: 'plains-boots-t1', name: 'Fleet Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { yellow: 16 }, stats: { speed: 25 }, tier: 1,
    mechanicEffects: { 'mobility.ooc-speed-pct': 0.40 },
    icon: 'items/boots/sandals-1.png',
    description: 'Open sandals built for crossing flat ground at a dead run.',
    upgrades: [
      { stats: { speed: 3 }, cost: { yellow: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { yellow: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { yellow: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['plains-charm-t1', {
    id: 'plains-charm-t1', name: 'Plains Core',
    recipeGroup: 'plains', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { yellow: 16 }, stats: { hpRegen: 4 },
    mechanicEffects: { 'defense.kill-burst-pct': 0.08 },
    tier: 1,
    icon: 'items/charms/jewel-charm-1.png',
    description: 'A sun-warmed stone from the heart of the grasslands, humming with quiet vigor.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { yellow: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 1 }, cost: { yellow: 22 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { yellow: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['plains-vest-t2', {
    id: 'plains-vest-t2', name: 'Enduring Robe',
    recipeGroup: 'plains', requiredBiomeLevel: 8, slot: 'armor',
    cost: { yellow: 50, red: 12 }, stats: { maxHp: 20, plating: 24 }, tier: 2,
    icon: 'items/armor/plate-armor-2.png',
    description: 'Plate that has outlasted the wars it was made for, and the smith who made it.',
    upgrades: [
      { stats: { maxHp: 5, plating: 6 }, cost: { yellow: 24 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 5, plating: 6 }, cost: { yellow: 50 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 5, plating: 6 }, cost: { yellow: 90 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['plains-boots-t2', {
    id: 'plains-boots-t2', name: 'Gale Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { yellow: 40, red: 10 }, stats: { speed: 36 }, tier: 2,
    mechanicEffects: { 'mobility.ooc-speed-pct': 0.55 },
    icon: 'items/boots/sandals-2.png',
    description: 'Wind-cured leather that seems to lean into every stride.',
    upgrades: [
      { stats: { speed: 3 }, cost: { yellow: 20 }, requiredBiomeLevel: 8 },
      { stats: { speed: 4 }, cost: { yellow: 40 }, requiredBiomeLevel: 8 },
      { stats: { speed: 5 }, cost: { yellow: 72 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['plains-charm-t2', {
    id: 'plains-charm-t2', name: 'Stalwart Core',
    recipeGroup: 'plains', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { yellow: 40, red: 10 }, stats: { hpRegen: 7 },
    mechanicEffects: { 'defense.kill-burst-pct': 0.12 },
    tier: 2,
    icon: 'items/charms/jewel-charm-2.png',
    description: 'A greater plains-stone, its warmth swelling with every foe laid low.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { yellow: 20 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 2 }, cost: { yellow: 40 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 2 }, cost: { yellow: 72 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['knight-steelsword', {
    id: 'knight-steelsword', name: "Knight's Steelsword",
    recipeGroup: 'plains', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { yellow: 35, red: 8 }, stats: { attack: 20 }, attacksPerSecond: 0.80, tier: 2,
    icon: 'items/weapons/sword-2.png',
    description: 'A knight sidearm kept keen by habit and pride — plain, proven, never flashy.',
    upgrades: [
      { stats: { attack: 8 }, cost: { yellow: 18 }, requiredBiomeLevel: 6 },
      { stats: { attack: 8 }, cost: { yellow: 35 }, requiredBiomeLevel: 7 },
      { stats: { attack: 8 }, cost: { yellow: 64 }, requiredBiomeLevel: 8 },
    ],
  }],

  // ── Swamp — dot-resist (+ DEBT at T2) armor / absorb charm / DoT weapon ────
  // The T2 armor closes a loop: hit-to-dot converts direct hits into debt (DoT),
  // and dot-resistance then mitigates that debt at FULL strength (generic DR is
  // only half-effective on DoT). The absorb charm heals from damage taken — note
  // resisting harder shrinks that heal pool (a natural self-limiter). This is the
  // build most dependent on the engine-gate heal-throughput + debt-conversion caps.
  ['ashbrand-blade', {
    id: 'ashbrand-blade', name: 'Ashbrand Blade',
    recipeGroup: 'swamp', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { purple: 22 }, stats: { attack: 7 }, attacksPerSecond: 0.75, tier: 1,
    mechanicEffects: { 'weapon.dot-conversion-pct': 0.30, 'weapon.dot-stacks': 5 },
    icon: 'items/weapons/rune-sword-hot-1.png',
    description: 'Crude iron scratched with heat-runes that never quite cool.',
    upgrades: [
      { stats: { attack: 3 }, cost: { purple: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 3 }, cost: { purple: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 3 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['swamp-vest-t1', {
    id: 'swamp-vest-t1', name: 'Arcane Wrappings',
    recipeGroup: 'swamp', requiredBiomeLevel: 4, slot: 'armor',
    cost: { purple: 22 }, stats: { maxHp: 24, plating: 6 },
    mechanicEffects: { 'defense.dot-resistance': 0.18 },
    tier: 1,
    icon: 'items/armor/leather-armor-4.png',
    description: 'Marsh-cloth steeped in old wardings against rot and fume.',
    upgrades: [
      { stats: { maxHp: 6, plating: 2 }, cost: { purple: 10 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 2 }, cost: { purple: 22 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 2 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['swamp-boots-t1', {
    id: 'swamp-boots-t1', name: 'Marsh Treads',
    recipeGroup: 'swamp', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { purple: 18 }, stats: { speed: 20 }, tier: 1,
    mechanicEffects: { 'mobility.tenacity-pct': 0.30 },
    icon: 'items/boots/leather-boots-2.png',
    description: 'Broad soles that ride the surface of soft, sucking ground.',
    upgrades: [
      { stats: { speed: 3 }, cost: { purple: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { purple: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['swamp-charm-t1', {
    id: 'swamp-charm-t1', name: 'Murk Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { purple: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.absorb-pct': 0.10 },
    tier: 1,
    icon: 'items/charms/eye-charm-1.png',
    description: 'A preserved golem eye, still weeping faint green light.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { purple: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 1 }, cost: { purple: 22 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['swamp-vest-t2', {
    id: 'swamp-vest-t2', name: 'Void Wrappings',
    recipeGroup: 'swamp', requiredBiomeLevel: 8, slot: 'armor',
    cost: { purple: 54, green: 14 }, stats: { maxHp: 44, plating: 12 },
    mechanicEffects: { 'defense.dot-resistance': 0.30, 'defense.hit-to-dot-pct': 0.15 },
    tier: 2,
    icon: 'items/armor/leather-armor-5.png',
    description: 'Cloth drawn from the deepest mire, where even the water has forgotten the sun.',
    upgrades: [
      { stats: { maxHp: 12, plating: 3 }, cost: { purple: 26 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 12, plating: 3 }, cost: { purple: 54 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 12, plating: 3 }, cost: { purple: 96 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['swamp-boots-t2', {
    id: 'swamp-boots-t2', name: 'Wetland Wraps',
    recipeGroup: 'swamp', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { purple: 44, green: 11 }, stats: { speed: 31 }, tier: 2,
    mechanicEffects: { 'mobility.tenacity-pct': 0.45 },
    icon: 'items/boots/leather-boots-4.png',
    description: 'Enchanted bindings that find footing where there should be none.',
    upgrades: [
      { stats: { speed: 3 }, cost: { purple: 22 }, requiredBiomeLevel: 8 },
      { stats: { speed: 4 }, cost: { purple: 44 }, requiredBiomeLevel: 8 },
      { stats: { speed: 5 }, cost: { purple: 78 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['swamp-charm-t2', {
    id: 'swamp-charm-t2', name: 'Void Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { purple: 44, green: 11 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.absorb-pct': 0.15 },
    tier: 2,
    icon: 'items/charms/eye-charm-2.png',
    description: 'A void-touched eye that drinks deep and gives quietly back.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { purple: 22 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 2 }, cost: { purple: 44 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 2 }, cost: { purple: 78 }, requiredBiomeLevel: 8 },
    ],
  }],

  // ── Cave — %DR armor / regen-burst charm / chaotic-axe (above-curve puzzle) ─
  // The axe is intentionally one of the highest AVERAGE-DPS weapons; the dead
  // swing is the "scary tax" that makes it a puzzle reward. The dead swing deals
  // no WEAPON damage but still fires on-hit effects and class gains, and must NOT
  // consume reload ammo (engine note).
  ['chaotic-axe', {
    id: 'chaotic-axe', name: 'Chaotic Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { red: 22 }, stats: { attack: 25 }, attacksPerSecond: 1.10, tier: 1,
    mechanicEffects: { 'weapon.dead-swing-interval': 3 },
    icon: 'items/weapons/axe-1.png',
    description: 'A wild, top-heavy thing that fights as much as it is wielded.',
    upgrades: [
      { stats: { attack: 10 }, cost: { red: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 10 }, cost: { red: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 10 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-vest-t1', {
    id: 'cave-vest-t1', name: 'Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 4, slot: 'armor',
    cost: { red: 22 }, stats: { maxHp: 16, plating: 2, damageReduction: 0.06 }, tier: 1,
    icon: 'items/armor/bone-armor.png',
    description: 'The hide of something large and unlucky, cured to a stubborn toughness.',
    upgrades: [
      { stats: { maxHp: 4, plating: 1, damageReduction: 0.01 }, cost: { red: 10 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4, plating: 1, damageReduction: 0.01 }, cost: { red: 22 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4, plating: 1, damageReduction: 0.01 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-boots-t1', {
    id: 'cave-boots-t1', name: 'Bat Wing Boots',
    recipeGroup: 'cave', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { red: 18 }, stats: { speed: 28 }, tier: 1,
    mechanicEffects: { 'mobility.stealth-pct': 0.30 },
    icon: 'items/boots/leather-boots-5.png',
    description: 'Stretched membrane that falls on stone without a whisper.',
    upgrades: [
      { stats: { speed: 3 }, cost: { red: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { red: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-charm-t1', {
    id: 'cave-charm-t1', name: 'Pulse Stone',
    recipeGroup: 'cave', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { red: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.08, 'defense.regen-burst-interval-ms': 8000 },
    tier: 1,
    icon: 'items/charms/bright-charm-1.png',
    description: 'A cave-crystal that beats, slow and steady, like a sleeping heart.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { red: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 1 }, cost: { red: 22 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-vest-t2', {
    id: 'cave-vest-t2', name: 'Dire Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 7, slot: 'armor',
    cost: { red: 54, purple: 14 }, stats: { maxHp: 30, plating: 4, damageReduction: 0.10 }, tier: 2,
    icon: 'items/armor/plate-armor-4.png',
    description: 'From a beast the deep-cavern folk name only in low voices.',
    upgrades: [
      { stats: { maxHp: 8, plating: 1, damageReduction: 0.01 }, cost: { red: 26 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 8, plating: 1, damageReduction: 0.01 }, cost: { red: 54 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 8, plating: 1, damageReduction: 0.01 }, cost: { red: 96 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['cave-boots-t2', {
    id: 'cave-boots-t2', name: 'Cavern Sprints',
    recipeGroup: 'cave', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { red: 44, purple: 11 }, stats: { speed: 39 }, tier: 2,
    mechanicEffects: { 'mobility.stealth-pct': 0.45 },
    icon: 'items/boots/leather-boots-6.png',
    description: 'Worn smooth on tunnel floors no map has ever charted.',
    upgrades: [
      { stats: { speed: 3 }, cost: { red: 22 }, requiredBiomeLevel: 8 },
      { stats: { speed: 4 }, cost: { red: 44 }, requiredBiomeLevel: 8 },
      { stats: { speed: 5 }, cost: { red: 78 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['cave-charm-t2', {
    id: 'cave-charm-t2', name: 'Resonant Gem',
    recipeGroup: 'cave', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { red: 44, purple: 11 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.15, 'defense.regen-burst-interval-ms': 8000 },
    tier: 2,
    icon: 'items/charms/bright-charm-2.png',
    description: 'A gem that rings on its own in the dark, answering a song no one else hears.',
    upgrades: [
      { stats: { hpRegen: 2 }, cost: { red: 22 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 2 }, cost: { red: 44 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 2 }, cost: { red: 78 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['ruinous-axe', {
    id: 'ruinous-axe', name: 'Ruinous Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { red: 54, purple: 13 }, stats: { attack: 40 }, attacksPerSecond: 1.20, tier: 2,
    mechanicEffects: { 'weapon.dead-swing-interval': 4 },
    icon: 'items/weapons/axe-2.png',
    description: 'Bigger, meaner, and somehow better balanced — chaos with the faintest thread of discipline.',
    upgrades: [
      { stats: { attack: 16 }, cost: { red: 26 }, requiredBiomeLevel: 6 },
      { stats: { attack: 16 }, cost: { red: 54 }, requiredBiomeLevel: 7 },
      { stats: { attack: 16 }, cost: { red: 96 }, requiredBiomeLevel: 8 },
    ],
  }],
] satisfies [string, Recipe][];