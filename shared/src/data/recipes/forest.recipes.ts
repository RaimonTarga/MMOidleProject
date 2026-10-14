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
    // 2026-09-26 weapon pass: Attack 5->8 (+5: 8->12). Per-hit size is what Power
    // Strike and monster plating reward, so the buff is Attack, not APS.
    cost: { green: 20 }, stats: { attack: 12 }, attacksPerSecond: 1.60, tier: 1,
    icon: 'items/weapons/flash-rapier.png',
    description: 'Forged thin as a reed by duelists who prized speed above all.',
    // T1 economy pass (2026-08-28): Flash Rapier was the one T1 item whose total
    // (950) ran roughly double every other specialist weapon's — normalized here
    // to ~500, in line with Heavy Hammer/Chaotic Axe. Curve stays accelerating;
    // no attacksPerSecond/attack stat changes. +5 catalyst from its own T2
    // evolution (gale-needle), tagged alacrity.
  }],

  // Evasion starts meaningful the moment the armor is obtained, and grows
  // CAUTIOUSLY: percentage avoidance is worth more per point the higher it goes,
  // so +5 lands at 22%, not the ~38% the old +4pp-per-step curve produced.
  ['forest-vest-t1', {
    id: 'forest-vest-t1', name: 'Shaded Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 20 }, stats: { "maxHp": 44, "evasion": 0.36, "damageReduction": 0.02 }, tier: 1,
    icon: 'items/armor/shaded-bindings.png',
    description: "Evades soften direct hits; a full dodge also prevents on-hit ailments. Jungle weave strengthens each evade.",
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (470).
    // +5 catalyst from forest-vest-t2's own family-tag ("evasion armor answers
    // frequent light hits → Alacrity").

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
    cost: { green: 15 }, stats: { "recovery": 9.2 }, tier: 1,
    mechanicEffects: { "defense.recovery-skill-potency": 0.15 },
    icon: 'items/charms/heartroot-amulet.png',
    description: 'Heartroot drawn from the oldest tree in the grove, still faintly warm.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (240).
  }],

  // BOOTS — traversal. The straightforward fast-travel option, no kill trigger
  // needed; the rework swapped this with Plains' kill-momentum boot.
  ['forest-boots-t1', {
    id: 'forest-boots-t1', name: 'Sprinter Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { green: 10 }, stats: { "speed": 32 }, tier: 1,
    // 2026-09-26: out-of-combat speed +25->50% trimmed to +20->35% (T2: +55->80% ->
    // +40->55%). Raw travel speed ran ~20% above every other boot; it applies to all
    // node-to-node travel, which the single-node farm pace test undercounts.
    mechanicEffects: { "mobility.ooc-speed-pct": 0.35 },
    icon: 'items/boots/sprinter-wraps.png',
    description: 'Strips of supple hide that move when you move, and never before.',
    // T1 economy pass (2026-08-28): accelerating +1..+5 curve, same total (160).
  }],

  // ── T2 — Rapier lineage evolved forms (system rework Step 6) ───────────────
  // Gale Needle = the evolution of Flash Rapier.
  // T2 economy pass (2026-08-29): normalized off the old doubling-to-+5 curve
  // (was 1,920 total) into the normal T2 specialist-weapon band (~1,000 total).
  ['gale-needle', {
    id: 'gale-needle', name: 'Gale Needle',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { green: 60 },                                     // family-tag: fast rapier → Alacrity
    // 2026-09-26 weapon normalization: Attack 9->17 (+5: 14->35). The old curve was T1-sized, so a
    // +5 Flash Rapier matched a +0 Gale Needle.
    stats: { attack: 35 }, attacksPerSecond: 1.70, tier: 2,
    icon: 'items/weapons/gale-needle.png',
    description: 'A fencing blade machined to an impossible point, humming faintly when drawn.',
  }],

  // `thorn-needle` (an on-hit "branch B" of this lineage) was REMOVED 2026-09-26:
  // it was never intended and duplicated the Jungle Stinger Rapier, the game's real
  // on-hit rapier. Saves that hold it are migrated to Gale Needle on load
  // (LEGACY_ITEM_IDS in server/src/db/playerRepo.ts).

  ['forest-vest-t2', {
    id: 'forest-vest-t2', name: 'Phantom Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 8, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { "maxHp": 78, "evasion": 0.42, "damageReduction": 0.04 }, tier: 2, // family-tag: evasion armor answers frequent light hits → Alacrity
    icon: 'items/armor/phantom-bindings.png',
    description: "Evades soften direct hits; a full dodge also prevents on-hit ailments. Jungle weave strengthens each evade.",

mechanicEffects: {"defense.evade-mitigation": 0.1},
}],

  // CHARM — Recovery + Recovery-skill potency, deepened. Same shape as the
  // Heartroot Amulet: raw rate for everyone, potency for those who build on it.
  // T2 economy pass (2026-08-29): now an EVOLUTION of forest-charm-t1 at +5.
  ['forest-charm-t2', {
    id: 'forest-charm-t2', name: 'Ancient Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { green: 50 }, stats: { "recovery": 20.3 }, tier: 2,
    mechanicEffects: { "defense.recovery-skill-potency": 0.23 },
    icon: 'items/charms/ancient-heartroot-amulet.png',
    description: 'A relic of a grove that burned an age ago, its life somehow undimmed.',
  }],

  // T2 economy pass (2026-08-29): now an EVOLUTION of forest-boots-t1 at +5.
  ['forest-boots-t2', {
    id: 'forest-boots-t2', name: 'Windstep Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { green: 40 }, stats: { "speed": 51 }, tier: 2,
    mechanicEffects: { "mobility.ooc-speed-pct": 0.55 },
    icon: 'items/boots/windstep-wraps.png',
    description: 'Light enough that the wind mistakes the wearer for one of its own.',
  }],

  // ── Cores ───────────────────────────────────────────────────────────────────
  // The 5th equipment slot. See the CORES header in plains.recipes.ts for how the
  // slot works and how eligibility/tier placement is decided.
  //
  // Forest owns SUSTAIN — it is where Second Wind is learned. The T2 recovery
  // capstone is intentionally delayed to Jungle; Forest's T2 reward is the
  // Perfection Stance in stanceRecipes.ts.

] satisfies [string, Recipe][];
