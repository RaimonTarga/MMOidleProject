import type { EssenceType } from '../../items';
import type { Vec2 } from '../../systems/spatial';
import type { DamageElement } from '../../systems/dotElements';

// ── Boss script types ─────────────────────────────────────────────────────────

/**
 * All actions a boss can take, as a discriminated union.
 *
 *   enrage    — multiply attack and accelerate attack cooldown for durationMs (or rest-of-fight).
 *   regen     — restore hpPctPerSec × maxHp HP per second for durationMs (or rest-of-fight).
 *   shield    — add drAdd to damageReduction for durationMs (cyclic, always timed).
 *   summon    — spawn `count` minions of monsterTypeId near the boss.
 *   stat-buff — multiply a single stat for durationMs (or rest-of-fight).
 *   morph     — SET (not multiply) non-numeric combat fields: isRanged, attackStyle,
 *               attackRange, dotEffect, kite. Lets a boss flip stance mid-fight
 *               (e.g. melee → ranged kiter at 50% HP). Each field is independent and
 *               optional; only provided fields change. `dotEffect: null` clears an
 *               existing DoT override. To kite after a flip, set `kite: true` AND
 *               extend `attackRange` (the standoff band scales off the live range).
 *   slam      — instant AoE burst centered on the boss, hitting all players AND
 *               enemy summons within `radius`. Pure damage (no slow/DoT). Pair with
 *               a RepeatingAction to slam every N seconds. `damageMult` scales off
 *               the boss's current attack (default 1.0).
 *
 *   apply-shield   — gain a runtime enemyShield override mid-fight (same mechanic as
 *               the static MonsterDefinition.enemyShield). The barrier comes up on the
 *               next incoming hit. Permanent until shed-defense / boss death.
 *   apply-soft-cap — gain a runtime enemySoftCap override mid-fight (same mechanic as
 *               the static MonsterDefinition.enemySoftCap). Permanent until shed.
 *   shed-defense   — drop ALL active defenses: clears the runtime shield/soft-cap
 *               overrides AND suppresses any static enemyShield/enemySoftCap, then
 *               reduces current plating to ~20%. The desperation finale. Pair with an
 *               explicit slam in the same phase for the transition impact.
 *   modify-ramp-debuff — raise the caps on this boss's rampDebuff. Patches live
 *               frost-ramp stacks on players in-node and all future applications.
 *   spawn-adds     — spawn a burst of trash adds near the boss (same as summon) and
 *               track them so they are despawned when the boss dies.
 *
 * `stat-buff` supports `evasion` in addition to the entity stats: it multiplies the
 * boss's effective per-hit dodge fraction via a runtime override (mult 0 = stop
 * dodging entirely).
 *
 * Omitting durationMs (or undefined) means the effect lasts until the boss dies.
 */
export type BossAction =
  | { type: 'enrage';    atkMult: number; cdMult: number;     durationMs?: number }
  | { type: 'regen';     hpPctPerSec: number;                 durationMs?: number }
  | { type: 'shield';    drAdd: number;   durationMs: number }
  | { type: 'summon';    monsterTypeId: string; count: number; offsetRange?: number }
  | { type: 'stat-buff'; stat: 'attack' | 'speed' | 'plating' | 'damageReduction' | 'evasion'; mult: number; durationMs?: number }
  | { type: 'slam';      radius: number; damageMult?: number }
  | { type: 'apply-shield';   shieldPct: number; intervalMs: number; durationMs: number }
  | { type: 'apply-soft-cap'; capPct: number; capMult: number }
  | { type: 'shed-defense' }
  | { type: 'modify-ramp-debuff'; moveSlowMaxPct: number; atkSlowMaxPct: number }
  | { type: 'spawn-adds'; monsterTypeId: string; count: number; offsetRange?: number }
  | {
      type: 'morph';
      isRanged?: boolean;
      attackStyle?: string;
      attackRange?: number;
      /** Object sets a runtime DoT override; null clears it (revert to no DoT). */
      dotEffect?: {
        debuffId?: string;
        label?: string;
        color?: string;
        damagePerStack: number;
        maxStacks: number;
        tickIntervalMs: number;
        durationMs?: number;
        element?: DamageElement;
        bypassShield?: boolean;
      } | null;
      kite?: boolean;
      /** When set, revert to pre-morph values after durationMs. Omit = permanent phase flip. */
      durationMs?: number;
    };

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

export type MonsterTargetingMode = 'closest' | 'lowest-hp';

export interface MonsterTargeting {
  /**
   * Initial aggro acquisition policy. Omitted defaults to 'closest', matching
   * the legacy behavior. Monsters do not periodically retarget from this alone.
   */
  mode?: MonsterTargetingMode;
  /**
   * Future taunt hook. Omitted/false means taunts may override this monster once
   * the taunt system ships.
   */
  ignoresTaunts?: boolean;
}

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
  /**
   * Short bestiary hint describing the monster's combat profile (e.g.
   * "Fast-attacking swarmer", "Slow, armored bruiser"). When omitted, a profile
   * is derived from the monster's stats and mechanics. Authoring this overrides
   * the derived text — the intended home for hand-written flavor/lore later.
   */
  profile?: string;
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
  /** How this monster chooses an aggro target when first pulled. Defaults to closest. */
  targeting?: MonsterTargeting;
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
    /** Stable debuff identity. Same id stacks together; different ids are separate debuffs. */
    debuffId?: string;
    /** Player-facing debuff label. Omitted falls back to biome/element flavor. */
    label?: string;
    /** Player-facing icon color. Omitted falls back to biome/element flavor. */
    color?: string;
    damagePerStack: number;
    maxStacks: number;
    tickIntervalMs: number;
    durationMs?: number;
    /** DoT element for damage-number flavor (color/glyph). Defaults to poison. */
    element?: DamageElement;
    /**
     * Exception flag: when true this DoT's ticks ignore the player's shields and
     * hit HP directly. The DEFAULT (omitted/false) is that DoT ticks are absorbed
     * by shields like any other damage — bypass should stay rare and deliberate.
     */
    bypassShield?: boolean;
  };
  /**
   * If set, this monster applies a movement slow (or root when speedMult = 0) to
   * the player on every successful hit. The effect is refreshed on each hit.
   */
  slowEffect?: { speedMult: number; durationMs: number };
  /**
   * If set, this monster's basic attack also deals splash damage to all players
   * AND enemy summons within `radius` px of the primary target. The primary target
   * takes its normal direct hit (full pipeline, including slow/DoT); everyone else
   * takes splash only. Splash bypasses the combat pipeline (pure damage — no
   * slow/DoT), matching player empowered-AoE semantics. `damageMult` scales the
   * splash off the monster's current attack (default 1.0), so it composes with
   * enrage / stat-buff / morph.
   */
  aoeAttack?: { radius: number; damageMult?: number };
  /**
   * Ranged kiter: when paired with isRanged, the AI steers to MAINTAIN attackRange
   * (backs off as the player closes, re-closes if the player flees). Kiter move
   * speed MUST stay below player base (120) so a charge can always catch it.
   * NOTE: behavior not yet implemented — this is the data gate only.
   */
  kite?: boolean;
  /**
   * In-combat attack ramp. While the monster has an aggro target, a multiplier on
   * `stat` grows by perTickPct every tickIntervalMs, clamped at maxPct. Deterministic
   * (counts elapsed ticks). Resets to zero on de-aggro / leash.
   */
  rampOnCombat?: {
    stat: 'attack';
    perTickPct: number;
    maxPct: number;
    tickIntervalMs: number;
  };
  /**
   * Stacking debuff applied to the PLAYER on every landed hit: a movement slow and
   * an attack-speed slow, each accumulating per hit and clamped at its own MaxPct.
   * The whole debuff decays stackDurationMs after the last hit taken (refreshed each
   * hit). ⚠ atkSlowMaxPct is load-bearing — an uncapped attack-speed debuff
   * death-spirals (slower attack → slower kill → more stacks).
   */
  rampDebuff?: {
    moveSlowPerHit: number;
    moveSlowMaxPct: number;
    atkSlowPerHit: number;
    atkSlowMaxPct: number;
    stackDurationMs: number;
  };
  /**
   * Deterministic cadence finisher — port of the player cadence empowered attack.
   * Every `everyNAttacks` landed basic attacks, that attack's outgoing damage is
   * multiplied by `multiplier`. Counter-based (no RNG); the boosted hit resolves
   * through the player's full defensive pipeline (damage-cap, shields, plating, DR)
   * exactly like a player empowered attack — these spikes are what the player's
   * damage-cap armor is meant to answer.
   */
  cadenceFinisher?: { everyNAttacks: number; multiplier: number };
  /**
   * Deterministic cooldown finisher — port of the player cooldown empowered attack.
   * The timer starts on combat entry; once `cooldownMs` elapses the monster's NEXT
   * landed attack is multiplied by `multiplier` and the timer resets. If the monster
   * cannot attack the instant the timer expires, the empowered state waits for the
   * next actual attack (it is evaluated at attack time, never wasted on an idle tick).
   * Resolves through the player's full defensive pipeline.
   */
  empoweredCooldown?: { cooldownMs: number; multiplier: number };
  /**
   * Periodic absorb barrier on the MONSTER — mirror of the player periodic shield
   * (defense.shield-pct). Every `intervalMs` the monster gains a shield equal to
   * `shieldPct × maxHp` lasting `durationMs`; it absorbs incoming player direct-hit
   * damage before the monster's HP (same scope as the player shield, which likewise
   * only absorbs combat-pipeline hits). Rewards burst (one big hit pops it) and
   * punishes chip (small hits waste themselves against it). Timer is deterministic.
   */
  enemyShield?: { shieldPct: number; intervalMs: number; durationMs: number };
  /**
   * Soft damage cap protecting the MONSTER — mirror of the player damage-cap
   * (defense.max-hit-pct / max-hit-mult). When a single player hit exceeds
   * `capPct × maxHp`, the portion above the threshold is scaled by `capMult`
   * (threshold + excess × capMult). Partial only — never reduces a hit to zero.
   * Punishes slow single-big-hit builds; rewards fast consistent damage and pierce.
   */
  enemySoftCap?: { capPct: number; capMult: number };
  /**
   * Deterministic evasion: per-hit dodge chance as a fraction (0–1), the same
   * notation as the player `evasion` stat. The value is added to a fractional
   * accumulator each incoming player hit and the hit is dodged when it crosses
   * 1.0 (e.g. 0.2 ⇒ dodges every 5th hit, 0.25 ⇒ every 4th). Not RNG.
   */
  evasion?: number;
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
