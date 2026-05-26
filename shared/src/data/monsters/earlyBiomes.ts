import type { MonsterDefinition } from './types';

export const earlyBiomeMonsterEntries = [
  // ── Forest T1 ──────────────────────────────────────────────────────────────
  // Threat profile: fast attacking, sustained damage, average HP, LOW defense.
  // Easy to burst down once you can hit fast enough.
  ['forest-slime', {
    id: 'forest-slime', name: 'Forest Slime', color: 0x55ff55,
    // Soft and squishy — dies fast but attacks quickly
    stats: { hp: 65, attack: 10, plating: 0, damageReduction: 0, speed: 52, attackRange: 60, attackCooldown: 1800, pullRange: 210 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 5, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 230, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4000 },
  }],
  ['wolf', {
    id: 'wolf', name: 'Wolf', color: 0xaaaacc,
    // High speed, high pull range — closes distance fast; zero armor, easy to burst
    stats: { hp: 55, attack: 12, plating: 0, damageReduction: 0, speed: 78, attackRange: 60, attackCooldown: 1400, pullRange: 255 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 7, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
  }],

  // ── Forest T2 ──────────────────────────────────────────────────────────────
  ['ancient-wolf', {
    id: 'ancient-wolf', name: 'Ancient Wolf', color: 0x8888ff,
    stats: { hp: 75, attack: 18, plating: 3, damageReduction: 0, speed: 85, attackRange: 60, attackCooldown: 1600, pullRange: 270 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 15, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 300, leashRange: 750, idleMinMs: 600, idleMaxMs: 2500 },
  }],
  ['ironwood-golem', {
    id: 'ironwood-golem', name: 'Ironwood Golem', color: 0x556633,
    // Extremely tanky; punishes low defense
    stats: { hp: 200, attack: 15, plating: 12, damageReduction: 0, speed: 18, attackRange: 60, attackCooldown: 3500, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 20, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 120, leashRange: 480, idleMinMs: 3000, idleMaxMs: 8000 },
  }],

  // ── Mountain T1 ────────────────────────────────────────────────────────────
  // Two distinct sub-types:
  //   Cliff Hopper — fast skirmisher, high spotting range, zero defense
  //   Ridge Archer — pseudo-ranged (long attackRange), average stats, zero defense
  ['cliff-hopper', {
    id: 'cliff-hopper', name: 'Cliff Hopper', color: 0x99aacc,
    // Sprint-attacks from far away; dies in a few hits
    stats: { hp: 60, attack: 12, plating: 0, damageReduction: 0, speed: 80, attackRange: 60, attackCooldown: 1500, pullRange: 275 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 6, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 310, leashRange: 720, idleMinMs: 600, idleMaxMs: 2500 },
  }],
  ['ridge-archer', {
    id: 'ridge-archer', name: 'Ridge Archer', color: 0x778899,
    // Longer attack range simulates a thrown-rock / sling attack; average stats overall
    stats: { hp: 85, attack: 13, plating: 0, damageReduction: 0, speed: 35, attackRange: 130, attackCooldown: 2800, pullRange: 230 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 9, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 210, leashRange: 600, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  // ── Mountain T2 ────────────────────────────────────────────────────────────
  ['granite-titan', {
    id: 'granite-titan', name: 'Granite Titan', color: 0x99aabb,
    stats: { hp: 220, attack: 14, plating: 12, damageReduction: 0, speed: 15, attackRange: 65, attackCooldown: 3800, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 22, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9000 },
  }],
  ['stone-eagle', {
    id: 'stone-eagle', name: 'Stone Eagle', color: 0xccdde8,
    // Fast aerial attacker; low defense
    stats: { hp: 65, attack: 22, plating: 2, damageReduction: 0, speed: 92, attackRange: 60, attackCooldown: 1500, pullRange: 280 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 18, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 320, leashRange: 800, idleMinMs: 500, idleMaxMs: 2000 },
  }],

  // ── Plains T1 ──────────────────────────────────────────────────────────────
  // Threat profile: balanced, no specialization — the tutorial of T1 biomes.
  // Average stats across the board; no surprises.
  ['plains-slime', {
    id: 'plains-slime', name: 'Plains Slime', color: 0xddee55,
    stats: { hp: 90, attack: 11, plating: 0, damageReduction: 0, speed: 42, attackRange: 60, attackCooldown: 2200, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 5, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 250, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
  }],
  ['boar', {
    id: 'boar', name: 'Boar', color: 0xcc8844,
    stats: { hp: 115, attack: 14, plating: 0, damageReduction: 0, speed: 48, attackRange: 60, attackCooldown: 2000, pullRange: 205 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 8, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
  }],

  // ── Plains T2 ──────────────────────────────────────────────────────────────
  ['stampede-bull', {
    id: 'stampede-bull', name: 'Stampede Bull', color: 0xdd5500,
    // Charges fast; devastating attack
    stats: { hp: 110, attack: 24, plating: 4, damageReduction: 0, speed: 65, attackRange: 60, attackCooldown: 1900, pullRange: 230 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 18, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3000 },
  }],
  ['prairie-wolf', {
    id: 'prairie-wolf', name: 'Prairie Wolf', color: 0xddaa55,
    stats: { hp: 80, attack: 18, plating: 2, damageReduction: 0, speed: 78, attackRange: 60, attackCooldown: 1700, pullRange: 260 },
    behavior: 'melee', attackStyle: 'slash', biome: 'plains',
    rewards: { essence: 15, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
  }],

  // ── Swamp T1 ───────────────────────────────────────────────────────────────
  // Threat profile: attrition — slow, above-average defense, poison/DoT style.
  // Damage output ramps over time; requires recovery investment to outlast.
  ['bog-slime', {
    id: 'bog-slime', name: 'Bog Slime', color: 0x558833,
    // Sluggish and toxic; tests player patience with sustained drip damage
    stats: { hp: 80, attack: 10, plating: 2, damageReduction: 0, speed: 28, attackRange: 60, attackCooldown: 2800, pullRange: 165 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 7, essenceType: 'purple', level: 1 },
    ai: { wanderRadius: 160, leashRange: 530, idleMinMs: 2000, idleMaxMs: 5500 },
    dotEffect: { damagePerStack: 2, maxStacks: 3, tickIntervalMs: 1000 },
  }],
  ['mud-toad', {
    id: 'mud-toad', name: 'Mud Toad', color: 0x778844,
    // Sturdier than it looks; small DR makes burst less effective
    stats: { hp: 95, attack: 12, plating: 2, damageReduction: 0.04, speed: 30, attackRange: 60, attackCooldown: 2600, pullRange: 180 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 8, essenceType: 'purple', level: 1 },
    ai: { wanderRadius: 180, leashRange: 550, idleMinMs: 1800, idleMaxMs: 5000 },
    dotEffect: { damagePerStack: 3, maxStacks: 3, tickIntervalMs: 1000 },
  }],

  // ── Swamp T2 ───────────────────────────────────────────────────────────────
  ['swamp-hydra', {
    id: 'swamp-hydra', name: 'Swamp Hydra', color: 0x335533,
    stats: { hp: 180, attack: 16, plating: 6, damageReduction: 0, speed: 32, attackRange: 65, attackCooldown: 2500, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'swamp',
    rewards: { essence: 20, essenceType: 'purple', level: 1 },
    ai: { wanderRadius: 170, leashRange: 560, idleMinMs: 2500, idleMaxMs: 7000 },
  }],
  ['bog-witch', {
    id: 'bog-witch', name: 'Bog Witch', color: 0x884499,
    // High damage caster-feel; paper thin defense
    stats: { hp: 85, attack: 22, plating: 2, damageReduction: 0, speed: 42, attackRange: 60, attackCooldown: 2200, pullRange: 200 },
    behavior: 'melee', attackStyle: 'magic', biome: 'swamp',
    rewards: { essence: 18, essenceType: 'purple', level: 1 },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  // ── Cave T1 ────────────────────────────────────────────────────────────────
  // Threat profile: high defense, hard and slow hits — damage spikiness.
  // Plating eats into player ATK; hardest T1 biome for low-ATK builds.
  // Low pull range simulates ambush predator lurking in shadows.
  ['cave-lurker', {
    id: 'cave-lurker', name: 'Cave Lurker', color: 0x664466,
    // Solid plating, slow but hits hard — plating is the core challenge here
    stats: { hp: 100, attack: 16, plating: 4, damageReduction: 0, speed: 22, attackRange: 60, attackCooldown: 3200, pullRange: 145 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 9, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 2500, idleMaxMs: 7000 },
  }],
  ['cave-brute', {
    id: 'cave-brute', name: 'Cave Brute', color: 0x443344,
    // Even slower, even thicker; each swing deals serious damage if it lands
    stats: { hp: 130, attack: 19, plating: 5, damageReduction: 0, speed: 17, attackRange: 60, attackCooldown: 3600, pullRange: 125 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 12, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 110, leashRange: 430, idleMinMs: 3000, idleMaxMs: 8000 },
  }],

  // ── Cave T2 ────────────────────────────────────────────────────────────────
  ['giant-spider', {
    id: 'giant-spider', name: 'Giant Spider', color: 0x992266,
    stats: { hp: 130, attack: 20, plating: 5, damageReduction: 0, speed: 65, attackRange: 62, attackCooldown: 2000, pullRange: 220 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave',
    rewards: { essence: 18, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3200 },
  }],
  ['cave-troll', {
    id: 'cave-troll', name: 'Cave Troll', color: 0x334433,
    stats: { hp: 220, attack: 18, plating: 9, damageReduction: 0, speed: 22, attackRange: 65, attackCooldown: 3600, pullRange: 155 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 22, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 130, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
  }],

  // ── Jungle T2 (first appearance) ───────────────────────────────────────────
  ['jungle-snake', {
    id: 'jungle-snake', name: 'Jungle Snake', color: 0x33cc44,
    stats: { hp: 48, attack: 13, plating: 1, damageReduction: 0, speed: 62, attackRange: 60, attackCooldown: 2100, pullRange: 210 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 7, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
  }],
  ['jungle-ape', {
    id: 'jungle-ape', name: 'Jungle Ape', color: 0xaa6633,
    stats: { hp: 72, attack: 14, plating: 2, damageReduction: 0, speed: 52, attackRange: 60, attackCooldown: 2200, pullRange: 220 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle',
    rewards: { essence: 9, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  // ── Tundra T2 ──────────────────────────────────────────────────────────────
  ['frost-slime', {
    id: 'frost-slime', name: 'Frost Slime', color: 0xaaddff,
    stats: { hp: 100, attack: 14, plating: 6, damageReduction: 0, speed: 28, attackRange: 60, attackCooldown: 2800, pullRange: 170 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 18, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 150, leashRange: 510, idleMinMs: 2500, idleMaxMs: 7000 },
  }],
  ['ice-bear', {
    id: 'ice-bear', name: 'Ice Bear', color: 0xddeeff,
    stats: { hp: 240, attack: 22, plating: 10, damageReduction: 0, speed: 38, attackRange: 65, attackCooldown: 3200, pullRange: 200 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 25, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 6500 },
  }],

  // ── Desert T2 ──────────────────────────────────────────────────────────────
  ['sand-scorpion', {
    id: 'sand-scorpion', name: 'Sand Scorpion', color: 0xddbb44,
    // Fast and hits hard; low defense
    stats: { hp: 90, attack: 22, plating: 4, damageReduction: 0, speed: 72, attackRange: 60, attackCooldown: 2000, pullRange: 230 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 18, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 280, leashRange: 700, idleMinMs: 900, idleMaxMs: 3500 },
  }],
  ['stone-basilisk', {
    id: 'stone-basilisk', name: 'Stone Basilisk', color: 0xaa8833,
    stats: { hp: 180, attack: 18, plating: 9, damageReduction: 0, speed: 32, attackRange: 62, attackCooldown: 3000, pullRange: 175 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 22, essenceType: 'red', level: 1 },
    ai: { wanderRadius: 155, leashRange: 520, idleMinMs: 2200, idleMaxMs: 7000 },
  }],

  // ── Volcanic T3 ────────────────────────────────────────────────────────────
  ['ember-slime', {
    id: 'ember-slime', name: 'Ember Slime', color: 0xff4422,
    stats: { hp: 110, attack: 18, plating: 5, damageReduction: 0, speed: 52, attackRange: 60, attackCooldown: 2300, pullRange: 210 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 20, essenceType: 'red', level: 1 },
    ai: { wanderRadius: 220, leashRange: 600, idleMinMs: 1200, idleMaxMs: 4000 },
  }],
  ['magma-golem', {
    id: 'magma-golem', name: 'Magma Golem', color: 0xcc2200,
    stats: { hp: 260, attack: 24, plating: 12, damageReduction: 0, speed: 18, attackRange: 65, attackCooldown: 3800, pullRange: 150 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 28, essenceType: 'red', level: 1 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9500 },
  }],
] satisfies [string, MonsterDefinition][];
