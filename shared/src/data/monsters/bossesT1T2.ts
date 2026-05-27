import type { MonsterDefinition } from './types';

export const bossMonsterEntriesT1T2 = [
  // ── Dungeon bosses ─────────────────────────────────────────────────────────
  // Bosses have isBoss: true. Spawned exclusively by World.ensureBoss() in dungeon nodes.
  // No dungeon multiplier is applied on top of boss stats.

  // ── T1 dungeon bosses ────────────────────────────────────────────────────
  // Design: HP 400-700, ATK 14-22, biome threat profile amplified

  // Plains: balanced — moderate stats across the board
  ['plains-champion', {
    id: 'plains-champion', name: 'Plains Champion', color: 0xddaa44,
    isBoss: true,
    stats: {
      hp: 520, attack: 18, plating: 2, damageReduction: 0.02,
      speed: 50, attackRange: 15, attackCooldown: 2200, pullRange: 280,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 100, essenceType: 'yellow', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  ['forest-warden', {
    id: 'forest-warden', name: 'Forest Warden', color: 0x33aa44,
    isBoss: true,
    stats: {
      hp: 450, attack: 22, plating: 0, damageReduction: 0,
      speed: 52, attackRange: 15, attackCooldown: 2000, pullRange: 300,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 100, essenceType: 'green', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 160, leashRange: 800, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  ['bog-sovereign', {
    id: 'bog-sovereign', name: 'Bog Sovereign', color: 0x1e3d1e,
    isBoss: true,
    stats: {
      hp: 500, attack: 16, plating: 4, damageReduction: 0.04,
      speed: 28, attackRange: 15, attackCooldown: 2800, pullRange: 260,
    },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 100, essenceType: 'purple', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 100, leashRange: 700, idleMinMs: 2000, idleMaxMs: 5500 },
    dotEffect: { damagePerStack: 4, maxStacks: 4, tickIntervalMs: 1000 },
  }],

  ['cave-sentinel', {
    id: 'cave-sentinel', name: 'Cave Sentinel', color: 0x334455,
    isBoss: true,
    stats: {
      hp: 650, attack: 22, plating: 7, damageReduction: 0.04,
      speed: 18, attackRange: 15, attackCooldown: 3200, pullRange: 240,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 110, essenceType: 'red', level: 5, biomeXp: 165 },
    ai: { wanderRadius: 80, leashRange: 680, idleMinMs: 2500, idleMaxMs: 6500 },
  }],

  ['mountain-sentinel', {
    id: 'mountain-sentinel', name: 'Mountain Sentinel', color: 0x8899bb,
    isBoss: true,
    stats: {
      hp: 480, attack: 20, plating: 0, damageReduction: 0,
      speed: 58, attackRange: 15, attackCooldown: 1800, pullRange: 280,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 105, essenceType: 'blue', level: 5, biomeXp: 158 },
    ai: { wanderRadius: 160, leashRange: 750, idleMinMs: 1000, idleMaxMs: 3500 },
  }],

  ['stone-warden', {
    id: 'stone-warden', name: 'Stone Warden', color: 0x667788,
    isBoss: true,
    stats: {
      hp: 2400, attack: 62, plating: 32, damageReduction: 0.10,
      speed: 20, attackRange: 72, attackCooldown: 4000, pullRange: 320,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 160, essenceType: 'blue', level: 5, biomeXp: 240 },
    ai: { wanderRadius: 120, leashRange: 850, idleMinMs: 3000, idleMaxMs: 7500 },
  }],


  ['mire-lord', {
    id: 'mire-lord', name: 'Mire Lord', color: 0x2a4011,
    isBoss: true,
    stats: {
      hp: 2100, attack: 58, plating: 22, damageReduction: 0.09,
      speed: 30, attackRange: 15, attackCooldown: 3000, pullRange: 300,
    },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 155, essenceType: 'purple', level: 5, biomeXp: 232 },
    ai: { wanderRadius: 110, leashRange: 800, idleMinMs: 2500, idleMaxMs: 6000 },
  }],


  ['desert-pharaoh', {
    id: 'desert-pharaoh', name: 'Desert Pharaoh', color: 0xddcc44,
    isBoss: true,
    stats: {
      hp: 1900, attack: 74, plating: 18, damageReduction: 0.10,
      speed: 40, attackRange: 74, attackCooldown: 2600, pullRange: 340,
    },
    behavior: 'melee', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 150, essenceType: 'yellow', level: 5, biomeXp: 225 },
    ai: { wanderRadius: 140, leashRange: 880, idleMinMs: 2000, idleMaxMs: 5500 },
  }],


  ['forest-elder', {
    id: 'forest-elder', name: 'Forest Elder', color: 0x226622,
    isBoss: true,
    stats: {
      hp: 2200, attack: 58, plating: 22, damageReduction: 0.08,
      speed: 26, attackRange: 74, attackCooldown: 3000, pullRange: 310,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 155, essenceType: 'green', level: 5, biomeXp: 232 },
    ai: { wanderRadius: 130, leashRange: 830, idleMinMs: 2500, idleMaxMs: 6500 },
  }],


  ['plains-overlord', {
    id: 'plains-overlord', name: 'Plains Overlord', color: 0xcc9922,
    isBoss: true,
    stats: {
      hp: 2000, attack: 64, plating: 20, damageReduction: 0.08,
      speed: 46, attackRange: 15, attackCooldown: 2700, pullRange: 320,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 150, essenceType: 'yellow', level: 5, biomeXp: 225 },
    ai: { wanderRadius: 140, leashRange: 850, idleMinMs: 2000, idleMaxMs: 5500 },
  }],


  ['jungle-colossus', {
    id: 'jungle-colossus', name: 'Jungle Colossus', color: 0x117722,
    isBoss: true,
    stats: {
      hp: 1800, attack: 68, plating: 17, damageReduction: 0.07,
      speed: 56, attackRange: 66, attackCooldown: 2400, pullRange: 320,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 145, essenceType: 'green', level: 5, biomeXp: 218 },
    ai: { wanderRadius: 150, leashRange: 840, idleMinMs: 1800, idleMaxMs: 4500 },
  }],


  ['cave-terror', {
    id: 'cave-terror', name: 'Cave Terror', color: 0x442244,
    isBoss: true,
    stats: {
      hp: 2400, attack: 56, plating: 28, damageReduction: 0.10,
      speed: 18, attackRange: 72, attackCooldown: 4000, pullRange: 280,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 160, essenceType: 'red', level: 5, biomeXp: 240 },
    ai: { wanderRadius: 90, leashRange: 800, idleMinMs: 3000, idleMaxMs: 7500 },
  }],

  ['glacial-colossus', {
    id: 'glacial-colossus', name: 'Glacial Colossus', color: 0xaaddff,
    isBoss: true,
    stats: {
      hp: 2600, attack: 55, plating: 28, damageReduction: 0.10,
      speed: 18, attackRange: 22, attackCooldown: 3600, pullRange: 280,
    },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 140, essenceType: 'blue', level: 5, biomeXp: 210 },
    ai: { wanderRadius: 140, leashRange: 800, idleMinMs: 3000, idleMaxMs: 6500 },
  }],
] satisfies [string, MonsterDefinition][];
