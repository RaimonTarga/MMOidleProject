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

export const jungleMonsterEntries = [

    // ══ JUNGLE T2 — fast, frequent, evasive swarm (Forest successor) ══
  ['jungle-snake', {
    id: 'jungle-snake', name: 'Jungle Snake', color: 0x33cc44,
    // The frantic frequent-attacker: low per-hit but strikes constantly (frequency
    // is what evasion answers), plus a light creeping venom. Squishy, very fast.
    stats: { hp: 150, attack: 16, plating: 0, damageReduction: 0, speed: 76, attackRange: 12, attackCooldown: 1100, pullRange: 270 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 7, essenceType: 'green', level: 1, biomeXp: 38 },
    ai: { wanderRadius: 290, leashRange: 740, idleMinMs: 600, idleMaxMs: 2600 },
    dotEffect: { damagePerStack: 6, maxStacks: 3, tickIntervalMs: 1000, durationMs: 1500 },
  }],
 
  ['jungle-ape', {
    id: 'jungle-ape', name: 'Jungle Ape', color: 0xaa6633,
    // Fast charging bruiser — closes the gap, hits a bit harder. DR removed: Jungle
    // is the evasion biome (squishy like Forest), not a DR biome.
    stats: { hp: 190, attack: 26, plating: 0, damageReduction: 0, speed: 62, attackRange: 12, attackCooldown: 1700, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle',
    rewards: { essence: 8, essenceType: 'green', level: 1, biomeXp: 44 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3800 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1000 },
  }],
 
  ['jungle-blowdarter', {
    id: 'jungle-blowdarter', name: 'Jungle Blowdarter', color: 0x55bb44,
    // Re-added: Jungle's ranged poke (its Canopy-Sprite analog). Hidden in foliage,
    // spits poisoned darts — frequent light hits + DoT from range. Squishy.
    stats: { hp: 140, attack: 16, plating: 0, damageReduction: 0, speed: 48, attackRange: 190, attackCooldown: 1900, pullRange: 250 },
    behavior: 'melee', attackStyle: 'poison', isRanged: true, biome: 'jungle',
    rewards: { essence: 7, essenceType: 'green', level: 1, biomeXp: 38 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
    dotEffect: { damagePerStack: 6, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2100 },
  }],

  // ══════════════════ JUNGLE — fast aggressive evasive swarm (Forest successor) ══════════════════
  // 2nd tier. Fast, frequent, low-per-hit, high density; raw speed catches kiters
  // (anti-Far). Answer: evasion + raw-regen. Frequency is the threat evasion eats.
  ['jungle-stalker', {
    id: 'jungle-stalker', name: 'Jungle Stalker', color: 0x33cc44,
    // Fast frequent-attacker: low per-hit, attacks often (evasion's home), very
    // fast move runs down kiters. Light venom. Anti-Far.
    stats: { hp: 340, attack: 26, plating: 0, damageReduction: 0, speed: 78, attackRange: 12, attackCooldown: 1000, pullRange: 270 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 25, essenceType: 'green', level: 2, biomeXp: 150 },
    ai: { wanderRadius: 300, leashRange: 760, idleMinMs: 600, idleMaxMs: 2600 },
    dotEffect: { damagePerStack: 4, maxStacks: 3, tickIntervalMs: 1200, durationMs: 3600 },
  }],

  ['silverback', {
    id: 'silverback', name: 'Silverback', color: 0xaa6633,
    // Fast charging bruiser: explosive close, mid hit, a little DR. Anti-Far.
    stats: { hp: 480, attack: 40, plating: 0, damageReduction: 0.05, speed: 60, attackRange: 12, attackCooldown: 1800, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle',
    rewards: { essence: 35, essenceType: 'green', level: 2, biomeXp: 210 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3800 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1100 },
  }],

  ['canopy-harrier', {
    id: 'canopy-harrier', name: 'Canopy Harrier', color: 0x88ff44,
    // Frequent ranged thorn-volleys from the canopy — fast cooldown, light hits.
    // Stationary ranged (relentless poke, not a standoff kiter). Adds chip volume.
    stats: { hp: 300, attack: 22, plating: 0, damageReduction: 0, speed: 52, attackRange: 190, attackCooldown: 1400, pullRange: 250 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'jungle',
    rewards: { essence: 27, essenceType: 'green', level: 2, biomeXp: 165 },
    ai: { wanderRadius: 240, leashRange: 650, idleMinMs: 1200, idleMaxMs: 3500 },
  }],

  // T4

  ['hunting-panther', {
    id: 'hunting-panther', name: 'Hunting Panther', color: 0x33cc44,
    // Fast swarm filler: low per-hit, attacks constantly. FREQUENCY is what
    // evasion answers. DPS 60 × (1000/1200) = 50 (filler; volume compensates).
    stats: { hp: 650, attack: 60, plating: 0, damageReduction: 0, speed: 82, attackRange: 12, attackCooldown: 1200, pullRange: 290 },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 45, essenceType: 'green', level: 3, biomeXp: 270 },
    ai: { wanderRadius: 320, leashRange: 800, idleMinMs: 600, idleMaxMs: 2400 },
  }],

  ['apex-silverback', {
    id: 'apex-silverback', name: 'Apex Silverback', color: 0xaa6633,
    // Charging great ape with EVASION (dodges 1-in-4 player hits) — tests on-hit
    // gear / Harrier −evasion debuffs. Anti-Far via charge. DPS 88 × (1000/1800) = 49.
    stats: { hp: 1050, attack: 88, plating: 0, damageReduction: 0.05, speed: 54, attackRange: 12, attackCooldown: 1800, pullRange: 250 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle',
    rewards: { essence: 88, essenceType: 'green', level: 4, biomeXp: 528 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 1000, idleMaxMs: 3600 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1000 },
    evasion: 0.25,
  }],

  ['thornback-lizard', {
    id: 'thornback-lizard', name: 'Thornback Lizard', color: 0x55bb44,
    // Ranged stationary spitter: frequent light hits + stacking venom DoT.
    // Background chip while the swarm closes. DPS 60 × (1000/1500) = 40 + DoT.
    stats: { hp: 700, attack: 60, plating: 0, damageReduction: 0, speed: 50, attackRange: 200, attackCooldown: 1500, pullRange: 260 },
    behavior: 'melee', attackStyle: 'poison', isRanged: true, biome: 'jungle',
    rewards: { essence: 50, essenceType: 'green', level: 3, biomeXp: 300 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
    dotEffect: { damagePerStack: 10, maxStacks: 5, tickIntervalMs: 1000, durationMs: 2500 },
  }],

  ['emerald-constrictor', {
    id: 'emerald-constrictor', name: 'Emerald Constrictor', color: 0x22aa33,
    // Elite predator. CADENCE every 4 = a 168 venom lunge + heavy DoT; evasion
    // 0.25. Tests cap, DoT-resist, AND on-hit all at once. Effective ~66 DPS:
    // avg/attack (3·84+168)/4 = 105 → ×(1000/1600) = 66, plus DoT.
    stats: { hp: 1400, attack: 84, plating: 0, damageReduction: 0.06, speed: 62, attackRange: 12, attackCooldown: 1600, pullRange: 280 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 130, essenceType: 'green', level: 4, biomeXp: 780 },
    ai: { wanderRadius: 280, leashRange: 720, idleMinMs: 800, idleMaxMs: 3000 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.0 },   // 168
    dotEffect: { damagePerStack: 12, maxStacks: 5, tickIntervalMs: 1000, durationMs: 3000 },
    evasion: 0.25,
  }],


] satisfies [string, MonsterDefinition][];