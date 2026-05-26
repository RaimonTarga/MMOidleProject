/** Chill stacks on the current attack target (Freezing Cold). */
export interface ChillsTarget {
  targetChillStacks: number;
}

export function initChillsTarget(): ChillsTarget {
  return {
    targetChillStacks: 0,
  };
}
