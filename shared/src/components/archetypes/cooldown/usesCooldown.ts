/** Merged cooldown archetype slice — wire fields + runtime bookkeeping. */
export interface UsesCooldown {
  executionCooldownPct: number;
  initialized: boolean;
  executionCooldownMs: number;
  batteryTimerAcc: number;
  // ── T4 spec runtime state ──────────────────────────────────────────────────
  /** Vengeance: damage taken since the last execution (cashed out + reset on it). */
  vengeanceDamageTaken: number;
  /** Rupture: ms left on the post-execution 50%-plating-bypass window. */
  ruptureWindowMs: number;
  // ── Resolve (class-first build plan CQ.1) ───────────────────────────────────
  /** Resolve in pips (fractional while it fills). */
  resolve: number;
  /** The bar's size in pips: the class budget. */
  resolveMax: number;
}

export function initUsesCooldown(): UsesCooldown {
  return {
    executionCooldownPct: 0,
    initialized:          false,
    executionCooldownMs:  0,
    batteryTimerAcc:      0,
    vengeanceDamageTaken: 0,
    ruptureWindowMs:      0,
    resolve:              0,
    resolveMax:           0,
  };
}
