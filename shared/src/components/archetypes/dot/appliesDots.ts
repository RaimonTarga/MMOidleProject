/** Merged DoT archetype slice — wire fields + runtime bookkeeping. */
export interface AppliesDots {
  targetDotStacks: number;
  /** Authoritative progress toward the current target's next primary DoT tick (0..100). */
  targetDotTickPct: number;
}

export function initAppliesDots(): AppliesDots {
  return {
    targetDotStacks: 0,
    targetDotTickPct: 0,
  };
}
