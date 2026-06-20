import type { PassiveKey, UsesEnergy } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../../../ecs/entity';
import type { World } from '../../../../../../world/World';
import { attachComponent, detachComponent } from '../../../../../../ecs/markerHelpers';
import { CHARGE_STATE_MIN, CHARGE_STATE_MAX } from './constants';

export function hasPassive(player: PlayerEntity, key: PassiveKey): boolean {
  return (player.usesSkills.passives[key] ?? 0) > 0;
}

export function energyPercent(energy: UsesEnergy): number {
  if (energy.energyMax <= 0) return 0;
  return energy.energy / energy.energyMax;
}

/**
 * Aetherist (charge-state) attack multiplier: piecewise-linear oscillation with a
 * neutral midpoint — MIN at empty, 1.0× at half energy, MAX at full.
 */
export function chargeStateMult(
  fillPct: number,
  minMult = CHARGE_STATE_MIN,
  maxMult = CHARGE_STATE_MAX,
): number {
  const f = Math.max(0, Math.min(1, fillPct));
  return f <= 0.5
    ? minMult + (1 - minMult) * (f * 2)
    : 1 + (maxMult - 1) * ((f - 0.5) * 2);
}

/**
 * End an Alternating Currents discharge phase. Restores the captured base
 * attack cooldown, detaches `inAcDischarge`, and flips back into the charge
 * phase by attaching `inAcChargePhase`.
 */
export function endACDischarge(world: World, player: PlayerEntity): void {
  if (player.inAcDischarge) {
    player.performsAttack.attackCooldown = player.inAcDischarge.baseCd;
  }
  detachComponent(world, player, 'inAcDischarge');
  attachComponent(world, player, 'inAcChargePhase', {});
  console.log(`[AltCurrents] ${player.isPlayer.id}: discharge → charge phase`);
}
