// Crescendo (Juggernaut, cadence-heavy-t3-c) — an "infinite scaler".
//
// Time spent in active combat ramps a bonus multiplier applied to the finisher.
// The first CRESCENDO_RAMP_SECONDS deliver the bulk of the scaling
// (CRESCENDO_RAMP_MULT); past that it keeps climbing forever but at a heavily
// diminished rate (CRESCENDO_TAIL_PER_SEC). The ramp resets instantly when combat
// ends (handled in the cadence tick), so it only rewards sustained fights.
// Balance pending — these are first-pass knobs.

export const CRESCENDO_RAMP_SECONDS = 15;    // window that delivers most of the scaling
export const CRESCENDO_RAMP_MULT    = 0.4;   // bonus gained across the ramp window (+40%)
export const CRESCENDO_TAIL_PER_SEC = 0.01;  // heavy-DR infinite growth after the ramp (+1%/s)

/** Finisher bonus multiplier from elapsed in-combat ms (0 = no bonus). */
export function crescendoMultiplier(combatMs: number): number {
  const t = Math.max(0, combatMs) / 1000;
  const rampFrac = Math.min(t, CRESCENDO_RAMP_SECONDS) / CRESCENDO_RAMP_SECONDS;
  let mult = CRESCENDO_RAMP_MULT * rampFrac;
  if (t > CRESCENDO_RAMP_SECONDS) {
    mult += (t - CRESCENDO_RAMP_SECONDS) * CRESCENDO_TAIL_PER_SEC;
  }
  return mult;
}
