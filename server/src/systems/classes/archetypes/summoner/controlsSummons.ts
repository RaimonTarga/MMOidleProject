/** Server-only formation bookkeeping. Never serialized or persisted. */
export interface ControlsSummons {
  /** Weighted generic proc progress, keyed by effect or effect+target. */
  procProgress: Record<string, number>;
  /** Per-target logical cycle: slot ids that have contributed to the cycle. */
  cycleContributorsByTarget: Record<string, string[]>;
  /** Monotonic completed formation-cycle serial by target. */
  cycleSerialByTarget: Record<string, number>;
  /** Deterministic death ordering within the current logic tick. */
  pendingDeadSlotIds: string[];
}

export function initControlsSummons(): ControlsSummons {
  return {
    procProgress: {},
    cycleContributorsByTarget: {},
    cycleSerialByTarget: {},
    pendingDeadSlotIds: [],
  };
}
