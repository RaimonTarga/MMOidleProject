/** Accumulates sampled eligible time; transit, death and long observation gaps do not count. */
export class ObservationWindow {
  private previous: number | null = null;
  private previousEligible = false;
  elapsedMs = 0;
  constructor(readonly requiredMs: number) {
    if (!Number.isFinite(requiredMs) || requiredMs <= 0) throw new Error("Observation duration must be positive");
  }
  sample(now: number, eligible: boolean): boolean {
    if (this.previous !== null && eligible && this.previousEligible) {
      const delta = now - this.previous;
      if (delta > 0 && delta <= 1500) this.elapsedMs += delta;
    }
    this.previous = now;
    this.previousEligible = eligible;
    return this.elapsedMs >= this.requiredMs;
  }
}
