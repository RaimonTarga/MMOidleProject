import type { MonsterDefinition } from './types';

export const advancedBiomeMonsterEntriesB = [
  // ── Tundra T3 ─────────────────────────────────────────────────────────────
  ['frost-giant', {
    id: 'frost-giant', name: 'Frost Giant', color: 0x88bbdd,
    stats: { hp: 700, attack: 50, plating: 18, damageReduction: 0.06, speed: 30, attackRange: 15, attackCooldown: 3200, pullRange: 175 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 58, essenceType: 'blue', level: 2 },
    ai: { wanderRadius: 160, leashRange: 520, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  ['blizzard-wolf', {
    id: 'blizzard-wolf', name: 'Blizzard Wolf', color: 0xddeeff,
    stats: { hp: 390, attack: 56, plating: 8, damageReduction: 0, speed: 98, attackRange: 12, attackCooldown: 1500, pullRange: 290 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 46, essenceType: 'blue', level: 2 },
    ai: { wanderRadius: 330, leashRange: 840, idleMinMs: 500, idleMaxMs: 2500 },
  }],

  ['arctic-leviathan', {
    id: 'arctic-leviathan', name: 'Arctic Leviathan', color: 0x5599cc,
    stats: { hp: 2000, attack: 112, plating: 48, damageReduction: 0.11, speed: 26, attackRange: 15, attackCooldown: 3800, pullRange: 175 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 158, essenceType: 'blue', level: 3 },
    ai: { wanderRadius: 140, leashRange: 500, idleMinMs: 3000, idleMaxMs: 8500 },
  }],

  ['ice-specter', {
    id: 'ice-specter', name: 'Ice Specter', color: 0xccffff,
    stats: { hp: 750, attack: 152, plating: 10, damageReduction: 0.08, speed: 92, attackRange: 12, attackCooldown: 1400, pullRange: 300 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 128, essenceType: 'blue', level: 3 },
    ai: { wanderRadius: 350, leashRange: 900, idleMinMs: 400, idleMaxMs: 2000 },
  }],

  ['sand-kraken', {
    id: 'sand-kraken', name: 'Sand Kraken', color: 0xcc9933,
    stats: { hp: 580, attack: 48, plating: 16, damageReduction: 0.04, speed: 46, attackRange: 15, attackCooldown: 2600, pullRange: 200 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 52, essenceType: 'yellow', level: 2 },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1800, idleMaxMs: 6000 },
  }],

  ['bone-drake', {
    id: 'bone-drake', name: 'Bone Drake', color: 0xddcc88,
    stats: { hp: 440, attack: 58, plating: 10, damageReduction: 0.05, speed: 84, attackRange: 12, attackCooldown: 1800, pullRange: 260 },
    behavior: 'melee', attackStyle: 'slash', biome: 'desert',
    rewards: { essence: 48, essenceType: 'yellow', level: 2 },
    ai: { wanderRadius: 290, leashRange: 740, idleMinMs: 800, idleMaxMs: 3500 },
  }],

  ['pharaoh-construct', {
    id: 'pharaoh-construct', name: 'Pharaoh Construct', color: 0xddbb44,
    stats: { hp: 1850, attack: 115, plating: 45, damageReduction: 0.11, speed: 28, attackRange: 15, attackCooldown: 3400, pullRange: 180 },
    behavior: 'melee', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 152, essenceType: 'yellow', level: 3 },
    ai: { wanderRadius: 155, leashRange: 520, idleMinMs: 2500, idleMaxMs: 7500 },
  }],

  ['desert-wyrm', {
    id: 'desert-wyrm', name: 'Desert Wyrm', color: 0xaa6600,
    stats: { hp: 1200, attack: 138, plating: 26, damageReduction: 0.06, speed: 70, attackRange: 15, attackCooldown: 2000, pullRange: 260 },
    behavior: 'melee', attackStyle: 'slash', biome: 'desert',
    rewards: { essence: 125, essenceType: 'red', level: 3 },
    ai: { wanderRadius: 280, leashRange: 720, idleMinMs: 800, idleMaxMs: 3800 },
  }],

  ['lava-titan', {
    id: 'lava-titan', name: 'Lava Titan', color: 0xff5500,
    stats: { hp: 720, attack: 54, plating: 20, damageReduction: 0.07, speed: 26, attackRange: 15, attackCooldown: 3500, pullRange: 155 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 60, essenceType: 'red', level: 2 },
    ai: { wanderRadius: 140, leashRange: 490, idleMinMs: 3000, idleMaxMs: 8500 },
  }],

  ['fire-elemental', {
    id: 'fire-elemental', name: 'Fire Elemental', color: 0xff8800,
    stats: { hp: 400, attack: 64, plating: 8, damageReduction: 0.04, speed: 70, attackRange: 12, attackCooldown: 2100, pullRange: 230 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 50, essenceType: 'red', level: 2 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4200 },
  }],

  ['infernal-drake', {
    id: 'infernal-drake', name: 'Infernal Drake', color: 0xcc2200,
    stats: { hp: 1600, attack: 135, plating: 38, damageReduction: 0.12, speed: 56, attackRange: 15, attackCooldown: 2200, pullRange: 250 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 145, essenceType: 'red', level: 3 },
    ai: { wanderRadius: 230, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4500 },
  }],

  ['magma-colossus', {
    id: 'magma-colossus', name: 'Magma Colossus', color: 0x881100,
    stats: { hp: 2400, attack: 118, plating: 58, damageReduction: 0.15, speed: 16, attackRange: 15, attackCooldown: 4800, pullRange: 145 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 168, essenceType: 'red', level: 3 },
    ai: { wanderRadius: 100, leashRange: 430, idleMinMs: 4500, idleMaxMs: 11000 },
  }],

  ['skeleton-warrior', {
    id: 'skeleton-warrior', name: 'Skeleton Warrior', color: 0xddddbb,
    stats: { hp: 500, attack: 47, plating: 12, damageReduction: 0.06, speed: 50, attackRange: 12, attackCooldown: 2400, pullRange: 220 },
    behavior: 'melee', attackStyle: 'slash', biome: 'necropolis',
    rewards: { essence: 50, essenceType: 'blue', level: 2 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 5000 },
  }],

  ['lich', {
    id: 'lich', name: 'Lich', color: 0x8855bb,
    stats: { hp: 360, attack: 68, plating: 5, damageReduction: 0.07, speed: 38, attackRange: 15, attackCooldown: 2000, pullRange: 230 },
    behavior: 'melee', attackStyle: 'magic', biome: 'necropolis',
    rewards: { essence: 55, essenceType: 'purple', level: 2 },
    ai: { wanderRadius: 220, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4500 },
  }],

  ['bone-colossus', {
    id: 'bone-colossus', name: 'Bone Colossus', color: 0xbbbbaa,
    stats: { hp: 2000, attack: 112, plating: 45, damageReduction: 0.11, speed: 18, attackRange: 15, attackCooldown: 4200, pullRange: 145 },
    behavior: 'melee', attackStyle: 'impact', biome: 'necropolis',
    rewards: { essence: 155, essenceType: 'blue', level: 3 },
    ai: { wanderRadius: 100, leashRange: 430, idleMinMs: 4000, idleMaxMs: 10000 },
  }],

  ['death-knight', {
    id: 'death-knight', name: 'Death Knight', color: 0x443355,
    stats: { hp: 1200, attack: 142, plating: 30, damageReduction: 0.09, speed: 58, attackRange: 12, attackCooldown: 2200, pullRange: 250 },
    behavior: 'melee', attackStyle: 'slash', biome: 'necropolis',
    rewards: { essence: 130, essenceType: 'purple', level: 3 },
    ai: { wanderRadius: 260, leashRange: 700, idleMinMs: 1000, idleMaxMs: 4000 },
  }],

  ['void-horror', {
    id: 'void-horror', name: 'Void Horror', color: 0x220033,
    stats: { hp: 1500, attack: 150, plating: 24, damageReduction: 0.09, speed: 68, attackRange: 64, attackCooldown: 1900, pullRange: 270 },
    behavior: 'melee', attackStyle: 'void', biome: 'abyss',
    rewards: { essence: 165, essenceType: 'purple', level: 3 },
    ai: { wanderRadius: 280, leashRange: 750, idleMinMs: 800, idleMaxMs: 3500 },
  }],

  ['abyssal-titan', {
    id: 'abyssal-titan', name: 'Abyssal Titan', color: 0x110022,
    stats: { hp: 2600, attack: 125, plating: 55, damageReduction: 0.15, speed: 20, attackRange: 15, attackCooldown: 4500, pullRange: 145 },
    behavior: 'melee', attackStyle: 'void', biome: 'abyss',
    rewards: { essence: 178, essenceType: 'purple', level: 3 },
    ai: { wanderRadius: 95, leashRange: 420, idleMinMs: 4500, idleMaxMs: 11000 },
  }],

  // ── Master merge additions ─────────────────────────────────────────────

  ['dune-asp', {
    id: 'dune-asp', name: 'Dune Asp', color: 0xccaa55,
    // Strikes from distance and writhes unpredictably — evasion + range is a dangerous combo
    stats: { hp: 135, attack: 22, plating: 0, damageReduction: 0.05, speed: 48, attackRange: 185, attackCooldown: 2400, pullRange: 250 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 14, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
    evadeEvery: 5,
  }],
] satisfies [string, MonsterDefinition][];
