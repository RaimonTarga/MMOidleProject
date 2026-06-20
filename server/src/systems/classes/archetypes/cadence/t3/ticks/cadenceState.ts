import type { World } from '../../../../../../world/World';
import { RAMPAGE_DECAY_INTERVAL_MS } from '../core/constants';
import { recomputeRampageStats } from '../core/rampage';

/**
 * Per-player cadence runtime tick — drives the time-based T4 specs:
 *   Crescendo — ramp in-combat elapsed time (resets instantly out of combat).
 *   Rampage   — shed 1 stack per interval out of combat (restore threshold/APS).
 * (Verdict's bank/execute is hit-driven and lives in pipeline/verdict.ts.)
 */
export function updateCadenceState(world: World, dt: number): void {
  for (const player of world.cadencePlayers) {
    const cadence = player.usesCadence!;
    const passives = player.usesSkills.passives;
    const inCombat = player.hasAttackTarget !== undefined;

    // ── Crescendo (Juggernaut) ──────────────────────────────────────────────────
    // Accrue in-combat time (drives the finisher ramp multiplier); reset instantly
    // the moment combat ends so the scaling only rewards sustained fights.
    if ((passives['cadence.crescendo'] ?? 0) > 0) {
      cadence.crescendoTimerMs = inCombat ? cadence.crescendoTimerMs + dt : 0;
    }

    // ── Rampage out-of-combat decay ────────────────────────────────────────────
    if ((passives['cadence.rampage'] ?? 0) > 0 && cadence.rampageStacks > 0) {
      if (inCombat) {
        cadence.rampageDecayMs = 0;
      } else {
        cadence.rampageDecayMs += dt;
        const decayInterval = passives['cadence.rampage-decay-interval-ms'] ?? RAMPAGE_DECAY_INTERVAL_MS;
        let decayed = false;
        while (cadence.rampageStacks > 0 && cadence.rampageDecayMs >= decayInterval) {
          cadence.rampageDecayMs -= decayInterval;
          cadence.rampageStacks--;
          decayed = true;
        }
        // Recompute threshold/cooldown once from the new stack count (drift-free).
        if (decayed) recomputeRampageStats(player);
      }
    }

  }
}
