/** Merged DoT archetype slice — wire fields + runtime bookkeeping. */
export interface AppliesDots {
  targetDotStacks: number;
  itInitialized: boolean;
  itBaseCd: number;
}

export function initAppliesDots(): AppliesDots {
  return {
    targetDotStacks: 0,
    itInitialized:   false,
    itBaseCd:        0,
  };
}
