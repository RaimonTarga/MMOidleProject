import type { EssenceType } from '../../items';

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
  rewards: { essence: number; essenceType: EssenceType; level: number };
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
}
