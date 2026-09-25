// Crescendo (Juggernaut, cadence-heavy-t3-c) — an "infinite scaler".
//
// Time spent in active combat ramps a bonus multiplier applied to the finisher.
// The first CRESCENDO_RAMP_SECONDS deliver the bulk of the scaling
// (CRESCENDO_RAMP_MULT); past that it climbs linearly (CRESCENDO_TAIL_PER_SEC)
// until CRESCENDO_KNEE_MULT, then keeps climbing forever on a logarithmic tail
// (CRESCENDO_KNEE_SCALE). The ramp resets instantly when combat ends (handled in
// the cadence tick), so it only rewards sustained fights.

import type { PassiveMap } from '@mmo-idle/shared';

// Fallback defaults — the live values are authored on the Juggernaut node
// (cadence.crescendo-ramp-seconds / -ramp-mult / -tail-per-sec).
export const CRESCENDO_RAMP_SECONDS = 15;    // window that delivers most of the scaling
export const CRESCENDO_RAMP_MULT    = 0.45;  // bonus gained across the ramp window (+45%)
export const CRESCENDO_TAIL_PER_SEC = 0.01;  // linear growth after the ramp (+1%/s), up to the knee
// Logarithmic knee (T4 scaling study): past +100% the bonus keeps growing as
// KNEE + SCALE * ln(1 + excess / SCALE) — continuous value and slope at the knee.
// With the authored ramp: +100% at 70s, ~+118% at 120s, ~+132% at 300s, ~+140% at 600s.
export const CRESCENDO_KNEE_MULT    = 1.0;   // bonus where the log tail begins (+100%)
export const CRESCENDO_KNEE_SCALE   = 0.1;   // log-tail scale; smaller = flatter past the knee

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
  if (mult <= CRESCENDO_KNEE_MULT) return mult;
  return CRESCENDO_KNEE_MULT + CRESCENDO_KNEE_SCALE * Math.log1p((mult - CRESCENDO_KNEE_MULT) / CRESCENDO_KNEE_SCALE);
}
