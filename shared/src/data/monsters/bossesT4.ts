import type { MonsterDefinition } from './types';

export const bossMonsterEntriesT4 = [
  // ── T4 dungeon bosses ────────────────────────────────────────────────────
  ['mountain-titan', {
    id: 'mountain-titan', name: 'Mountain Titan', color: 0x99aacc,
    isBoss: true,
    stats: {
      hp: 7500, attack: 170, plating: 65, damageReduction: 0.20,
      speed: 12, attackRange: 20, attackCooldown: 5200, pullRange: 400,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 600, essenceType: 'blue', level: 5 },
    ai: { wanderRadius: 80, leashRange: 950, idleMinMs: 4000, idleMaxMs: 10000 },
  }],


  ['infernal-tyrant', {
    id: 'infernal-tyrant', name: 'Infernal Tyrant', color: 0xff2200,
    isBoss: true,
    stats: {
      hp: 2200, attack: 68, plating: 20, damageReduction: 0.12,
      speed: 26, attackRange: 20, attackCooldown: 2800, pullRange: 320,
    },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 120, essenceType: 'red', level: 5 },
    ai: { wanderRadius: 180, leashRange: 900, idleMinMs: 2000, idleMaxMs: 5000 },
  }],


  ['glacial-titan', {
    id: 'glacial-titan', name: 'Glacial Titan', color: 0x55aadd,
    isBoss: true,
    stats: {
      hp: 7500, attack: 168, plating: 64, damageReduction: 0.20,
      speed: 18, attackRange: 88, attackCooldown: 5500, pullRange: 400,
    },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 580, essenceType: 'blue', level: 5 },
    ai: { wanderRadius: 85, leashRange: 950, idleMinMs: 4000, idleMaxMs: 10000 },
  }],


  ['elder-treant-lord', {
    id: 'elder-treant-lord', name: 'Elder Treant Lord', color: 0x112a08,
    isBoss: true,
    stats: {
      hp: 7000, attack: 158, plating: 60, damageReduction: 0.19,
      speed: 14, attackRange: 85, attackCooldown: 5200, pullRange: 390,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 560, essenceType: 'green', level: 5 },
    ai: { wanderRadius: 80, leashRange: 940, idleMinMs: 4500, idleMaxMs: 11000 },
  }],


  ['stampede-emperor', {
    id: 'stampede-emperor', name: 'Stampede Emperor', color: 0xff4400,
    isBoss: true,
    stats: {
      hp: 6500, attack: 175, plating: 52, damageReduction: 0.18,
      speed: 68, attackRange: 20, attackCooldown: 2800, pullRange: 380,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 550, essenceType: 'yellow', level: 5 },
    ai: { wanderRadius: 120, leashRange: 940, idleMinMs: 1500, idleMaxMs: 5000 },
  }],


  ['desert-eternal', {
    id: 'desert-eternal', name: 'Desert Eternal', color: 0xddbb33,
    isBoss: true,
    stats: {
      hp: 7200, attack: 165, plating: 58, damageReduction: 0.20,
      speed: 32, attackRange: 86, attackCooldown: 4200, pullRange: 400,
    },
    behavior: 'melee', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 570, essenceType: 'yellow', level: 5 },
    ai: { wanderRadius: 100, leashRange: 950, idleMinMs: 3000, idleMaxMs: 8500 },
  }],


  ['jungle-ancient-lord', {
    id: 'jungle-ancient-lord', name: 'Jungle Ancient Lord', color: 0x0d4419,
    isBoss: true,
    stats: {
      hp: 6800, attack: 172, plating: 55, damageReduction: 0.18,
      speed: 76, attackRange: 20, attackCooldown: 3000, pullRange: 390,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 560, essenceType: 'green', level: 5 },
    ai: { wanderRadius: 115, leashRange: 950, idleMinMs: 2000, idleMaxMs: 6000 },
  }],


  ['inferno-lord', {
    id: 'inferno-lord', name: 'Inferno Lord', color: 0xcc1100,
    isBoss: true,
    stats: {
      hp: 8000, attack: 182, plating: 62, damageReduction: 0.21,
      speed: 26, attackRange: 84, attackCooldown: 4000, pullRange: 380,
    },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 600, essenceType: 'red', level: 5 },
    ai: { wanderRadius: 100, leashRange: 940, idleMinMs: 3000, idleMaxMs: 8000 },
  }],


  ['undying-lord', {
    id: 'undying-lord', name: 'Undying Lord', color: 0x6611aa,
    isBoss: true,
    stats: {
      hp: 7500, attack: 178, plating: 58, damageReduction: 0.21,
      speed: 24, attackRange: 88, attackCooldown: 4500, pullRange: 390,
    },
    behavior: 'melee', attackStyle: 'magic', biome: 'necropolis',
    rewards: { essence: 590, essenceType: 'purple', level: 5 },
    ai: { wanderRadius: 90, leashRange: 940, idleMinMs: 3500, idleMaxMs: 9000 },
  }],


  ['cave-titan', {
    id: 'cave-titan', name: 'Cave Titan', color: 0x223344,
    isBoss: true,
    stats: {
      hp: 8500, attack: 162, plating: 70, damageReduction: 0.22,
      speed: 14, attackRange: 22, attackCooldown: 5500, pullRange: 370,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 610, essenceType: 'red', level: 5 },
    ai: { wanderRadius: 80, leashRange: 940, idleMinMs: 4500, idleMaxMs: 11000 },
  }],


  ['swamp-sovereign', {
    id: 'swamp-sovereign', name: 'Swamp Sovereign', color: 0x0d2a0a,
    isBoss: true,
    stats: {
      hp: 7200, attack: 170, plating: 56, damageReduction: 0.20,
      speed: 30, attackRange: 86, attackCooldown: 4200, pullRange: 385,
    },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 575, essenceType: 'purple', level: 5 },
    ai: { wanderRadius: 95, leashRange: 940, idleMinMs: 3500, idleMaxMs: 9000 },
  }],


  ['void-titan', {
    id: 'void-titan', name: 'Void Titan', color: 0x440066,
    isBoss: true,
    stats: {
      hp: 12000, attack: 252, plating: 68, damageReduction: 0.22,
      speed: 20, attackRange: 100, attackCooldown: 3200, pullRange: 360,
    },
    behavior: 'melee', attackStyle: 'void', biome: 'abyss',
    rewards: { essence: 2000, essenceType: 'purple', level: 25 },
    ai: { wanderRadius: 140, leashRange: 950, idleMinMs: 3000, idleMaxMs: 7000 },
  }],
] satisfies [string, MonsterDefinition][];
