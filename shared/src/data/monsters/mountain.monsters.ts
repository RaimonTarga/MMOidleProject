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

export const mountainMonsterEntries = [

  // ══ MOUNTAIN — rare HUGE hits that trip the cap; slow + charge to connect ══
  ['cliff-hopper', {
    id: 'cliff-hopper', name: 'Cliff Hopper', color: 0x99aacc,
    // SHAPE CHANGED: now a slow charging bruiser (atk trips the ~25%-HP cap), not a
    // fast mob. Charges once to close, then lumbers. TODO rename in cosmetic pass.
    stats: { hp: 170, attack: 36, plating: 0, damageReduction: 0, speed: 28, attackRange: 12, attackCooldown: 3500, pullRange: 275 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 6, essenceType: 'blue', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 200, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 1200 },
  }],

  ['ridge-archer', {
    id: 'ridge-archer', name: 'Ridge Archer', color: 0x778899,
    // Hurls boulders — a big, slow hit from range. Punishes standing still; the
    // ranged half of mountain's "stand and trade" pressure. No charge (ranged).
    stats: { hp: 200, attack: 32, plating: 0, damageReduction: 0, speed: 26, attackRange: 210, attackCooldown: 3500, pullRange: 350 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'mountain',
    rewards: { essence: 8, essenceType: 'blue', level: 1, biomeXp: 52 },
    ai: { wanderRadius: 210, leashRange: 600, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  // ── MOUNTAIN T2 — everything hits like a truck and trips the cap ──
  ['granite-titan', {
    id: 'granite-titan', name: 'Granite Titan', color: 0x99aabb,
    // The flagship cap-tripper: a slow, charging slam well over 25% of player HP.
    // No DR — it's a glass cannon you survive via the cap, not a sponge.
    stats: { hp: 350, attack: 70, plating: 0, damageReduction: 0, speed: 18, attackRange: 15, attackCooldown: 3800, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 14, essenceType: 'blue', level: 1, biomeXp: 80 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
  }],

  ['stone-eagle', {
    id: 'stone-eagle', name: 'Stone Eagle', color: 0xccdde8,
    // REBALANCED: was a fast low-hitter. Now a swooping dive-bomber — faster than
    // the titan but still a heavy hit; the charge IS the dive.
    stats: { hp: 240, attack: 50, plating: 0, damageReduction: 0, speed: 40, attackRange: 12, attackCooldown: 2800, pullRange: 285 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 12, essenceType: 'blue', level: 1, biomeXp: 68 },
    ai: { wanderRadius: 320, leashRange: 800, idleMinMs: 500, idleMaxMs: 2000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],

  ['peak-archer', {
    id: 'peak-archer', name: 'Boulder Thrower', color: 0xaabbcc,
    // Ranged cap-tripper — a devastating boulder from extreme range; stand still
    // and a single shot can carve a quarter of your HP. No charge (ranged).
    stats: { hp: 280, attack: 60, plating: 0, damageReduction: 0, speed: 28, attackRange: 240, attackCooldown: 3500, pullRange: 265 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'mountain',
    rewards: { essence: 13, essenceType: 'blue', level: 1, biomeXp: 75 },
    ai: { wanderRadius: 200, leashRange: 600, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  // ══════════════════ T3 MOUNTAIN — the big-hitters that trip the cap, with some new wrinkles (charge, kite) ══════════════════
  ['mountain-colossus', {
    id: 'mountain-colossus', name: 'Mountain Colossus', color: 0x8899aa,
    // Flagship cap-tripper: a slow charging slam well past the cap. Anti-Far.
    stats: { hp: 770, attack: 95, plating: 0, damageReduction: 0, speed: 16, attackRange: 15, attackCooldown: 3800, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 75, essenceType: 'blue', level: 3, biomeXp: 440 },
    ai: { wanderRadius: 90, leashRange: 420, idleMinMs: 4000, idleMaxMs: 10500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
  }],

  ['avalanche-ram', {
    id: 'avalanche-ram', name: 'Avalanche Ram', color: 0x99aabb,
    // Faster charger, still a heavy (near-cap) hit — the mobile anti-Far threat.
    stats: { hp: 520, attack: 64, plating: 0, damageReduction: 0, speed: 38, attackRange: 12, attackCooldown: 2600, pullRange: 245 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 47, essenceType: 'blue', level: 2, biomeXp: 280 },
    ai: { wanderRadius: 300, leashRange: 760, idleMinMs: 500, idleMaxMs: 2200 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],

  ['summit-trebuchet', {
    id: 'summit-trebuchet', name: 'Summit Trebuchet', color: 0x778899,
    // Ranged cap-tripper that KITES — backs off, lobs boulders. Anti-Close:
    // melee chasing eats free 80-dmg hits. Slow (30) so a charge can still catch it.
    stats: { hp: 600, attack: 80, plating: 0, damageReduction: 0, speed: 30, attackRange: 250, attackCooldown: 3600, pullRange: 360 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, kite: true, biome: 'mountain',
    rewards: { essence: 60, essenceType: 'blue', level: 3, biomeXp: 360 },
    ai: { wanderRadius: 200, leashRange: 620, idleMinMs: 2000, idleMaxMs: 5000 },
  }],


] satisfies [string, MonsterDefinition][];