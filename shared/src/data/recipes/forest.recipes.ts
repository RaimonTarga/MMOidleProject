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

// ── T1 ECONOMY CANDIDATE C (2026-08-31) ───────────────────────────────────
// Every T1 (+5) step's ESSENCE cost was cut 25%, rounded to the nearest 5
// (Math.round semantics): 205->155, 260->195, 200->150, 100->75, 75->55,
// 70->55, 60->45. Catalyst costs, initial crafts and +1..+4 are UNCHANGED, so
// the per-item "same total (N)" notes below now describe the pre-candidate
// total, not the current one. The target is the post-mastery affordability
// tail only -- the 2x bot cohort spent its last ~15m/run earning the final
// +5 essence after every biome was already maxed.
// ──────────────────────────────────────────────────────────────────────────

export const forestRecipeEntries = [
  // ── Rapier lineage (system rework Step 6 worked example) ───────────────────
  // Flash Rapier (base) → Gale Needle. Evolve consumes
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
    // 2026-09-26 weapon pass: Attack 5->8 (+5: 8->12). Per-hit size is what Power
    // Strike and monster plating reward, so the buff is Attack, not APS.
    cost: { green: 20 }, stats: { attack: 8 }, attacksPerSecond: 1.50, tier: 1,
    icon: 'items/weapons/flash-rapier.png',
    description: 'Forged thin as a reed by duelists who prized speed above all.',
    // T1 economy pass (2026-08-28): Flash Rapier was the one T1 item whose total
    // (950) ran roughly double every other specialist weapon's — normalized here
    // to ~500, in line with Heavy Hammer/Chaotic Axe. Curve stays accelerating;
    // no attacksPerSecond/attack stat changes. +5 catalyst from its own T2
    // evolution (gale-needle), tagged alacrity.
    upgrades: [
      { stats: { attack: 1 }, attacksPerSecond: 0.02, cost: { green: 25 }, requiredBiomeLevel: 2 },
      { stats: { attack: 1 }, attacksPerSecond: 0.02, cost: { green: 50 }, requiredBiomeLevel: 3 },
      { attacksPerSecond: 0.02, cost: { green: 75 }, requiredBiomeLevel: 4 },
      { stats: { attack: 1 }, attacksPerSecond: 0.02, cost: { green: 125 }, requiredBiomeLevel: 5 },
      { stats: { attack: 1 }, attacksPerSecond: 0.02, cost: { green: 155 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 6 }, // +5 = evolution-ready (T2 econ pass 2026-08-29: raised from +3)
    ],
  }],

  // Evasion starts meaningful the moment the armor is obtained, and grows
  // CAUTIOUSLY: percentage avoidance is worth more per point the higher it goes,
  // so +5 lands at 22%, not the ~38% the old +4pp-per-step curve produced.
  ['forest-vest-t1', {
    id: 'forest-vest-t1', name: 'Shaded Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 20 }, stats: {"maxHp": 29, "evasion": 0.28, "damageReduction": 0.02}, tier: 1,
    icon: 'items/armor/shaded-bindings.png',
    description: "Evades soften direct hits; a full dodge also prevents on-hit ailments. Jungle weave strengthens each evade.",
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (470).
    // +5 catalyst from forest-vest-t2's own family-tag ("evasion armor answers
    // frequent light hits → Alacrity").
    upgrades: [
      {"cost": {"green": 20}, "requiredBiomeLevel": 3, "stats": {"maxHp": 3, "evasion": 0.016}},
      {"cost": {"green": 45}, "requiredBiomeLevel": 4, "stats": {"maxHp": 3, "evasion": 0.016}},
      {"cost": {"green": 70}, "requiredBiomeLevel": 4, "stats": {"maxHp": 3, "evasion": 0.016}},
      {"cost": {"green": 115}, "requiredBiomeLevel": 4, "stats": {"maxHp": 3, "evasion": 0.016}},
      {"cost": {"green": 150}, "catalystCost": {"alacrity": 1}, "requiredBiomeLevel": 4, "stats": {"maxHp": 3, "evasion": 0.016}}
    ],

mechanicEffects: {"defense.evade-mitigation": 0.1},
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
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (240).
    upgrades: [
      { mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 10 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 20 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 35 }, requiredBiomeLevel: 4 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 60 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 75 }, requiredBiomeLevel: 4 },
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
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (160).
    upgrades: [
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 15 }, requiredBiomeLevel: 4 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 25 }, requiredBiomeLevel: 4 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 40 }, requiredBiomeLevel: 4 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 45 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 — Rapier lineage evolved forms (system rework Step 6) ───────────────
  // Gale Needle = the evolution of Flash Rapier.
  // Evolve consumes the predecessor at +3; reconstruct skips it for a higher cost.
  // T2 economy pass (2026-08-29): normalized off the old doubling-to-+5 curve
  // (was 1,920 total) into the normal T2 specialist-weapon band (~1,000 total).
  // Evolution costs no catalyst (§2/§7); catalysts moved to +4/+5 only (§8).
  // Evolution requires flash-rapier at +EVOLUTION_REQUIRED_PLUS, which returned
  // to +3 on 2026-09-04 (see shared/src/systems/evolution.ts for rationale).
  ['gale-needle', {
    id: 'gale-needle', name: 'Gale Needle',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'weapon',
    lineageId: 'rapier', evolvesFrom: 'flash-rapier',
    cost: { green: 60 },                                     // family-tag: fast rapier → Alacrity
    reconstructCost: { green: 210 }, reconstructCatalystCost: { alacrity: 2 }, // RECONSTRUCT (no predecessor)
    // 2026-09-26 weapon normalization: Attack 9->17 (+5: 14->35). The old curve was T1-sized, so a
    // +5 Flash Rapier matched a +0 Gale Needle.
    stats: { attack: 17 }, attacksPerSecond: 1.60, tier: 2,
    icon: 'items/weapons/gale-needle.png',
    description: 'A fencing blade machined to an impossible point, humming faintly when drawn.',
    upgrades: [
      { stats: { attack: 4 }, attacksPerSecond: 0.02, cost: { green: 38 }, requiredBiomeLevel: 8 },
      { stats: { attack: 3 }, attacksPerSecond: 0.02, cost: { green: 94 }, requiredBiomeLevel: 9 },
      { stats: { attack: 3 }, attacksPerSecond: 0.02, cost: { green: 150 }, requiredBiomeLevel: 10 },
      { stats: { attack: 3 }, attacksPerSecond: 0.02, cost: { green: 244 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 11 },
      { stats: { attack: 5 }, attacksPerSecond: 0.02, cost: { green: 414 }, catalystCost: { alacrity: 2 }, requiredBiomeLevel: 12 },
    ],
  }],

  // `thorn-needle` (an on-hit "branch B" of this lineage) was REMOVED 2026-09-26:
  // it was never intended and duplicated the Jungle Stinger Rapier, the game's real
  // on-hit rapier. Saves that hold it are migrated to Gale Needle on load
  // (LEGACY_ITEM_IDS in server/src/db/playerRepo.ts).

  // T2 economy pass (2026-08-29): now an EVOLUTION of forest-vest-t1 (Shaded
  // Bindings) at +5 — see §5/§6/§7. Evolve pays no catalyst; reconstruct (no
  // predecessor) costs ~3.5x essence + 2 alacrity. Catalysts moved to +4/+5.
  ['forest-vest-t2', {
    id: 'forest-vest-t2', name: 'Phantom Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 8, slot: 'armor',
    evolvesFrom: 'forest-vest-t1',
    cost: { green: 48, yellow: 12 }, stats: {"maxHp": 52, "evasion": 0.34, "damageReduction": 0.04}, tier: 2, // family-tag: evasion armor answers frequent light hits → Alacrity
    reconstructCost: { green: 168, yellow: 42 }, reconstructCatalystCost: { alacrity: 2 },
    icon: 'items/armor/phantom-bindings.png',
    description: "Evades soften direct hits; a full dodge also prevents on-hit ailments. Jungle weave strengthens each evade.",
    upgrades: [
      {"cost": {"green": 29, "yellow": 7}, "requiredBiomeLevel": 9, "stats": {"maxHp": 5, "evasion": 0.016}},
      {"cost": {"green": 72, "yellow": 18}, "requiredBiomeLevel": 10, "stats": {"maxHp": 5, "evasion": 0.016}},
      {"cost": {"green": 115, "yellow": 29}, "requiredBiomeLevel": 10, "stats": {"maxHp": 6, "evasion": 0.016}},
      {"cost": {"green": 187, "yellow": 47}, "catalystCost": {"alacrity": 1}, "requiredBiomeLevel": 10, "stats": {"maxHp": 5, "evasion": 0.016}},
      {"cost": {"green": 317, "yellow": 79}, "catalystCost": {"alacrity": 2}, "requiredBiomeLevel": 10, "stats": {"maxHp": 5, "evasion": 0.016}}
    ],

mechanicEffects: {"defense.evade-mitigation": 0.1},
}],

  // CHARM — Recovery + Recovery-skill potency, deepened. Same shape as the
  // Heartroot Amulet: raw rate for everyone, potency for those who build on it.
  // T2 economy pass (2026-08-29): now an EVOLUTION of forest-charm-t1 at +5.
  ['forest-charm-t2', {
    id: 'forest-charm-t2', name: 'Ancient Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 9, slot: 'recovery',
    evolvesFrom: 'forest-charm-t1',
    cost: { green: 50 }, stats: { recovery: 5 }, tier: 2,
    reconstructCost: { green: 175 }, reconstructCatalystCost: { alacrity: 2 }, // family-tag: recovery charm → Alacrity
    mechanicEffects: { 'defense.recovery-skill-potency': 0.18 },
    icon: 'items/charms/ancient-heartroot-amulet.png',
    description: 'A relic of a grove that burned an age ago, its life somehow undimmed.',
    upgrades: [
      { mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 18 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 45 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 72 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 117 }, requiredBiomeLevel: 10 },
      { stats: { recovery: 1 }, mechanicEffects: { 'defense.recovery-skill-potency': 0.01 }, cost: { green: 198 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 10 },
    ],
  }],

  // T2 economy pass (2026-08-29): now an EVOLUTION of forest-boots-t1 at +5.
  ['forest-boots-t2', {
    id: 'forest-boots-t2', name: 'Windstep Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 10, slot: 'mobility',
    evolvesFrom: 'forest-boots-t1',
    cost: { green: 40 }, stats: { speed: 40 }, tier: 2,
    reconstructCost: { green: 140 }, reconstructCatalystCost: { alacrity: 2 }, // family-tag: forest mobility → Alacrity
    mechanicEffects: { 'mobility.ooc-speed-pct': 0.55 },
    icon: 'items/boots/windstep-wraps.png',
    description: 'Light enough that the wind mistakes the wearer for one of its own.',
    upgrades: [
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 12 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 30 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 48 }, requiredBiomeLevel: 10 },
      { stats: { speed: 3 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 78 }, requiredBiomeLevel: 10 },
      { stats: { speed: 2 }, mechanicEffects: { 'mobility.ooc-speed-pct': 0.05 }, cost: { green: 132 }, catalystCost: { alacrity: 1 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────
  // The 5th equipment slot. See the CORES header in plains.recipes.ts for how the
  // slot works and how eligibility/tier placement is decided.
  //
  // Forest owns SUSTAIN — it is where Second Wind is learned. The T2 recovery
  // capstone is intentionally delayed to Jungle; Forest's T2 reward is the
  // Perfection Stance in stanceRecipes.ts.

] satisfies [string, Recipe][];
