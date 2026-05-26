import type { MonsterDefinition } from './types';

export const advancedBiomeMonsterEntriesA = [
  // ── Forest T3 ─────────────────────────────────────────────────────────────
  ['cursed-wolf', {
    id: 'cursed-wolf', name: 'Cursed Wolf', color: 0x5533bb,
    stats: { hp: 420, attack: 55, plating: 8, damageReduction: 0, speed: 92, attackRange: 60, attackCooldown: 1400, pullRange: 280 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 45, essenceType: 'green', level: 2 },
    ai: { wanderRadius: 320, leashRange: 820, idleMinMs: 500, idleMaxMs: 2200 },
  }],

  ['treant', {
    id: 'treant', name: 'Treant', color: 0x2a5c14,
    stats: { hp: 720, attack: 40, plating: 18, damageReduction: 0.05, speed: 18, attackRange: 65, attackCooldown: 3800, pullRange: 140 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 55, essenceType: 'green', level: 2 },
    ai: { wanderRadius: 100, leashRange: 450, idleMinMs: 3500, idleMaxMs: 9000 },
  }],

  ['elder-treant', {
    id: 'elder-treant', name: 'Elder Treant', color: 0x1a3a08,
    stats: { hp: 1800, attack: 102, plating: 40, damageReduction: 0.10, speed: 14, attackRange: 68, attackCooldown: 4200, pullRange: 140 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 135, essenceType: 'green', level: 3 },
    ai: { wanderRadius: 90, leashRange: 420, idleMinMs: 4000, idleMaxMs: 10000 },
  }],

  ['spectral-wolf', {
    id: 'spectral-wolf', name: 'Spectral Wolf', color: 0x9966ff,
    stats: { hp: 950, attack: 138, plating: 10, damageReduction: 0.06, speed: 108, attackRange: 60, attackCooldown: 1200, pullRange: 300 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 110, essenceType: 'green', level: 3 },
    ai: { wanderRadius: 340, leashRange: 900, idleMinMs: 400, idleMaxMs: 1800 },
  }],

  ['rune-golem', {
    id: 'rune-golem', name: 'Rune Golem', color: 0x6688bb,
    stats: { hp: 640, attack: 46, plating: 20, damageReduction: 0.07, speed: 16, attackRange: 65, attackCooldown: 3600, pullRange: 145 },
    behavior: 'melee', attackStyle: 'magic', biome: 'mountain',
    rewards: { essence: 52, essenceType: 'blue', level: 2 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9500 },
  }],

  ['storm-eagle', {
    id: 'storm-eagle', name: 'Storm Eagle', color: 0xaaccff,
    stats: { hp: 340, attack: 58, plating: 5, damageReduction: 0, speed: 112, attackRange: 60, attackCooldown: 1300, pullRange: 290 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 48, essenceType: 'blue', level: 2 },
    ai: { wanderRadius: 340, leashRange: 860, idleMinMs: 400, idleMaxMs: 1800 },
  }],

  ['colossal-titan', {
    id: 'colossal-titan', name: 'Colossal Titan', color: 0x8899aa,
    stats: { hp: 2100, attack: 115, plating: 50, damageReduction: 0.12, speed: 12, attackRange: 70, attackCooldown: 4500, pullRange: 140 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 150, essenceType: 'blue', level: 3 },
    ai: { wanderRadius: 85, leashRange: 400, idleMinMs: 4500, idleMaxMs: 11000 },
  }],

  ['thunder-condor', {
    id: 'thunder-condor', name: 'Thunder Condor', color: 0xddddff,
    stats: { hp: 800, attack: 152, plating: 12, damageReduction: 0, speed: 125, attackRange: 60, attackCooldown: 1100, pullRange: 310 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 120, essenceType: 'blue', level: 3 },
    ai: { wanderRadius: 360, leashRange: 920, idleMinMs: 300, idleMaxMs: 1500 },
  }],

  ['war-mammoth', {
    id: 'war-mammoth', name: 'War Mammoth', color: 0xbb8844,
    stats: { hp: 680, attack: 42, plating: 14, damageReduction: 0.04, speed: 42, attackRange: 65, attackCooldown: 2600, pullRange: 220 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 55, essenceType: 'yellow', level: 2 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 1200, idleMaxMs: 4500 },
  }],

  ['dire-wolf', {
    id: 'dire-wolf', name: 'Dire Wolf', color: 0xee6622,
    stats: { hp: 380, attack: 54, plating: 8, damageReduction: 0, speed: 98, attackRange: 60, attackCooldown: 1500, pullRange: 280 },
    behavior: 'melee', attackStyle: 'slash', biome: 'plains',
    rewards: { essence: 45, essenceType: 'yellow', level: 2 },
    ai: { wanderRadius: 310, leashRange: 800, idleMinMs: 500, idleMaxMs: 2500 },
  }],

  ['ancient-guardian', {
    id: 'ancient-guardian', name: 'Ancient Guardian', color: 0xddaa55,
    stats: { hp: 1700, attack: 118, plating: 42, damageReduction: 0.09, speed: 36, attackRange: 65, attackCooldown: 3000, pullRange: 200 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 145, essenceType: 'yellow', level: 3 },
    ai: { wanderRadius: 220, leashRange: 640, idleMinMs: 1500, idleMaxMs: 5500 },
  }],

  ['stampede-king', {
    id: 'stampede-king', name: 'Stampede King', color: 0xff5500,
    stats: { hp: 1100, attack: 145, plating: 22, damageReduction: 0.04, speed: 82, attackRange: 62, attackCooldown: 1700, pullRange: 260 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 118, essenceType: 'yellow', level: 3 },
    ai: { wanderRadius: 290, leashRange: 750, idleMinMs: 700, idleMaxMs: 3000 },
  }],

  ['bog-horror', {
    id: 'bog-horror', name: 'Bog Horror', color: 0x224422,
    stats: { hp: 600, attack: 44, plating: 15, damageReduction: 0.05, speed: 24, attackRange: 65, attackCooldown: 2800, pullRange: 170 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 50, essenceType: 'purple', level: 2 },
    ai: { wanderRadius: 155, leashRange: 540, idleMinMs: 2800, idleMaxMs: 7500 },
  }],

  ['plague-witch', {
    id: 'plague-witch', name: 'Plague Witch', color: 0xaa22cc,
    stats: { hp: 290, attack: 66, plating: 4, damageReduction: 0, speed: 56, attackRange: 62, attackCooldown: 2000, pullRange: 210 },
    behavior: 'melee', attackStyle: 'magic', biome: 'swamp',
    rewards: { essence: 48, essenceType: 'purple', level: 2 },
    ai: { wanderRadius: 220, leashRange: 600, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  ['hydra-elder', {
    id: 'hydra-elder', name: 'Hydra Elder', color: 0x114422,
    stats: { hp: 1900, attack: 108, plating: 38, damageReduction: 0.09, speed: 26, attackRange: 68, attackCooldown: 2900, pullRange: 180 },
    behavior: 'melee', attackStyle: 'impact', biome: 'swamp',
    rewards: { essence: 148, essenceType: 'purple', level: 3 },
    ai: { wanderRadius: 145, leashRange: 520, idleMinMs: 2800, idleMaxMs: 8000 },
  }],

  ['shadow-toad', {
    id: 'shadow-toad', name: 'Shadow Toad', color: 0x662288,
    stats: { hp: 900, attack: 142, plating: 16, damageReduction: 0.06, speed: 72, attackRange: 60, attackCooldown: 1900, pullRange: 230 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 115, essenceType: 'purple', level: 3 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 900, idleMaxMs: 3500 },
  }],

  ['cave-behemoth', {
    id: 'cave-behemoth', name: 'Cave Behemoth', color: 0x443344,
    stats: { hp: 750, attack: 42, plating: 22, damageReduction: 0.07, speed: 16, attackRange: 65, attackCooldown: 4000, pullRange: 140 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 58, essenceType: 'red', level: 2 },
    ai: { wanderRadius: 100, leashRange: 440, idleMinMs: 4000, idleMaxMs: 10000 },
  }],

  ['venom-queen', {
    id: 'venom-queen', name: 'Venom Queen', color: 0x882255,
    stats: { hp: 360, attack: 60, plating: 8, damageReduction: 0, speed: 80, attackRange: 62, attackCooldown: 1800, pullRange: 240 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave',
    rewards: { essence: 46, essenceType: 'red', level: 2 },
    ai: { wanderRadius: 270, leashRange: 700, idleMinMs: 800, idleMaxMs: 3200 },
  }],

  ['stone-colossus', {
    id: 'stone-colossus', name: 'Stone Colossus', color: 0x334444,
    stats: { hp: 2200, attack: 98, plating: 58, damageReduction: 0.13, speed: 12, attackRange: 70, attackCooldown: 4500, pullRange: 135 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 155, essenceType: 'red', level: 3 },
    ai: { wanderRadius: 80, leashRange: 400, idleMinMs: 5000, idleMaxMs: 12000 },
  }],

  ['abyss-crawler', {
    id: 'abyss-crawler', name: 'Abyss Crawler', color: 0x551166,
    stats: { hp: 1100, attack: 128, plating: 28, damageReduction: 0.08, speed: 58, attackRange: 62, attackCooldown: 2000, pullRange: 240 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave',
    rewards: { essence: 120, essenceType: 'red', level: 3 },
    ai: { wanderRadius: 260, leashRange: 700, idleMinMs: 1000, idleMaxMs: 3800 },
  }],

  ['feral-gorilla', {
    id: 'feral-gorilla', name: 'Feral Gorilla', color: 0x774422,
    stats: { hp: 620, attack: 46, plating: 13, damageReduction: 0.03, speed: 64, attackRange: 62, attackCooldown: 2200, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle',
    rewards: { essence: 52, essenceType: 'green', level: 2 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 1000, idleMaxMs: 3800 },
  }],

  ['pit-viper', {
    id: 'pit-viper', name: 'Pit Viper', color: 0x22aa33,
    stats: { hp: 330, attack: 60, plating: 6, damageReduction: 0, speed: 96, attackRange: 60, attackCooldown: 1600, pullRange: 270 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 45, essenceType: 'green', level: 2 },
    ai: { wanderRadius: 300, leashRange: 780, idleMinMs: 600, idleMaxMs: 2800 },
  }],

  ['ancient-titan', {
    id: 'ancient-titan', name: 'Ancient Titan', color: 0x664411,
    stats: { hp: 1750, attack: 115, plating: 40, damageReduction: 0.09, speed: 50, attackRange: 65, attackCooldown: 2800, pullRange: 220 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle',
    rewards: { essence: 148, essenceType: 'green', level: 3 },
    ai: { wanderRadius: 240, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4500 },
  }],

  ['jungle-wyvern', {
    id: 'jungle-wyvern', name: 'Jungle Wyvern', color: 0x117733,
    stats: { hp: 1000, attack: 140, plating: 20, damageReduction: 0.04, speed: 90, attackRange: 65, attackCooldown: 1800, pullRange: 280 },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 122, essenceType: 'green', level: 3 },
    ai: { wanderRadius: 300, leashRange: 800, idleMinMs: 700, idleMaxMs: 3000 },
  }],

  // ── Master merge additions ─────────────────────────────────────────────

  ['jungle-blowdarter', {
    id: 'jungle-blowdarter', name: 'Jungle Blowdarter', color: 0x55bb44,
    // Hidden in foliage; fires poisoned darts from long range
    stats: { hp: 130, attack: 19, plating: 0, damageReduction: 0, speed: 42, attackRange: 195, attackCooldown: 2500, pullRange: 245 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 13, essenceType: 'green', level: 1, biomeXp: 38 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
    dotEffect: { damagePerStack: 2, maxStacks: 5, tickIntervalMs: 1000, durationMs: 4500 },
  }],
] satisfies [string, MonsterDefinition][];
