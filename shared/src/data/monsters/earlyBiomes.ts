import type { MonsterDefinition } from './types';

export const earlyBiomeMonsterEntries = [
  // ── Forest T1 ──────────────────────────────────────────────────────────────
  // Threat profile: fast attacking, sustained damage, average HP, LOW defense.
  // Easy to burst down once you can hit fast enough.
  ['forest-slime', {
    id: 'forest-slime', name: 'Forest Slime', color: 0x55ff55,
    // Soft and squishy — dies fast but attacks quickly
    stats: { hp: 70, attack: 10, plating: 0, damageReduction: 0, speed: 52, attackRange: 12, attackCooldown: 1800, pullRange: 210 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 5, essenceType: 'green', level: 1, biomeXp: 18 },
    ai: { wanderRadius: 230, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  ['wolf', {
    id: 'wolf', name: 'Wolf', color: 0xaaaacc,
    // High speed, high pull range — closes distance fast; zero armor, easy to burst
    stats: { hp: 60, attack: 12, plating: 0, damageReduction: 0, speed: 78, attackRange: 12, attackCooldown: 1400, pullRange: 255 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 7, essenceType: 'green', level: 1, biomeXp: 25 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
  }],

  ['ancient-wolf', {
    id: 'ancient-wolf', name: 'Ancient Wolf', color: 0x8888ff,
    // Explosive charger — lunges the moment it spots you, then bites fast
    stats: { hp: 195, attack: 25, plating: 0, damageReduction: 0, speed: 95, attackRange: 12, attackCooldown: 1300, pullRange: 280 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 16, essenceType: 'green', level: 1, biomeXp: 45 },
    ai: { wanderRadius: 300, leashRange: 750, idleMinMs: 600, idleMaxMs: 2500 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 1000 },
  }],

  ['ironwood-golem', {
    id: 'ironwood-golem', name: 'Ironwood Golem', color: 0x556633,
    // Bark-armored sentinel; DR replaces plating so shred doesn't trivialize it
    stats: { hp: 280, attack: 18, plating: 0, damageReduction: 0.22, speed: 16, attackRange: 15, attackCooldown: 3800, pullRange: 140 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 20, essenceType: 'green', level: 1, biomeXp: 58 },
    ai: { wanderRadius: 120, leashRange: 480, idleMinMs: 3000, idleMaxMs: 8000 },
  }],

  ['cliff-hopper', {
    id: 'cliff-hopper', name: 'Cliff Hopper', color: 0x99aacc,
    // Sprint-attacks from far away; high HP for a fast mob
    stats: { hp: 175, attack: 15, plating: 0, damageReduction: 0, speed: 80, attackRange: 12, attackCooldown: 1500, pullRange: 275 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 12, essenceType: 'blue', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 310, leashRange: 720, idleMinMs: 600, idleMaxMs: 2500 },
  }],

  ['ridge-archer', {
    id: 'ridge-archer', name: 'Ridge Archer', color: 0x778899,
    // Longer attack range simulates a thrown-rock / sling attack; high HP and punishing damage
    stats: { hp: 200, attack: 16, plating: 0, damageReduction: 0, speed: 35, attackRange: 200, attackCooldown: 2800, pullRange: 350 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'mountain',
    rewards: { essence: 15, essenceType: 'blue', level: 1, biomeXp: 52 },
    ai: { wanderRadius: 210, leashRange: 600, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  ['granite-titan', {
    id: 'granite-titan', name: 'Granite Titan', color: 0x99aabb,
    // Pure DR tank — attrition fight; plating swapped for dense stone hide
    stats: { hp: 400, attack: 22, plating: 0, damageReduction: 0.22, speed: 16, attackRange: 15, attackCooldown: 3800, pullRange: 145 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 28, essenceType: 'blue', level: 1, biomeXp: 80 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9000 },
  }],

  ['stone-eagle', {
    id: 'stone-eagle', name: 'Stone Eagle', color: 0xccdde8,
    // Dive-bombs from full speed on aggro; no armor but hits devastatingly hard
    stats: { hp: 215, attack: 28, plating: 0, damageReduction: 0, speed: 98, attackRange: 12, attackCooldown: 1300, pullRange: 285 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 24, essenceType: 'blue', level: 1, biomeXp: 68 },
    ai: { wanderRadius: 320, leashRange: 800, idleMinMs: 500, idleMaxMs: 2000 },
    chargeOnAggro: { speedMult: 3.5, durationMs: 1000 },
  }],

  ['plains-slime', {
    id: 'plains-slime', name: 'Plains Slime', color: 0xddee55,
    stats: { hp: 55, attack: 9, plating: 0, damageReduction: 0, speed: 42, attackRange: 12, attackCooldown: 2200, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 3, essenceType: 'yellow', level: 1, biomeXp: 10 },
    ai: { wanderRadius: 250, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  ['boar', {
    id: 'boar', name: 'Boar', color: 0xcc8844,
    stats: { hp: 75, attack: 12, plating: 0, damageReduction: 0, speed: 48, attackRange: 12, attackCooldown: 2000, pullRange: 205 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 5, essenceType: 'yellow', level: 1, biomeXp: 18 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
    chargeOnAggro: { speedMult: 3.5, durationMs: 1200 },
  }],

  ['stampede-bull', {
    id: 'stampede-bull', name: 'Stampede Bull', color: 0xdd5500,
    // Charges on aggro; slight DR from thick hide; straightforward threat
    stats: { hp: 130, attack: 22, plating: 0, damageReduction: 0.05, speed: 62, attackRange: 12, attackCooldown: 1800, pullRange: 235 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 14, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],

  ['prairie-wolf', {
    id: 'prairie-wolf', name: 'Prairie Wolf', color: 0xddaa55,
    // Pack hunter — fastest T2 mob in its tier; glass cannon
    stats: { hp: 105, attack: 20, plating: 0, damageReduction: 0, speed: 92, attackRange: 12, attackCooldown: 1300, pullRange: 275 },
    behavior: 'melee', attackStyle: 'slash', biome: 'plains',
    rewards: { essence: 12, essenceType: 'yellow', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
  }],

  ['bog-slime', {
    id: 'bog-slime', name: 'Bog Slime', color: 0x558833,
    // Sluggish and toxic; tests player patience with sustained drip damage
    stats: { hp: 120, attack: 10, plating: 2, damageReduction: 0, speed: 28, attackRange: 12, attackCooldown: 2800, pullRange: 165 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 10, essenceType: 'purple', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 160, leashRange: 530, idleMinMs: 2000, idleMaxMs: 5500 },
    dotEffect: { damagePerStack: 1, maxStacks: 3, tickIntervalMs: 1200 },
  }],

  ['mud-toad', {
    id: 'mud-toad', name: 'Mud Toad', color: 0x778844,
    // Sturdier than it looks; plating and DR make burst less effective
    stats: { hp: 145, attack: 11, plating: 3, damageReduction: 0.04, speed: 30, attackRange: 12, attackCooldown: 2600, pullRange: 180 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 12, essenceType: 'purple', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 180, leashRange: 550, idleMinMs: 1800, idleMaxMs: 5000 },
    dotEffect: { damagePerStack: 1, maxStacks: 4, tickIntervalMs: 1000 },
  }],

  ['swamp-hydra', {
    id: 'swamp-hydra', name: 'Swamp Hydra', color: 0x335533,
    // Multi-headed DoT engine; DR replaces plating; fights long enough to stack poison deep
    stats: { hp: 340, attack: 16, plating: 0, damageReduction: 0.12, speed: 28, attackRange: 15, attackCooldown: 2500, pullRange: 185 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 24, essenceType: 'purple', level: 1, biomeXp: 68 },
    ai: { wanderRadius: 170, leashRange: 560, idleMinMs: 2500, idleMaxMs: 7000 },
    dotEffect: { damagePerStack: 4, maxStacks: 4, tickIntervalMs: 1000, durationMs: 4500 },
  }],

  ['bog-witch', {
    id: 'bog-witch', name: 'Bog Witch', color: 0x884499,
    // Curses from range; much longer attack range than T1 counterpart
    stats: { hp: 190, attack: 26, plating: 0, damageReduction: 0.05, speed: 38, attackRange: 180, attackCooldown: 2000, pullRange: 215 },
    behavior: 'melee', attackStyle: 'magic', isRanged: true, biome: 'swamp',
    rewards: { essence: 22, essenceType: 'purple', level: 1, biomeXp: 62 },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  ['cave-lurker', {
    id: 'cave-lurker', name: 'Cave Lurker', color: 0x664466,
    stats: { hp: 210, attack: 13, plating: 6, damageReduction: 0.02, speed: 55, attackRange: 12, attackCooldown: 1400, pullRange: 145 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 20, essenceType: 'red', level: 1, biomeXp: 70 },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  ['cave-brute', {
    id: 'cave-brute', name: 'Cave Brute', color: 0x443344,
    stats: { hp: 360, attack: 32, plating: 1, damageReduction: 0.15, speed: 15, attackRange: 12, attackCooldown: 4000, pullRange: 125 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 26, essenceType: 'red', level: 1, biomeXp: 90 },
    ai: { wanderRadius: 110, leashRange: 430, idleMinMs: 3000, idleMaxMs: 8000 },
  }],

  ['giant-spider', {
    id: 'giant-spider', name: 'Giant Spider', color: 0x992266,
    // Fast ambush hunter; DR hide + evasion makes it slippery despite its size
    stats: { hp: 360, attack: 26, plating: 0, damageReduction: 0.08, speed: 72, attackRange: 12, attackCooldown: 1900, pullRange: 220 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave',
    rewards: { essence: 30, essenceType: 'red', level: 1, biomeXp: 85 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3200 },
    evadeEvery: 5,
  }],

  ['cave-troll', {
    id: 'cave-troll', name: 'Cave Troll', color: 0x334433,
    // Colossal slow bruiser; DR replaces plating; each hit is an event
    stats: { hp: 640, attack: 34, plating: 0, damageReduction: 0.18, speed: 15, attackRange: 15, attackCooldown: 3600, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 40, essenceType: 'red', level: 1, biomeXp: 115 },
    ai: { wanderRadius: 130, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
  }],

  ['jungle-snake', {
    id: 'jungle-snake', name: 'Jungle Snake', color: 0x33cc44,
    // Fast venomous ambusher — racks up DoT stacks quickly
    stats: { hp: 145, attack: 18, plating: 0, damageReduction: 0, speed: 72, attackRange: 12, attackCooldown: 1900, pullRange: 215 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 12, essenceType: 'green', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
    dotEffect: { damagePerStack: 3, maxStacks: 4, tickIntervalMs: 1000, durationMs: 4500 },
  }],

  ['jungle-ape', {
    id: 'jungle-ape', name: 'Jungle Ape', color: 0xaa6633,
    // Charges from the canopy; hits surprisingly hard for a high-density mob
    stats: { hp: 185, attack: 22, plating: 0, damageReduction: 0.05, speed: 58, attackRange: 12, attackCooldown: 2000, pullRange: 225 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle',
    rewards: { essence: 14, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1100 },
  }],

  ['frost-slime', {
    id: 'frost-slime', name: 'Frost Slime', color: 0xaaddff,
    stats: { hp: 100, attack: 14, plating: 0, damageReduction: 0.10, speed: 28, attackRange: 12, attackCooldown: 2800, pullRange: 170 },
    behavior: 'melee', attackStyle: 'impact', biome: 'tundra',
    rewards: { essence: 18, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 150, leashRange: 510, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  ['ice-bear', {
    id: 'ice-bear', name: 'Ice Bear', color: 0xddeeff,
    stats: { hp: 240, attack: 22, plating: 0, damageReduction: 0.14, speed: 38, attackRange: 15, attackCooldown: 3200, pullRange: 200 },
    behavior: 'melee', attackStyle: 'impact', biome: 'tundra',
    rewards: { essence: 25, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 6500 },
  }],

  ['sand-scorpion', {
    id: 'sand-scorpion', name: 'Sand Scorpion', color: 0xddbb44,
    // Venomous sting slows movement; fights become longer as you struggle to reposition
    stats: { hp: 160, attack: 20, plating: 0, damageReduction: 0.10, speed: 50, attackRange: 12, attackCooldown: 2200, pullRange: 210 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 13, essenceType: 'yellow', level: 1, biomeXp: 38 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],

  ['stone-basilisk', {
    id: 'stone-basilisk', name: 'Stone Basilisk', color: 0xaa8833,
    // Petrifying gaze — its hit roots the player briefly; tough hide adds DR
    stats: { hp: 255, attack: 24, plating: 0, damageReduction: 0.12, speed: 28, attackRange: 12, attackCooldown: 2600, pullRange: 175 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 16, essenceType: 'yellow', level: 1, biomeXp: 45 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 5500 },
    slowEffect: { speedMult: 0, durationMs: 1200 },
  }],

  ['ember-slime', {
    id: 'ember-slime', name: 'Ember Slime', color: 0xff4422,
    stats: { hp: 110, attack: 18, plating: 5, damageReduction: 0, speed: 52, attackRange: 12, attackCooldown: 2300, pullRange: 210 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 20, essenceType: 'red', level: 1, biomeXp: 58 },
    ai: { wanderRadius: 220, leashRange: 600, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  ['magma-golem', {
    id: 'magma-golem', name: 'Magma Golem', color: 0xcc2200,
    stats: { hp: 260, attack: 24, plating: 12, damageReduction: 0, speed: 18, attackRange: 15, attackCooldown: 3800, pullRange: 150 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 28, essenceType: 'red', level: 1, biomeXp: 80 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9500 },
  }],

  // ── Master merge additions ─────────────────────────────────────────────

  ['canopy-sprite', {
    id: 'canopy-sprite', name: 'Canopy Sprite', color: 0x88ff44,
    // Hurls thorn volleys from the treetops; long range but lightly armored
    stats: { hp: 150, attack: 23, plating: 0, damageReduction: 0.05, speed: 48, attackRange: 190, attackCooldown: 2800, pullRange: 250 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'forest',
    rewards: { essence: 17, essenceType: 'green', level: 1, biomeXp: 50 },
    ai: { wanderRadius: 240, leashRange: 650, idleMinMs: 1200, idleMaxMs: 3500 },
  }],

  ['peak-archer', {
    id: 'peak-archer', name: 'Peak Archer', color: 0xaabbcc,
    // Hurls boulders from extreme range; slow but devastating if you stand still
    stats: { hp: 280, attack: 30, plating: 0, damageReduction: 0.05, speed: 28, attackRange: 240, attackCooldown: 3500, pullRange: 265 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'mountain',
    rewards: { essence: 26, essenceType: 'blue', level: 1, biomeXp: 75 },
    ai: { wanderRadius: 200, leashRange: 600, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  ['savanna-hawk', {
    id: 'savanna-hawk', name: 'Savanna Hawk', color: 0xddcc66,
    // Aerial predator; swoops from distance and retreats — the ranged threat of the plains
    stats: { hp: 90, attack: 22, plating: 0, damageReduction: 0, speed: 50, attackRange: 165, attackCooldown: 2600, pullRange: 245 },
    behavior: 'melee', attackStyle: 'slash', isRanged: true, biome: 'plains',
    rewards: { essence: 13, essenceType: 'yellow', level: 1, biomeXp: 38 },
    ai: { wanderRadius: 280, leashRange: 680, idleMinMs: 1000, idleMaxMs: 3200 },
  }],

  ['mire-stalker', {
    id: 'mire-stalker', name: 'Mire Stalker', color: 0x445533,
    // Ambush predator; heavy DR + occasional dodge makes it surprisingly hard to put down
    stats: { hp: 295, attack: 20, plating: 0, damageReduction: 0.18, speed: 30, attackRange: 12, attackCooldown: 2800, pullRange: 155 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 26, essenceType: 'purple', level: 1, biomeXp: 75 },
    ai: { wanderRadius: 170, leashRange: 540, idleMinMs: 2000, idleMaxMs: 6000 },
    evadeEvery: 5,
  }],

  ['cave-gargoyle', {
    id: 'cave-gargoyle', name: 'Cave Gargoyle', color: 0x554455,
    // Perches in darkness and hurls stalactites — the only ranged threat in the caverns
    stats: { hp: 430, attack: 30, plating: 0, damageReduction: 0.10, speed: 22, attackRange: 200, attackCooldown: 3200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'cave',
    rewards: { essence: 35, essenceType: 'red', level: 1, biomeXp: 100 },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 2500, idleMaxMs: 7000 },
  }],
] satisfies [string, MonsterDefinition][];
