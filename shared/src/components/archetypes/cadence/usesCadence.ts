/** Merged cadence archetype slice — wire fields + runtime bookkeeping. */
export interface UsesCadence {
  count: number;
  threshold: number;
  speedStacks: number;
  seqDmg: number;
  charge: number;
  echo: number;
}

export function initUsesCadence(args: { threshold: number }): UsesCadence {
  return {
    count:       0,
    threshold:   args.threshold,
    speedStacks: 0,
    seqDmg:      0,
    charge:      0,
    echo:        0,
  };
}
