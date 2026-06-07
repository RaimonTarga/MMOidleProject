import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// TIER 3 MOBS — the 7 active T3 biomes. Replaces the placeholder
// advancedBiomeMonsterEntriesA/B (those were AI-generated, no design — discard).
// NO Plains/Forest (retired at T2). Built from the T3 enemy-texture toolkit.
//
// SCALING (power-curve §3, ~1.9–2×/tier):
//   H_med 44 · H_big (generic) 70 · flagship cap-tripper 85–95 · mob-HP 440 · DPS 34.
//   Player T3 pool ~210–272, damage cap ~25% ≈ 55–68. Cap-trippers (Mountain/Cave)
//   exceed 68 to TRIP the cap; median hits sit ~44; armored elites carry plating/DR.
//   HP ×2.2 from T2, attack/DoT ×1.9, cooldowns/speed re-tuned per texture.
//
// HEADLINE AXIS = RANGE. Each biome takes a stance vs the Close/Mid/Far choice:
//   anti-Far  = chargers / fast movers / slow-you  (punish kiting)
//   anti-Close= kiters / ranged standoff           (punish melee chasing)
//   Goal: each range pick has good AND bad biomes — Far is a real choice, never auto.
//   CHARGE (exists) closes on Far. KITE (new) maintains standoff vs Close.
//
// ⚠ KITER SPEED IS CAPPED BELOW THE PLAYER (base 120). A kiter must always be
//   catchable by a charging player — otherwise it's unkillable for slow builds.
//   All kiters here sit at speed 30–40. Do not raise above player base.
//
// COMPLEXITY GRADIENT by biome age:
//   Mountain/Swamp = final tier (most-developed texture, then retire).
//   Cave = mature, existing defenses ONLY (shield/soft-cap held to T4).
//   Desert/Jungle = 2nd tier (scale + one deepening).
//   Volcano/Tundra = DEBUT T3 (clean, legible single-mechanic intros).
//
// NEW fields used below (engine gate — see bottom of file):
//   kite: true            — ranged AI maintains standoff (pairs with isRanged)
//   rampOnCombat: {...}    — Volcano: attack ramps while in combat, capped
//   rampDebuff: {...}      — Tundra: stacking slow/atk-slow on the PLAYER, capped
// Existing/reused: chargeOnAggro, isRanged, dotEffect, evasion, slowEffect.
// Costs/essence/biomeXp = placeholder (economy deferred).
// ─────────────────────────────────────────────────────────────────────────

export const tundraMonsterEntries = [

  // ══════════════════ TUNDRA (debut T3) — slow frozen hard-hitters + RAMPING DEBUFF ══════════════════
  // Debut → legible intro. Low-mid density, slow movers, hard hits; they SLOW you
  // (the anti-Far — catches kiters who get slowed) and stack a ramping debuff (capped).
  // "Plant and outlast" vs "burst before the debuffs bite." Answer: stationary-ramp
  // DR + cap armor, shield + absorb charm.
  ['frost-lurker', {
    id: 'frost-lurker', name: 'Frost Lurker', color: 0xaaddff,
    // Slow mover, hard-ish hit, applies a flat slow on you → catches Far. The basic
    // teaching unit: kitable until it lands the slow, then it closes.
    stats: { hp: 460, attack: 40, plating: 0, damageReduction: 0.10, speed: 26, attackRange: 12, attackCooldown: 2600, pullRange: 170 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 29, essenceType: 'blue', level: 2, biomeXp: 175 },
    ai: { wanderRadius: 150, leashRange: 510, idleMinMs: 2500, idleMaxMs: 7000 },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],

  ['glacier-bear', {
    id: 'glacier-bear', name: 'Glacier Bear', color: 0x5599cc,
    // The ramping-debuff carrier: each hit stacks slow + attack-slow on you, capped.
    // If the fight drags the debuff bites — but the cap guarantees you can still kill.
    // Plant-vs-burst tension: your stationary-DR armor ALSO rewards the long fight.
    stats: { hp: 780, attack: 64, plating: 0, damageReduction: 0.14, speed: 22, attackRange: 15, attackCooldown: 3200, pullRange: 175 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 65, essenceType: 'blue', level: 3, biomeXp: 390 },
    ai: { wanderRadius: 140, leashRange: 500, idleMinMs: 3000, idleMaxMs: 8500 },
    rampDebuff: {
      moveSlowPerHit: 0.06, moveSlowMaxPct: 0.40,   // capped — never a full root
      atkSlowPerHit: 0.05,  atkSlowMaxPct: 0.30,     // ⚠ cap load-bearing (anti-spiral)
      stackDurationMs: 4000,                          // each stack decays if you disengage
    },
  }],

  ['rime-caster', {
    id: 'rime-caster', name: 'Rime Caster', color: 0xccffff,
    // Ranged frost KITER: backs off, plinks, and keeps you slowed so you can't close —
    // anti-Close, and it feeds the bears' debuff window. Speed 30 (catchable on charge).
    stats: { hp: 420, attack: 46, plating: 0, damageReduction: 0.08, speed: 30, attackRange: 200, attackCooldown: 2800, pullRange: 230 },
    behavior: 'melee', attackStyle: 'frost', isRanged: true, kite: true, biome: 'tundra',
    rewards: { essence: 45, essenceType: 'blue', level: 2, biomeXp: 270 },
    ai: { wanderRadius: 200, leashRange: 600, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.6, durationMs: 2200 },
  }],

  
] satisfies [string, MonsterDefinition][];