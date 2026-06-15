/** Merged cooldown archetype slice — wire fields + runtime bookkeeping. */
export interface UsesCooldown {
  executionCooldownPct: number;
  initialized: boolean;
  executionCooldownMs: number;
  batteryTimerAcc: number;
  singularNoTargetMs: number;
  // ── T4 spec runtime state ──────────────────────────────────────────────────
  /** Reverb: attacks landed in the current CD window (resets each execution). */
  reverbAttackCount: number;
  /** Reverb: bonus fraction (from the prior window) applied to the next execution. */
  reverbStoredBonus: number;
  /** Vengeance: damage taken since the last execution (cashed out + reset on it). */
  vengeanceDamageTaken: number;
  /** Rupture: ms left on the post-execution 50%-plating-bypass window. */
  ruptureWindowMs: number;
}

export function initUsesCooldown(): UsesCooldown {
  return {
    executionCooldownPct: 0,
    initialized:          false,
    executionCooldownMs:  0,
    batteryTimerAcc:      0,
    singularNoTargetMs:   0,
    reverbAttackCount:    0,
    reverbStoredBonus:    0,
    vengeanceDamageTaken: 0,
    ruptureWindowMs:      0,
  };
}
