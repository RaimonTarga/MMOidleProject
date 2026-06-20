import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// MONSTER REFACTOR — starter biomes (Plains/Forest/Mountain/Swamp/Cave), T1+T2.
//
// Core fix (diagnosed problem: every biome was the same fast/tank/ranged trio,
// recolored, so no biome taught its own mitigation). Each starter biome now
// expresses ONE dominant damage-SHAPE matched to its armor's mitigation:
//
//   PLAINS    swarm of small fast hits      -> answered by PLATING (flat subtract)
//   FOREST    fast, FREQUENT attacks         -> answered by EVASION (flat %, scales w/ hit count)
//   MOUNTAIN  rare, HUGE hits (trip the cap) -> answered by DAMAGE-CAP
//   SWAMP     low direct dmg, heavy DoT       -> answered by DOT-RESIST (+ debt loop)
//   CAVE      few ELITE, MIXED shapes         -> answered by %DR (the universal mitigation)
//
// Tuned against player-power-curve §7: T1 ~HP90 / H_med~12, T2 ~HP200 / H_med~23.
// MOUNTAIN/CAVE big-hitters deliberately exceed the generic trash H_big so they
// reach the damage cap (≈25% of player maxHP: ~40-50 at T1, ~55-70 at T2).
//
// CHARGE = closes the gap for SLOW big-hitters (anti-kite for the ponderous).
// HIGH BASE SPEED = the fast-ambusher identity. RANGED = anti-kite from afar.
// Squishy biomes (plains/forest) carry NO plating/DR (fast weapons shred them —
// intended); CAVE elites carry DR/plating (where slow/piercing weapons earn keep).
//
// Rewards / ai wander+leash / colors / ids kept as-is. A few NAMES no longer
// match their refactored shape (flagged inline) — rename in the cosmetic pass.
// Advanced biomes (jungle/tundra/desert/volcanic) are DEFERRED below, untouched.
// ─────────────────────────────────────────────────────────────────────────

export const forestMonsterEntries = [
  // ══ FOREST — fast movement + FREQUENT attacks; low per-hit; evasion's home ══
  ['forest-slime', {
    id: 'forest-slime', name: 'Forest Slime', color: 0x55ff55,
    // Attacks faster than its plains cousin — frequency over force.
    stats: { hp: 100, attack: 10, plating: 0, damageReduction: 0, speed: 54, attackRange: 12, attackCooldown: 1500, pullRange: 210 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 3, essenceType: 'green', level: 1, biomeXp: 18 },
    ai: { wanderRadius: 230, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  ['wolf', {
    id: 'wolf', name: 'Wolf', color: 0xaaaacc,
    // Fast baseline speed IS the anti-kite — no charge needed. Frequent light bites.
    stats: { hp: 60, attack: 14, plating: 0, damageReduction: 0, speed: 82, attackRange: 12, attackCooldown: 1200, pullRange: 255 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 4, essenceType: 'green', level: 1, biomeXp: 25 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
  }],


  // ── FOREST T2 — fast charger, a frantic frequent-attacker, a ranged thorn ──
  ['ancient-wolf', {
    id: 'ancient-wolf', name: 'Ancient Wolf', color: 0x8888ff,
    // Explosive fast charger; closes instantly then bites in a blur.
    stats: { hp: 225, attack: 28, plating: 0, damageReduction: 0, speed: 96, attackRange: 12, attackCooldown: 1100, pullRange: 280 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 8, essenceType: 'green', level: 1, biomeXp: 45 },
    ai: { wanderRadius: 300, leashRange: 750, idleMinMs: 600, idleMaxMs: 2500 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 900 },
  }],

  ['ironwood-golem', {
    id: 'ironwood-golem', name: 'Ironwood Golem', color: 0x556633,
    // SHAPE CHANGED: no longer a DR tank (off-identity for forest). Now a slow-
    // moving but VERY fast-ATTACKING sentinel — frequency is the threat evasion
    // answers; squishy (no DR) so it still dies to burst. TODO rename.
    stats: { hp: 200, attack: 26, plating: 0, damageReduction: 0, speed: 22, attackRange: 15, attackCooldown: 900, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 10, essenceType: 'green', level: 1, biomeXp: 58 },
    ai: { wanderRadius: 120, leashRange: 480, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  ['canopy-sprite', {
    id: 'canopy-sprite', name: 'Canopy Sprite', color: 0x88ff44,
    // Ranged thorn-volleys; frequent, light, from the treetops.
    stats: { hp: 190, attack: 26, plating: 0, damageReduction: 0, speed: 48, attackRange: 190, attackCooldown: 2400, pullRange: 250 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'forest',
    rewards: { essence: 9, essenceType: 'green', level: 1, biomeXp: 50 },
    ai: { wanderRadius: 240, leashRange: 650, idleMinMs: 1200, idleMaxMs: 3500 },
  }],

] satisfies [string, MonsterDefinition][];