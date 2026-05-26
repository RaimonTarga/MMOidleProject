import type { MonsterDefinition } from './types';

export const bossMonsterEntriesT3 = [
  // ── T3 dungeon bosses ────────────────────────────────────────────────────
  ['frost-colossus', {
    id: 'frost-colossus', name: 'Frost Colossus', color: 0x88ccee,
    isBoss: true,
    stats: {
      hp: 4000, attack: 95, plating: 40, damageReduction: 0.14,
      speed: 20, attackRange: 82, attackCooldown: 4200, pullRange: 360,
    },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 350, essenceType: 'blue', level: 5 },
    ai: { wanderRadius: 100, leashRange: 900, idleMinMs: 3000, idleMaxMs: 8000 },
  }],


  ['volcanic-titan', {
    id: 'volcanic-titan', name: 'Volcanic Titan', color: 0xee4400,
    isBoss: true,
    stats: {
      hp: 3800, attack: 105, plating: 30, damageReduction: 0.12,
      speed: 32, attackRange: 76, attackCooldown: 3400, pullRange: 340,
    },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 360, essenceType: 'red', level: 5 },
    ai: { wanderRadius: 120, leashRange: 920, idleMinMs: 2500, idleMaxMs: 7000 },
  }],


  ['peak-titan', {
    id: 'peak-titan', name: 'Peak Titan', color: 0x6688cc,
    isBoss: true,
    stats: {
      hp: 4200, attack: 100, plating: 42, damageReduction: 0.14,
      speed: 18, attackRange: 80, attackCooldown: 4500, pullRange: 360,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 340, essenceType: 'blue', level: 5 },
    ai: { wanderRadius: 100, leashRange: 920, idleMinMs: 3500, idleMaxMs: 8500 },
  }],


  ['elder-forest-warden', {
    id: 'elder-forest-warden', name: 'Elder Forest Warden', color: 0x1a6622,
    isBoss: true,
    stats: {
      hp: 4500, attack: 102, plating: 38, damageReduction: 0.13,
      speed: 22, attackRange: 78, attackCooldown: 4000, pullRange: 350,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 360, essenceType: 'green', level: 5 },
    ai: { wanderRadius: 110, leashRange: 910, idleMinMs: 3000, idleMaxMs: 8000 },
  }],


  ['plains-warlord', {
    id: 'plains-warlord', name: 'Plains Warlord', color: 0xdd8800,
    isBoss: true,
    stats: {
      hp: 3800, attack: 108, plating: 32, damageReduction: 0.12,
      speed: 50, attackRange: 75, attackCooldown: 3000, pullRange: 340,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 330, essenceType: 'yellow', level: 5 },
    ai: { wanderRadius: 130, leashRange: 900, idleMinMs: 2000, idleMaxMs: 6000 },
  }],


  ['sand-emperor', {
    id: 'sand-emperor', name: 'Sand Emperor', color: 0xccaa22,
    isBoss: true,
    stats: {
      hp: 4000, attack: 112, plating: 34, damageReduction: 0.13,
      speed: 42, attackRange: 80, attackCooldown: 3200, pullRange: 350,
    },
    behavior: 'melee', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 345, essenceType: 'yellow', level: 5 },
    ai: { wanderRadius: 140, leashRange: 900, idleMinMs: 2200, idleMaxMs: 6500 },
  }],


  ['jungle-titan-lord', {
    id: 'jungle-titan-lord', name: 'Jungle Titan Lord', color: 0x115522,
    isBoss: true,
    stats: {
      hp: 3900, attack: 110, plating: 30, damageReduction: 0.12,
      speed: 60, attackRange: 76, attackCooldown: 2800, pullRange: 340,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 340, essenceType: 'green', level: 5 },
    ai: { wanderRadius: 140, leashRange: 920, idleMinMs: 2000, idleMaxMs: 6000 },
  }],


  ['cave-overlord', {
    id: 'cave-overlord', name: 'Cave Overlord', color: 0x332244,
    isBoss: true,
    stats: {
      hp: 4800, attack: 96, plating: 48, damageReduction: 0.15,
      speed: 16, attackRange: 82, attackCooldown: 5000, pullRange: 330,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 355, essenceType: 'red', level: 5 },
    ai: { wanderRadius: 85, leashRange: 890, idleMinMs: 4000, idleMaxMs: 10000 },
  }],


  ['bog-ancient', {
    id: 'bog-ancient', name: 'Bog Ancient', color: 0x1a3311,
    isBoss: true,
    stats: {
      hp: 4200, attack: 98, plating: 36, damageReduction: 0.13,
      speed: 28, attackRange: 78, attackCooldown: 3500, pullRange: 330,
    },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 345, essenceType: 'purple', level: 5 },
    ai: { wanderRadius: 105, leashRange: 880, idleMinMs: 2800, idleMaxMs: 7000 },
  }],


  ['lich-king', {
    id: 'lich-king', name: 'Lich King', color: 0x9933cc,
    isBoss: true,
    stats: {
      hp: 5200, attack: 118, plating: 38, damageReduction: 0.16,
      speed: 25, attackRange: 90, attackCooldown: 2600, pullRange: 340,
    },
    behavior: 'melee', attackStyle: 'magic', biome: 'necropolis',
    rewards: { essence: 800, essenceType: 'purple', level: 15 },
    ai: { wanderRadius: 160, leashRange: 900, idleMinMs: 2500, idleMaxMs: 6000 },
  }],
] satisfies [string, MonsterDefinition][];
