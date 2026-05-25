/** Merged cooldown archetype slice — wire fields + runtime bookkeeping. */
export interface UsesCooldown {
  executionCooldownPct: number;
  initialized: boolean;
  executionCooldownMs: number;
  batteryTimerAcc: number;
  singularNoTargetMs: number;
}

export function initUsesCooldown(): UsesCooldown {
  return {
    executionCooldownPct: 0,
    initialized:          false,
    executionCooldownMs:  0,
    batteryTimerAcc:      0,
    singularNoTargetMs:   0,
  };
}
