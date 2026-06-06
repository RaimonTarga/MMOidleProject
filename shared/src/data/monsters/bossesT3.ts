import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// T3 BOSSES (Pass 2). Rebuilt from scratch — the old placeholders were kiteable
// sponges with no biome mechanic. Follows boss-design.md.
//
// Layer for T3 (on top of T2's single phase):
//   - TWO phase thresholds (50% + 25%) — a stepped escalation, not a smooth ramp.
//   - The range axis: bosses hold a clear range stance; Sand Emperor FLIPS it
//     mid-fight via `morph` (melee debuffer -> ranged kiter).
//   - `slam` periodic novas on the titans (also extra anti-summon AoE).
//   - Volcano/Tundra carry their trash identities (relentless AoE / ramp-debuff).
//
// Engine-fit discipline (from the boss-script limitations):
//   - NEVER two enrages, and never two effects on the SAME stat. Each phase touches
//     distinct levers: @50 = enrage (attack &/or cooldown); @25 = stat-buff(speed)
//     + slam. Where a boss needs an attack jump at 25% (Bog, Jungle), its @50 enrage
//     uses cdMult only (atkMult 1.0) so `attack` is modified exactly once.
//   - Phase buffs omit durationMs = permanent. `slam` is a one-off burst.
//
// Anti-kite: every boss has charge (slow ones, to land the first hit) — a T3 boss
//   must never be kiteable to triviality. Sand Emperor charges in P1, then morphs
//   to a kiter (so YOU chase IT) in P2.
// Cleave (aoeAttack) on the SLOW bosses (Mtn/Cave/Swamp/Volcano/Tundra); Sand
//   Emperor (medium) and Jungle Titan (fast) stay single-target.
//
// Anchors: HP ~9-10x median trash (440) & >=2x toughest elite (1400); slammers
//   ~120-125 atk (~45-58% of player pool -> trips the cap hard); Jungle is
//   frequency-not-burst (lower hit, fast cd). Rewards/essence = placeholder.
//
// NOTE: no `shield` (that's the T4 defense-break layer) and no `summon` (T5 adds).
// ─────────────────────────────────────────────────────────────────────────

export const bossMonsterEntriesT3 = [
  // MOUNTAIN — escalating cap-slammer; periodic rockfall slams; cleave + charge.
  ['peak-titan', {
    id: 'peak-titan', name: 'Peak Titan', color: 0x6688cc,
    isBoss: true,
    stats: { hp: 4200, attack: 125, plating: 12, damageReduction: 0.05, speed: 18, attackRange: 72, attackCooldown: 4200, pullRange: 360 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 340, essenceType: 'blue', level: 5, biomeXp: 510 },
    ai: { wanderRadius: 100, leashRange: 920, idleMinMs: 3500, idleMaxMs: 8500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    bossScript: {
      repeating: [
        { intervalMs: 7000, initialDelayMs: 4000, actions: [{ type: 'slam', radius: 200, damageMult: 1.3 }] }, // rockfall
      ],
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.25, cdMult: 0.90 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.3 }, { type: 'slam', radius: 280, damageMult: 2.2 }] }, // avalanche
      ],
    },
  }],

  // CAVE — endurance bruiser: high HP, DR + plating, charges, cleave. Pure attrition
  // (existing defenses only — no shield, that's T4). Closes faster as it dies.
  ['cave-dread', {
    id: 'cave-dread', name: 'Cave Dread', color: 0x332244,
    isBoss: true,
    stats: { hp: 4400, attack: 120, plating: 16, damageReduction: 0.15, speed: 16, attackRange: 72, attackCooldown: 4500, pullRange: 330 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 355, essenceType: 'red', level: 5, biomeXp: 530 },
    ai: { wanderRadius: 85, leashRange: 890, idleMinMs: 4000, idleMaxMs: 10000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    bossScript: {
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.25, cdMult: 0.88 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.35 }, { type: 'slam', radius: 220, damageMult: 1.8 }] }, // cave-in
      ],
    },
  }],

  // SWAMP — DoT engine; @50 the venom applies far faster (DoT storm), @25 it
  // also starts biting hard (a second, direct shape arrives). Cleave + charge.
  ['bog-ancient', {
    id: 'bog-ancient', name: 'Bog Ancient', color: 0x1a3311,
    isBoss: true,
    stats: { hp: 4000, attack: 16, plating: 8, damageReduction: 0.10, speed: 28, attackRange: 18, attackCooldown: 3400, pullRange: 330 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 345, essenceType: 'purple', level: 5, biomeXp: 518 },
    ai: { wanderRadius: 105, leashRange: 880, idleMinMs: 2800, idleMaxMs: 7000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    dotEffect: { damagePerStack: 16, maxStacks: 6, tickIntervalMs: 1000, durationMs: 6000 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    bossScript: {
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.0, cdMult: 0.65 }] },        // DoT applies far faster (cd only)
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'attack', mult: 4.0 }, { type: 'slam', radius: 200, damageMult: 1.5 }] }, // now it BITES (16 -> ~64) + toxic nova
      ],
    },
  }],

  // DESERT — the range-axis boss. P1: melee debuffer that charges + slows you.
  // @50: MORPH -> ranged kiter (you must now chase it THROUGH the slow -> anti-Close).
  ['sand-emperor', {
    id: 'sand-emperor', name: 'Sand Emperor', color: 0xccaa22,
    isBoss: true,
    stats: { hp: 4000, attack: 120, plating: 10, damageReduction: 0.08, speed: 42, attackRange: 20, attackCooldown: 3000, pullRange: 350 },
    behavior: 'melee', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 345, essenceType: 'yellow', level: 5, biomeXp: 518 },
    ai: { wanderRadius: 140, leashRange: 900, idleMinMs: 2200, idleMaxMs: 6500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },     // P1 closes the gap
    slowEffect: { speedMult: 0.6, durationMs: 2000 },         // debuff identity (persists through the morph)
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'morph', isRanged: true, attackStyle: 'magic', attackRange: 240, kite: true }, // flips to a kiter
          { type: 'enrage', atkMult: 1.15, cdMult: 0.90 },
        ] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.3 }, { type: 'slam', radius: 200, damageMult: 1.6 }] }, // sandstorm (hits if you've closed)
      ],
    },
  }],

  // JUNGLE — fast, frequent, squishy (no plating). The evasion exam, boss-scale.
  // @50 frequency storm (cd only); @25 harder hits + uncatchable chase. Single-target.
  ['jungle-titan-lord', {
    id: 'jungle-titan-lord', name: 'Jungle Titan Lord', color: 0x115522,
    isBoss: true,
    stats: { hp: 3900, attack: 64, plating: 0, damageReduction: 0.03, speed: 64, attackRange: 18, attackCooldown: 1500, pullRange: 340 },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 340, essenceType: 'green', level: 5, biomeXp: 510 },
    ai: { wanderRadius: 140, leashRange: 920, idleMinMs: 2000, idleMaxMs: 6000 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 900 },
    bossScript: {
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.0, cdMult: 0.65 }] },          // frequency storm (cd only)
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'attack', mult: 1.4 }, { type: 'stat-buff', stat: 'speed', mult: 1.4 }] },
      ],
    },
  }],

  // VOLCANO — relentless fire: normal swings cleave, a fire-nova slams on a timer,
  // and it escalates twice. The "burst it or out-sustain it" boss. Charge + cleave.
  ['volcanic-titan', {
    id: 'volcanic-titan', name: 'Volcanic Titan', color: 0xee4400,
    isBoss: true,
    stats: { hp: 3800, attack: 110, plating: 8, damageReduction: 0.04, speed: 26, attackRange: 18, attackCooldown: 3000, pullRange: 340 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 360, essenceType: 'red', level: 5, biomeXp: 540 },
    ai: { wanderRadius: 120, leashRange: 920, idleMinMs: 2500, idleMaxMs: 7000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    aoeAttack: { radius: 120, damageMult: 0.7 },
    bossScript: {
      repeating: [
        { intervalMs: 6000, initialDelayMs: 3000, actions: [{ type: 'slam', radius: 180, damageMult: 1.3 }] }, // fire nova
      ],
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.30, cdMult: 0.85 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.25 }, { type: 'slam', radius: 240, damageMult: 2.0 }] }, // eruption
      ],
    },
  }],

  // TUNDRA — slow hard-hitter; its hits stack a capped slow + attack-slow on you
  // (rampDebuff, static like the Tundra trash). Plant-and-outlast vs your stationary
  // -DR armor. Periodic frost-quake slams. Charge (to land the first slow) + cleave.
  ['frost-colossus', {
    id: 'frost-colossus', name: 'Frost Colossus', color: 0x88ccee,
    isBoss: true,
    stats: { hp: 4400, attack: 125, plating: 12, damageReduction: 0.12, speed: 18, attackRange: 20, attackCooldown: 4200, pullRange: 360 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 350, essenceType: 'blue', level: 5, biomeXp: 525 },
    ai: { wanderRadius: 100, leashRange: 900, idleMinMs: 3000, idleMaxMs: 8000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    rampDebuff: { moveSlowPerHit: 0.06, moveSlowMaxPct: 0.40, atkSlowPerHit: 0.05, atkSlowMaxPct: 0.30, stackDurationMs: 4000 }, // capped — anti-spiral
    bossScript: {
      repeating: [
        { intervalMs: 7000, initialDelayMs: 4000, actions: [{ type: 'slam', radius: 200, damageMult: 1.4 }] }, // frost quake
      ],
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.25, cdMult: 0.90 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.3 }, { type: 'slam', radius: 240, damageMult: 1.8 }] },
      ],
    },
  }],
] satisfies [string, MonsterDefinition][];