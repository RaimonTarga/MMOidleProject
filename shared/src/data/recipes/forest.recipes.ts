import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// FOREST — full lineage (T1→T2; retires after T2).
//
// Identity (design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md §5):
//   weapon  fast weapon. FAST DOES NOT MEAN ON-HIT-ONLY — the cadence has to
//           serve basic attacks, resource generation and DoT application alike.
//   armor   evasion / frequent-hit defence
//   charm   the foundational investment in the Recovery STAT, plus Recovery
//           SKILL potency (a category hook, never "Second Wind +X%")
//   boots   traversal / out-of-combat speed
//
// See the scaling rule in the header of `plains.recipes.ts` for how T2 numbers
// are derived from the T1 baseline.
// ─────────────────────────────────────────────────────────────────────────

export const forestRecipeEntries = [
  // ── Rapier lineage (system rework Step 6 worked example) ───────────────────
  // Flash Rapier (base) → Gale Needle / Thorn Needle (branches). Evolve consumes
  // the +3 predecessor; reconstruction skips the chain for a higher cost.
  //
  // The rapier is the one lineage that spends part of its UPGRADE budget on
  // cadence rather than Attack (`attacksPerSecond` deltas on the steps), because
  // cadence is the identity: it adds little Attack of its own and instead
  // multiplies the player's innate 15 at high frequency.
  //
  // SIMULATION WATCHPOINT (baseline §5.3): this is the raw-throughput leader and
  // compounds with on-hit, Energy gain, Cadence building and rapid DoT
  // application. Do NOT reflexively nerf it on tooltip DPS — compare full
  // class-mechanic throughput first, and if it must come down, the lever is a
  // modest APS/Attack cut, never a bolted-on drawback.
  ['flash-rapier', {
    id: 'flash-rapier', name: 'Flash Rapier',
    recipeGroup: 'forest', requiredBiomeLevel: 1, slot: 'weapon',
    lineageId: 'rapier',
    cost: { green: 20 }, stats: { attack: 5 }, attacksPerSecond: 1.50, tier: 1,
    icon: 'items/weapons/flash-rapier.png',
    description: 'Forged thin as a reed by duelists who prized speed above all.',
    upgrades: [
      { attacksPerSecond: 0.02, cost: { green: 30 }, requiredBiomeLevel: 2 },
      { stats: { attack: 1 }, attacksPerSecond: 0.02, cost: { green: 60 }, requiredBiomeLevel: 3 },
      { attacksPerSecond: 0.02, cost: { green: 120 }, requiredBiomeLevel: 4 }, // +3 = evolution-ready
      { stats: { attack: 1 }, attacksPerSecond: 0.02, cost: { green: 240 }, requiredBiomeLevel: 5 },
      { stats: { attack: 1 }, attacksPerSecond: 0.02, cost: { green: 480 }, requiredBiomeLevel: 6 },
    ],
  }],

  // Evasion starts meaningful the moment the armor is obtained, and grows
  // CAUTIOUSLY: percentage avoidance is worth more per point the higher it goes,
  // so +5 lands at 22%, not the ~38% the old +4pp-per-step curve produced.
  ['forest-vest-t1', {
    id: 'forest-vest-t1', name: 'Shaded Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 20 }, stats: { maxHp: 28, plating: 3, evasion: 0.16 }, tier: 1,
    icon: 'items/armor/shaded-bindings.png',
    description: 'Woven in the dappled dark beneath the canopy, where shadow clings to cloth.',
    upgrades: [
      { stats: { maxHp: 3, evasion: 0.01 }, cost: { green: 30 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 3, plating: 1, evasion: 0.01 }, cost: { green: 60 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, evasion: 0.01 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, plating: 1, evasion: 0.01 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 3, evasion: 0.02 }, cost: { green: 120 }, requiredBiomeLevel: 4 },
    ],
  }],

  // CHARM — the broadly-useful Recovery investment. Raw Recovery lifts OOC
  // regen, Squire's combat access, Striker pulses and every Recovery-tagged
  // skill at once; the potency rider rewards actually building around those
  // skills. It supports the recovery CATEGORY, deliberately not one named skill.
  //
  // WATCHPOINT (baseline §9.3): this charm participates in many systems. If it
  // becomes the default pick for nearly every build, cut raw Recovery first —
  // removing the skill synergy would delete the identity instead of tuning it.
  ['forest-charm-t1', {
    id: 'forest-charm-t1', name: 'Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 15 }, stats: { recovery: 3 }, tier: 1,
    mechanicEffects: { 'defense.recovery-skill-potency': 0.10 },
    icon: 'items/charms/heartroot-amulet.png',
    description: 'Heartroot drawn from the oldest tree in the grove, still faintly warm.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 15 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 30 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 60 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 60 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 60 }, requiredBiomeLevel: 4 },
    ],
  }],

  // BOOTS — traversal. The straightforward fast-travel option, no kill trigger
  // needed; the rework swapped this with Plains' kill-momentum boot.
  ['forest-boots-t1', {
    id: 'forest-boots-t1', name: 'Sprinter Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { green: 10 }, stats: { speed: 22 }, tier: 1,
    mechanicEffects: { 'mobility.ooc-speed-pct': 0.25 },
    icon: 'items/boots/sprinter-wraps.png',
    description: 'Strips of supple hide that move when you move, and never before.',
    upgrades: [
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 20 }, requiredBiomeLevel: 4 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 40 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 — Rapier lineage evolved forms (system rework Step 6) ───────────────
  // Gale Needle = the primary evolution of Flash Rapier; Thorn Needle = a branch.
  // Evolve consumes the predecessor at +3; reconstruct skips it for a higher cost.
  ['gale-needle', {
    id: 'gale-needle', name: 'Gale Needle',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'weapon',
    lineageId: 'rapier', evolvesFrom: 'flash-rapier',
    cost: { green: 60 }, catalystCost: { alacrity: 2 },           // family-tag: fast rapier → Alacrity
    reconstructCost: { green: 240 }, reconstructCatalystCost: { alacrity: 5 }, // RECONSTRUCT (no predecessor)
    stats: { attack: 9 }, attacksPerSecond: 1.60, tier: 2,
    icon: 'items/weapons/gale-needle.png',
    description: 'A fencing blade machined to an impossible point, humming faintly when drawn.',
    upgrades: [
      { attacksPerSecond: 0.02, cost: { green: 60 }, requiredBiomeLevel: 8 },
      { stats: { attack: 1 }, attacksPerSecond: 0.02, cost: { green: 120 }, requiredBiomeLevel: 9 },
      { attacksPerSecond: 0.02, cost: { green: 240 }, requiredBiomeLevel: 10 }, // +3 evolution-ready
      { stats: { attack: 2 }, attacksPerSecond: 0.02, cost: { green: 480 }, requiredBiomeLevel: 11 },
      { stats: { attack: 2 }, attacksPerSecond: 0.02, cost: { green: 960 }, requiredBiomeLevel: 12 },
    ],
  }],

  // Branch B: trades part of the Attack budget for flat on-hit damage, which the
  // rapier's cadence turns into its real payload. Same total budget, split.
  ['thorn-needle', {
    id: 'thorn-needle', name: 'Thorn Needle',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'weapon',
    lineageId: 'rapier', evolvesFrom: 'flash-rapier',         // branch B of the rapier lineage
    cost: { green: 50, purple: 20 }, catalystCost: { alacrity: 2 }, // family-tag: rapid on-hit rapier → Alacrity (bleed flavor could argue Blight)
    reconstructCost: { green: 200, purple: 80 }, reconstructCatalystCost: { alacrity: 5 },
    stats: { attack: 5, onHitDamage: 4 }, attacksPerSecond: 1.50, tier: 2,
    icon: 'items/weapons/thorn-needle.png',
    description: 'The same blade, barbed — it bites and lets the wound do the rest.',
    upgrades: [
      { stats: { onHitDamage: 1 }, cost: { green: 60, purple: 20 }, requiredBiomeLevel: 8 },
      { stats: { attack: 1 }, cost: { green: 120, purple: 40 }, requiredBiomeLevel: 9 },
      { stats: { onHitDamage: 1 }, cost: { green: 240, purple: 80 }, requiredBiomeLevel: 10 }, // +3 evolution-ready
      { stats: { attack: 1 }, cost: { green: 480, purple: 160 }, requiredBiomeLevel: 11 },
      { stats: { attack: 1, onHitDamage: 1 }, cost: { green: 960, purple: 320 }, requiredBiomeLevel: 12 },
    ],
  }],

  ['forest-vest-t2', {
    id: 'forest-vest-t2', name: 'Phantom Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 8, slot: 'armor',
    cost: { green: 48, yellow: 12 }, catalystCost: { alacrity: 2 }, stats: { maxHp: 50, plating: 5, evasion: 0.24 }, tier: 2, // family-tag: evasion armor answers frequent light hits → Alacrity
    icon: 'items/armor/phantom-bindings.png',
    description: 'They say the weaver vanished the day it was finished. The cloth remembers the trick.',
    upgrades: [
      { stats: { maxHp: 5, evasion: 0.01 }, cost: { green: 45, yellow: 15 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 5, plating: 1, evasion: 0.01 }, cost: { green: 90, yellow: 30 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 5, evasion: 0.01 }, cost: { green: 180, yellow: 60 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 5, plating: 1, evasion: 0.01 }, cost: { green: 180, yellow: 60 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 5, evasion: 0.02 }, cost: { green: 180, yellow: 60 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 10 },
    ],
  }],

  // CHARM — Recovery + Recovery-skill potency, deepened. Same shape as the
  // Heartroot Amulet: raw rate for everyone, potency for those who build on it.
  ['forest-charm-t2', {
    id: 'forest-charm-t2', name: 'Ancient Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { green: 50 }, stats: { recovery: 5 }, tier: 2,
    mechanicEffects: { 'defense.recovery-skill-potency': 0.18 },
    icon: 'items/charms/ancient-heartroot-amulet.png',
    description: 'A relic of a grove that burned an age ago, its life somehow undimmed.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 30 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 60 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 120 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 120 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 120 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['forest-boots-t2', {
    id: 'forest-boots-t2', name: 'Windstep Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { green: 40 }, stats: { speed: 40 }, tier: 2,
    mechanicEffects: { 'mobility.ooc-speed-pct': 0.55 },
    icon: 'items/boots/windstep-wraps.png',
    description: 'Light enough that the wind mistakes the wearer for one of its own.',
    upgrades: [
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 20 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 40 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 80 }, requiredBiomeLevel: 10 },
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 80 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 80 }, requiredBiomeLevel: 10 },
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
    cost: { green: 45 }, catalystCost: { fortified: 1 }, // family-tag: attrition survival → Fortified
    stats: {}, tier: 2,
    // recovery-mult scales the Recovery RATE, and every in-combat regen effect
    // activates a fraction of that rate — so this lifts OOC regen and all active
    // sustain at once, rather than the near-nothing a flat regen bump would give.
    mechanicEffects: { 'core.recovery-mult': 0.20, 'core.maxhp-mult': 0.10 },
    icon: 'items/cores/survivalist.png',
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
    icon: 'items/cores/accelerant.png',
    description: 'The forest keeps a fast rhythm. Match it, and you will find you are swinging before you decide to.',
  }],

  ['relic-hastebound-dial', {
    id: 'relic-hastebound-dial', name: 'Hastebound Dial',
    recipeGroup: 'forest', requiredBiomeLevel: 24, slot: 'relic',
    lineageId: 'relic-hastebound-dial',
    cost: { green: 220 }, catalystCost: { alacrity: 4 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': 0.35,
      'relic.mechanic-potency': -0.25,
    },
    icon: 'items/relics/hastebound-dial.png',
    description: 'The dial runs ahead of every rhythm, trading weight for relentless motion.',
  }],


] satisfies [string, Recipe][];
