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

export const volcanoMonsterEntries = [


  // ══════════════════ VOLCANO (debut T3) — high-density fire swarm, RAMPING ══════════════════
  // Debut → legible single-mechanic intro. Fast dense swarm; every enemy RAMPS
  // attack while in combat (capped) — "burst it or out-sustain it." Density + speed
  // catch Far, ramp punishes slow kills. Answer: hardening + in-combat-regen/kill-burst.
  ['ember-imp', {
    id: 'ember-imp', name: 'Ember Imp', color: 0xff6622,
    // Swarm filler that heats up: starts weak, ramps if the fight drags. Fast.
    stats: { hp: 280, attack: 24, plating: 2, damageReduction: 0, speed: 64, attackRange: 12, attackCooldown: 1600, pullRange: 210 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 25, essenceType: 'red', level: 2, biomeXp: 150 },
    ai: { wanderRadius: 230, leashRange: 620, idleMinMs: 1000, idleMaxMs: 3600 },
    rampOnCombat: { stat: 'attack', perTickPct: 0.08, maxPct: 0.40, tickIntervalMs: 2000 },
  }],

  ['cinder-hound', {
    id: 'cinder-hound', name: 'Cinder Hound', color: 0xff8800,
    // Fast charger that ramps: closes instantly, gets hotter the longer it lives.
    stats: { hp: 360, attack: 30, plating: 3, damageReduction: 0, speed: 70, attackRange: 12, attackCooldown: 1300, pullRange: 260 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 29, essenceType: 'red', level: 2, biomeXp: 175 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 700, idleMaxMs: 3000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 900 },
    rampOnCombat: { stat: 'attack', perTickPct: 0.08, maxPct: 0.40, tickIntervalMs: 2000 },
  }],

  ['magma-brute', {
    id: 'magma-brute', name: 'Magma Brute', color: 0xcc2200,
    // Slow bruiser that ramps HARDER (cap +60%): kitable alone, but in the swarm you
    // can't kite freely, and a slow kill lets it spiral toward dangerous. Plt 6.
    stats: { hp: 700, attack: 56, plating: 6, damageReduction: 0, speed: 22, attackRange: 15, attackCooldown: 3000, pullRange: 150 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 55, essenceType: 'red', level: 3, biomeXp: 330 },
    ai: { wanderRadius: 120, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
    rampOnCombat: { stat: 'attack', perTickPct: 0.10, maxPct: 0.60, tickIntervalMs: 2000 },
  }],

  ['ash-slinger', {
    id: 'ash-slinger', name: 'Ash Slinger', color: 0xff4422,
    // Ranged ember-lobber that ramps — pokes while the swarm closes; ignoring it
    // lets its ramp build. Stationary ranged (not a kiter — Volcano is aggressive).
    stats: { hp: 320, attack: 34, plating: 2, damageReduction: 0, speed: 44, attackRange: 180, attackCooldown: 2000, pullRange: 230 },
    behavior: 'melee', attackStyle: 'fire', isRanged: true, biome: 'volcanic',
    rewards: { essence: 27, essenceType: 'red', level: 2, biomeXp: 165 },
    ai: { wanderRadius: 220, leashRange: 600, idleMinMs: 1200, idleMaxMs: 4000 },
    rampOnCombat: { stat: 'attack', perTickPct: 0.08, maxPct: 0.40, tickIntervalMs: 2000 },
  }],

] satisfies [string, MonsterDefinition][];