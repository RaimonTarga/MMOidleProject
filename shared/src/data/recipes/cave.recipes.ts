import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// CAVE — full lineage (T1→T3).
//
// Identity (design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md §5):
//   weapon  chaotic HIGH-OUTPUT weapon with a structural drawback. Above-curve
//           offence paid for in dead swings — dangerous, not merely efficient.
//   armor   premium generalist %DR. "Premium" means BREADTH, not a bigger total
//           budget: rarely the best specialist answer, rarely a bad choice.
//   charm   ABSORB — its own defensive mechanic, scaling from damage processed,
//           never from max HP, Recovery or Barrier.
//   boots   stealth / reduced detection. Intentionally niche: its value is
//           avoiding unwanted Cave overpulls, not throughput.
//
// The rework SWAPPED Cave's and Swamp's charm mechanics: the periodic Recovery
// pulse went to Swamp (it answers attrition regardless of damage source) and
// Cave took the dedicated Absorb hook (philosophy §11.5, §13, §22).
//
// See the scaling rule in the header of `plains.recipes.ts` for how T2/T3
// numbers are derived from the T1 baseline.
// ─────────────────────────────────────────────────────────────────────────

// ── T1 ECONOMY CANDIDATE C (2026-08-31) ───────────────────────────────────
// Every T1 (+5) step's ESSENCE cost was cut 25%, rounded to the nearest 5
// (Math.round semantics): 205->155, 260->195, 200->150, 100->75, 75->55,
// 70->55, 60->45. Catalyst costs, initial crafts and +1..+4 are UNCHANGED, so
// the per-item "same total (N)" notes below now describe the pre-candidate
// total, not the current one. The target is the post-mastery affordability
// tail only -- the 2x bot cohort spent its last ~15m/run earning the final
// +5 essence after every biome was already maxed.
// ──────────────────────────────────────────────────────────────────────────

export const caveRecipeEntries = [
  // ── T1 ──
  // Every 3rd swing is dead. NOT equivalent to a flat ×2/3 DPS tax in every
  // build: it is harsher when a wasted swing blows a timing window or when a
  // class mechanic counts landed hits, and milder when resources advance on
  // attempts. The implementation must stay explicit about which combat events a
  // dead swing fires (baseline §5.6).
  ['chaotic-axe', {
    id: 'chaotic-axe', name: 'Chaotic Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 1, slot: 'weapon',
    // 2026-09-26 weapon pass: Attack 22->20 (+5: 32->29), about -5% throughput.
    // Its per-hit size made it the best T1 weapon for every class once Power
    // Strike and monster plating were counted, not only on raw DPS.
    cost: { red: 26 }, stats: { attack: 29 }, attacksPerSecond: 1.10, tier: 1,
    mechanicEffects: { 'weapon.dead-swing-interval': 3 },
    icon: 'items/weapons/chaotic-axe.png',
    description: 'A wild, top-heavy thing that fights as much as it is wielded.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~501 (was 500).
    // +5 catalyst from its own T2 successor's tag ("chaotic-axe (counted
    // disruption) → Swarming").
  }],

  // %DR is kept well below runaway values on purpose: percentage mitigation
  // compounds hard with HP, plating, class damage-taken affinities and every
  // other defensive layer (baseline §7.6).
  ['cave-vest-t1', {
    id: 'cave-vest-t1', name: 'Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 2, slot: 'armor',
    cost: { red: 22 }, stats: { "maxHp": 45, "damageReduction": 0.14 }, tier: 1,
    icon: 'items/armor/bestial-hide.png',
    description: "Dependable protection against direct damage and damage over time.",
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (622).
    // +5 catalyst from cave-vest-t2's own tag ("premium %DR generalist wall →
    // Swarming").

mechanicEffects: {},
}],

  // CHARM — Absorb. Converts a fraction of damage taken into a pool that drains
  // back as healing. It scales from DAMAGE PROCESSED, not from max HP, Recovery
  // or Barrier — that separation is the whole reason Absorb is its own mechanic.
  ['cave-charm-t1', {
    id: 'cave-charm-t1', name: 'Pulse Stone',
    recipeGroup: 'cave', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { red: 18 }, stats: { "recovery": 6 },
    mechanicEffects: { "defense.absorb-pct": 0.12 },
    tier: 1,
    icon: 'items/charms/pulse-stone.png',
    description: 'A cave-crystal that beats, slow and steady, like a sleeping heart.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~253 (was 255).
  }],

  ['cave-boots-t1', {
    id: 'cave-boots-t1', name: 'Bat Wing Boots',
    recipeGroup: 'cave', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { red: 18 }, stats: { "speed": 25 }, tier: 1,
    mechanicEffects: { "mobility.stealth-pct": 0.35 },
    icon: 'items/boots/bat-wing-boots.png',
    description: 'Stretched membrane that falls on stone without a whisper.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~178 (was 176).
  }],

  // ── T2 ──
  // T2 economy pass (2026-08-29): now an EVOLUTION of chaotic-axe at +5.
  ['ruinous-axe', {
    id: 'ruinous-axe', name: 'Ruinous Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 7, slot: 'weapon',
    // 2026-09-26 weapon normalization: Attack 43->31 (+5: 65->60). Its +0 sat 28% over the T2 +0
    // median (a flat curve with a huge start); +5 is the axe's ~5% cut.
    cost: { red: 60 }, stats: { attack: 60 }, attacksPerSecond: 1.20, tier: 2, // family-tag: chaotic-axe (counted disruption) → Swarming
    mechanicEffects: { 'weapon.dead-swing-interval': 4 },
    icon: 'items/weapons/ruinous-axe.png',
    description: 'Bigger, meaner, and somehow better balanced — chaos with the faintest thread of discipline.',
  }],

  // T2 economy pass (2026-08-29): now an EVOLUTION of cave-vest-t1 at +5.
  ['cave-vest-t2', {
    id: 'cave-vest-t2', name: 'Dire Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 8, slot: 'armor',
    cost: { red: 54 }, stats: { "maxHp": 83, "damageReduction": 0.22 }, tier: 2, // family-tag: premium %DR generalist wall → Swarming
    icon: 'items/armor/dire-bestial-hide.png',
    description: "Dependable protection against direct damage and damage over time.",

mechanicEffects: {},
}],

  // CHARM — Absorb, deepened. T2 economy pass (2026-08-29): now an EVOLUTION of
  // cave-charm-t1 at +5.
  ['cave-charm-t2', {
    id: 'cave-charm-t2', name: 'Resonant Gem',
    recipeGroup: 'cave', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { red: 44 }, stats: { "recovery": 15.7 }, // family-tag: reliable generalist recovery → Swarming
    mechanicEffects: { "defense.absorb-pct": 0.19, "defense.absorb-guard-bonus-pct": 0.08 },
    tier: 2,
    icon: 'items/charms/resonant-gem.png',
    description: 'A gem that rings on its own in the dark, answering a song no one else hears.',
  }],

  // T2 economy pass (2026-08-29): now an EVOLUTION of cave-boots-t1 at +5.
  ['cave-boots-t2', {
    id: 'cave-boots-t2', name: 'Cavern Sprints',
    recipeGroup: 'cave', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { red: 33 }, stats: { "speed": 46 }, tier: 2, // family-tag: cave generalist mobility → Swarming
    mechanicEffects: { "mobility.stealth-pct": 0.48 },
    icon: 'items/boots/cavern-sprints.png',
    description: 'Worn smooth on tunnel floors no map has ever charted.',
  }],

  // ── T3 ──
  ['cave-cataclysm-axe', {
    id: 'cave-cataclysm-axe', name: 'Cataclysm Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 13, slot: 'weapon',
    // T3 economy pass (2026-08-30): EVOLUTION of ruinous-axe at +5; 2.00× its lifetime
    // total on the shipped accelerating curve; catalysts moved to +4/+5.
    // 2026-09-26 T2-T4 weapon normalization: Attack 78->67 (+5: 117->112).
    cost: { red: 120 }, stats: { attack: 112 }, attacksPerSecond: 1.20, tier: 3, // family-tag: chaotic-axe → Swarming
    mechanicEffects: { 'weapon.dead-swing-interval': 5 },
    icon: 'items/weapons/cataclysm-axe.png',
    description: 'Chaos given an edge — and, at last, a little rhythm. Every fifth swing still finds only air.',
  }],

  ['cave-vest-t3', {
    id: 'cave-vest-t3', name: 'Deepscale Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 14, slot: 'armor',
    cost: { red: 116, yellow: 29 }, stats: { "maxHp": 225, "damageReduction": 0.3 }, // family-tag: premium %DR wall → Swarming
    tier: 3,
    icon: 'items/armor/deepscale-hide.png',
    description: "Dependable protection against direct damage and damage over time.",

mechanicEffects: {},
}],

  // CHARM — Absorb, T3. The old always-on Recovery trickle came off with the
  // pulse identity that moved to Swamp: Cave's charm is the Absorb hook, and
  // mixing a second sustain mechanic into it blurs the distinction the
  // Recovery/Barrier/Absorb split exists to draw.
  ['cave-charm-t3', {
    id: 'cave-charm-t3', name: 'Echo Geode',
    recipeGroup: 'cave', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { red: 100, green: 25 }, stats: { "recovery": 50.5 }, // family-tag: reliable generalist recovery → Swarming
    mechanicEffects: { "defense.absorb-pct": 0.24, "defense.absorb-guard-bonus-pct": 0.1 },
    tier: 3,
    icon: 'items/charms/echo-geode.png',
    description: 'It rings with every blow that lands, and rings louder while you stand behind a guard.',
  }],

  ['cave-boots-t3', {
    id: 'cave-boots-t3', name: 'Echostep Treads',
    recipeGroup: 'cave', requiredBiomeLevel: 16, slot: 'mobility',
    cost: { red: 100 }, stats: { "speed": 83 }, tier: 3, // family-tag: cave generalist mobility → Swarming
    mechanicEffects: { "mobility.stealth-pct": 0.6 },
    icon: 'items/boots/echostep-treads.png',
    description: 'They give back no sound at all — not even the echo the deep stone expects.',
  }],

] satisfies [string, Recipe][];
