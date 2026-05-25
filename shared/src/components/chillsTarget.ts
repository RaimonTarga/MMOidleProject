/** Chill stacks on the current attack target (Freezing Cold). */
export interface ChillsTarget {
  targetChillStacks: number;
}

export function makeChillsTargetFromSnapshot(snapshot: {
  targetChillStacks: number;
}): ChillsTarget {
  return {
    targetChillStacks: snapshot.targetChillStacks,
  };
}

export function refreshChillsTargetFromSnapshot(
  slice: ChillsTarget,
  snapshot: { targetChillStacks: number },
): void {
  slice.targetChillStacks = snapshot.targetChillStacks;
}
