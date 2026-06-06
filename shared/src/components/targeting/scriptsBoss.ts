import type { BossScript, MonsterDefinition } from '../../monsterDatabase';

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
}

export function initScriptsBoss(script: BossScript): ScriptsBoss {
  return {
    phaseTriggered:  new Array(script.phases?.length ?? 0).fill(false) as boolean[],
    repeatingTimers: (script.repeating ?? []).map(r => r.initialDelayMs ?? r.intervalMs),
    activeEffects:   [],
  };
}

