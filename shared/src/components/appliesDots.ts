/** Merged DoT archetype slice — wire fields + runtime bookkeeping. */
export interface AppliesDots {
  targetDotStacks: number;
  itInitialized: boolean;
  itBaseCd: number;
}

export function makeAppliesDotsFromSnapshot(snapshot: {
  targetDotStacks: number;
}): AppliesDots {
  return {
    targetDotStacks: snapshot.targetDotStacks,
    itInitialized:   false,
    itBaseCd:        0,
  };
}

export function refreshAppliesDotsFromSnapshot(
  slice: AppliesDots,
  snapshot: { targetDotStacks: number },
): void {
  slice.targetDotStacks = snapshot.targetDotStacks;
  slice.itInitialized   = false;
  slice.itBaseCd        = 0;
}
