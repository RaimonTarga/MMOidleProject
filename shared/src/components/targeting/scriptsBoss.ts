import type { BossAction, BossScript, MonsterDefinition } from '../../monsterDatabase';

/** Runtime DoT override shape — mirrors MonsterDefinition.dotEffect. */
export type MonsterDotEffect = NonNullable<MonsterDefinition['dotEffect']>;

/**
 * An active timed effect on a boss.
 * Stat fields hold the pre-buff values so they can be restored on expiry.
 */
export interface ActiveBossEffect {
  type: string;
  /** Remaining ms. -1 = permanent (lasts until boss dies). */
  remainingMs: number;
  /** Authored duration used by the client clock. -1 = permanent. */
  totalMs: number;
  /** For 'regen': HP fraction of maxHp to restore per second. */
  regenHpPctPerSec?: number;
  /** Saved stats — restored when effect expires. */
  savedAttack?:          number;
  savedCooldown?:        number;
  savedPlating?:         number;
  savedDamageReduction?: number;
  savedSpeed?:           number;
  /**
   * Saved morph fields — restored when a timed 'morph' expires. The `had*Override`
   * flags distinguish "revert to a prior override value" from "clear the override".
   */
  savedIsRanged?:        boolean;
  savedAttackStyle?:     string;
  savedAttackRange?:     number;
  savedDotEffect?:       MonsterDotEffect;
  hadDotOverride?:       boolean;
  savedKite?:            boolean;
  hadKiteOverride?:      boolean;
  /** Saved evasion override — restored when a timed evasion 'stat-buff' expires. */
  savedEvasionOverride?: number;
  hadEvasionOverride?:   boolean;
}

/**
 * Per-boss runtime tracking on `entity.scriptsBoss`.
 * Created on first encounter, removed when the monster entity is despawned.
 */
export interface ScriptsBoss {
  /** Parallel array to BossScript.phases — true once that phase has fired. */
  phaseTriggered: boolean[];
  /** Countdown timers per RepeatingAction (ms until next fire), in script order. */
  repeatingTimers: number[];
  /** Currently active timed effects. */
  activeEffects: ActiveBossEffect[];
  /**
   * The `bossEffects` keys the script published last tick. Other systems (boss
   * patterns: recovery, instinct, cast announcements) publish onto the same list,
   * so the script replaces only its own keys instead of the whole list.
   */
  publishedEffects?: string[];
  /**
   * Runtime override of the monster's DoT-on-hit (set by a 'morph' action). When
   * present, the monster→player DoT listener uses this instead of the static def.
   */
  dotEffectOverride?: MonsterDotEffect;
  /** Runtime override of the kite flag (set by a 'morph' action). Read by the AI. */
  kiteOverride?: boolean;
  /**
   * Runtime enemyShield gained mid-fight (set by an 'apply-shield' action). When
   * present, the monster→player shield mechanic uses this instead of the static def.
   */
  shieldOverride?: {
    shieldPct: number;
    intervalMs: number;
    durationMs: number;
    /** See `MonsterDefinition.enemyShield.shatter`. */
    shatter?: {
      selfDamagePct: number;
      vulnerability?: { damageTakenPct: number; durationMs: number };
      freezeRadius?: number;
      freezeDurationMs?: number;
    };
    /** See `MonsterDefinition.enemyShield.rechargeAfterCleanMs`. */
    rechargeAfterCleanMs?: number;
  };
  /**
   * Runtime enemySoftCap gained mid-fight (set by an 'apply-soft-cap' action). When
   * present, the player→monster soft-cap mechanic uses this instead of the static def.
   */
  softCapOverride?: { capPct: number; capMult: number };
  /**
   * Runtime evasion override (set by a 'stat-buff' evasion action). When present, the
   * monster's per-hit dodge fraction uses this instead of the static def.evasion.
   */
  evasionOverride?: number;
  /**
   * Runtime rampDebuff cap override (set by a 'modify-ramp-debuff' action). Raises the
   * move/atk slow caps used when (re)applying the frost-ramp debuff to players.
   */
  rampDebuffCapOverride?: { moveSlowMaxPct: number; atkSlowMaxPct: number };
  /**
   * Set by 'shed-defense' — suppresses BOTH the runtime overrides AND any static
   * enemyShield/enemySoftCap so the boss drops all defenses for the finale.
   */
  defenseShed?: boolean;
  /** Ids of adds spawned by 'spawn-adds' — despawned when the boss dies. */
  spawnedAddIds?: string[];
  /** A scripted cast currently locking the boss in place. */
  scriptedCast?: {
    remainingMs: number;
    label: string;
    actions: BossAction[];
    /** Client animation id for the cast's start/end events. */
    castFx?: string;
    ownsRoot: boolean;
    ownsCannotAttack: boolean;
  };
  /** Scripted casts triggered while another is resolving; starts in FIFO order. */
  scriptedCastQueue?: {
    castMs: number;
    label: string;
    actions: BossAction[];
    fx?: 'roar' | 'frenzy' | 'shield';
    castFx?: string;
  }[];
  /**
   * Runtime scalars on the boss's `chargedAttack` (set by 'empower-charged'). Stored
   * as MULTIPLIERS rather than resolved values so repeated phases compose, and so the
   * authored definition stays the single source of the base numbers.
   */
  chargedOverride?: {
    multiplierMult: number;
    cooldownMult: number;
    radiusMult: number;
    castMsMult: number;
    aftershockRayCountAdd: number;
    aftershockDamageMult: number;
  };
  /**
   * Runtime deepening of `appliesPlatingShred` (set by 'empower-shred'). Additive on
   * top of the static def; `extraThresholds` are merged into the threshold-poison
   * stack counts.
   */
  shredOverride?: {
    platingPerStackAdd: number;
    maxStacksAdd: number;
    extraThresholds: number[];
  };
  /** Added to `raisesDead.maxAlive` by a 'raise-dead' action carrying `maxAliveAdd`. */
  raiseMaxAliveAdd?: number;
  /** Id of the `bossPatternVariants` entry a 'set-pattern' action switched to. */
  patternOverrideId?: string;
  /** Extra variant patterns armed alongside the main one ('add-pattern'). */
  extraPatternIds?: string[];
  /** Name of the last announced (named) phase; mirrored to the boss bar. */
  phaseLabel?: string;
  /** Presentational weather set by 'set-weather'; mirrored to `hasStatus.bossWeather`. */
  weather?: 'blizzard' | 'ashfall' | 'abyss' | 'sandstorm' | 'spores';
  /** Set by 'spread-pools': owned pools grow toward a cap. */
  poolSpread?: { radiusPerSec: number; maxRadiusMult: number };
  /** Set by 'bone-tithe': damage reduction per living risen. */
  boneTithe?: { damageReductionPerRisen: number; maxStacks: number };
  /** Set by 'harvest': the devour clock. */
  harvest?: { intervalMs: number; timerMs: number; attackMult: number };
  /** Set by 'vent-field': the arena's magma vents and their eruption clocks. */
  vents?: {
    pos: { x: number; y: number };
    radius: number;
    nextEruptAtMs: number;
    /** The vent's ground zone, so a later phase can widen it in place. */
    zoneId?: string;
  }[];
  /** Set by 'set-raising': the boss has stopped raising the dead. */
  raiseDisabled?: boolean;
  /** Set by 'vent-spawner': transient vents opening around the boss. */
  ventSpawner?: {
    everyMs: number;
    count: number;
    minRadius: number;
    maxRadius: number;
    radius: number;
    telegraphMs: number;
    lingerMs: number;
    damageMult: number;
    rampAccelMult: number;
    nextAtMs: number;
  };
  ventRhythm?: {
    eruptEveryMs: number;
    telegraphMs: number;
    damageMult: number;
    radius: number;
    rampAccelMult: number;
    /** Fissures: a new vent splits open under a player and erupts at once. */
    fissure?: { everyMs: number; maxVents: number; nextAtMs: number };
  };
  /** Set by 'room-debuff': the arena's own boss-debuff ramps (Frostbite, Depth). */
  roomDebuffs?: {
    effectId: string;
    intervalMs: number;
    timerMs: number;
    maxStacks: number;
    durationMs: number;
    data: Record<string, number>;
    accelerate?: { intervalMult: number; minIntervalMs: number };
  }[];
  /** Set by 'room-affliction': the arena's own DoT ramp and its timer. */
  roomAffliction?: {
    intervalMs: number;
    timerMs: number;
    dot: {
      debuffId: string;
      label: string;
      color?: string;
      damagePerStack: number;
      maxStacks: number;
      tickIntervalMs: number;
      durationMs: number;
    };
  };
}

export function initScriptsBoss(script: BossScript): ScriptsBoss {
  return {
    phaseTriggered:  new Array(script.phases?.length ?? 0).fill(false) as boolean[],
    repeatingTimers: (script.repeating ?? []).map(r => r.initialDelayMs ?? r.intervalMs),
    activeEffects:   [],
  };
}

