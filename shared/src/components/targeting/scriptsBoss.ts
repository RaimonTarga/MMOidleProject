import type { BossScript } from '../../monsterDatabase';

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
}

export function initScriptsBoss(script: BossScript): ScriptsBoss {
  return {
    phaseTriggered:  new Array(script.phases?.length ?? 0).fill(false) as boolean[],
    repeatingTimers: (script.repeating ?? []).map(r => r.initialDelayMs ?? r.intervalMs),
    activeEffects:   [],
  };
}

