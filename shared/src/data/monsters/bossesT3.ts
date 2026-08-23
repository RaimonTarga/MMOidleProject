import type { MonsterDefinition } from './types';

// ════════════════════════ T3 BOSS CONFIGURATIONS ════════════════════════

export const bossMonsterEntriesT3 = [
  ['crag-gorged-horn-behemoth', {
    id: 'crag-gorged-horn-behemoth', name: 'Crag-Gorged Horn-Behemoth', color: 0x6688cc,
    isBoss: true,
    stats: { hp: 12418, attack: 204, plating: 12, damageReduction: 0.05, speed: 18, attackRange: 72, attackCooldown: 4200, pullRange: 360 },
    behavior: 'melee', attackStyle: 'quake', biome: 'mountain',
    rewards: { essence: 340, essenceType: 'blue', level: 5, biomeXp: 510 },
    ai: { wanderRadius: 100, leashRange: 920, idleMinMs: 3500, idleMaxMs: 8500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    engageSequence: { kind: 'charge-lock-charged-attack', speedMult: 3.0, maxChargeMs: 1800, lockoutMs: 500 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    chargedAttack: {
      name: 'Cragbreaker Slam', castMs: 2400, cooldownMs: 9000, initialCooldownMs: 4500,
      multiplier: 2.0, fx: 'strong-kick', aoe: { radius: 205 },
    },
    bossScript: {
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.25, cdMult: 0.90 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.3 }] },
      ],
    },
  }],

  ['deep-core-burrow-gorger', {
    id: 'deep-core-burrow-gorger', name: 'Deep-Core Burrow-Gorger', color: 0x332244,
    isBoss: true,
    stats: { hp: 12895, attack: 196, plating: 16, damageReduction: 0.15, speed: 16, attackRange: 72, attackCooldown: 4500, pullRange: 330 },
    behavior: 'melee', attackStyle: 'quake', biome: 'cave',
    rewards: { essence: 355, essenceType: 'red', level: 5, biomeXp: 530 },
    ai: { wanderRadius: 85, leashRange: 890, idleMinMs: 4000, idleMaxMs: 10000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    appliesPlatingShred: {
      platingPerStack: 2,
      maxStacks: 8,
      thresholdPoison: {
        atStacks: [3, 6],
        debuffId: 'deep-core-corrosive-venom',
        label: 'Corrosive Venom',
        damagePerStack: 16,
        maxStacks: 2,
        tickIntervalMs: 1000,
        durationMs: 6000,
        element: 'poison',
      },
    },
    chargedAttack: {
      name: 'Deep-Core Slam', castMs: 1500, cooldownMs: 8500, initialCooldownMs: 4000,
      multiplier: 1.7, fx: 'strong-kick', aoe: { radius: 155 },
    },
    bossScript: {
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.25, cdMult: 0.88 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.35 }] },
      ],
    },
  }],

  ['rot-spore-croc-behemoth', {
    id: 'rot-spore-croc-behemoth', name: 'Rot-Spore Croc-Behemoth', color: 0x1a3311,
    isBoss: true,
    stats: { hp: 11940, attack: 52, plating: 8, damageReduction: 0.10, speed: 28, attackRange: 18, attackCooldown: 3400, pullRange: 330 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 345, essenceType: 'purple', level: 5, biomeXp: 518 },
    ai: { wanderRadius: 105, leashRange: 880, idleMinMs: 2800, idleMaxMs: 7000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    dotEffect: { debuffId: 'rot-spore-plague', label: 'Rot Spores', damagePerStack: 13, maxStacks: 6, tickIntervalMs: 1000, durationMs: 6000 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    chargedAttack: {
      name: 'Spore Pool', castMs: 1000, cooldownMs: 8000, initialCooldownMs: 3500,
      multiplier: 1.2, fx: 'strong-kick', aoe: { radius: 130 },
      pool: {
        durationMs: 9000, damagePerTick: 8, tickIntervalMs: 1000, slowSpeedMult: 0.55,
        vulnerability: { damageTakenPct: 0.16, durationMs: 1800 },
        detonationMultiplier: 2.25,
      },
    },
    bossScript: {
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.0, cdMult: 0.65 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'attack', mult: 4.0 }] },
      ],
    },
  }],

  ['dune-carapace-monarch', {
    id: 'dune-carapace-monarch', name: 'Dune-Carapace Monarch', color: 0xccaa22,
    isBoss: true,
    stats: { hp: 11940, attack: 196, plating: 10, damageReduction: 0.08, speed: 42, attackRange: 20, attackCooldown: 3000, pullRange: 350 },
    behavior: 'melee', attackStyle: 'sandblast', biome: 'desert',
    rewards: { essence: 345, essenceType: 'yellow', level: 5, biomeXp: 518 },
    ai: { wanderRadius: 140, leashRange: 900, idleMinMs: 2200, idleMaxMs: 6500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    slowEffect: { speedMult: 0.6, durationMs: 2000 },
    chargedAttack: {
      name: 'Sandburst', castMs: 1300, cooldownMs: 9000, initialCooldownMs: 4500,
      multiplier: 1.6, fx: 'strong-kick', aoe: { radius: 155 },
    },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'morph', isRanged: true, attackStyle: 'sandblast', attackRange: 240, kite: true },
          { type: 'enrage', atkMult: 1.15, cdMult: 0.90 },
        ] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.3 }] },
      ],
    },
  }],

  ['apex-bramble-slasher', {
    id: 'apex-bramble-slasher', name: 'Apex Bramble-Slasher', color: 0x115522,
    isBoss: true,
    stats: { hp: 11701, attack: 104, plating: 0, damageReduction: 0.03, speed: 64, attackRange: 18, attackCooldown: 1500, pullRange: 340 },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 340, essenceType: 'green', level: 5, biomeXp: 510 },
    ai: { wanderRadius: 140, leashRange: 920, idleMinMs: 2000, idleMaxMs: 6000 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 900 },
    bossScript: {
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.0, cdMult: 0.65 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'attack', mult: 1.4 }, { type: 'stat-buff', stat: 'speed', mult: 1.4 }] },
      ],
    },
  }],

  ['cinder-shell-magma-salamander', {
    id: 'cinder-shell-magma-salamander', name: 'Cinder-Shell Magma-Salamander', color: 0xee4400,
    isBoss: true,
    stats: { hp: 11462, attack: 179, plating: 8, damageReduction: 0.04, speed: 26, attackRange: 18, attackCooldown: 3000, pullRange: 340 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 360, essenceType: 'red', level: 5, biomeXp: 540 },
    ai: { wanderRadius: 120, leashRange: 920, idleMinMs: 2500, idleMaxMs: 7000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    aoeAttack: { radius: 120, damageMult: 0.7 },
    chargedAttack: {
      name: 'Eruption', castMs: 1400, cooldownMs: 7000, initialCooldownMs: 3500,
      multiplier: 1.6, fx: 'strong-kick', aoe: { radius: 175 },
    },
    bossScript: {
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.30, cdMult: 0.85 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.25 }] },
      ],
    },
  }],

  ['frost-plated-rime-mammoth', {
    id: 'frost-plated-rime-mammoth', name: 'Frost-Plated Rime-Mammoth', color: 0x88ccee,
    isBoss: true,
    stats: { hp: 12895, attack: 204, plating: 12, damageReduction: 0.12, speed: 18, attackRange: 20, attackCooldown: 4200, pullRange: 360 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 350, essenceType: 'blue', level: 5, biomeXp: 525 },
    ai: { wanderRadius: 100, leashRange: 900, idleMinMs: 3000, idleMaxMs: 8000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    rampDebuff: { moveSlowPerHit: 0.06, moveSlowMaxPct: 0.40, atkSlowPerHit: 0.05, atkSlowMaxPct: 0.30, stackDurationMs: 4000 },
    // ECOLOGY exam "shatter the ice": a periodic frost barrier the player must BURST to
    // crack (shatter = bonus self-dmg + freezing shockwave). Chip-DPS stalls here.
    enemyShield: {
      shieldPct: 0.18, intervalMs: 12000, durationMs: 6000,
      shatter: { selfDamagePct: 0.08, freezeRadius: 240, freezeDurationMs: 1500 },
    },
    chargedAttack: {
      name: 'Permafrost Slam', castMs: 1900, cooldownMs: 8500, initialCooldownMs: 4500,
      multiplier: 1.7, fx: 'strong-kick', aoe: { radius: 195 },
    },
    bossScript: {
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.25, cdMult: 0.90 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.3 }] },
      ],
    },
  }],
] satisfies [string, MonsterDefinition][];
