import type { EssenceType } from './items';

// ── Boss script types ─────────────────────────────────────────────────────────

/**
 * All actions a boss can take, as a discriminated union.
 *
 *   enrage    — multiply attack and accelerate attack cooldown for durationMs (or rest-of-fight).
 *   regen     — restore hpPctPerSec × maxHp HP per second for durationMs (or rest-of-fight).
 *   shield    — add drAdd to damageReduction for durationMs (cyclic, always timed).
 *   summon    — spawn `count` minions of monsterTypeId near the boss.
 *   stat-buff — multiply a single stat for durationMs (or rest-of-fight).
 *
 * Omitting durationMs (or undefined) means the effect lasts until the boss dies.
 */
export type BossAction =
  | { type: 'enrage';    atkMult: number; cdMult: number;     durationMs?: number }
  | { type: 'regen';     hpPctPerSec: number;                 durationMs?: number }
  | { type: 'shield';    drAdd: number;   durationMs: number }
  | { type: 'summon';    monsterTypeId: string; count: number; offsetRange?: number }
  | { type: 'stat-buff'; stat: 'attack' | 'speed' | 'plating' | 'damageReduction'; mult: number; durationMs?: number };

/**
 * HP-threshold phase — fires once per fight when boss HP% drops below hpPct.
 * Define phases from highest hpPct to lowest for readable scripts.
 */
export interface BossPhase {
  /** 0.0–1.0 fraction of maxHp below which this phase fires. */
  hpPct: number;
  actions: BossAction[];
}

/**
 * Periodic action that fires on a fixed interval while the boss is engaged.
 * Timers start counting from first aggro.
 */
export interface RepeatingAction {
  intervalMs: number;
  /** Delay before the first fire. Defaults to intervalMs when omitted. */
  initialDelayMs?: number;
  actions: BossAction[];
}

/**
 * Full fight script for a boss monster.
 * Attach to MonsterDefinition.bossScript to opt in.
 *
 *   phases    — one-shot HP-threshold triggers, each fires at most once per life.
 *   repeating — periodic timers, run for the duration of the fight once engaged.
 */
export interface BossScript {
  phases?: BossPhase[];
  repeating?: RepeatingAction[];
}

// ── Monster definition ────────────────────────────────────────────────────────

export interface MonsterDefinition {
  id: string;
  name: string;
  /** Phaser hex color for the placeholder rectangle sprite. */
  color: number;
  stats: {
    hp: number;
    attack: number;
    plating: number;
    damageReduction: number;
    speed: number;
    attackRange: number;
    attackCooldown: number;
    pullRange: number;
  };
  /** Combat style — only 'melee' exists; extend union for ranged/caster/etc. */
  behavior: 'melee';
  /** Visual style for attack animations: 'slash' | 'impact' | 'poison' | 'magic' */
  attackStyle: string;
  /** Biome group this monster belongs to — must match a BiomeDefinition id. */
  biome: string;
  rewards: { essence: number; essenceType: EssenceType; level: number; biomeXp?: number };
  ai: {
    wanderRadius: number;
    leashRange: number;
    idleMinMs: number;
    idleMaxMs: number;
  };
  /** True for dungeon boss monsters — affects spawn logic and client visuals. */
  isBoss?: boolean;
  /** Fight script — opt-in boss mechanics (phases, regen, enrage, summons, etc.). */
  bossScript?: BossScript;
  /**
   * If set, the monster bursts at speedMult × base speed for durationMs when it
   * first acquires an aggro target (both pull-range and retaliation aggro).
   * The charge overrides the kite ramp for its duration; kite timer accumulates
   * normally afterward.
   */
  chargeOnAggro?: { speedMult: number; durationMs: number };
  /** Dev test-room target behavior. These monsters are interacted with by standing in attack range. */
  interactKind?: 'reset' | 'gainPoint';
  /**
   * If set, this monster applies a DoT effect on every hit.
   * damagePerStack: damage dealt per stack per tick.
   * maxStacks: maximum stacks that can be on the target simultaneously.
   * tickIntervalMs: time between DoT ticks in milliseconds.
   */
  dotEffect?: {
    damagePerStack: number;
    maxStacks: number;
    tickIntervalMs: number;
    durationMs?: number;
  };
  /**
   * If set, this monster applies a movement slow (or root when speedMult = 0) to
   * the player on every successful hit. The effect is refreshed on each hit.
   * speedMult: 0 = root (full stop), 0 < speedMult < 1 = partial slow.
   */
  slowEffect?: { speedMult: number; durationMs: number };
  /**
   * Deterministic evasion: this monster dodges every Nth incoming hit from players.
   * The counter is tracked server-side in monsterCombatState and persists for the
   * monster's entire lifetime. Max 1-in-5 (minimum evadeEvery = 5).
   */
  evadeEvery?: number;
}

export const MONSTER_DATABASE: Map<string, MonsterDefinition> = new Map([

  // ── Clearing (ring 0, tier 0 — tutorial zone) ──────────────────────────────
  ['tiny-slime', {
    id: 'tiny-slime', name: 'Tiny Slime', color: 0x99ff99,
    stats: { hp: 22, attack: 3, plating: 0, damageReduction: 0, speed: 30, attackRange: 50, attackCooldown: 3000, pullRange: 140 },
    behavior: 'melee', attackStyle: 'impact', biome: 'clearing',
    rewards: { essence: 2, essenceType: 'green', level: 1, biomeXp: 43 },
    ai: { wanderRadius: 140, leashRange: 380, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  // ── Dev test room targets ─────────────────────────────────────────────────
  ['test-target-reset', {
    id: 'test-target-reset', name: 'Reset', color: 0xff5555,
    stats: { hp: 9_999_999, attack: 0, plating: 0, damageReduction: 1, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'red', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
    interactKind: 'reset',
  }],
  ['test-target-gain-point', {
    id: 'test-target-gain-point', name: 'Gain Point', color: 0x55aaff,
    stats: { hp: 9_999_999, attack: 0, plating: 0, damageReduction: 1, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'magic', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'blue', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
    interactKind: 'gainPoint',
  }],

  // ── Dev training dummies ──────────────────────────────────────────────────
  // Stationary, non-attacking targets used to test animations, range, and
  // damage numbers against representative HP pools for each enemy tier.
  // HP values are the median boss HP for each tier (T0 uses tiny-slime).
  // attackRange/pullRange/speed are 0 so they never aggro, move, or retaliate.
  ['training-dummy-t0', {
    id: 'training-dummy-t0', name: 'Training Dummy T0', color: 0xb0b0b0,
    stats: { hp: 22, attack: 0, plating: 0, damageReduction: 0, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'green', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
  }],
  ['training-dummy-t1', {
    id: 'training-dummy-t1', name: 'Training Dummy T1', color: 0xa8a8a8,
    stats: { hp: 500, attack: 0, plating: 0, damageReduction: 0, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'green', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
  }],
  ['training-dummy-t2', {
    id: 'training-dummy-t2', name: 'Training Dummy T2', color: 0x909090,
    stats: { hp: 2200, attack: 0, plating: 0, damageReduction: 0, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'green', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
  }],
  ['training-dummy-t3', {
    id: 'training-dummy-t3', name: 'Training Dummy T3', color: 0x787878,
    stats: { hp: 4200, attack: 0, plating: 0, damageReduction: 0, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'green', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
  }],
  ['training-dummy-t4', {
    id: 'training-dummy-t4', name: 'Training Dummy T4', color: 0x606060,
    stats: { hp: 7500, attack: 0, plating: 0, damageReduction: 0, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'green', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
  }],

  // ── Forest T1 ──────────────────────────────────────────────────────────────
  // Threat profile: fast attacking, sustained damage, average HP, LOW defense.
  // Easy to burst down once you can hit fast enough.
  ['forest-slime', {
    id: 'forest-slime', name: 'Forest Slime', color: 0x55ff55,
    // Soft and squishy — dies fast but attacks quickly
    stats: { hp: 70, attack: 10, plating: 0, damageReduction: 0, speed: 52, attackRange: 60, attackCooldown: 1800, pullRange: 210 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 5, essenceType: 'green', level: 1, biomeXp: 18 },
    ai: { wanderRadius: 230, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4000 },
  }],
  ['wolf', {
    id: 'wolf', name: 'Wolf', color: 0xaaaacc,
    // High speed, high pull range — closes distance fast; zero armor, easy to burst
    stats: { hp: 60, attack: 12, plating: 0, damageReduction: 0, speed: 78, attackRange: 60, attackCooldown: 1400, pullRange: 255 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 7, essenceType: 'green', level: 1, biomeXp: 25 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
  }],

  // ── Forest T2 ──────────────────────────────────────────────────────────────
  ['ancient-wolf', {
    id: 'ancient-wolf', name: 'Ancient Wolf', color: 0x8888ff,
    // Explosive charger — lunges the moment it spots you, then bites fast
    stats: { hp: 195, attack: 25, plating: 0, damageReduction: 0, speed: 95, attackRange: 60, attackCooldown: 1300, pullRange: 280 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 16, essenceType: 'green', level: 1, biomeXp: 45 },
    ai: { wanderRadius: 300, leashRange: 750, idleMinMs: 600, idleMaxMs: 2500 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 1000 },
  }],
  ['ironwood-golem', {
    id: 'ironwood-golem', name: 'Ironwood Golem', color: 0x556633,
    // Bark-armored sentinel; DR replaces plating so shred doesn't trivialize it
    stats: { hp: 280, attack: 18, plating: 0, damageReduction: 0.22, speed: 16, attackRange: 65, attackCooldown: 3800, pullRange: 140 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 20, essenceType: 'green', level: 1, biomeXp: 58 },
    ai: { wanderRadius: 120, leashRange: 480, idleMinMs: 3000, idleMaxMs: 8000 },
  }],
  ['canopy-sprite', {
    id: 'canopy-sprite', name: 'Canopy Sprite', color: 0x88ff44,
    // Hurls thorn volleys from the treetops; long range but lightly armored
    stats: { hp: 150, attack: 23, plating: 0, damageReduction: 0.05, speed: 48, attackRange: 190, attackCooldown: 2800, pullRange: 250 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 17, essenceType: 'green', level: 1, biomeXp: 50 },
    ai: { wanderRadius: 240, leashRange: 650, idleMinMs: 1200, idleMaxMs: 3500 },
  }],

  // ── Mountain T1 ────────────────────────────────────────────────────────────
  // Two distinct sub-types:
  //   Cliff Hopper — fast skirmisher, high spotting range, zero defense
  //   Ridge Archer — pseudo-ranged (long attackRange), average stats, zero defense
  ['cliff-hopper', {
    id: 'cliff-hopper', name: 'Cliff Hopper', color: 0x99aacc,
    // Sprint-attacks from far away; high HP for a fast mob
    stats: { hp: 175, attack: 15, plating: 0, damageReduction: 0, speed: 80, attackRange: 60, attackCooldown: 1500, pullRange: 275 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 12, essenceType: 'blue', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 310, leashRange: 720, idleMinMs: 600, idleMaxMs: 2500 },
  }],
  ['ridge-archer', {
    id: 'ridge-archer', name: 'Ridge Archer', color: 0x778899,
    // Longer attack range simulates a thrown-rock / sling attack; high HP and punishing damage
    stats: { hp: 200, attack: 16, plating: 0, damageReduction: 0, speed: 35, attackRange: 200, attackCooldown: 2800, pullRange: 350 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 15, essenceType: 'blue', level: 1, biomeXp: 52 },
    ai: { wanderRadius: 210, leashRange: 600, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  // ── Mountain T2 ────────────────────────────────────────────────────────────
  ['granite-titan', {
    id: 'granite-titan', name: 'Granite Titan', color: 0x99aabb,
    // Pure DR tank — attrition fight; plating swapped for dense stone hide
    stats: { hp: 400, attack: 22, plating: 0, damageReduction: 0.22, speed: 16, attackRange: 65, attackCooldown: 3800, pullRange: 145 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 28, essenceType: 'blue', level: 1, biomeXp: 80 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9000 },
  }],
  ['stone-eagle', {
    id: 'stone-eagle', name: 'Stone Eagle', color: 0xccdde8,
    // Dive-bombs from full speed on aggro; no armor but hits devastatingly hard
    stats: { hp: 215, attack: 28, plating: 0, damageReduction: 0, speed: 98, attackRange: 60, attackCooldown: 1300, pullRange: 285 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 24, essenceType: 'blue', level: 1, biomeXp: 68 },
    ai: { wanderRadius: 320, leashRange: 800, idleMinMs: 500, idleMaxMs: 2000 },
    chargeOnAggro: { speedMult: 3.5, durationMs: 1000 },
  }],
  ['peak-archer', {
    id: 'peak-archer', name: 'Peak Archer', color: 0xaabbcc,
    // Hurls boulders from extreme range; slow but devastating if you stand still
    stats: { hp: 280, attack: 30, plating: 0, damageReduction: 0.05, speed: 28, attackRange: 240, attackCooldown: 3500, pullRange: 265 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 26, essenceType: 'blue', level: 1, biomeXp: 75 },
    ai: { wanderRadius: 200, leashRange: 600, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  // ── Plains T1 ──────────────────────────────────────────────────────────────
  // Threat profile: balanced, no specialization — the tutorial of T1 biomes.
  // Average stats across the board; no surprises.
  ['plains-slime', {
    id: 'plains-slime', name: 'Plains Slime', color: 0xddee55,
    stats: { hp: 55, attack: 9, plating: 0, damageReduction: 0, speed: 42, attackRange: 60, attackCooldown: 2200, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 3, essenceType: 'yellow', level: 1, biomeXp: 10 },
    ai: { wanderRadius: 250, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
  }],
  ['boar', {
    id: 'boar', name: 'Boar', color: 0xcc8844,
    stats: { hp: 75, attack: 12, plating: 0, damageReduction: 0, speed: 48, attackRange: 60, attackCooldown: 2000, pullRange: 205 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 5, essenceType: 'yellow', level: 1, biomeXp: 18 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
    chargeOnAggro: { speedMult: 3.5, durationMs: 1200 },
  }],

  // ── Plains T2 ──────────────────────────────────────────────────────────────
  ['stampede-bull', {
    id: 'stampede-bull', name: 'Stampede Bull', color: 0xdd5500,
    // Charges on aggro; slight DR from thick hide; straightforward threat
    stats: { hp: 130, attack: 22, plating: 0, damageReduction: 0.05, speed: 62, attackRange: 60, attackCooldown: 1800, pullRange: 235 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 14, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],
  ['prairie-wolf', {
    id: 'prairie-wolf', name: 'Prairie Wolf', color: 0xddaa55,
    // Pack hunter — fastest T2 mob in its tier; glass cannon
    stats: { hp: 105, attack: 20, plating: 0, damageReduction: 0, speed: 92, attackRange: 60, attackCooldown: 1300, pullRange: 275 },
    behavior: 'melee', attackStyle: 'slash', biome: 'plains',
    rewards: { essence: 12, essenceType: 'yellow', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
  }],
  ['savanna-hawk', {
    id: 'savanna-hawk', name: 'Savanna Hawk', color: 0xddcc66,
    // Aerial predator; swoops from distance and retreats — the ranged threat of the plains
    stats: { hp: 90, attack: 22, plating: 0, damageReduction: 0, speed: 50, attackRange: 165, attackCooldown: 2600, pullRange: 245 },
    behavior: 'melee', attackStyle: 'slash', biome: 'plains',
    rewards: { essence: 13, essenceType: 'yellow', level: 1, biomeXp: 38 },
    ai: { wanderRadius: 280, leashRange: 680, idleMinMs: 1000, idleMaxMs: 3200 },
  }],

  // ── Swamp T1 ───────────────────────────────────────────────────────────────
  // Threat profile: attrition — slow, above-average defense, poison/DoT style.
  // Damage output ramps over time; requires recovery investment to outlast.
  ['bog-slime', {
    id: 'bog-slime', name: 'Bog Slime', color: 0x558833,
    // Sluggish and toxic; tests player patience with sustained drip damage
    stats: { hp: 120, attack: 10, plating: 2, damageReduction: 0, speed: 28, attackRange: 60, attackCooldown: 2800, pullRange: 165 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 10, essenceType: 'purple', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 160, leashRange: 530, idleMinMs: 2000, idleMaxMs: 5500 },
    dotEffect: { damagePerStack: 1, maxStacks: 3, tickIntervalMs: 1200 },
  }],
  ['mud-toad', {
    id: 'mud-toad', name: 'Mud Toad', color: 0x778844,
    // Sturdier than it looks; plating and DR make burst less effective
    stats: { hp: 145, attack: 11, plating: 3, damageReduction: 0.04, speed: 30, attackRange: 60, attackCooldown: 2600, pullRange: 180 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 12, essenceType: 'purple', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 180, leashRange: 550, idleMinMs: 1800, idleMaxMs: 5000 },
    dotEffect: { damagePerStack: 1, maxStacks: 4, tickIntervalMs: 1000 },
  }],

  // ── Swamp T2 ───────────────────────────────────────────────────────────────
  ['swamp-hydra', {
    id: 'swamp-hydra', name: 'Swamp Hydra', color: 0x335533,
    // Multi-headed DoT engine; DR replaces plating; fights long enough to stack poison deep
    stats: { hp: 340, attack: 16, plating: 0, damageReduction: 0.12, speed: 28, attackRange: 65, attackCooldown: 2500, pullRange: 185 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 24, essenceType: 'purple', level: 1, biomeXp: 68 },
    ai: { wanderRadius: 170, leashRange: 560, idleMinMs: 2500, idleMaxMs: 7000 },
    dotEffect: { damagePerStack: 4, maxStacks: 4, tickIntervalMs: 1000, durationMs: 4500 },
  }],
  ['bog-witch', {
    id: 'bog-witch', name: 'Bog Witch', color: 0x884499,
    // Curses from range; much longer attack range than T1 counterpart
    stats: { hp: 190, attack: 26, plating: 0, damageReduction: 0.05, speed: 38, attackRange: 180, attackCooldown: 2000, pullRange: 215 },
    behavior: 'melee', attackStyle: 'magic', biome: 'swamp',
    rewards: { essence: 22, essenceType: 'purple', level: 1, biomeXp: 62 },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1500, idleMaxMs: 4500 },
  }],
  ['mire-stalker', {
    id: 'mire-stalker', name: 'Mire Stalker', color: 0x445533,
    // Ambush predator; heavy DR + occasional dodge makes it surprisingly hard to put down
    stats: { hp: 295, attack: 20, plating: 0, damageReduction: 0.18, speed: 30, attackRange: 62, attackCooldown: 2800, pullRange: 155 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 26, essenceType: 'purple', level: 1, biomeXp: 75 },
    ai: { wanderRadius: 170, leashRange: 540, idleMinMs: 2000, idleMaxMs: 6000 },
    evadeEvery: 5,
  }],

  // ── Cave T1 ────────────────────────────────────────────────────────────────
  // Threat profile: Elite Encounters.
  //   Cave Lurker — Agile, fast-striking, heavily armored; tests armor-shred/high flat damage.
  //   Cave Brute  — Massive HP pool, slow devastating swings; tests burst mitigation/shields.
  ['cave-lurker', {
    id: 'cave-lurker', name: 'Cave Lurker', color: 0x664466,
    stats: { hp: 210, attack: 13, plating: 6, damageReduction: 0.02, speed: 55, attackRange: 60, attackCooldown: 1400, pullRange: 145 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 20, essenceType: 'red', level: 1, biomeXp: 70 },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 2500, idleMaxMs: 7000 },
  }],
  ['cave-brute', {
    id: 'cave-brute', name: 'Cave Brute', color: 0x443344,
    stats: { hp: 360, attack: 32, plating: 1, damageReduction: 0.15, speed: 15, attackRange: 60, attackCooldown: 4000, pullRange: 125 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 26, essenceType: 'red', level: 1, biomeXp: 90 },
    ai: { wanderRadius: 110, leashRange: 430, idleMinMs: 3000, idleMaxMs: 8000 },
  }],

  // ── Cave T2 ────────────────────────────────────────────────────────────────
  ['giant-spider', {
    id: 'giant-spider', name: 'Giant Spider', color: 0x992266,
    // Fast ambush hunter; DR hide + evasion makes it slippery despite its size
    stats: { hp: 360, attack: 26, plating: 0, damageReduction: 0.08, speed: 72, attackRange: 62, attackCooldown: 1900, pullRange: 220 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave',
    rewards: { essence: 30, essenceType: 'red', level: 1, biomeXp: 85 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3200 },
    evadeEvery: 5,
  }],
  ['cave-troll', {
    id: 'cave-troll', name: 'Cave Troll', color: 0x334433,
    // Colossal slow bruiser; DR replaces plating; each hit is an event
    stats: { hp: 640, attack: 34, plating: 0, damageReduction: 0.18, speed: 15, attackRange: 65, attackCooldown: 3600, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 40, essenceType: 'red', level: 1, biomeXp: 115 },
    ai: { wanderRadius: 130, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
  }],
  ['cave-gargoyle', {
    id: 'cave-gargoyle', name: 'Cave Gargoyle', color: 0x554455,
    // Perches in darkness and hurls stalactites — the only ranged threat in the caverns
    stats: { hp: 430, attack: 30, plating: 0, damageReduction: 0.10, speed: 22, attackRange: 200, attackCooldown: 3200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 35, essenceType: 'red', level: 1, biomeXp: 100 },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  // ── Jungle T2 (first appearance) ───────────────────────────────────────────
  // Threat profile: aggressive DoT, fast flankers, ambush range — the most
  // dangerous high-density biome due to sustained poison pressure.
  ['jungle-snake', {
    id: 'jungle-snake', name: 'Jungle Snake', color: 0x33cc44,
    // Fast venomous ambusher — racks up DoT stacks quickly
    stats: { hp: 145, attack: 18, plating: 0, damageReduction: 0, speed: 72, attackRange: 60, attackCooldown: 1900, pullRange: 215 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 12, essenceType: 'green', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
    dotEffect: { damagePerStack: 3, maxStacks: 4, tickIntervalMs: 1000, durationMs: 4500 },
  }],
  ['jungle-ape', {
    id: 'jungle-ape', name: 'Jungle Ape', color: 0xaa6633,
    // Charges from the canopy; hits surprisingly hard for a high-density mob
    stats: { hp: 185, attack: 22, plating: 0, damageReduction: 0.05, speed: 58, attackRange: 60, attackCooldown: 2000, pullRange: 225 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle',
    rewards: { essence: 14, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1100 },
  }],
  ['jungle-blowdarter', {
    id: 'jungle-blowdarter', name: 'Jungle Blowdarter', color: 0x55bb44,
    // Hidden in foliage; fires poisoned darts from long range
    stats: { hp: 130, attack: 19, plating: 0, damageReduction: 0, speed: 42, attackRange: 195, attackCooldown: 2500, pullRange: 245 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 13, essenceType: 'green', level: 1, biomeXp: 38 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
    dotEffect: { damagePerStack: 2, maxStacks: 5, tickIntervalMs: 1000, durationMs: 4500 },
  }],

  // ── Tundra T3 (minimum tier 3 — no T2 tundra nodes exist) ─────────────────
  ['frost-slime', {
    id: 'frost-slime', name: 'Frost Slime', color: 0xaaddff,
    stats: { hp: 100, attack: 14, plating: 0, damageReduction: 0.10, speed: 28, attackRange: 60, attackCooldown: 2800, pullRange: 170 },
    behavior: 'melee', attackStyle: 'impact', biome: 'tundra',
    rewards: { essence: 18, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 150, leashRange: 510, idleMinMs: 2500, idleMaxMs: 7000 },
  }],
  ['ice-bear', {
    id: 'ice-bear', name: 'Ice Bear', color: 0xddeeff,
    stats: { hp: 240, attack: 22, plating: 0, damageReduction: 0.14, speed: 38, attackRange: 65, attackCooldown: 3200, pullRange: 200 },
    behavior: 'melee', attackStyle: 'impact', biome: 'tundra',
    rewards: { essence: 25, essenceType: 'blue', level: 1 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 6500 },
  }],

  // ── Desert T2 (first appearance) ───────────────────────────────────────────
  // Threat profile: high density, control effects (slow/root), evasion — forces
  // players to think about positioning rather than just standing and attacking.
  ['sand-scorpion', {
    id: 'sand-scorpion', name: 'Sand Scorpion', color: 0xddbb44,
    // Venomous sting slows movement; fights become longer as you struggle to reposition
    stats: { hp: 160, attack: 20, plating: 0, damageReduction: 0.10, speed: 50, attackRange: 60, attackCooldown: 2200, pullRange: 210 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 13, essenceType: 'yellow', level: 1, biomeXp: 38 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],
  ['stone-basilisk', {
    id: 'stone-basilisk', name: 'Stone Basilisk', color: 0xaa8833,
    // Petrifying gaze — its hit roots the player briefly; tough hide adds DR
    stats: { hp: 255, attack: 24, plating: 0, damageReduction: 0.12, speed: 28, attackRange: 62, attackCooldown: 2600, pullRange: 175 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 16, essenceType: 'yellow', level: 1, biomeXp: 45 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 5500 },
    slowEffect: { speedMult: 0, durationMs: 1200 },
  }],
  ['dune-asp', {
    id: 'dune-asp', name: 'Dune Asp', color: 0xccaa55,
    // Strikes from distance and writhes unpredictably — evasion + range is a dangerous combo
    stats: { hp: 135, attack: 22, plating: 0, damageReduction: 0.05, speed: 48, attackRange: 185, attackCooldown: 2400, pullRange: 250 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 14, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
    evadeEvery: 5,
  }],

  // ── Volcanic T3 ────────────────────────────────────────────────────────────
  ['ember-slime', {
    id: 'ember-slime', name: 'Ember Slime', color: 0xff4422,
    stats: { hp: 110, attack: 18, plating: 5, damageReduction: 0, speed: 52, attackRange: 60, attackCooldown: 2300, pullRange: 210 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 20, essenceType: 'red', level: 1, biomeXp: 58 },
    ai: { wanderRadius: 220, leashRange: 600, idleMinMs: 1200, idleMaxMs: 4000 },
  }],
  ['magma-golem', {
    id: 'magma-golem', name: 'Magma Golem', color: 0xcc2200,
    stats: { hp: 260, attack: 24, plating: 12, damageReduction: 0, speed: 18, attackRange: 65, attackCooldown: 3800, pullRange: 150 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 28, essenceType: 'red', level: 1, biomeXp: 80 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9500 },
  }],

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

  // ── Forest T4 ─────────────────────────────────────────────────────────────
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

  // ── Mountain T3 ───────────────────────────────────────────────────────────
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

  // ── Mountain T4 ───────────────────────────────────────────────────────────
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

  // ── Plains T3 ─────────────────────────────────────────────────────────────
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

  // ── Plains T4 ─────────────────────────────────────────────────────────────
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

  // ── Swamp T3 ──────────────────────────────────────────────────────────────
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

  // ── Swamp T4 ──────────────────────────────────────────────────────────────
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

  // ── Cave T3 ───────────────────────────────────────────────────────────────
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

  // ── Cave T4 ───────────────────────────────────────────────────────────────
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

  // ── Jungle T3 ─────────────────────────────────────────────────────────────
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

  // ── Jungle T4 ─────────────────────────────────────────────────────────────
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

  // ── Tundra T3 ─────────────────────────────────────────────────────────────
  ['frost-giant', {
    id: 'frost-giant', name: 'Frost Giant', color: 0x88bbdd,
    stats: { hp: 700, attack: 50, plating: 18, damageReduction: 0.06, speed: 30, attackRange: 68, attackCooldown: 3200, pullRange: 175 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 58, essenceType: 'blue', level: 2 },
    ai: { wanderRadius: 160, leashRange: 520, idleMinMs: 2500, idleMaxMs: 7000 },
  }],
  ['blizzard-wolf', {
    id: 'blizzard-wolf', name: 'Blizzard Wolf', color: 0xddeeff,
    stats: { hp: 390, attack: 56, plating: 8, damageReduction: 0, speed: 98, attackRange: 60, attackCooldown: 1500, pullRange: 290 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 46, essenceType: 'blue', level: 2 },
    ai: { wanderRadius: 330, leashRange: 840, idleMinMs: 500, idleMaxMs: 2500 },
  }],

  // ── Tundra T4 ─────────────────────────────────────────────────────────────
  ['arctic-leviathan', {
    id: 'arctic-leviathan', name: 'Arctic Leviathan', color: 0x5599cc,
    stats: { hp: 2000, attack: 112, plating: 48, damageReduction: 0.11, speed: 26, attackRange: 70, attackCooldown: 3800, pullRange: 175 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 158, essenceType: 'blue', level: 3 },
    ai: { wanderRadius: 140, leashRange: 500, idleMinMs: 3000, idleMaxMs: 8500 },
  }],
  ['ice-specter', {
    id: 'ice-specter', name: 'Ice Specter', color: 0xccffff,
    stats: { hp: 750, attack: 152, plating: 10, damageReduction: 0.08, speed: 92, attackRange: 62, attackCooldown: 1400, pullRange: 300 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 128, essenceType: 'blue', level: 3 },
    ai: { wanderRadius: 350, leashRange: 900, idleMinMs: 400, idleMaxMs: 2000 },
  }],

  // ── Desert T3 ─────────────────────────────────────────────────────────────
  ['sand-kraken', {
    id: 'sand-kraken', name: 'Sand Kraken', color: 0xcc9933,
    stats: { hp: 580, attack: 48, plating: 16, damageReduction: 0.04, speed: 46, attackRange: 68, attackCooldown: 2600, pullRange: 200 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 52, essenceType: 'yellow', level: 2 },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1800, idleMaxMs: 6000 },
  }],
  ['bone-drake', {
    id: 'bone-drake', name: 'Bone Drake', color: 0xddcc88,
    stats: { hp: 440, attack: 58, plating: 10, damageReduction: 0.05, speed: 84, attackRange: 62, attackCooldown: 1800, pullRange: 260 },
    behavior: 'melee', attackStyle: 'slash', biome: 'desert',
    rewards: { essence: 48, essenceType: 'yellow', level: 2 },
    ai: { wanderRadius: 290, leashRange: 740, idleMinMs: 800, idleMaxMs: 3500 },
  }],

  // ── Desert T4 ─────────────────────────────────────────────────────────────
  ['pharaoh-construct', {
    id: 'pharaoh-construct', name: 'Pharaoh Construct', color: 0xddbb44,
    stats: { hp: 1850, attack: 115, plating: 45, damageReduction: 0.11, speed: 28, attackRange: 68, attackCooldown: 3400, pullRange: 180 },
    behavior: 'melee', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 152, essenceType: 'yellow', level: 3 },
    ai: { wanderRadius: 155, leashRange: 520, idleMinMs: 2500, idleMaxMs: 7500 },
  }],
  ['desert-wyrm', {
    id: 'desert-wyrm', name: 'Desert Wyrm', color: 0xaa6600,
    stats: { hp: 1200, attack: 138, plating: 26, damageReduction: 0.06, speed: 70, attackRange: 65, attackCooldown: 2000, pullRange: 260 },
    behavior: 'melee', attackStyle: 'slash', biome: 'desert',
    rewards: { essence: 125, essenceType: 'red', level: 3 },
    ai: { wanderRadius: 280, leashRange: 720, idleMinMs: 800, idleMaxMs: 3800 },
  }],

  // ── Volcanic T3 ───────────────────────────────────────────────────────────
  ['lava-titan', {
    id: 'lava-titan', name: 'Lava Titan', color: 0xff5500,
    stats: { hp: 720, attack: 54, plating: 20, damageReduction: 0.07, speed: 26, attackRange: 65, attackCooldown: 3500, pullRange: 155 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 60, essenceType: 'red', level: 2 },
    ai: { wanderRadius: 140, leashRange: 490, idleMinMs: 3000, idleMaxMs: 8500 },
  }],
  ['fire-elemental', {
    id: 'fire-elemental', name: 'Fire Elemental', color: 0xff8800,
    stats: { hp: 400, attack: 64, plating: 8, damageReduction: 0.04, speed: 70, attackRange: 62, attackCooldown: 2100, pullRange: 230 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 50, essenceType: 'red', level: 2 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4200 },
  }],

  // ── Volcanic T4 ───────────────────────────────────────────────────────────
  ['infernal-drake', {
    id: 'infernal-drake', name: 'Infernal Drake', color: 0xcc2200,
    stats: { hp: 1600, attack: 135, plating: 38, damageReduction: 0.12, speed: 56, attackRange: 65, attackCooldown: 2200, pullRange: 250 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 145, essenceType: 'red', level: 3 },
    ai: { wanderRadius: 230, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4500 },
  }],
  ['magma-colossus', {
    id: 'magma-colossus', name: 'Magma Colossus', color: 0x881100,
    stats: { hp: 2400, attack: 118, plating: 58, damageReduction: 0.15, speed: 16, attackRange: 70, attackCooldown: 4800, pullRange: 145 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 168, essenceType: 'red', level: 3 },
    ai: { wanderRadius: 100, leashRange: 430, idleMinMs: 4500, idleMaxMs: 11000 },
  }],

  // ── Necropolis T3 ─────────────────────────────────────────────────────────
  ['skeleton-warrior', {
    id: 'skeleton-warrior', name: 'Skeleton Warrior', color: 0xddddbb,
    stats: { hp: 500, attack: 47, plating: 12, damageReduction: 0.06, speed: 50, attackRange: 62, attackCooldown: 2400, pullRange: 220 },
    behavior: 'melee', attackStyle: 'slash', biome: 'necropolis',
    rewards: { essence: 50, essenceType: 'blue', level: 2 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 5000 },
  }],
  ['lich', {
    id: 'lich', name: 'Lich', color: 0x8855bb,
    stats: { hp: 360, attack: 68, plating: 5, damageReduction: 0.07, speed: 38, attackRange: 65, attackCooldown: 2000, pullRange: 230 },
    behavior: 'melee', attackStyle: 'magic', biome: 'necropolis',
    rewards: { essence: 55, essenceType: 'purple', level: 2 },
    ai: { wanderRadius: 220, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4500 },
  }],

  // ── Necropolis T4 ─────────────────────────────────────────────────────────
  ['bone-colossus', {
    id: 'bone-colossus', name: 'Bone Colossus', color: 0xbbbbaa,
    stats: { hp: 2000, attack: 112, plating: 45, damageReduction: 0.11, speed: 18, attackRange: 68, attackCooldown: 4200, pullRange: 145 },
    behavior: 'melee', attackStyle: 'impact', biome: 'necropolis',
    rewards: { essence: 155, essenceType: 'blue', level: 3 },
    ai: { wanderRadius: 100, leashRange: 430, idleMinMs: 4000, idleMaxMs: 10000 },
  }],
  ['death-knight', {
    id: 'death-knight', name: 'Death Knight', color: 0x443355,
    stats: { hp: 1200, attack: 142, plating: 30, damageReduction: 0.09, speed: 58, attackRange: 62, attackCooldown: 2200, pullRange: 250 },
    behavior: 'melee', attackStyle: 'slash', biome: 'necropolis',
    rewards: { essence: 130, essenceType: 'purple', level: 3 },
    ai: { wanderRadius: 260, leashRange: 700, idleMinMs: 1000, idleMaxMs: 4000 },
  }],

  // ── Abyss T4 ──────────────────────────────────────────────────────────────
  ['void-horror', {
    id: 'void-horror', name: 'Void Horror', color: 0x220033,
    stats: { hp: 1500, attack: 150, plating: 24, damageReduction: 0.09, speed: 68, attackRange: 64, attackCooldown: 1900, pullRange: 270 },
    behavior: 'melee', attackStyle: 'void', biome: 'abyss',
    rewards: { essence: 165, essenceType: 'purple', level: 3 },
    ai: { wanderRadius: 280, leashRange: 750, idleMinMs: 800, idleMaxMs: 3500 },
  }],
  ['abyssal-titan', {
    id: 'abyssal-titan', name: 'Abyssal Titan', color: 0x110022,
    stats: { hp: 2600, attack: 125, plating: 55, damageReduction: 0.15, speed: 20, attackRange: 70, attackCooldown: 4500, pullRange: 145 },
    behavior: 'melee', attackStyle: 'void', biome: 'abyss',
    rewards: { essence: 178, essenceType: 'purple', level: 3 },
    ai: { wanderRadius: 95, leashRange: 420, idleMinMs: 4500, idleMaxMs: 11000 },
  }],

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
      speed: 50, attackRange: 65, attackCooldown: 2200, pullRange: 280,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 100, essenceType: 'yellow', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  // Forest: fast and hard-hitting, zero defense — high DPS spike
  ['forest-warden', {
    id: 'forest-warden', name: 'Forest Warden', color: 0x33aa44,
    isBoss: true,
    stats: {
      hp: 450, attack: 22, plating: 0, damageReduction: 0,
      speed: 52, attackRange: 68, attackCooldown: 2000, pullRange: 300,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 100, essenceType: 'green', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 160, leashRange: 800, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  // Swamp: slow, defensive, poisons — attrition boss
  ['bog-sovereign', {
    id: 'bog-sovereign', name: 'Bog Sovereign', color: 0x1e3d1e,
    isBoss: true,
    stats: {
      hp: 500, attack: 16, plating: 4, damageReduction: 0.04,
      speed: 28, attackRange: 68, attackCooldown: 2800, pullRange: 260,
    },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 100, essenceType: 'purple', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 100, leashRange: 700, idleMinMs: 2000, idleMaxMs: 5500 },
    dotEffect: { damagePerStack: 4, maxStacks: 4, tickIntervalMs: 1000 },
  }],

  // Caverns: most defensive T1 boss — serious plating, hits hardest, very slow
  ['cave-sentinel', {
    id: 'cave-sentinel', name: 'Cave Sentinel', color: 0x334455,
    isBoss: true,
    stats: {
      hp: 650, attack: 22, plating: 7, damageReduction: 0.04,
      speed: 18, attackRange: 65, attackCooldown: 3200, pullRange: 240,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 110, essenceType: 'red', level: 5, biomeXp: 165 },
    ai: { wanderRadius: 80, leashRange: 680, idleMinMs: 2500, idleMaxMs: 6500 },
  }],

  // Mountain: fast mobile boss, skirmisher profile — zero armor, aggressive pull
  ['mountain-sentinel', {
    id: 'mountain-sentinel', name: 'Mountain Sentinel', color: 0x8899bb,
    isBoss: true,
    stats: {
      hp: 480, attack: 20, plating: 0, damageReduction: 0,
      speed: 58, attackRange: 68, attackCooldown: 1800, pullRange: 280,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 105, essenceType: 'blue', level: 5, biomeXp: 158 },
    ai: { wanderRadius: 160, leashRange: 750, idleMinMs: 1000, idleMaxMs: 3500 },
  }],

  // ── T2 dungeon bosses ────────────────────────────────────────────────────
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
      speed: 30, attackRange: 68, attackCooldown: 3000, pullRange: 300,
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
      speed: 46, attackRange: 70, attackCooldown: 2700, pullRange: 320,
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

  // ── T2 bosses (tundra/glacial already in T2 band) ─────────────────────────
  ['glacial-colossus', {
    id: 'glacial-colossus', name: 'Glacial Colossus', color: 0xaaddff,
    isBoss: true,
    stats: {
      hp: 2600, attack: 55, plating: 28, damageReduction: 0.10,
      speed: 18, attackRange: 90, attackCooldown: 3600, pullRange: 280,
    },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 140, essenceType: 'blue', level: 5, biomeXp: 210 },
    ai: { wanderRadius: 140, leashRange: 800, idleMinMs: 3000, idleMaxMs: 6500 },
  }],

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

  // ── T4 dungeon bosses ────────────────────────────────────────────────────
  ['mountain-titan', {
    id: 'mountain-titan', name: 'Mountain Titan', color: 0x99aacc,
    isBoss: true,
    stats: {
      hp: 7500, attack: 170, plating: 65, damageReduction: 0.20,
      speed: 12, attackRange: 80, attackCooldown: 5200, pullRange: 400,
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
      speed: 26, attackRange: 80, attackCooldown: 2800, pullRange: 320,
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
      speed: 68, attackRange: 80, attackCooldown: 2800, pullRange: 380,
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
      speed: 76, attackRange: 82, attackCooldown: 3000, pullRange: 390,
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
      speed: 14, attackRange: 90, attackCooldown: 5500, pullRange: 370,
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
]);
