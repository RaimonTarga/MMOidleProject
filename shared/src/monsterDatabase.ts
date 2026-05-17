import type { EssenceType } from './items';

export interface MonsterDefinition {
  id: string;
  name: string;
  /** Phaser hex color for the placeholder rectangle sprite. */
  color: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    attackRange: number;
    attackCooldown: number;
    pullRange: number;
  };
  /** Combat style — only 'melee' exists; extend union for ranged/caster/etc. */
  behavior: 'melee';
  /** Biome group this monster belongs to — must match a BiomeDefinition id. */
  biome: string;
  rewards: { essence: number; essenceType: EssenceType; level: number };
  ai: {
    wanderRadius: number;
    leashRange: number;
    idleMinMs: number;
    idleMaxMs: number;
  };
}

export const MONSTER_DATABASE: Map<string, MonsterDefinition> = new Map([

  // ── Clearing (ring 0, tier 0 — tutorial zone) ──────────────────────────────
  ['tiny-slime', {
    id: 'tiny-slime', name: 'Tiny Slime', color: 0x99ff99,
    stats: { hp: 20, attack: 3, defense: 0, speed: 30, attackRange: 50, attackCooldown: 3000, pullRange: 140 },
    behavior: 'melee', biome: 'clearing',
    rewards: { essence: 2, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 140, leashRange: 380, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  // ── Forest (ring 1, tier 1) ────────────────────────────────────────────────
  ['forest-slime', {
    id: 'forest-slime', name: 'Forest Slime', color: 0x55ff55,
    stats: { hp: 50, attack: 8, defense: 1, speed: 40, attackRange: 60, attackCooldown: 2500, pullRange: 200 },
    behavior: 'melee', biome: 'forest',
    rewards: { essence: 5, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 220, leashRange: 600, idleMinMs: 1500, idleMaxMs: 4500 },
  }],
  ['wolf', {
    id: 'wolf', name: 'Wolf', color: 0xaaaacc,
    // Fast with high pull range — punishes standing still
    stats: { hp: 40, attack: 12, defense: 1, speed: 70, attackRange: 60, attackCooldown: 1800, pullRange: 250 },
    behavior: 'melee', biome: 'forest',
    rewards: { essence: 8, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 280, leashRange: 700, idleMinMs: 800, idleMaxMs: 3000 },
  }],

  // ── Forest (ring 2, tier 2) ────────────────────────────────────────────────
  ['ancient-wolf', {
    id: 'ancient-wolf', name: 'Ancient Wolf', color: 0x8888ff,
    stats: { hp: 75, attack: 18, defense: 3, speed: 85, attackRange: 60, attackCooldown: 1600, pullRange: 270 },
    behavior: 'melee', biome: 'forest',
    rewards: { essence: 15, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 300, leashRange: 750, idleMinMs: 600, idleMaxMs: 2500 },
  }],
  ['ironwood-golem', {
    id: 'ironwood-golem', name: 'Ironwood Golem', color: 0x556633,
    // Extremely tanky; punishes low defense
    stats: { hp: 200, attack: 15, defense: 12, speed: 18, attackRange: 60, attackCooldown: 3500, pullRange: 150 },
    behavior: 'melee', biome: 'forest',
    rewards: { essence: 20, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 120, leashRange: 480, idleMinMs: 3000, idleMaxMs: 8000 },
  }],

  // ── Mountain (ring 1, tier 1) ──────────────────────────────────────────────
  ['stone-slime', {
    id: 'stone-slime', name: 'Stone Slime', color: 0x8899aa,
    stats: { hp: 80, attack: 6, defense: 4, speed: 25, attackRange: 60, attackCooldown: 3000, pullRange: 160 },
    behavior: 'melee', biome: 'mountain',
    rewards: { essence: 7, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 160, leashRange: 500, idleMinMs: 2000, idleMaxMs: 6000 },
  }],
  ['rock-beetle', {
    id: 'rock-beetle', name: 'Rock Beetle', color: 0x556677,
    stats: { hp: 100, attack: 8, defense: 6, speed: 20, attackRange: 60, attackCooldown: 3200, pullRange: 140 },
    behavior: 'melee', biome: 'mountain',
    rewards: { essence: 10, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 130, leashRange: 450, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  // ── Mountain (ring 2, tier 2) ──────────────────────────────────────────────
  ['granite-titan', {
    id: 'granite-titan', name: 'Granite Titan', color: 0x99aabb,
    stats: { hp: 220, attack: 14, defense: 12, speed: 15, attackRange: 65, attackCooldown: 3800, pullRange: 150 },
    behavior: 'melee', biome: 'mountain',
    rewards: { essence: 22, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9000 },
  }],
  ['stone-eagle', {
    id: 'stone-eagle', name: 'Stone Eagle', color: 0xccdde8,
    // Fast aerial attacker; low defense
    stats: { hp: 65, attack: 22, defense: 2, speed: 92, attackRange: 60, attackCooldown: 1500, pullRange: 280 },
    behavior: 'melee', biome: 'mountain',
    rewards: { essence: 18, essenceType: 'purple', level: 1 },
    ai: { wanderRadius: 320, leashRange: 800, idleMinMs: 500, idleMaxMs: 2000 },
  }],

  // ── Plains (ring 1, tier 1) ────────────────────────────────────────────────
  ['plains-slime', {
    id: 'plains-slime', name: 'Plains Slime', color: 0xddee55,
    stats: { hp: 45, attack: 9, defense: 1, speed: 45, attackRange: 60, attackCooldown: 2300, pullRange: 210 },
    behavior: 'melee', biome: 'plains',
    rewards: { essence: 5, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 240, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4000 },
  }],
  ['boar', {
    id: 'boar', name: 'Boar', color: 0xcc8844,
    stats: { hp: 60, attack: 16, defense: 2, speed: 50, attackRange: 60, attackCooldown: 2000, pullRange: 220 },
    behavior: 'melee', biome: 'plains',
    rewards: { essence: 9, essenceType: 'red', level: 1 },
    ai: { wanderRadius: 250, leashRange: 650, idleMinMs: 1000, idleMaxMs: 3500 },
  }],

  // ── Plains (ring 2, tier 2) ────────────────────────────────────────────────
  ['stampede-bull', {
    id: 'stampede-bull', name: 'Stampede Bull', color: 0xdd5500,
    // Charges fast; devastating attack
    stats: { hp: 110, attack: 24, defense: 4, speed: 65, attackRange: 60, attackCooldown: 1900, pullRange: 230 },
    behavior: 'melee', biome: 'plains',
    rewards: { essence: 18, essenceType: 'red', level: 1 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3000 },
  }],
  ['prairie-wolf', {
    id: 'prairie-wolf', name: 'Prairie Wolf', color: 0xddaa55,
    stats: { hp: 80, attack: 18, defense: 2, speed: 78, attackRange: 60, attackCooldown: 1700, pullRange: 260 },
    behavior: 'melee', biome: 'plains',
    rewards: { essence: 15, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
  }],

  // ── Swamp (ring 1, tier 1) ─────────────────────────────────────────────────
  ['bog-slime', {
    id: 'bog-slime', name: 'Bog Slime', color: 0x558833,
    // Sluggish but persistent; tests player patience
    stats: { hp: 60, attack: 9, defense: 2, speed: 28, attackRange: 60, attackCooldown: 2800, pullRange: 170 },
    behavior: 'melee', biome: 'swamp',
    rewards: { essence: 6, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 160, leashRange: 520, idleMinMs: 2000, idleMaxMs: 5500 },
  }],
  ['mud-toad', {
    id: 'mud-toad', name: 'Mud Toad', color: 0x778844,
    stats: { hp: 70, attack: 11, defense: 3, speed: 35, attackRange: 60, attackCooldown: 2600, pullRange: 180 },
    behavior: 'melee', biome: 'swamp',
    rewards: { essence: 8, essenceType: 'purple', level: 1 },
    ai: { wanderRadius: 180, leashRange: 540, idleMinMs: 1800, idleMaxMs: 5000 },
  }],

  // ── Swamp (ring 2, tier 2) ─────────────────────────────────────────────────
  ['swamp-hydra', {
    id: 'swamp-hydra', name: 'Swamp Hydra', color: 0x335533,
    stats: { hp: 180, attack: 16, defense: 6, speed: 32, attackRange: 65, attackCooldown: 2500, pullRange: 190 },
    behavior: 'melee', biome: 'swamp',
    rewards: { essence: 20, essenceType: 'purple', level: 1 },
    ai: { wanderRadius: 170, leashRange: 560, idleMinMs: 2500, idleMaxMs: 7000 },
  }],
  ['bog-witch', {
    id: 'bog-witch', name: 'Bog Witch', color: 0x884499,
    // High damage caster-feel; paper thin defense
    stats: { hp: 85, attack: 22, defense: 2, speed: 42, attackRange: 60, attackCooldown: 2200, pullRange: 200 },
    behavior: 'melee', biome: 'swamp',
    rewards: { essence: 18, essenceType: 'purple', level: 1 },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  // ── Cave (ring 1, tier 1) ──────────────────────────────────────────────────
  ['cave-bat', {
    id: 'cave-bat', name: 'Cave Bat', color: 0x8855aa,
    // Extremely fast; fragile; rewards kiting
    stats: { hp: 30, attack: 10, defense: 0, speed: 88, attackRange: 55, attackCooldown: 1600, pullRange: 190 },
    behavior: 'melee', biome: 'cave',
    rewards: { essence: 5, essenceType: 'purple', level: 1 },
    ai: { wanderRadius: 300, leashRange: 720, idleMinMs: 600, idleMaxMs: 2500 },
  }],
  ['cave-spider', {
    id: 'cave-spider', name: 'Cave Spider', color: 0x553355,
    stats: { hp: 55, attack: 12, defense: 1, speed: 58, attackRange: 60, attackCooldown: 2100, pullRange: 200 },
    behavior: 'melee', biome: 'cave',
    rewards: { essence: 7, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 250, leashRange: 650, idleMinMs: 1000, idleMaxMs: 3800 },
  }],

  // ── Cave (ring 2, tier 2) ──────────────────────────────────────────────────
  ['giant-spider', {
    id: 'giant-spider', name: 'Giant Spider', color: 0x992266,
    stats: { hp: 130, attack: 20, defense: 5, speed: 65, attackRange: 62, attackCooldown: 2000, pullRange: 220 },
    behavior: 'melee', biome: 'cave',
    rewards: { essence: 18, essenceType: 'purple', level: 1 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3200 },
  }],
  ['cave-troll', {
    id: 'cave-troll', name: 'Cave Troll', color: 0x334433,
    stats: { hp: 220, attack: 18, defense: 9, speed: 22, attackRange: 65, attackCooldown: 3600, pullRange: 155 },
    behavior: 'melee', biome: 'cave',
    rewards: { essence: 22, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 130, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
  }],

  // ── Jungle (ring 1, tier 1) ────────────────────────────────────────────────
  ['jungle-snake', {
    id: 'jungle-snake', name: 'Jungle Snake', color: 0x33cc44,
    stats: { hp: 48, attack: 13, defense: 1, speed: 62, attackRange: 60, attackCooldown: 2100, pullRange: 210 },
    behavior: 'melee', biome: 'jungle',
    rewards: { essence: 7, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
  }],
  ['jungle-ape', {
    id: 'jungle-ape', name: 'Jungle Ape', color: 0xaa6633,
    stats: { hp: 72, attack: 14, defense: 2, speed: 52, attackRange: 60, attackCooldown: 2200, pullRange: 220 },
    behavior: 'melee', biome: 'jungle',
    rewards: { essence: 9, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  // ── Jungle (ring 2, tier 2) ────────────────────────────────────────────────
  ['anaconda', {
    id: 'anaconda', name: 'Anaconda', color: 0x118833,
    stats: { hp: 160, attack: 20, defense: 5, speed: 50, attackRange: 62, attackCooldown: 2400, pullRange: 210 },
    behavior: 'melee', biome: 'jungle',
    rewards: { essence: 20, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 230, leashRange: 620, idleMinMs: 1500, idleMaxMs: 5000 },
  }],
  ['jungle-titan', {
    id: 'jungle-titan', name: 'Jungle Titan', color: 0x885522,
    stats: { hp: 130, attack: 25, defense: 6, speed: 58, attackRange: 62, attackCooldown: 2000, pullRange: 230 },
    behavior: 'melee', biome: 'jungle',
    rewards: { essence: 22, essenceType: 'red', level: 1 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
  }],

  // ── Tundra (ring 2 only, tier 2) ──────────────────────────────────────────
  ['frost-slime', {
    id: 'frost-slime', name: 'Frost Slime', color: 0xaaddff,
    stats: { hp: 100, attack: 14, defense: 6, speed: 28, attackRange: 60, attackCooldown: 2800, pullRange: 170 },
    behavior: 'melee', biome: 'tundra',
    rewards: { essence: 18, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 150, leashRange: 510, idleMinMs: 2500, idleMaxMs: 7000 },
  }],
  ['ice-bear', {
    id: 'ice-bear', name: 'Ice Bear', color: 0xddeeff,
    stats: { hp: 240, attack: 22, defense: 10, speed: 38, attackRange: 65, attackCooldown: 3200, pullRange: 200 },
    behavior: 'melee', biome: 'tundra',
    rewards: { essence: 25, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 6500 },
  }],

  // ── Desert (ring 2 only, tier 2) ──────────────────────────────────────────
  ['sand-scorpion', {
    id: 'sand-scorpion', name: 'Sand Scorpion', color: 0xddbb44,
    // Fast and hits hard; low defense
    stats: { hp: 90, attack: 22, defense: 4, speed: 72, attackRange: 60, attackCooldown: 2000, pullRange: 230 },
    behavior: 'melee', biome: 'desert',
    rewards: { essence: 18, essenceType: 'yellow', level: 1 },
    ai: { wanderRadius: 280, leashRange: 700, idleMinMs: 900, idleMaxMs: 3500 },
  }],
  ['stone-basilisk', {
    id: 'stone-basilisk', name: 'Stone Basilisk', color: 0xaa8833,
    stats: { hp: 180, attack: 18, defense: 9, speed: 32, attackRange: 62, attackCooldown: 3000, pullRange: 175 },
    behavior: 'melee', biome: 'desert',
    rewards: { essence: 22, essenceType: 'red', level: 1 },
    ai: { wanderRadius: 155, leashRange: 520, idleMinMs: 2200, idleMaxMs: 7000 },
  }],

  // ── Volcanic (ring 2 only, tier 2) ────────────────────────────────────────
  ['ember-slime', {
    id: 'ember-slime', name: 'Ember Slime', color: 0xff4422,
    stats: { hp: 110, attack: 18, defense: 5, speed: 52, attackRange: 60, attackCooldown: 2300, pullRange: 210 },
    behavior: 'melee', biome: 'volcanic',
    rewards: { essence: 20, essenceType: 'red', level: 1 },
    ai: { wanderRadius: 220, leashRange: 600, idleMinMs: 1200, idleMaxMs: 4000 },
  }],
  ['magma-golem', {
    id: 'magma-golem', name: 'Magma Golem', color: 0xcc2200,
    // Hardest monster in the game — ultimate tank
    stats: { hp: 260, attack: 24, defense: 12, speed: 18, attackRange: 65, attackCooldown: 3800, pullRange: 150 },
    behavior: 'melee', biome: 'volcanic',
    rewards: { essence: 28, essenceType: 'red', level: 1 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9500 },
  }],
]);
