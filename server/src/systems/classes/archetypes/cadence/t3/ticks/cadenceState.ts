import type { World } from '../../../../../../world/World';
import {
  CRESCENDO_TICK_MS,
  CRESCENDO_DECAY_MS,
  RAMPAGE_DECAY_INTERVAL_MS,
} from '../core/constants';
import { recomputeRampageStats } from '../core/rampage';

/**
 * Per-player cadence runtime tick — drives the time-based T4 specs:
 *   Crescendo — accrue 1 stack/sec in combat, decay slowly out of combat.
 *   Rampage   — shed 1 stack per interval out of combat (restore threshold/APS).
 * (Verdict's bank/execute is hit-driven and lives in pipeline/verdict.ts.)
 */
export function updateCadenceState(world: World, dt: number): void {
  for (const player of world.cadencePlayers) {
    const cadence = player.usesCadence!;
    const passives = player.usesSkills.passives;
    const inCombat = player.hasAttackTarget !== undefined;

    // ── Crescendo ─────────────────────────────────────────────────────────────
    if ((passives['cadence.crescendo'] ?? 0) > 0) {
      cadence.crescendoTimerMs += dt;
      if (inCombat) {
        while (cadence.crescendoTimerMs >= CRESCENDO_TICK_MS) {
          cadence.crescendoTimerMs -= CRESCENDO_TICK_MS;
          cadence.crescendoStacks++;
        }
      } else {
        while (cadence.crescendoStacks > 0 && cadence.crescendoTimerMs >= CRESCENDO_DECAY_MS) {
          cadence.crescendoTimerMs -= CRESCENDO_DECAY_MS;
          cadence.crescendoStacks--;
        }
        if (cadence.crescendoStacks === 0) cadence.crescendoTimerMs = 0;
      }
    }

    // ── Rampage out-of-combat decay ────────────────────────────────────────────
    if ((passives['cadence.rampage'] ?? 0) > 0 && cadence.rampageStacks > 0) {
      if (inCombat) {
        cadence.rampageDecayMs = 0;
      } else {
        cadence.rampageDecayMs += dt;
        let decayed = false;
        while (cadence.rampageStacks > 0 && cadence.rampageDecayMs >= RAMPAGE_DECAY_INTERVAL_MS) {
          cadence.rampageDecayMs -= RAMPAGE_DECAY_INTERVAL_MS;
          cadence.rampageStacks--;
          decayed = true;
        }
        // Recompute threshold/cooldown once from the new stack count (drift-free).
        if (decayed) recomputeRampageStats(player);
      }
    }

  }
}
