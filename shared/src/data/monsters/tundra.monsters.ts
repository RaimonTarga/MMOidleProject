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

  // T4
  ['frosttusk-mammoth', {
    id: 'frosttusk-mammoth', name: 'Frosttusk Mammoth', color: 0xaaddff,
    // CADENCE every 4 = a 240 freeze-slam that trips the cap + hard slow.
    // Heavy ICE PLATING (12) rewards the brittle weapon to crack it open.
    // Base 120 ≈ H_big. avg/attack (3·120+240)/4 = 150 → ×(1000/3500) = 43.
    stats: { hp: 1250, attack: 120, plating: 12, damageReduction: 0, speed: 18, attackRange: 15, attackCooldown: 3500, pullRange: 165 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 110, essenceType: 'blue', level: 4, biomeXp: 660 },
    ai: { wanderRadius: 140, leashRange: 490, idleMinMs: 3500, idleMaxMs: 9500 },
    chargeOnAggro: { speedMult: 2.3, durationMs: 1200 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.0 },   // 240
    slowEffect: { speedMult: 0.45, durationMs: 3500 },
  }],

  ['glacial-direbear', {
    id: 'glacial-direbear', name: 'Glacial Dire-Bear', color: 0x5599cc,
    // The ramping-debuff carrier: each hit stacks move-slow + atk-slow (both
    // capped — never a full root). Plant-vs-burst tension with your stationary
    // DR armor. DPS 105 × (1000/3200) = 33 base, but the debuff escalates the fight.
    stats: { hp: 1700, attack: 105, plating: 0, damageReduction: 0.14, speed: 18, attackRange: 15, attackCooldown: 3200, pullRange: 175 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 150, essenceType: 'blue', level: 4, biomeXp: 900 },
    ai: { wanderRadius: 130, leashRange: 490, idleMinMs: 3500, idleMaxMs: 9000 },
    rampDebuff: {
      moveSlowPerHit: 0.08, moveSlowMaxPct: 0.50,
      atkSlowPerHit:  0.06, atkSlowMaxPct:  0.40,   // cap load-bearing (anti-spiral)
      stackDurationMs: 5000,
    },
  }],

  ['hoarfrost-yeti', {
    id: 'hoarfrost-yeti', name: 'Hoarfrost Yeti', color: 0xccffff,
    // Ranged KITER (hurls ice chunks): maintains standoff, applies ramp debuff
    // from afar. Anti-Close — chasing while its stacks build hurts. Speed 36
    // (catchable on charge). DPS 86 × (1000/2900) = 30 + escalating debuff.
    stats: { hp: 910, attack: 86, plating: 0, damageReduction: 0.08, speed: 36, attackRange: 220, attackCooldown: 2900, pullRange: 260 },
    behavior: 'melee', attackStyle: 'frost', isRanged: true, kite: true, biome: 'tundra',
    rewards: { essence: 62, essenceType: 'blue', level: 3, biomeXp: 370 },
    ai: { wanderRadius: 210, leashRange: 620, idleMinMs: 1500, idleMaxMs: 4500 },
    rampDebuff: {
      moveSlowPerHit: 0.05, moveSlowMaxPct: 0.35,
      atkSlowPerHit:  0.04, atkSlowMaxPct:  0.25,
      stackDurationMs: 4000,
    },
  }],

  ['permafrost-behemoth', {
    id: 'permafrost-behemoth', name: 'Permafrost Behemoth', color: 0x4477aa,
    // Apex. COOLDOWN slam every 9s = 300. Extreme plating (20) + ENEMY SOFT-CAP
    // — the full weapon-matchup exam: brittle weapon strips the plate (shatter
    // window), fast consistent damage beats the soft-cap, empowered-only builds
    // struggle. Base 100 ≈ H_med (survivable between slams).
    stats: { hp: 2600, attack: 100, plating: 20, damageReduction: 0.12, speed: 12, attackRange: 15, attackCooldown: 4000, pullRange: 140 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 260, essenceType: 'blue', level: 4, biomeXp: 1560 },
    ai: { wanderRadius: 70, leashRange: 380, idleMinMs: 6000, idleMaxMs: 15000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1400 },
    empoweredCooldown: { cooldownMs: 9000, multiplier: 3.0 },  // 300
    enemySoftCap: { capPct: 0.25, capMult: 0.5 },
  }],

  
] satisfies [string, MonsterDefinition][];