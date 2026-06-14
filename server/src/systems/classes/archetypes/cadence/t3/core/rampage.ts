import type { PlayerEntity } from '../../../../../../ecs/entity';
import { RAMPAGE_THRESHOLD_FLOOR, RAMPAGE_APS_PER_STACK_MS } from './constants';

const CADENCE_THRESHOLD_DEFAULT = 5;
const ATTACK_COOLDOWN_FLOOR_MS = 200;

/**
 * Recompute Berserker's rampage stat effects (combo threshold + attack cooldown)
 * from the current `rampageStacks`. Routed through here by every path that changes
 * the stack count — finisher gain, out-of-combat decay, and the overload reset.
 *
 * The cooldown uses an undo-then-reapply model: we add back the exact amount we
 * previously subtracted (`rampageCdReduction`), then reapply for the new stack
 * count clamped to the floor. This stays drift-free no matter how many stacks
 * pushed the cooldown into the floor (a plain += / -= would over-restore on reset).
 */
export function recomputeRampageStats(player: PlayerEntity): void {
  const cadence = player.usesCadence;
  if (!cadence) return;
  const passives = player.usesSkills.passives;

  const baseThreshold = Math.max(
    RAMPAGE_THRESHOLD_FLOOR,
    Math.round(
      (passives['cadence.empowered-threshold'] ?? CADENCE_THRESHOLD_DEFAULT) +
        (passives['cadence.threshold-mod'] ?? 0),
    ),
  );

  player.performsAttack.attackCooldown += cadence.rampageCdReduction;
  const desired = cadence.rampageStacks * RAMPAGE_APS_PER_STACK_MS;
  cadence.rampageCdReduction = Math.min(
    desired,
    Math.max(0, player.performsAttack.attackCooldown - ATTACK_COOLDOWN_FLOOR_MS),
  );
  player.performsAttack.attackCooldown -= cadence.rampageCdReduction;

  cadence.threshold = Math.max(RAMPAGE_THRESHOLD_FLOOR, baseThreshold - cadence.rampageStacks);
}
