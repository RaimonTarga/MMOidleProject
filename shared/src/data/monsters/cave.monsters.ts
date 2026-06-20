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

export const caveMonsterEntries = [

  // ══ CAVE — few ELITE mobs, MIXED shapes (fast + bruiser); %DR answers all ══
  // Cave is the intended exception: variety is the point, and the universal
  // answer is flat %DR. Cave elites carry DR/plating — slow/piercing weapons
  // earn their keep here (unlike the squishy plains/forest mobs).
  ['cave-lurker', {
    id: 'cave-lurker', name: 'Cave Lurker', color: 0x664466,
    // The fast elite of the pair — quick, armored a little, relentless.
    stats: { hp: 250, attack: 16, plating: 4, damageReduction: 0.05, speed: 60, attackRange: 12, attackCooldown: 1400, pullRange: 220 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 10, essenceType: 'red', level: 1, biomeXp: 70 },
    ai: { wanderRadius: 200, leashRange: 560, idleMinMs: 2000, idleMaxMs: 6000 },
  }],

  ['cave-brute', {
    id: 'cave-brute', name: 'Cave Brute', color: 0x443344,
    // The bruiser elite — a cap-tripping slam, slow, charges to connect, and
    // armored enough that fast weapons don't trivially shred it.
    stats: { hp: 400, attack: 40, plating: 2, damageReduction: 0.10, speed: 18, attackRange: 12, attackCooldown: 3800, pullRange: 145 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 13, essenceType: 'red', level: 1, biomeXp: 90 },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 3000, idleMaxMs: 8000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
  }],

  // ── CAVE T2 — three distinct ELITE shapes: fast/dodgy, bruiser, ranged ──
  ['giant-spider', {
    id: 'giant-spider', name: 'Giant Spider', color: 0x992266,
    // Fast ambush hunter; DR hide + evasion make it slippery, plus a little venom.
    stats: { hp: 460, attack: 22, plating: 0, damageReduction: 0.08, speed: 72, attackRange: 12, attackCooldown: 1800, pullRange: 220 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave',
    rewards: { essence: 15, essenceType: 'red', level: 1, biomeXp: 85 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3200 },
    evasion: 0.2,
    dotEffect: { debuffId: 'spider-venom', label: 'Spider Venom', damagePerStack: 6, maxStacks: 3, tickIntervalMs: 1000, durationMs: 2000 },
  }],

  ['cave-troll', {
    id: 'cave-troll', name: 'Cave Troll', color: 0x334433,
    // Colossal slow bruiser; cap-tripping slam, charges to close, heavy DR + plating.
    // The elite where slow/piercing weapons pay off.
    stats: { hp: 740, attack: 65, plating: 4, damageReduction: 0.15, speed: 15, attackRange: 15, attackCooldown: 3600, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 23, essenceType: 'red', level: 1, biomeXp: 145 },
    ai: { wanderRadius: 130, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
  }],

  ['cave-gargoyle', {
    id: 'cave-gargoyle', name: 'Cave Gargoyle', color: 0x554455,
    // Ranged elite — hurls stalactites from its perch; armored and patient.
    stats: { hp: 530, attack: 32, plating: 3, damageReduction: 0.10, speed: 22, attackRange: 200, attackCooldown: 3200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'cave',
    rewards: { essence: 18, essenceType: 'red', level: 1, biomeXp: 100 },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  // ══════════════════ CAVE — tanky consistent elites, MIXED (existing defenses only) ══════════════════
  // Mature. Few elites, mixed shapes, consistent (non-spiky) damage, carry DR/plating
  // where slow/piercing weapons pay off. Answer: %DR (the universal mitigation).
  // NO shield / soft-cap here (those are the T4 weapon-matchup axis).
  ['deep-spider', {
    id: 'deep-spider', name: 'Deep Spider', color: 0x992266,
    // Fast dodgy elite: high speed catches kiters (anti-Far), evasion whiffs many-hit
    // weapons, consistent medium hits = %DR's home. Light venom.
    stats: { hp: 1000, attack: 42, plating: 0, damageReduction: 0.08, speed: 70, attackRange: 12, attackCooldown: 1500, pullRange: 220 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave',
    rewards: { essence: 55, essenceType: 'red', level: 3, biomeXp: 330 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3200 },
    evasion: 0.25,
    dotEffect: { debuffId: 'deep-spider-venom', label: 'Deep Venom', damagePerStack: 8, maxStacks: 3, tickIntervalMs: 1000, durationMs: 3000 },
  }],

  ['cavern-troll', {
    id: 'cavern-troll', name: 'Cavern Troll', color: 0x334433,
    // The elite ceiling: armored cap-tripping bruiser, charges to connect. Heavy
    // DR + plating means slow/piercing weapons earn their keep. Anti-Far.
    stats: { hp: 1600, attack: 88, plating: 4, damageReduction: 0.15, speed: 14, attackRange: 15, attackCooldown: 3600, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 83, essenceType: 'red', level: 3, biomeXp: 500 },
    ai: { wanderRadius: 120, leashRange: 460, idleMinMs: 3000, idleMaxMs: 8500 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
  }],

  ['crystal-gargoyle', {
    id: 'crystal-gargoyle', name: 'Crystal Gargoyle', color: 0x554455,
    // Armored ranged sentry — perched, patient, hurls shards. Stationary ranged
    // (NOT a kiter: it holds its perch), armored so it isn't trivially bursted.
    stats: { hp: 1150, attack: 60, plating: 3, damageReduction: 0.10, speed: 20, attackRange: 210, attackCooldown: 3200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'cave',
    rewards: { essence: 60, essenceType: 'red', level: 3, biomeXp: 360 },
    ai: { wanderRadius: 120, leashRange: 450, idleMinMs: 2500, idleMaxMs: 7000 },
  }],


] satisfies [string, MonsterDefinition][];
