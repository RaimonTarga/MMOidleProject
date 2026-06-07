import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// BOSS REBALANCE — T1 + T2 (Pass 1). Follows boss-design.md.
//
// T1: HP bumped ~1.8x (they read weaker than cave elites). NO phases (T1 = the
//     "pure shape" floor). Slow bosses gain CLEAVE (aoeAttack) so summon-spam
//     can't body-block them — see the anti-summon guardrail in boss-design.md.
// T2: + ONE phase at 50% HP (the tier's new layer — escalation, not a 2nd shape;
//     true shape-swaps/range-flips start at T3 via `morph`). Slow bosses cleave.
//
// Cleave criterion = SLOW swing rate (vulnerable to body-block), not hit size:
//   cleave  -> Mountain, Swamp, Cave (speed <= ~30)
//   single  -> Plains, Forest, Desert, Jungle (fast enough to keep pace)
// aoeAttack: { radius, damageMult } — every swing splashes damageMult x attack to
//   others within radius of the target (full damage to the primary target).
//
// Phases use enrage (atk x atkMult, cd x cdMult) + stat-buff (movement speed).
// No two enrages on one boss (last-write-wins restore bug) — speed pressure uses
// stat-buff. Phase buffs omit durationMs = permanent for the rest of the life.
//
// DESERT/JUNGLE bosses moved out of "deferred" — those biomes debut at T2, so
// they get the full T2 treatment now. `glacial-colossus` (Tundra) is DELETED:
// Tundra debuts at T3, its boss is frost-colossus (Pass 2).
//
// Stat anchors (boss-design.md): boss HP ~9-10x median trash & >=2x toughest
// elite; per-hit ~1.3-1.4x the biome's biggest trash hit; Mtn/Cave slams ~40-50%
// of player pool (trip the cap). Rewards/essence = placeholder (economy deferred).
// ─────────────────────────────────────────────────────────────────────────

export const bossMonsterEntriesT1T2 = [
  // ════════════════════════ T1 BOSSES (pure shape, no phase) ════════════════════════

  // PLAINS — honest bruiser, no gimmick. The floor. (fast enough: single-target)
  ['plains-champion', {
    id: 'plains-champion', name: 'Plains Champion', color: 0xddaa44,
    isBoss: true,
    stats: { hp: 1000, attack: 36, plating: 4, damageReduction: 0.02, speed: 50, attackRange: 15, attackCooldown: 2000, pullRange: 280 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 100, essenceType: 'yellow', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  // FOREST — fast, frequent, frail. The evasion exam. (fast: single-target)
  ['forest-warden', {
    id: 'forest-warden', name: 'Forest Warden', color: 0x33aa44,
    isBoss: true,
    stats: { hp: 900, attack: 32, plating: 0, damageReduction: 0, speed: 60, attackRange: 15, attackCooldown: 1400, pullRange: 300 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 100, essenceType: 'green', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 160, leashRange: 800, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  // MOUNTAIN — slow charging mega-slam that trips the cap. Burst exam. Cleaves.
  ['mountain-sentinel', {
    id: 'mountain-sentinel', name: 'Mountain Sentinel', color: 0x8899bb,
    isBoss: true,
    stats: { hp: 1100, attack: 60, plating: 0, damageReduction: 0, speed: 22, attackRange: 18, attackCooldown: 3500, pullRange: 280 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 105, essenceType: 'blue', level: 5, biomeXp: 158 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 2000, idleMaxMs: 5000 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
  }],

  // SWAMP — trivial direct hit, real (beatable) DoT. dot-resist exam. Cleaves
  // (slow: a body-blocked DoT swing lands on summons instead of the player).
  ['bog-sovereign', {
    id: 'bog-sovereign', name: 'Bog Sovereign', color: 0x1e3d1e,
    isBoss: true,
    stats: { hp: 950, attack: 8, plating: 2, damageReduction: 0.02, speed: 28, attackRange: 15, attackCooldown: 2600, pullRange: 260 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 100, essenceType: 'purple', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 100, leashRange: 700, idleMinMs: 2000, idleMaxMs: 5500 },
    dotEffect: { damagePerStack: 4, maxStacks: 3, tickIntervalMs: 1000, durationMs: 4000 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
  }],

  // CAVE — tanky mixed elite: high HP, DR + plating, charges. Endurance exam. Cleaves.
  ['cave-sentinel', {
    id: 'cave-sentinel', name: 'Cave Sentinel', color: 0x334455,
    isBoss: true,
    stats: { hp: 1050, attack: 40, plating: 6, damageReduction: 0.10, speed: 24, attackRange: 18, attackCooldown: 2800, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 110, essenceType: 'red', level: 5, biomeXp: 165 },
    ai: { wanderRadius: 80, leashRange: 680, idleMinMs: 2500, idleMaxMs: 6500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
  }],

  // ════════════════════════ T2 BOSSES (+ one phase @50%) ════════════════════════

  // PLAINS — honest big bruiser; phase is the simplest: it just gets angrier.
  ['plains-tyrant', {
    id: 'plains-tyrant', name: 'Plains Tyrant', color: 0xcc9922,
    isBoss: true,
    stats: { hp: 2000, attack: 60, plating: 8, damageReduction: 0.05, speed: 46, attackRange: 15, attackCooldown: 2200, pullRange: 320 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 150, essenceType: 'yellow', level: 5, biomeXp: 225 },
    ai: { wanderRadius: 140, leashRange: 850, idleMinMs: 2000, idleMaxMs: 5500 },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [{ type: 'enrage', atkMult: 1.30, cdMult: 0.85 }] },
      ],
    },
  }],

  // FOREST — fast, frequent, frail; phase pushes frequency higher (cd down).
  ['forest-elder', {
    id: 'forest-elder', name: 'Forest Elder', color: 0x226622,
    isBoss: true,
    stats: { hp: 1900, attack: 50, plating: 0, damageReduction: 0, speed: 60, attackRange: 18, attackCooldown: 1500, pullRange: 310 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 155, essenceType: 'green', level: 5, biomeXp: 232 },
    ai: { wanderRadius: 130, leashRange: 830, idleMinMs: 1200, idleMaxMs: 4000 },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [{ type: 'enrage', atkMult: 1.15, cdMult: 0.70 }] }, // frequency surge
      ],
    },
  }],

  // MOUNTAIN — flagship burst-check: ~40%-pool slam, slow, charges, reach. Cleaves.
  ['stone-warden', {
    id: 'stone-warden', name: 'Stone Warden', color: 0x667788,
    isBoss: true,
    stats: { hp: 2400, attack: 90, plating: 10, damageReduction: 0.05, speed: 20, attackRange: 72, attackCooldown: 3800, pullRange: 320 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 160, essenceType: 'blue', level: 5, biomeXp: 240 },
    ai: { wanderRadius: 120, leashRange: 850, idleMinMs: 3000, idleMaxMs: 7500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [{ type: 'enrage', atkMult: 1.30, cdMult: 0.85 }] }, // deeper, faster cap-trips
      ],
    },
  }],

  // SWAMP — tiny direct, the venom is the fight; phase makes it apply faster. Cleaves.
  ['mire-lord', {
    id: 'mire-lord', name: 'Mire Lord', color: 0x2a4011,
    isBoss: true,
    stats: { hp: 1900, attack: 12, plating: 6, damageReduction: 0.08, speed: 30, attackRange: 15, attackCooldown: 2800, pullRange: 300 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 155, essenceType: 'purple', level: 5, biomeXp: 232 },
    ai: { wanderRadius: 110, leashRange: 800, idleMinMs: 2500, idleMaxMs: 6000 },
    dotEffect: { damagePerStack: 9, maxStacks: 5, tickIntervalMs: 1000, durationMs: 5000 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [{ type: 'enrage', atkMult: 1.10, cdMult: 0.70 }] }, // DoT stacks faster
      ],
    },
  }],

  // CAVE — endurance bruiser: high HP, DR + plating, cap-slam, charges. Cleaves.
  ['cave-terror', {
    id: 'cave-terror', name: 'Cave Terror', color: 0x442244,
    isBoss: true,
    stats: { hp: 2300, attack: 92, plating: 12, damageReduction: 0.12, speed: 20, attackRange: 72, attackCooldown: 3600, pullRange: 280 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 160, essenceType: 'red', level: 5, biomeXp: 240 },
    ai: { wanderRadius: 90, leashRange: 800, idleMinMs: 3000, idleMaxMs: 7500 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.25, cdMult: 0.90 },
          { type: 'stat-buff', stat: 'speed', mult: 1.2 }, // closes faster (permanent)
        ] },
      ],
    },
  }],

  // DESERT (debut T2) — debuffer with reach; phase keeps it on your heels. Single-target.
  ['desert-pharaoh', {
    id: 'desert-pharaoh', name: 'Desert Pharaoh', color: 0xddcc44,
    isBoss: true,
    stats: { hp: 2000, attack: 70, plating: 12, damageReduction: 0.08, speed: 42, attackRange: 40, attackCooldown: 2600, pullRange: 340 },
    behavior: 'melee', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 150, essenceType: 'yellow', level: 5, biomeXp: 225 },
    ai: { wanderRadius: 140, leashRange: 880, idleMinMs: 2000, idleMaxMs: 5500 },
    slowEffect: { speedMult: 0.6, durationMs: 2000 }, // debuff identity
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.20, cdMult: 0.85 },
          { type: 'stat-buff', stat: 'speed', mult: 1.3 },
        ] },
      ],
    },
  }],

  // JUNGLE (debut T2) — fast, frequent, squishy (plating stripped); phase = frequency
  // storm + chase. Single-target (fast enough to keep pace with summons).
  ['jungle-colossus', {
    id: 'jungle-colossus', name: 'Jungle Colossus', color: 0x117722,
    isBoss: true,
    stats: { hp: 1850, attack: 64, plating: 0, damageReduction: 0.03, speed: 56, attackRange: 18, attackCooldown: 2400, pullRange: 320 },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 145, essenceType: 'green', level: 5, biomeXp: 218 },
    ai: { wanderRadius: 150, leashRange: 840, idleMinMs: 1800, idleMaxMs: 4500 },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.10, cdMult: 0.70 },
          { type: 'stat-buff', stat: 'speed', mult: 1.35 },
        ] },
      ],
    },
  }],
] satisfies [string, MonsterDefinition][];

// NOTE: `glacial-colossus` (old deferred Tundra boss) is intentionally removed —
// Tundra debuts at T3; its boss is `frost-colossus`, built in Pass 2 (T3 bosses).