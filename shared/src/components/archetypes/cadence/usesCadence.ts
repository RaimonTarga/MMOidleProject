/** Merged cadence archetype slice — wire fields + runtime bookkeeping. */
export interface UsesCadence {
  /** The beat counter: the index of the next beat of the combo. */
  count: number;
  /** The combo length, the finisher included (the Order sets it). */
  threshold: number;
  // ── The Order (class-first build plan CS.1) ────────────────────────────────
  /** The spark trophy riding this combo (armed by the last finisher), or null. */
  sparkTrophyId: string | null;
  /** Coil resolved this combo: the finisher hits harder. */
  coiled: boolean;
}

export function initUsesCadence(args: { threshold: number }): UsesCadence {
  return {
    count:         0,
    threshold:     args.threshold,
    sparkTrophyId: null,
    coiled:        false,
  };
}
