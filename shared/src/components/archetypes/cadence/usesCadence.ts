/** Merged cadence archetype slice — wire fields + runtime bookkeeping. */
export interface UsesCadence {
  count: number;
  threshold: number;
  speedStacks: number;
  charge: number;
  echo: number;
  // ── T4 spec runtime state ──────────────────────────────────────────────────
  /** Aftershock: remaining regular attacks that fire their on-hit damage twice. */
  aftershockCharges: number;
  /** Metronome: flat damage accumulated this cycle, applied to subsequent attacks. */
  metronomeBonus: number;
  /** Metronome: number of buildup attacks accumulated this cycle (buff badge). */
  metronomeStacks: number;
  /** Resonance (Wavecrest): buildup attacks this cycle that amplify the finisher. */
  resonanceStacks: number;
  /** Rampage: stacks accrued from finishers (threshold-down / APS-up / mult-up). */
  rampageStacks: number;
  /** Rampage: ms accumulator for out-of-combat stack decay. */
  rampageDecayMs: number;
  /** Rampage: ms currently subtracted from attack cooldown (for exact undo). */
  rampageCdReduction: number;
  /** Crescendo: per-second in-combat stacks consumed on the next finisher. */
  crescendoStacks: number;
  /** Crescendo: ms accumulator toward the next +1 stack (or decay while OOC). */
  crescendoTimerMs: number;
  /** Verdict: character-side banked execution power (persists across targets). */
  verdictStored: number;
}

export function initUsesCadence(args: { threshold: number }): UsesCadence {
  return {
    count:       0,
    threshold:   args.threshold,
    speedStacks: 0,
    charge:      0,
    echo:        0,
    aftershockCharges: 0,
    metronomeBonus:    0,
    metronomeStacks:   0,
    resonanceStacks:   0,
    rampageStacks:     0,
    rampageDecayMs:    0,
    rampageCdReduction: 0,
    crescendoStacks:   0,
    crescendoTimerMs:  0,
    verdictStored:     0,
  };
}
