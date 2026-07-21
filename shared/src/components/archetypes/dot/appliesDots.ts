/** Merged DoT archetype slice — wire fields + runtime bookkeeping. */
export interface AppliesDots {
  targetDotStacks: number;
  /** Authoritative progress toward the current target's next primary DoT tick (0..100). */
  targetDotTickPct: number;
  itInitialized: boolean;
  itBaseCd: number;
  /** Frenzy: cached clean attack cooldown while the buff is active (0 = inactive). */
  frenzyBaseCd: number;
  /** Frenzy: last attack cooldown this spec wrote (to detect recalc resets). */
  frenzyAppliedCd: number;
}

export function initAppliesDots(): AppliesDots {
  return {
    targetDotStacks: 0,
    targetDotTickPct: 0,
    itInitialized:   false,
    itBaseCd:        0,
    frenzyBaseCd:    0,
    frenzyAppliedCd: 0,
  };
}
