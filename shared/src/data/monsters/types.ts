import type { EssenceType } from '../../items';
import type { Vec2 } from '../../systems/spatial';

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

// ── Ultimate encounter types ──────────────────────────────────────────────────

/**
 * Objective-driven encounter script for major bosses.
 *
 * Unlike BossScript, stages advance from explicit conditions such as clearing
 * tracked waves or elites rather than HP thresholds.
 */
export interface UltimateEncounter {
  anchor?: 'center';
  /** Empty-node reset is handled by node freeze/thaw; this covers party wipes. */
  reset: { onWipe: boolean };
  stages: EncounterStage[];
  /** When set, staged adds spawn on this node feature's perimeter instead of around the boss. */
  spawnFromFeatureId?: string;
}

export interface EncounterStage {
  id: string;
  /** HUD label; falls back to id.toUpperCase() when omitted. */
  displayName?: string;
  /** Overrides server-built objective headline when set. */
  objectiveLabel?: string;
  /** Default false. Final stages usually set this true and omit completeWhen. */
  vulnerable?: boolean;
  onEnter: StageAction[];
  /** Omit on a final stage that ends only when the boss dies. */
  completeWhen?: StageCondition;
}

export type StageAction =
  | { type: 'spawn-waves'; waves: WaveDef[] }
  | { type: 'spawn-elites'; monsterTypeId: string; count: number; offsetRange?: number }
  | {
      type: 'environmental-dot';
      effectId: string;
      damagePerStack: number;
      tickIntervalMs: number;
      /** Pass 0 for linear stacks × damagePerStack (used by void flood ramp). */
      maxStacks: number;
      refreshMs: number;
      /** Max stacks the hazard ramps up to over the fight. */
      stackCap?: number;
      /** HUD hint, e.g. "Leave the throne hazard". */
      hazardHint?: string;
    }
  | { type: 'set-invulnerable'; value: boolean }
  | { type: 'set-rooted'; value: boolean }
  | { type: 'set-cannot-attack'; value: boolean }
  /** Toggle a node-feature obstacle on/off for this node while engaged. */
  | { type: 'set-feature-block'; featureId: string; value: boolean };

export interface WaveDef {
  adds: { monsterTypeId: string; count: number }[];
}

export type StageCondition =
  | { kind: 'adds-cleared' }
  | { kind: 'elites-cleared' }
  | { kind: 'waves-cleared' };

export interface UltimateEnvironmentalDot {
  effectId: string;
  damagePerStack: number;
  tickIntervalMs: number;
  maxStacks: number;
  refreshMs: number;
  refreshTimerMs: number;
  /** Max stacks the flood ramp reaches. */
  stackCap: number;
  /** Current ramp intensity (1..stackCap). */
  currentStacks: number;
  /** Refresh cycles since flood started — ramp skips the first. */
  refreshCount: number;
}

export interface UltimateSavedBaseline {
  speed?: number;
  pullRange?: number;
  spawn?: Vec2;
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
  /** True for monsters that attack from range and should not play a lunge animation. */
  isRanged?: boolean;
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
  /** Objective-driven multi-stage encounter controller. */
  ultimateEncounter?: UltimateEncounter;
  /**
   * If set, the monster bursts at speedMult x base speed for durationMs when it
   * first acquires an aggro target (both pull-range and retaliation aggro).
   * The charge overrides the kite ramp for its duration.
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
   */
  slowEffect?: { speedMult: number; durationMs: number };
  /**
   * Deterministic evasion: this monster dodges at a rate of 1/N incoming player
   * hits (a fractional accumulator, not RNG). Minimum useful value is 5; lower
   * values should be ignored by combat logic.
   */
  evadeEvery?: number;
  /**
   * Fraction of damage avoided on one of this monster's dodges (0..1). Defaults
   * to GAME_CONFIG.EVADE_MITIGATION_BASE (0.5). Set to 1 to fully negate the hit
   * (the legacy behavior).
   */
  evadeMitigation?: number;
  /**
   * If true, the player's debuffs/DoT stacks still land even when this monster
   * dodges the hit. Default false (a dodged hit applies no debuffs).
   */
  appliesThroughEvade?: boolean;
}
