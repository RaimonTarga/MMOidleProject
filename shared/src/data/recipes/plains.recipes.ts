import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// PLAINS — full lineage (T1→T2; retires after T2).
//
// Identity (design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md §5):
//   weapon  cheap generalist + Technique frequency. Deliberately BELOW the
//           specialist raw-DPS budget — do NOT normalise it upward.
//   armor   plating / swarm defence
//   charm   kill-chain Recovery — a kill keeps part of Recovery running in
//           combat; further kills REFRESH the window, never stack a copy
//   boots   kill momentum
//
// ── T1 ITEM REWORK: THE SCALING RULE (applies to all five T1-biome files) ──
// T1 numbers are verbatim from design_docs/T1_ITEM_NUMERICAL_BASELINE.md.
// T2+ numbers are DERIVED from that baseline, not re-designed:
//   · raw magnitude (attack / maxHp / plating / recovery / speed) steps ×1.8 per
//     tier at +0, and spans 100%→150% of that tier's +0 across +0…+5;
//   · boot `speed` is the exception — it spans ~100%→128%, because the
//     conditional movement mechanic carries the rest of the boot's budget
//     (philosophy §4: a +10% budget step is not a +10% step on every stat);
//   · percentage mechanics (evasion, DR, DoT resist, potency, CDR, barrier,
//     absorb, stealth, slow resist, boot bonuses) do NOT compound at 1.8× —
//     their marginal value rises nonlinearly, so they climb a hand-authored,
//     decelerating ladder;
//   · `attacksPerSecond` is lineage IDENTITY, not budget, so it is carried, not
//     scaled. Attack is what pays for the tier.
// Costs, catalysts, biome levels and evolution wiring are untouched by the
// rework — the economy is an explicitly separate pass (baseline §17).
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

export const plainsRecipeEntries = [
  // ── T1 ──
  // Cheaper than the other T1 weapons and below their raw budget, on purpose.
  ['iron-broadsword', {
    id: 'iron-broadsword', name: 'Iron Broadsword',
    recipeGroup: 'plains', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { yellow: 10 }, stats: { attack: 10 }, attacksPerSecond: 0.80, tier: 1,
    // Technique CDR is the whole reason this stays a legitimate generalist pick
    // despite the low raw budget. CDR is multiplicatively powerful, so 6→11% is
    // intentionally conservative (baseline §5.2).
    mechanicEffects: { 'technique.cooldown-reduction-pct': 0.06 },
    icon: 'items/weapons/iron-broadsword.png',
    description: 'Mass-forged for the ranks, dependable as sunrise. Ten thousand like it have won quiet wars.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (240)
    // as before — reshaped, not inflated. No catalyst: stays neutral like its
    // own T2 successor (knight-steelsword), an intentional "flexible payment"
    // identity noted on plains-boots-t2's family-tag comment.
    upgrades: [
      { stats: { attack: 1 }, mechanicEffects: { 'technique.cooldown-reduction-pct': 0.01 }, cost: { yellow: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 1 }, mechanicEffects: { 'technique.cooldown-reduction-pct': 0.01 }, cost: { yellow: 25 }, requiredBiomeLevel: 3 },
      { stats: { attack: 1 }, mechanicEffects: { 'technique.cooldown-reduction-pct': 0.01 }, cost: { yellow: 35 }, requiredBiomeLevel: 4 },
      { stats: { attack: 1 }, mechanicEffects: { 'technique.cooldown-reduction-pct': 0.01 }, cost: { yellow: 60 }, requiredBiomeLevel: 4 },
      { stats: { attack: 1 }, mechanicEffects: { 'technique.cooldown-reduction-pct': 0.01 }, cost: { yellow: 75 }, requiredBiomeLevel: 4 },
    ],
  }],

  // Plating / swarm defence. Deliberately extreme against small Plains hits —
  // that is the point of the armor, not an accident of tuning.
  ['plains-vest-t1', {
    id: 'plains-vest-t1', name: "Survivor's Robe",
    recipeGroup: 'plains', requiredBiomeLevel: 2, slot: 'armor',
    cost: { yellow: 20 }, stats: { maxHp: 24, plating: 7 }, tier: 1,
    icon: 'items/armor/survivors-robe.png',
    description: 'Field plate patched and repatched by those who lived to patch it.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (470).
    // +5 catalyst inherited from plains-vest-t2's own family-tag ("plating
    // answers frequent light hits → Alacrity").
    upgrades: [
      { stats: { maxHp: 3, plating: 1 }, cost: { yellow: 20 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 3, plating: 1 }, cost: { yellow: 45 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, plating: 1 }, cost: { yellow: 70 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, plating: 1 }, cost: { yellow: 115 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, plating: 1 }, cost: { yellow: 150 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 4 },
    ],
  }],

  // CHARM — kill-chain Recovery. A kill switches on 20→30% of the player's
  // Recovery RATE for 4s; further kills refresh that window rather than stacking
  // a second copy. Excellent while chaining dense packs, deliberately poor
  // against a boss or an isolated elite (baseline §9.2).
  ['plains-charm-t1', {
    id: 'plains-charm-t1', name: 'Plains Stone',
    recipeGroup: 'plains', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { yellow: 10 }, stats: { recovery: 1 },
    mechanicEffects: { 'defense.recovery-on-kill-pct': 0.20, 'defense.recovery-on-kill-ms': 4000 },
    tier: 1,
    icon: 'items/charms/plains-stone.png',
    description: 'A sun-warmed stone from the heart of the grasslands, humming with quiet vigor.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (190).
    // No catalyst — charms stay clean at T1.
    upgrades: [
      { mechanicEffects: { 'defense.recovery-on-kill-pct': 0.02 }, cost: { yellow: 10 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.recovery-on-kill-pct': 0.02 }, cost: { yellow: 20 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-on-kill-pct': 0.02 }, cost: { yellow: 30 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.recovery-on-kill-pct': 0.02 }, cost: { yellow: 45 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-on-kill-pct': 0.02 }, cost: { yellow: 55 }, requiredBiomeLevel: 4 },
    ],
  }],

  // BOOTS — kill momentum. The movement half of Plains' chain-farming identity;
  // the rework swapped this with Forest's out-of-combat traversal boot.
  ['plains-boots-t1', {
    id: 'plains-boots-t1', name: 'Fleet Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { yellow: 10 }, stats: { speed: 18 }, tier: 1,
    mechanicEffects: { 'mobility.kill-speed-pct': 0.25, 'mobility.kill-speed-ms': 3000 },
    icon: 'items/boots/fleet-boots.png',
    description: 'Open sandals built for crossing flat ground at a dead run.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (160).
    upgrades: [
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.kill-speed-pct': 0.03 }, cost: { yellow: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.kill-speed-pct': 0.03 }, cost: { yellow: 15 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.kill-speed-pct': 0.03 }, cost: { yellow: 25 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.kill-speed-pct': 0.03 }, cost: { yellow: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.kill-speed-pct': 0.03 }, cost: { yellow: 45 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  // T2 economy pass (2026-08-29): now an EVOLUTION of iron-broadsword at +5
  // (§5/§6). DELIBERATE EXCEPTION to §8's weapon catalyst schedule: this weapon
  // stays catalyst-neutral at every step, same as its T1 predecessor ("flexible
  // payment, deferred" — see plains-boots-t2's old family-tag comment) — there is
  // no established family for the Plains generalist sidearm, and inventing one
  // would contradict the T1 precedent. Reconstruct is essence-only too, priced at
  // 4x (not the usual 3.5x) so evolving still reads as strictly better even
  // without a catalyst gap. See T2_PROGRESSION_ECONOMY_IMPLEMENTATION ledger §11.
  ['knight-steelsword', {
    id: 'knight-steelsword', name: "Knight's Steelsword",
    recipeGroup: 'plains', requiredBiomeLevel: 7, slot: 'weapon',
    evolvesFrom: 'iron-broadsword',
    cost: { yellow: 45 }, stats: { attack: 18 }, attacksPerSecond: 1.00, tier: 2,
    reconstructCost: { yellow: 180 },
    icon: 'items/weapons/knight-steelsword.png',
    // The generalist Technique stat, inherited from the Broadsword: Plains is the
    // generalist biome, and this sidearm is still bought for its cadence of
    // Techniques rather than for the raw number on the blade.
    mechanicEffects: { 'technique.cooldown-reduction-pct': 0.12 },
    description: 'A knight sidearm kept keen by habit and pride — plain, proven, never flashy.',
    upgrades: [
      { stats: { attack: 2 }, mechanicEffects: { 'technique.cooldown-reduction-pct': 0.01 }, cost: { yellow: 27 }, requiredBiomeLevel: 8 },
      { stats: { attack: 2 }, mechanicEffects: { 'technique.cooldown-reduction-pct': 0.01 }, cost: { yellow: 68 }, requiredBiomeLevel: 9 },
      { stats: { attack: 2 }, mechanicEffects: { 'technique.cooldown-reduction-pct': 0.01 }, cost: { yellow: 108 }, requiredBiomeLevel: 10 },
      { stats: { attack: 2 }, mechanicEffects: { 'technique.cooldown-reduction-pct': 0.01 }, cost: { yellow: 176 }, requiredBiomeLevel: 10 },
      { stats: { attack: 1 }, mechanicEffects: { 'technique.cooldown-reduction-pct': 0.01 }, cost: { yellow: 296 }, requiredBiomeLevel: 10 },
    ],
  }],

  // T2 economy pass (2026-08-29): now an EVOLUTION of plains-vest-t1 at +5.
  ['plains-vest-t2', {
    id: 'plains-vest-t2', name: 'Enduring Robe',
    recipeGroup: 'plains', requiredBiomeLevel: 8, slot: 'armor',
    evolvesFrom: 'plains-vest-t1',
    cost: { yellow: 60 }, stats: { maxHp: 43, plating: 13 }, tier: 2, // family-tag: plating answers frequent light hits → Alacrity
    reconstructCost: { yellow: 210 }, reconstructCatalystCost: { alacrity: 2 },
    icon: 'items/armor/enduring-robe.png',
    description: 'Plate that has outlasted the wars it was made for, and the smith who made it.',
    upgrades: [
      { stats: { maxHp: 4, plating: 1 }, cost: { yellow: 36 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 4, plating: 1 }, cost: { yellow: 90 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 5, plating: 1 }, cost: { yellow: 144 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 4, plating: 2 }, cost: { yellow: 234 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 5, plating: 1 }, cost: { yellow: 396 }, catalystCost: { alacrity: 2 }, requiredBiomeLevel: 10 },
    ],
  }],

  // CHARM — kill-chain Recovery, deepened. Same shape as the Plains Stone.
  // T2 economy pass (2026-08-29): now an EVOLUTION of plains-charm-t1 at +5.
  ['plains-charm-t2', {
    id: 'plains-charm-t2', name: 'Stalwart Heart',
    recipeGroup: 'plains', requiredBiomeLevel: 9, slot: 'recovery',
    evolvesFrom: 'plains-charm-t1',
    cost: { yellow: 50 }, stats: { recovery: 2 }, // family-tag: on-kill Recovery answers swarm attrition → Alacrity
    reconstructCost: { yellow: 175 }, reconstructCatalystCost: { alacrity: 2 },
    mechanicEffects: { 'defense.recovery-on-kill-pct': 0.32, 'defense.recovery-on-kill-ms': 4000 },
    tier: 2,
    icon: 'items/charms/stalwart-heart.png',
    description: 'A greater plains-stone, its warmth swelling with every foe laid low.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-on-kill-pct': 0.02 }, cost: { yellow: 18 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.recovery-on-kill-pct': 0.02 }, cost: { yellow: 45 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-on-kill-pct': 0.02 }, cost: { yellow: 72 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 0.5 }, mechanicEffects: { 'defense.recovery-on-kill-pct': 0.02 }, cost: { yellow: 117 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-on-kill-pct': 0.02 }, cost: { yellow: 198 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 10 },
    ],
  }],

  // T2 economy pass (2026-08-29): now an EVOLUTION of plains-boots-t1 at +5.
  ['plains-boots-t2', {
    id: 'plains-boots-t2', name: 'Gale Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 10, slot: 'mobility',
    evolvesFrom: 'plains-boots-t1',
    cost: { yellow: 40 }, stats: { speed: 32 }, tier: 2, // family-tag: plains speed → Alacrity
    reconstructCost: { yellow: 140 }, reconstructCatalystCost: { alacrity: 2 },
    mechanicEffects: { 'mobility.kill-speed-pct': 0.45, 'mobility.kill-speed-ms': 3000 },
    icon: 'items/boots/gale-boots.png',
    description: 'Wind-cured leather that seems to lean into every stride.',
    upgrades: [
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.kill-speed-pct': 0.03 }, cost: { yellow: 12 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.kill-speed-pct': 0.03 }, cost: { yellow: 30 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.kill-speed-pct': 0.03 }, cost: { yellow: 48 }, requiredBiomeLevel: 10 },
      { stats: { speed: 1 }, mechanicEffects: { 'mobility.kill-speed-pct': 0.03 }, cost: { yellow: 78 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.kill-speed-pct': 0.03 }, cost: { yellow: 132 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────
  //
  // CANONICAL HEADER FOR THE WHOLE CORE CAST — other biomes' core blocks point here.
  // Design source: design_docs/CORE_DESIGN_PHILOSOPHY.md + CORE_CAST_REVIEW_DRAFT.md.
  //
  // WHAT A CORE IS: the 5th equipment slot, one at a time. A core MAGNIFIES what a
  // build already does — it does not add a new attack, resource, or payoff loop
  // (those belong to Techniques and Paths). Effects are percentage multipliers on
  // your FINAL summed stats (`core.*-mult`, summed across sources, applied once),
  // plus a few keys with their own consumers. Negative values are tradeoffs.
  //
  // ELIGIBILITY is binary — full effect or nothing at all, including the tradeoffs:
  //   melee        — close-range builds only
  //   ranged       — mid AND far builds (one pool)
  //   unrestricted — every build; lower ceiling, no commitment
  //
  // TIER PLACEMENT IS LOad-BEARING. A range is not chosen until PLAYER TIER 3, so a
  // restricted core placed in a T2 biome-level band is craftable but permanently
  // inert — which is exactly the bug the original placeholder cast shipped with.
  //   T2 starters   -> unrestricted only, T1 biomes at level 7-8
  //   T3 cores      -> T1 biomes level 13-18 | T2 biomes level 7-12 | T3 biomes level 1-6
  // Each T3 core sits MID-band so the biome's challenge is met before its answer is
  // earned (same convention as ability placement).
  //
  // Cores are OFF the +N upgrade track. They grow by EVOLVING into one of several
  // named branches at the next tier — one evolve, one decision. Every core therefore
  // carries a `lineageId` for those future branches to hang from.
  //
  // Values are the 2026-08-29 first-pass capstone tune; validate with benches/playtests.
  //
  // The cast, one core per biome (jungle/cave/mountain carry two):
  //   plains   Tempered      swamp    Controller     tundra   Scout
  //   forest   Survivalist   jungle   Bruiser        volcanic Catalyst
  //                                   Accelerant
  //   cave     Force         desert   Sniper
  //            Duelist       mountain Juggernaut
  //                                   Arcanist
  // (Corrected 2026-08-30: Accelerant is homed in JUNGLE — `jungle.recipes.ts` — not
  //  Forest; Forest carries only Survivalist.)

  // T2 starter — Tempered: the benchmark. Deliberately simple and never a trap,
  // so specialising stays a choice rather than a requirement.
  ['core-tempered', {
    id: 'core-tempered', name: 'Tempered Core',
    recipeGroup: 'plains', requiredBiomeLevel: 7, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-tempered',
    cost: { yellow: 45 }, catalystCost: { swarming: 1 }, // family-tag: reliable always-on generalist → Swarming
    stats: {}, tier: 2,
    mechanicEffects: { 'core.attack-mult': 0.12, 'core.maxhp-mult': 0.12 },
    icon: 'items/cores/tempered.png',
    description: 'Balanced for any hand. It asks no commitment, and rewards none in particular.',
  }],

] satisfies [string, Recipe][];
