/** Merged DoT archetype slice — wire fields + runtime bookkeeping. */
export interface AppliesDots {
  targetDotStacks: number;
  itInitialized: boolean;
  itBaseCd: number;
  /** Frenzy: true while the doubled-APS state is active (target at max stacks). */
  frenzyActive: boolean;
  /** Frenzy: pre-frenzy attack cooldown, restored when the state drops. */
  frenzyBaseCd: number;
}

export function initAppliesDots(): AppliesDots {
  return {
    targetDotStacks: 0,
    itInitialized:   false,
    itBaseCd:        0,
    frenzyActive:    false,
    frenzyBaseCd:    0,
  };
}
