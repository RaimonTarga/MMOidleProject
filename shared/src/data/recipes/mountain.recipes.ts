import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// MOUNTAIN — full lineage (T1→T4).
//
// Identity (design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md §5):
//   weapon  slow, heavy, empowered. High damage per swing, low cadence. It is
//           SUPPOSED to look mediocre in a raw autoattack comparison — its
//           budget buys big individual hits and empowered-attack amplification.
//   armor   DEFENSIVE-SKILL AMPLIFICATION. Mountain teaches Brace, so its plate
//           reinforces deliberate defensive windows. Authored against the
//           `guard.*` CATEGORY, never against one named skill.
//   charm   Barrier — the rechargeable secondary HP pool
//   boots   continuous gap closing toward the current target
//
// TWO REWORK CHANGES WORTH KNOWING:
//
// 1. The T1 damage-cap (`defense.max-hit-*`) was REMOVED, not deleted globally.
//    T1 does not yet contain enough genuinely enormous hits for a max-hit clamp
//    to be a natural foundational defence (philosophy §8.4). The concept is
//    reserved for the later tiers where extreme spike damage is common, so the
//    plate picks it up at T3 and keeps it at T4 — the lineage LEARNS to cap the
//    biggest hits once the game actually throws them.
//    Guard cooldown reduction is deliberately still absent everywhere: potency
//    first, CDR held back as the easy second lever if the armor reads too narrow.
//
// 2. The boots' acquire-target proc is gone. The bonus is now a continuous
//    condition — moving toward the target, and still outside the minimum gap —
//    with no timer and no cooldown. See `mobility.approach-speed-pct`.
//
// WHY THE RAW BULK IS HIGH: unlike plating, evasion, DR or DoT resistance, skill
// potency does nothing while no Guard is up. The plate therefore carries a
// healthy HP/plating shell so it is never a trap before the skill fires.
//
// Barrier answers Mountain's damage RHYTHM rather than its damage type: a big
// hit empties the pool, the long gap before the next one lets it recharge.
// Continuous chip and DoT suppress that recharge naturally, which is the
// matchup — no hidden "Mountain damage reduction" rule (philosophy §19).
//
// See the scaling rule in the header of `plains.recipes.ts` for how T2–T4
// numbers are derived from the T1 baseline.
// ─────────────────────────────────────────────────────────────────────────

export const mountainRecipeEntries = [
  // ── T1 ──
  // `weapon.empowered-mult-bonus` is MULTIPLICATIVE on the empowered attack's
  // normal multiplier — see the warning on the T4 Warmaul for why.
  ['heavy-hammer', {
    id: 'heavy-hammer', name: 'Heavy Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 22 }, stats: { attack: 26 }, attacksPerSecond: 0.55, tier: 1,
    icon: 'items/weapons/heavy-hammer.png',
    mechanicEffects: { 'weapon.empowered-mult-bonus': 0.15 },
    description: 'Two-handed, brutal, and honest. It asks only that you find the time to swing it.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~497 (was 496).
    // +5 catalyst from its own T2 hammer successor's tag ("slow heavy hammer →
    // Heavy").
    upgrades: [
      { stats: { attack: 2 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 25 }, requiredBiomeLevel: 2 },
      { stats: { attack: 2 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 45 }, requiredBiomeLevel: 3 },
      { stats: { attack: 2 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 75 }, requiredBiomeLevel: 4 },
      { stats: { attack: 2 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.02 }, cost: { blue: 125 }, requiredBiomeLevel: 4 },
      { stats: { attack: 2 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.02 }, cost: { blue: 205 }, catalystCost: { heavy: 1 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['mountain-vest-t1', {
    id: 'mountain-vest-t1', name: 'Fallen Knight Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 2, slot: 'armor',
    cost: { blue: 22 }, stats: { maxHp: 32, plating: 5 },
    mechanicEffects: { 'guard.potency-pct': 0.15 },
    tier: 1,
    icon: 'items/armor/fallen-knight-plate.png',
    description: 'Stripped from a knight who fell at the high pass and was never named.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~497 (was 496).
    // +5 catalyst from mountain-vest-t2's own tag ("Guard-amplifying plate →
    // Heavy").
    upgrades: [
      { stats: { maxHp: 4 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 25 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 4, plating: 1 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 45 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 75 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4, plating: 1 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 125 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 205 }, catalystCost: { heavy: 1 }, requiredBiomeLevel: 4 },
    ],
  }],

  // CHARM — Barrier. Capacity is the only axis that grows at T1 on purpose:
  // recharge rate and delay are held at their engine defaults so future items
  // have those axes free to specialise (baseline §9.5).
  ['mountain-charm-t1', {
    id: 'mountain-charm-t1', name: 'Granite Barrier',
    recipeGroup: 'mountain', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { blue: 18 }, stats: { recovery: 1 },
    mechanicEffects: { 'defense.barrier-pct': 0.12 },
    tier: 1,
    icon: 'items/charms/granite-barrier.png',
    description: 'A palm of carved granite, cold and patient as the peak it came from.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~253 (was 255).
    upgrades: [
      { mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 10 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 25 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 40 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.barrier-pct': 0.015 }, cost: { blue: 60 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.barrier-pct': 0.015 }, cost: { blue: 100 }, requiredBiomeLevel: 4 },
    ],
  }],

  // BOOTS — continuous gap closing. No proc timer, no internal cooldown, no
  // benefit while retreating, and nothing once already inside the minimum gap.
  // It should read instantly as "these help me reach the target".
  ['mountain-boots-t1', {
    id: 'mountain-boots-t1', name: 'Iron Treads',
    recipeGroup: 'mountain', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { blue: 18 }, stats: { speed: 16 }, tier: 1,
    mechanicEffects: { 'mobility.approach-speed-pct': 0.35 },
    icon: 'items/boots/iron-treads.png',
    description: 'Heavy soles that bite into scree and loose rock alike.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~178 (was 176).
    upgrades: [
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 15 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 25 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 70 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  ['quake-hammer', {
    id: 'quake-hammer', name: 'Quake Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { blue: 52 }, catalystCost: { heavy: 2 }, stats: { attack: 47 }, attacksPerSecond: 0.55, tier: 2, // family-tag: slow heavy hammer → Heavy
    icon: 'items/weapons/quake-hammer.png',
    // Cast Speed (abilities evolution §6.1) lives on Mountain's T2 hammer — the
    // biome that owns Charged Strike, and whose whole identity is the wind-up.
    // Only affects abilities with a real castTime.
    mechanicEffects: {
      'weapon.empowered-mult-bonus': 0.26,
      'technique.cast-speed-pct': 0.15,
    },
    description: 'When it lands, the ground remembers it longer than the foe does.',
    upgrades: [
      { stats: { attack: 4 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 78 }, requiredBiomeLevel: 8 },
      { stats: { attack: 5 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.02 }, cost: { blue: 156 }, requiredBiomeLevel: 9 },
      { stats: { attack: 4 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 312 }, requiredBiomeLevel: 10 },
      { stats: { attack: 5 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.02 }, cost: { blue: 312 }, requiredBiomeLevel: 10 },
      { stats: { attack: 5 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 312 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['mountain-vest-t2', {
    id: 'mountain-vest-t2', name: 'Iron Crusader Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 8, slot: 'armor',
    cost: { blue: 52 }, catalystCost: { heavy: 2 }, stats: { maxHp: 58, plating: 9 }, // family-tag: Guard-amplifying plate → Heavy
    mechanicEffects: { 'guard.potency-pct': 0.28 },
    tier: 2,
    icon: 'items/armor/iron-crusader-plate.png',
    description: 'Masterwork plate of the old crusades, dented in a hundred places, breached in none.',
    upgrades: [
      { stats: { maxHp: 6, plating: 1 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 78 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 5, plating: 1 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 156 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 6, plating: 1 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 276 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 5, plating: 1 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 276 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 6, plating: 1 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 276 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['mountain-charm-t2', {
    id: 'mountain-charm-t2', name: 'Iron Bulwark',
    recipeGroup: 'mountain', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { blue: 42 }, catalystCost: { heavy: 2 }, stats: { recovery: 2 }, // family-tag: barrier pool (anti-spike) → Heavy
    mechanicEffects: { 'defense.barrier-pct': 0.20 },
    tier: 2,
    icon: 'items/charms/iron-bulwark.png',
    description: 'A ward-stone the mountainfolk pass down, hand to weathered hand.',
    upgrades: [
      { mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 30 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 60 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 112 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.015 }, cost: { blue: 112 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.barrier-pct': 0.015 }, cost: { blue: 112 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['mountain-boots-t2', {
    id: 'mountain-boots-t2', name: 'Mountain Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { blue: 42 }, catalystCost: { heavy: 2 }, stats: { speed: 29 }, tier: 2, // family-tag: gap-closer boots serve the heavy-hit identity → Heavy
    mechanicEffects: { 'mobility.approach-speed-pct': 0.65 },
    icon: 'items/boots/mountain-stride.png',
    description: 'Forged for those who treat a sheer slope as a road.',
    upgrades: [
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 20 }, requiredBiomeLevel: 10 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 42 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 75 }, requiredBiomeLevel: 10 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 75 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 75 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── T3 ──
  ['mountain-avalanche-maul', {
    id: 'mountain-avalanche-maul', name: 'Avalanche Maul',
    recipeGroup: 'mountain', requiredBiomeLevel: 13, slot: 'weapon',
    cost: { blue: 116 }, catalystCost: { heavy: 3 }, stats: { attack: 84 }, attacksPerSecond: 0.55, tier: 3, // family-tag: slow heavy maul → Heavy
    icon: 'items/weapons/avalanche-maul.png',
    mechanicEffects: { 'weapon.empowered-mult-bonus': 0.37 },
    description: 'It does not so much strike as arrive, the way a slope arrives on a village.',
    upgrades: [
      { stats: { attack: 8 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 174 },  requiredBiomeLevel: 14 },
      { stats: { attack: 9 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.02 }, cost: { blue: 348 }, requiredBiomeLevel: 15 },
      { stats: { attack: 8 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 588 }, requiredBiomeLevel: 16 },
      { stats: { attack: 9 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.02 }, cost: { blue: 588 }, requiredBiomeLevel: 16 },
      { stats: { attack: 8 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 588 }, requiredBiomeLevel: 16 },
    ],
  }],

  // T3 is where the lineage picks the damage cap back up — see change (1) in the
  // file header. By this tier the game reliably produces hits large enough for a
  // max-hit clamp to be a real defensive tool rather than dead text.
  ['mountain-vest-t3', {
    id: 'mountain-vest-t3', name: 'Summit Aegis',
    recipeGroup: 'mountain', requiredBiomeLevel: 14, slot: 'armor',
    cost: { blue: 116, red: 29 }, catalystCost: { heavy: 3 }, stats: { maxHp: 104, plating: 16 }, // family-tag: Guard-amplifying plate → Heavy
    mechanicEffects: {
      'guard.potency-pct': 0.41,
      'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5,
    },
    tier: 3,
    icon: 'items/armor/summit-aegis.png',
    description: 'Forged for those who plan to be hit by something the size of a house and walk on.',
    upgrades: [
      { stats: { maxHp: 11, plating: 2 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 130, red: 44},  requiredBiomeLevel: 15 },
      { stats: { maxHp: 10, plating: 1 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 260, red: 88 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 11, plating: 2 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 390, red: 132 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 10, plating: 1 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 390, red: 132 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 10, plating: 2 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 390, red: 132 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['mountain-charm-t3', {
    id: 'mountain-charm-t3', name: 'Bastion Heart',
    recipeGroup: 'mountain', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { blue: 100, red: 25 }, catalystCost: { heavy: 3 }, stats: { recovery: 3 }, // family-tag: barrier pool (anti-spike) → Heavy
    mechanicEffects: { 'defense.barrier-pct': 0.28 },
    tier: 3,
    icon: 'items/charms/bastion-heart.png',
    description: 'A core of mountain-heart stone that raises a wall of itself, over and over.',
    upgrades: [
      { mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 50, red: 25 },  requiredBiomeLevel: 16 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 100, red: 50 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.barrier-pct': 0.015 }, cost: { blue: 150, red: 75 }, requiredBiomeLevel: 16 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 150, red: 75 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.barrier-pct': 0.015 }, cost: { blue: 150, red: 75 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['mountain-boots-t3', {
    id: 'mountain-boots-t3', name: 'Peak Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 16, slot: 'mobility',
    cost: { blue: 100 }, catalystCost: { heavy: 3 }, stats: { speed: 52 }, tier: 3, // family-tag: gap-closer boots → Heavy
    mechanicEffects: { 'mobility.approach-speed-pct': 0.95 },
    icon: 'items/boots/peak-stride.png',
    description: 'Not even the mountain can keep you from your prey.',
    upgrades: [
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 20 }, requiredBiomeLevel: 16 },
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 42 }, requiredBiomeLevel: 16 },
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 75 }, requiredBiomeLevel: 16 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 75 }, requiredBiomeLevel: 16 },
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 75 }, requiredBiomeLevel: 16 },
    ],
  }],

  // ── T4 ──
  // Two weapon branches off the same budget: Earthsunder spends everything on the
  // raw number at the slowest cadence in the game; Warmaul keeps the T-line
  // cadence and buys empowered amplification with the difference.
  ['mountain-earthsunder-maul', {
    id: 'mountain-earthsunder-maul', name: 'Earthsunder Maul',
    recipeGroup: 'mountain', requiredBiomeLevel: 19, slot: 'weapon',
    cost: { blue: 256 }, catalystCost: { heavy: 4 }, stats: { attack: 152 }, attacksPerSecond: 0.40, tier: 4, // family-tag: capstone heavy maul → Heavy
    icon: 'items/weapons/earthsunder-maul.png',
    description: 'It does not strike the earth so much as remind it of an old grievance.',
    upgrades: [
      { stats: { attack: 15 }, cost: { blue: 384 },  requiredBiomeLevel: 20 },
      { stats: { attack: 15 }, cost: { blue: 768 },  requiredBiomeLevel: 21 },
      { stats: { attack: 15 }, cost: { blue: 1290 }, requiredBiomeLevel: 22 },
      { stats: { attack: 15 }, cost: { blue: 1290 }, requiredBiomeLevel: 22 },
      { stats: { attack: 16 }, cost: { blue: 1290 }, requiredBiomeLevel: 22 },
    ],
  }],

  ['mountain-warmaul', {
    id: 'mountain-warmaul', name: 'Warmaul',
    recipeGroup: 'mountain', requiredBiomeLevel: 19, slot: 'weapon',
    cost: { blue: 240 }, catalystCost: { heavy: 4 }, stats: { attack: 98 }, attacksPerSecond: 0.55, tier: 4, // family-tag: capstone hammer → Heavy
    // ⚠⚠ empowered-mult-bonus MUST be implemented MULTIPLICATIVELY, not additively.
    // final empowered mult = base_mult * (1 + 0.48), i.e. a flat +48% to the
    // empowered hit REGARDLESS of the spec's base multiplier.
    // Additive (+0.48 flat) would skew hugely toward low-mult/high-frequency
    // specs and barely help high-mult specs. Multiplicative gives every spec the
    // same %, which is the design intent.
    mechanicEffects: { 'weapon.empowered-mult-bonus': 0.48 },
    icon: 'items/weapons/warmaul.png',
    description: 'Lighter in the haft, quicker to the shoulder — it rewards the soldier who already knows when to swing.',
    upgrades: [
      { stats: { attack: 10 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 360 },  requiredBiomeLevel: 20 },
      { stats: { attack: 10 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.02 }, cost: { blue: 720 },  requiredBiomeLevel: 21 },
      { stats: { attack: 10 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 1200 }, requiredBiomeLevel: 22 },
      { stats: { attack: 9 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.02 }, cost: { blue: 1200 }, requiredBiomeLevel: 22 },
      { stats: { attack: 10 }, mechanicEffects: { 'weapon.empowered-mult-bonus': 0.01 }, cost: { blue: 1200 }, requiredBiomeLevel: 22 },
    ],
  }],

  ['mountain-vest-t4', {
    id: 'mountain-vest-t4', name: "Titan's Keep",
    recipeGroup: 'mountain', requiredBiomeLevel: 20, slot: 'armor',
    cost: { blue: 256, red: 64 }, catalystCost: { heavy: 4 }, stats: { maxHp: 187, plating: 29 }, // family-tag: capstone Guard plate → Heavy
    // † max-hit-refills-barrier: when the damage cap triggers, immediately refill
    //   the barrier to full (shares the barrier-break rider cooldown).
    mechanicEffects: {
      'guard.potency-pct': 0.54,
      'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5,
      'defense.max-hit-refills-barrier': 1,
    },
    tier: 4,
    icon: 'items/armor/titans-keep.png',
    description: 'The blow that should have ended you instead rings the walls — and the walls answer by standing back up.',
    upgrades: [
      { stats: { maxHp: 19, plating: 3 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 290, red: 96 },  requiredBiomeLevel: 21 },
      { stats: { maxHp: 18, plating: 3 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 572, red: 192 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 19, plating: 3 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 18, plating: 3 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 19, plating: 3 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
    ],
  }],

  // Branch: trades some of Titan's Keep plating for a barrier-break payout.
  ['mountain-vest-t4-stormwall', {
    id: 'mountain-vest-t4-stormwall', name: 'Stormwall Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 20, slot: 'armor',
    cost: { blue: 256, red: 64 }, catalystCost: { heavy: 4 }, stats: { maxHp: 187, plating: 22 }, // family-tag: capstone anti-spike plate → Heavy
    // † barrier-break-hp-recovery-pct: when the barrier is emptied, recover 30% of
    //   its max value as HP (armor-side variant; rider cooldown applies).
    mechanicEffects: {
      'guard.potency-pct': 0.54,
      'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5,
      'defense.barrier-break-hp-recovery-pct': 0.30,
    },
    tier: 4,
    icon: 'items/armor/stormwall-plate.png',
    description: 'Built to take the storm head-on and turn what it absorbs back into a second wind.',
    upgrades: [
      { stats: { maxHp: 19, plating: 2 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 290, red: 96 },  requiredBiomeLevel: 21 },
      { stats: { maxHp: 18, plating: 2 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 572, red: 192 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 19, plating: 2 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 18, plating: 2 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 19, plating: 3 }, mechanicEffects: { 'guard.potency-pct': 0.02 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
    ],
  }],

  ['mountain-charm-t4', {
    id: 'mountain-charm-t4', name: 'Fortress Heart',
    recipeGroup: 'mountain', requiredBiomeLevel: 21, slot: 'recovery',
    cost: { blue: 220, red: 30 }, catalystCost: { heavy: 4 }, stats: { recovery: 6 }, // family-tag: barrier pool (anti-spike) → Heavy
    mechanicEffects: { 'defense.barrier-pct': 0.36 },
    tier: 4,
    icon: 'items/charms/fortress-heart.png',
    description: 'A keep in miniature: it throws up a wall, lets it fall, and throws up another, tireless as siegework.',
    upgrades: [
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 110, red: 30 }, requiredBiomeLevel: 22 },
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 220, red: 60 }, requiredBiomeLevel: 22 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.barrier-pct': 0.015 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.barrier-pct': 0.015 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
    ],
  }],

  // Branch: a smaller pool that pays out when it breaks.
  ['mountain-charm-t4-shieldmend', {
    id: 'mountain-charm-t4-shieldmend', name: 'Shieldmend Ward',
    recipeGroup: 'mountain', requiredBiomeLevel: 21, slot: 'recovery',
    cost: { blue: 220, red: 30 }, catalystCost: { heavy: 4 }, stats: { recovery: 6 }, // family-tag: barrier-break survival → Heavy
    // † barrier-break-heal-pct: when the barrier is emptied, heal 25% of its max
    //   value as HP (rider cooldown applies).
    mechanicEffects: {
      'defense.barrier-pct': 0.32,
      'defense.barrier-break-heal-pct': 0.25,
    },
    tier: 4,
    icon: 'items/charms/shieldmend-ward.png',
    description: 'When the ward shatters, it gives back a little of the blow it ate.',
    upgrades: [
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 110, red: 30 }, requiredBiomeLevel: 22 },
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 220, red: 60 }, requiredBiomeLevel: 22 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.barrier-pct': 0.01 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
    ],
  }],

  ['mountain-boots-t4', {
    id: 'mountain-boots-t4', name: 'Vanguard Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 22, slot: 'mobility',
    cost: { blue: 220 }, catalystCost: { heavy: 4 }, stats: { speed: 93 }, tier: 4, // family-tag: gap-closer boots → Heavy
    mechanicEffects: { 'mobility.approach-speed-pct': 1.25 },
    icon: 'items/boots/vanguard-stride.png',
    description: 'While a foe stands at distance, they close the gap as if the mountain itself leaned them forward.',
    upgrades: [
      { stats: { speed: 5 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 44 },  requiredBiomeLevel: 22 },
      { stats: { speed: 5 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 92 },  requiredBiomeLevel: 22 },
      { stats: { speed: 5 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 165 }, requiredBiomeLevel: 22 },
      { stats: { speed: 6 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 165 }, requiredBiomeLevel: 22 },
      { stats: { speed: 5 }, mechanicEffects: { 'mobility.approach-speed-pct': 0.05 }, cost: { blue: 165 }, requiredBiomeLevel: 22 },
    ],
  }],


  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Mountain owns ENDURANCE AND
  // PREPARATION — Brace and Charged Strike are both learned here, so it carries
  // both the tank core and the ability core.

  // T3 melee — Juggernaut: the dedicated tank, and melee-exclusive by design.
  // Other ranges may buy survivability, but never this whole package.
  ['core-juggernaut', {
    id: 'core-juggernaut', name: 'Juggernaut Core',
    recipeGroup: 'mountain', requiredBiomeLevel: 14, slot: 'core', coreEligibility: 'melee',
    lineageId: 'core-juggernaut',
    cost: { blue: 110 }, catalystCost: { heavy: 3 }, // family-tag: durability wall → Heavy
    stats: {}, tier: 3,
    // HP, plating and the separate DR layer COMPOUND, so this must be judged as a
    // whole survivability package rather than three numbers. It clears slowly —
    // that is the cost, and it is paid in attack speed and movement, not in eHP.
    mechanicEffects: {
      'core.maxhp-mult': 0.25, 'core.plating-mult': 0.32, 'core.dr-layer-pct': 0.12,
      'core.attack-speed-mult': -0.20, 'core.speed-mult': -0.07,
    },
    icon: 'items/cores/juggernaut.png',
    description: 'The mountain does not dodge. It simply outlasts whatever is thrown at it, and so will you.',
  }],

  // T3 unrestricted — Arcanist: abilities come back faster and hit harder.
  // TECHNIQUE-ONLY on purpose: `technique.*` (offence) and `guard.*` (defence) are
  // separate budgets so one item can never buy both. A Guard-flavoured branch is
  // where the defensive half belongs.
  ['core-arcanist', {
    id: 'core-arcanist', name: 'Arcanist Core',
    recipeGroup: 'mountain', requiredBiomeLevel: 17, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-arcanist',
    cost: { blue: 90 }, catalystCost: { swarming: 2 }, // family-tag: ability tempo → Swarming
    stats: {}, tier: 3,
    // Worth little when abilities are a minor part of the build — the specialisation
    // IS the opportunity cost, so no explicit penalty is authored.
    mechanicEffects: { 'technique.cooldown-reduction-pct': 0.18, 'technique.power-pct': 0.08 },
    icon: 'items/cores/arcanist.png',
    description: 'Thin air, long thoughts. The gap between what you can do and how often shrinks.',
  }],

  ['relic-colossus-heart', {
    id: 'relic-colossus-heart', name: 'Colossus Heart',
    recipeGroup: 'mountain', requiredBiomeLevel: 24, slot: 'relic',
    lineageId: 'relic-colossus-heart',
    cost: { blue: 240 }, catalystCost: { heavy: 4 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': -0.30,
      'relic.mechanic-potency': 0.40,
    },
    icon: 'items/relics/colossus-heart.png',
    description: 'A mountain heartbeat: slow enough to feel inevitable, heavy enough to end the argument.',
  }],

  // The no-trade Relic. Mountain is the only biome with nodes at every tier T1-T4,
  // which makes it the natural home for the one Relic that asks nothing back — and
  // its level-24 gate is unchanged, because Mountain actually reaches 24 through T4
  // play. Moved off Plains, which stops at T2: the same gate there cost ~12,500
  // kills of T2 content. Mountain is the one biome hosting two Relics; the Cores
  // already double up here for the same reason.
  ['relic-equilibrium-shard', {
    id: 'relic-equilibrium-shard', name: 'Equilibrium Shard',
    recipeGroup: 'mountain', requiredBiomeLevel: 24, slot: 'relic',
    lineageId: 'relic-equilibrium-shard',
    cost: { blue: 200 }, catalystCost: { heavy: 4 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': 0.10,
      'relic.mechanic-potency': 0.10,
    },
    icon: 'items/relics/equilibrium-shard.png',
    description: 'A clean answer with no hidden edge: a little more rhythm, a little more force.',
  }],

] satisfies [string, Recipe][];
