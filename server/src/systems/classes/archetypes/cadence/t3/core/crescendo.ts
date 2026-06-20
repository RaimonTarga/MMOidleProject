// Crescendo (Juggernaut, cadence-heavy-t3-c) — an "infinite scaler".
//
// Time spent in active combat ramps a bonus multiplier applied to the finisher.
// The first CRESCENDO_RAMP_SECONDS deliver the bulk of the scaling
// (CRESCENDO_RAMP_MULT); past that it keeps climbing forever but at a heavily
// diminished rate (CRESCENDO_TAIL_PER_SEC). The ramp resets instantly when combat
// ends (handled in the cadence tick), so it only rewards sustained fights.
// Balance pending — these are first-pass knobs.

import type { PassiveMap } from '@mmo-idle/shared';

// Fallback defaults — the live values are authored on the Juggernaut node
// (cadence.crescendo-ramp-seconds / -ramp-mult / -tail-per-sec).
export const CRESCENDO_RAMP_SECONDS = 15;    // window that delivers most of the scaling
export const CRESCENDO_RAMP_MULT    = 0.4;   // bonus gained across the ramp window (+40%)
export const CRESCENDO_TAIL_PER_SEC = 0.01;  // heavy-DR infinite growth after the ramp (+1%/s)

/**
 * Finisher bonus multiplier from elapsed in-combat ms (0 = no bonus). Reads the
 * ramp tuning from the player's passives when provided, falling back to the
 * constants above so the HUD/display can call it without a passive map.
 */
export function crescendoMultiplier(combatMs: number, passives?: PassiveMap): number {
  const rampSeconds = passives?.['cadence.crescendo-ramp-seconds'] ?? CRESCENDO_RAMP_SECONDS;
  const rampMult    = passives?.['cadence.crescendo-ramp-mult'] ?? CRESCENDO_RAMP_MULT;
  const tailPerSec  = passives?.['cadence.crescendo-tail-per-sec'] ?? CRESCENDO_TAIL_PER_SEC;
  const t = Math.max(0, combatMs) / 1000;
  const rampFrac = Math.min(t, rampSeconds) / rampSeconds;
  let mult = rampMult * rampFrac;
  if (t > rampSeconds) {
    mult += (t - rampSeconds) * tailPerSec;
  }
  return mult;
}
