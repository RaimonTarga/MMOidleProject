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
    ownsRoot: boolean;
    ownsCannotAttack: boolean;
  };
  /** Scripted casts triggered while another is resolving; starts in FIFO order. */
  scriptedCastQueue?: {
    castMs: number;
    label: string;
    actions: BossAction[];
    fx?: 'roar' | 'frenzy';
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
}

export function initScriptsBoss(script: BossScript): ScriptsBoss {
  return {
    phaseTriggered:  new Array(script.phases?.length ?? 0).fill(false) as boolean[],
    repeatingTimers: (script.repeating ?? []).map(r => r.initialDelayMs ?? r.intervalMs),
    activeEffects:   [],
  };
}

