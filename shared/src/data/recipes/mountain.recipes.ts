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
// 1. The defense candidate removes soft-cap grants at all tiers. Health and
//    Guard potency provide the lineage's heavy-hit defense instead.
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

// ── T1 ECONOMY CANDIDATE C (2026-08-31) ───────────────────────────────────
// Every T1 (+5) step's ESSENCE cost was cut 25%, rounded to the nearest 5
// (Math.round semantics): 205->155, 260->195, 200->150, 100->75, 75->55,
// 70->55, 60->45. Catalyst costs, initial crafts and +1..+4 are UNCHANGED, so
// the per-item "same total (N)" notes below now describe the pre-candidate
// total, not the current one. The target is the post-mastery affordability
// tail only -- the 2x bot cohort spent its last ~15m/run earning the final
// +5 essence after every biome was already maxed.
// ──────────────────────────────────────────────────────────────────────────

export const mountainRecipeEntries = [
  // ── T1 ──
  // `weapon.empowered-mult-bonus` is MULTIPLICATIVE on the empowered attack's
  // normal multiplier — see the warning on the T4 Warmaul for why.
  ['heavy-hammer', {
    id: 'heavy-hammer', name: 'Heavy Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 1, slot: 'weapon',
    // 2026-09-26 weapon pass: Attack 26->27 (+5: 36->38).
    cost: { blue: 22 }, stats: { attack: 38 }, attacksPerSecond: 0.55, tier: 1,
    icon: 'items/weapons/heavy-hammer.png',
    mechanicEffects: { 'weapon.empowered-mult-bonus': 0.22 },
    description: 'Two-handed, brutal, and honest. It asks only that you find the time to swing it.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~497 (was 496).
    // +5 catalyst from its own T2 hammer successor's tag ("slow heavy hammer →
    // Heavy").
  }],

  ['mountain-vest-t1', {
    id: 'mountain-vest-t1', name: 'Fallen Knight Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 2, slot: 'armor',
    cost: { blue: 22 }, stats: { "maxHp": 54, "plating": 2, "damageReduction": 0.04 },
    mechanicEffects: { "guard.potency-pct": 0.25 },
    tier: 1,
    icon: 'items/armor/fallen-knight-plate.png',
    description: "A sturdy health reserve that strengthens timed Guards.",
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~497 (was 496).
    // +5 catalyst from mountain-vest-t2's own tag ("Guard-amplifying plate →
    // Heavy").
  }],

  // CHARM — Barrier. Capacity is the only axis that grows at T1 on purpose:
  // recharge rate and delay are held at their engine defaults so future items
  // have those axes free to specialise (baseline §9.5).
  ['mountain-charm-t1', {
    id: 'mountain-charm-t1', name: 'Granite Barrier',
    recipeGroup: 'mountain', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { blue: 18 }, stats: { "recovery": 4.5 },
    mechanicEffects: { "defense.barrier-pct": 0.18 },
    tier: 1,
    icon: 'items/charms/granite-barrier.png',
    description: 'A palm of carved granite, cold and patient as the peak it came from.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~253 (was 255).
  }],

  // BOOTS — continuous gap closing. No proc timer, no internal cooldown, no
  // benefit while retreating, and nothing once already inside the minimum gap.
  // It should read instantly as "these help me reach the target".
  ['mountain-boots-t1', {
    id: 'mountain-boots-t1', name: 'Iron Treads',
    recipeGroup: 'mountain', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { blue: 18 }, stats: { "speed": 21 }, tier: 1,
    mechanicEffects: { "mobility.approach-speed-pct": 0.6 },
    icon: 'items/boots/iron-treads.png',
    description: 'Heavy soles that bite into scree and loose rock alike.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, total ~178 (was 176).
  }],

  // ── T2 ──
  // T2 economy pass (2026-08-29): now an EVOLUTION of heavy-hammer at +5.
  ['quake-hammer', {
    id: 'quake-hammer', name: 'Quake Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 7, slot: 'weapon',
    evolvesFrom: 'heavy-hammer',
    // 2026-09-26 weapon normalization: Attack 47->45 (+5: 70->85).
    cost: { blue: 52 }, stats: { attack: 85 }, attacksPerSecond: 0.55, tier: 2, // family-tag: slow heavy hammer → Heavy
    reconstructCost: { blue: 182 },
    icon: 'items/weapons/quake-hammer.png',
    // Cast Speed (abilities evolution §6.1) lives on Mountain's T2 hammer — the
    // biome that owns Charged Strike, and whose whole identity is the wind-up.
    // Only affects abilities with a real castTime.
    mechanicEffects: {
      'weapon.empowered-mult-bonus': 0.33,
      'technique.cast-speed-pct': 0.15,
    },
    description: 'When it lands, the ground remembers it longer than the foe does.',
  }],

  // T2 economy pass (2026-08-29): now an EVOLUTION of mountain-vest-t1 at +5.
  ['mountain-vest-t2', {
    id: 'mountain-vest-t2', name: 'Iron Crusader Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 8, slot: 'armor',
    cost: { blue: 52 }, stats: { "maxHp": 99, "plating": 2, "damageReduction": 0.08 }, // family-tag: Guard-amplifying plate → Heavy
    reconstructCost: { blue: 182 },
    mechanicEffects: { "guard.potency-pct": 0.3 },
    tier: 2,
    icon: 'items/armor/iron-crusader-plate.png',
    description: "A sturdy health reserve that strengthens timed Guards.",
  }],

  // T2 economy pass (2026-08-29): now an EVOLUTION of mountain-charm-t1 at +5.
  ['mountain-charm-t2', {
    id: 'mountain-charm-t2', name: 'Iron Bulwark',
    recipeGroup: 'mountain', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { blue: 42 }, stats: { "recovery": 8.7 }, // family-tag: barrier pool (anti-spike) → Heavy
    reconstructCost: { blue: 147 },
    mechanicEffects: { "defense.barrier-pct": 0.26, "guard.barrier-refill-pct": 0.15 },
    tier: 2,
    icon: 'items/charms/iron-bulwark.png',
    description: 'A ward-stone the mountainfolk pass down, hand to weathered hand.',
  }],

  // T2 economy pass (2026-08-29): now an EVOLUTION of mountain-boots-t1 at +5.
  ['mountain-boots-t2', {
    id: 'mountain-boots-t2', name: 'Mountain Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { blue: 42 }, stats: { "speed": 37 }, tier: 2, // family-tag: gap-closer boots serve the heavy-hit identity → Heavy
    reconstructCost: { blue: 147 },
    mechanicEffects: { "mobility.approach-speed-pct": 0.9 },
    icon: 'items/boots/mountain-stride.png',
    description: 'Forged for those who treat a sheer slope as a road.',
  }],

  // ── T3 ──
  // T3 economy pass (2026-08-30): now an EVOLUTION of quake-hammer at +5. Costs are
  // 2.00× the finalized T2 predecessor's lifetime total on the shipped accelerating
  // curve (4/10/16/26/44% of post-base spend); catalysts move off the base craft to
  // +4/+5, continuing the T2 grammar one tier up.
  ['mountain-avalanche-maul', {
    id: 'mountain-avalanche-maul', name: 'Avalanche Maul',
    recipeGroup: 'mountain', requiredBiomeLevel: 13, slot: 'weapon',
    evolvesFrom: 'quake-hammer',
    // 2026-09-26 weapon normalization: Attack 84->96 (+5: 126->164). It sat 21% under the T3 +5 median.
    cost: { blue: 116 }, stats: { attack: 164 }, attacksPerSecond: 0.55, tier: 3, // family-tag: slow heavy maul → Heavy
    reconstructCost: { blue: 406 },
    icon: 'items/weapons/avalanche-maul.png',
    element: 'frost',   // cosmetic attack tint only
    mechanicEffects: { 'weapon.empowered-mult-bonus': 0.44 },
    description: 'It does not so much strike as arrive, the way a slope arrives on a village.',
  }],

  // T3 is where the lineage picks the damage cap back up — see change (1) in the
  // file header. By this tier the game reliably produces hits large enough for a
  // max-hit clamp to be a real defensive tool rather than dead text.
  ['mountain-vest-t3', {
    id: 'mountain-vest-t3', name: 'Summit Aegis',
    recipeGroup: 'mountain', requiredBiomeLevel: 14, slot: 'armor',
    cost: { blue: 116, red: 29 }, stats: { "maxHp": 270, "plating": 3, "damageReduction": 0.17 }, // family-tag: Guard-amplifying plate → Heavy
    reconstructCost: { blue: 406, red: 102 },
    mechanicEffects: { "guard.potency-pct": 0.35 },
    tier: 3,
    icon: 'items/armor/summit-aegis.png',
    description: "A sturdy health reserve that strengthens timed Guards.",
  }],

  ['mountain-charm-t3', {
    id: 'mountain-charm-t3', name: 'Bastion Heart',
    recipeGroup: 'mountain', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { blue: 100, red: 25 }, stats: { "recovery": 28.2 }, // family-tag: barrier pool (anti-spike) → Heavy
    reconstructCost: { blue: 350, red: 88 },
    mechanicEffects: { "defense.barrier-pct": 0.34, "guard.barrier-refill-pct": 0.2 },
    tier: 3,
    icon: 'items/charms/bastion-heart.png',
    description: 'A core of mountain-heart stone that raises a wall of itself, over and over.',
  }],

  ['mountain-boots-t3', {
    id: 'mountain-boots-t3', name: 'Peak Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 16, slot: 'mobility',
    cost: { blue: 100 }, stats: { "speed": 66 }, tier: 3, // family-tag: gap-closer boots → Heavy
    reconstructCost: { blue: 350 },
    mechanicEffects: { "mobility.approach-speed-pct": 1.2 },
    icon: 'items/boots/peak-stride.png',
    description: 'Not even the mountain can keep you from your prey.',
  }],

  // ── T4 ──
  // T4 economy pass (2026-08-30): both branches now EVOLVE from Avalanche Maul at
  // +5 (T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §4). Costs are 2.00× the
  // finalized T3 predecessor's lifetime total on the shipped accelerating curve;
  // catalysts move to the weapon/armor 0/0/0/0/3/4 schedule (was a flat 4-at-the-door).
  // Earthsunder owns the largest raw hit: 240 -> 540 Attack, 20% above Tyrant
  // at matching upgrades, with its slower 0.40 cadence retained. Warmaul keeps
  // the T-line cadence and its empowered-attack specialization.
  ['mountain-earthsunder-maul', {
    id: 'mountain-earthsunder-maul', name: 'Earthsunder Maul',
    recipeGroup: 'mountain', requiredBiomeLevel: 19, slot: 'weapon',
    evolvesFrom: 'mountain-avalanche-maul',
    // 2026-09-26 T2-T4 weapon normalization: Attack 240->264 (+5: 540->486).
    cost: { blue: 256 }, stats: { attack: 486 }, attacksPerSecond: 0.40, tier: 4, // family-tag: capstone heavy maul → Heavy
    reconstructCost: { blue: 896 },
    icon: 'items/weapons/earthsunder-maul.png',
    description: 'It does not strike the earth so much as remind it of an old grievance.',
  }],

  ['mountain-warmaul', {
    id: 'mountain-warmaul', name: 'Warmaul',
    recipeGroup: 'mountain', requiredBiomeLevel: 19, slot: 'weapon',
    evolvesFrom: 'mountain-avalanche-maul',
    // 2026-09-26 T2-T4 weapon normalization: Attack 98->184 (+5: 147->370).
    cost: { blue: 240 }, stats: { attack: 370 }, attacksPerSecond: 0.55, tier: 4, // family-tag: capstone hammer → Heavy
    reconstructCost: { blue: 840 },
    // ⚠⚠ empowered-mult-bonus MUST be implemented MULTIPLICATIVELY, not additively.
    // final empowered mult = base_mult * (1 + 0.48), i.e. a flat +48% to the
    // empowered hit REGARDLESS of the spec's base multiplier.
    // Additive (+0.48 flat) would skew hugely toward low-mult/high-frequency
    // specs and barely help high-mult specs. Multiplicative gives every spec the
    // same %, which is the design intent.
    mechanicEffects: { 'weapon.empowered-mult-bonus': 0.55 },
    icon: 'items/weapons/warmaul.png',
    description: 'Lighter in the haft, quicker to the shoulder — it rewards the soldier who already knows when to swing.',
  }],

  ['mountain-vest-t4', {
    id: 'mountain-vest-t4', name: "Titan's Keep",
    recipeGroup: 'mountain', requiredBiomeLevel: 20, slot: 'armor',
    cost: { blue: 256, red: 64 }, stats: { "maxHp": 519, "plating": 5, "damageReduction": 0.21 }, // family-tag: capstone Guard plate → Heavy
    reconstructCost: { blue: 896, red: 224 },
    // Timed Guard potency replaces the former cap-triggered barrier refill.
    mechanicEffects: { "guard.potency-pct": 0.4 },
    tier: 4,
    icon: 'items/armor/titans-keep.png',
    description: "A sturdy health reserve that strengthens timed Guards.",
  }],

  // Branch: trades some of Titan's Keep plating for a barrier-break payout.
  ['mountain-vest-t4-stormwall', {
    id: 'mountain-vest-t4-stormwall', name: 'Stormwall Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 20, slot: 'armor',
    cost: { blue: 256, red: 64 }, stats: { "maxHp": 519, "plating": 5, "damageReduction": 0.21 }, // family-tag: capstone anti-spike plate → Heavy
    reconstructCost: { blue: 896, red: 224 },
    // † barrier-break-hp-recovery-pct: when the barrier is emptied, recover 30% of
    //   its max value as HP (armor-side variant; rider cooldown applies).
    mechanicEffects: { "guard.potency-pct": 0.3, "defense.barrier-pct": 0.1, "defense.barrier-break-hp-recovery-pct": 0.2 },
    tier: 4,
    icon: 'items/armor/stormwall-plate.png',
    description: "Strengthens timed Guards and grants a small barrier that heals you when broken.",
  }],

  ['mountain-charm-t4', {
    id: 'mountain-charm-t4', name: 'Fortress Heart',
    recipeGroup: 'mountain', requiredBiomeLevel: 21, slot: 'recovery',
    cost: { blue: 220, red: 30 }, stats: { "recovery": 77.8 }, // family-tag: barrier pool (anti-spike) → Heavy
    reconstructCost: { blue: 770, red: 105 },
    mechanicEffects: { "defense.barrier-pct": 0.42, "guard.barrier-refill-pct": 0.3 },
    tier: 4,
    icon: 'items/charms/fortress-heart.png',
    description: 'A keep in miniature: it throws up a wall, lets it fall, and throws up another, tireless as siegework.',
  }],

  // Branch: a smaller pool that pays out when it breaks.
  ['mountain-charm-t4-shieldmend', {
    id: 'mountain-charm-t4-shieldmend', name: 'Shieldmend Ward',
    recipeGroup: 'mountain', requiredBiomeLevel: 21, slot: 'recovery',
    cost: { blue: 220, red: 30 }, stats: { "recovery": 77.8 }, // family-tag: barrier-break survival → Heavy
    reconstructCost: { blue: 770, red: 105 },
    // † barrier-break-heal-pct: when the barrier is emptied, heal 25% of its max
    //   value as HP (rider cooldown applies).
    mechanicEffects: { "defense.barrier-pct": 0.37, "defense.barrier-break-heal-pct": 0.25, "guard.barrier-refill-pct": 0.2 },
    tier: 4,
    icon: 'items/charms/shieldmend-ward.png',
    description: 'When the ward shatters, it gives back a little of the blow it ate.',
  }],

  ['mountain-boots-t4', {
    id: 'mountain-boots-t4', name: 'Vanguard Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 22, slot: 'mobility',
    cost: { blue: 220 }, stats: { "speed": 119 }, tier: 4, // family-tag: gap-closer boots → Heavy
    reconstructCost: { blue: 770 },
    mechanicEffects: { "mobility.approach-speed-pct": 1.5 },
    icon: 'items/boots/vanguard-stride.png',
    description: 'While a foe stands at distance, they close the gap as if the mountain itself leaned them forward.',
  }],


  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Mountain owns ENDURANCE AND
  // PREPARATION — Brace and Charged Strike are both learned here, so it carries
  // both the tank core and the ability core.

  // T4 premium melee — Juggernaut: the dedicated tank, and melee-exclusive by
  // design. The L22 gate and 2,200 blue / 7 Heavy price make this a late-band
  // capstone rather than an incidental early core.
  ['core-juggernaut', {
    id: 'core-juggernaut', name: 'Juggernaut Core',
    recipeGroup: 'mountain', requiredBiomeLevel: 22, slot: 'core', coreEligibility: 'melee',
    lineageId: 'core-juggernaut',
    cost: { blue: 2200 }, // family-tag: durability wall → Heavy
    stats: {}, tier: 4,
    // HP, plating and the separate DR layer COMPOUND, so this must be judged as a
    // whole survivability package rather than three numbers. It clears slowly —
    // that is the cost, and it is paid in attack speed and movement, not in eHP.
    mechanicEffects: {"core.maxhp-mult": 0.2, "core.plating-mult": 0.1, "core.damage-taken-pct": -0.1, "core.attack-speed-mult": -0.25, "core.speed-mult": -0.1},
    icon: 'items/cores/juggernaut.png',
    description: 'The mountain does not dodge. It simply outlasts whatever is thrown at it, and so will you.',
  }],

  // T3 premium unrestricted — Arcanist: abilities come back faster and hit harder.
  // It is the final Mountain reward at L18: 1,200 blue / 5 Swarming.
  // TECHNIQUE-ONLY on purpose: `technique.*` (offence) and `guard.*` (defence) are
  // separate budgets so one item can never buy both. A Guard-flavoured branch is
  // where the defensive half belongs.
  ['core-arcanist', {
    id: 'core-arcanist', name: 'Arcanist Core',
    recipeGroup: 'mountain', requiredBiomeLevel: 18, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-arcanist',
    cost: { blue: 1200 }, // family-tag: ability tempo → Swarming
    stats: {}, tier: 3,
    // Worth little when abilities are a minor part of the build — the specialisation
    // IS the opportunity cost, so no explicit penalty is authored.
    mechanicEffects: { 'technique.cooldown-reduction-pct': 0.20, 'technique.power-pct': 0.20 },
    icon: 'items/cores/arcanist.png',
    description: 'Thin air, long thoughts. The gap between what you can do and how often shrinks.',
  }],

  ['relic-colossus-heart', {
    id: 'relic-colossus-heart', name: 'Colossus Heart',
    recipeGroup: 'mountain', requiredBiomeLevel: 24, slot: 'relic',
    lineageId: 'relic-colossus-heart',
    cost: { blue: 3300 },
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
    cost: { blue: 2500 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': 0.10,
      'relic.mechanic-potency': 0.10,
    },
    icon: 'items/relics/equilibrium-shard.png',
    description: 'A clean answer with no hidden edge: a little more rhythm, a little more force.',
  }],

] satisfies [string, Recipe][];
