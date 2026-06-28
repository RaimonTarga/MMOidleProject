import type { MonsterDefinition } from './types';

// ════════════════════════ T3 BOSS CONFIGURATIONS ════════════════════════

export const bossMonsterEntriesT3 = [
  ['crag-gorged-horn-behemoth', {
    id: 'crag-gorged-horn-behemoth', name: 'Crag-Gorged Horn-Behemoth', color: 0x6688cc,
    isBoss: true,
    stats: { hp: 5200, attack: 125, plating: 12, damageReduction: 0.05, speed: 18, attackRange: 72, attackCooldown: 4200, pullRange: 360 },
    behavior: 'melee', attackStyle: 'quake', biome: 'mountain',
    rewards: { essence: 340, essenceType: 'blue', level: 5, biomeXp: 510 },
    ai: { wanderRadius: 100, leashRange: 920, idleMinMs: 3500, idleMaxMs: 8500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    bossScript: {
      repeating: [
        { intervalMs: 7000, initialDelayMs: 4000, actions: [{ type: 'slam', radius: 200, damageMult: 1.3 }] },
      ],
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.25, cdMult: 0.90 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.3 }, { type: 'slam', radius: 280, damageMult: 2.2 }] },
      ],
    },
  }],

  ['deep-core-burrow-gorger', {
    id: 'deep-core-burrow-gorger', name: 'Deep-Core Burrow-Gorger', color: 0x332244,
    isBoss: true,
    stats: { hp: 5400, attack: 120, plating: 16, damageReduction: 0.15, speed: 16, attackRange: 72, attackCooldown: 4500, pullRange: 330 },
    behavior: 'melee', attackStyle: 'quake', biome: 'cave',
    rewards: { essence: 355, essenceType: 'red', level: 5, biomeXp: 530 },
    ai: { wanderRadius: 85, leashRange: 890, idleMinMs: 4000, idleMaxMs: 10000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    bossScript: {
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.25, cdMult: 0.88 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.35 }, { type: 'slam', radius: 220, damageMult: 1.8 }] },
      ],
    },
  }],

  ['rot-spore-croc-behemoth', {
    id: 'rot-spore-croc-behemoth', name: 'Rot-Spore Croc-Behemoth', color: 0x1a3311,
    isBoss: true,
    stats: { hp: 5000, attack: 32, plating: 8, damageReduction: 0.10, speed: 28, attackRange: 18, attackCooldown: 3400, pullRange: 330 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 345, essenceType: 'purple', level: 5, biomeXp: 518 },
    ai: { wanderRadius: 105, leashRange: 880, idleMinMs: 2800, idleMaxMs: 7000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    dotEffect: { debuffId: 'rot-spore-plague', label: 'Rot Spores', damagePerStack: 8, maxStacks: 6, tickIntervalMs: 1000, durationMs: 6000 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    bossScript: {
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.0, cdMult: 0.65 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'attack', mult: 4.0 }, { type: 'slam', radius: 200, damageMult: 1.5 }] },
      ],
    },
  }],

  ['dune-carapace-monarch', {
    id: 'dune-carapace-monarch', name: 'Dune-Carapace Monarch', color: 0xccaa22,
    isBoss: true,
    stats: { hp: 5000, attack: 120, plating: 10, damageReduction: 0.08, speed: 42, attackRange: 20, attackCooldown: 3000, pullRange: 350 },
    behavior: 'melee', attackStyle: 'sandblast', biome: 'desert',
    rewards: { essence: 345, essenceType: 'yellow', level: 5, biomeXp: 518 },
    ai: { wanderRadius: 140, leashRange: 900, idleMinMs: 2200, idleMaxMs: 6500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    slowEffect: { speedMult: 0.6, durationMs: 2000 },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'morph', isRanged: true, attackStyle: 'sandblast', attackRange: 240, kite: true },
          { type: 'enrage', atkMult: 1.15, cdMult: 0.90 },
        ] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.3 }, { type: 'slam', radius: 200, damageMult: 1.6 }] },
      ],
    },
  }],

  ['apex-bramble-slasher', {
    id: 'apex-bramble-slasher', name: 'Apex Bramble-Slasher', color: 0x115522,
    isBoss: true,
    stats: { hp: 4900, attack: 64, plating: 0, damageReduction: 0.03, speed: 64, attackRange: 18, attackCooldown: 1500, pullRange: 340 },
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
    stats: { hp: 4800, attack: 110, plating: 8, damageReduction: 0.04, speed: 26, attackRange: 18, attackCooldown: 3000, pullRange: 340 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 360, essenceType: 'red', level: 5, biomeXp: 540 },
    ai: { wanderRadius: 120, leashRange: 920, idleMinMs: 2500, idleMaxMs: 7000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    aoeAttack: { radius: 120, damageMult: 0.7 },
    bossScript: {
      repeating: [
        { intervalMs: 6000, initialDelayMs: 3000, actions: [{ type: 'slam', radius: 180, damageMult: 1.3 }] },
      ],
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.30, cdMult: 0.85 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.25 }, { type: 'slam', radius: 240, damageMult: 2.0 }] },
      ],
    },
  }],

  ['frost-plated-rime-mammoth', {
    id: 'frost-plated-rime-mammoth', name: 'Frost-Plated Rime-Mammoth', color: 0x88ccee,
    isBoss: true,
    stats: { hp: 5400, attack: 125, plating: 12, damageReduction: 0.12, speed: 18, attackRange: 20, attackCooldown: 4200, pullRange: 360 },
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
    bossScript: {
      repeating: [
        { intervalMs: 7000, initialDelayMs: 4000, actions: [{ type: 'slam', radius: 200, damageMult: 1.4 }] },
      ],
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.25, cdMult: 0.90 }] },
        { hpPct: 0.25, actions: [{ type: 'stat-buff', stat: 'speed', mult: 1.3 }, { type: 'slam', radius: 240, damageMult: 1.8 }] },
      ],
    },
  }],
] satisfies [string, MonsterDefinition][];
