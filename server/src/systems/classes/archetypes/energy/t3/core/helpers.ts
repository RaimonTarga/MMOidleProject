import type { PassiveKey, UsesEnergy } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../../../ecs/entity';
import type { World } from '../../../../../../world/World';
import { attachComponent, detachComponent } from '../../../../../../ecs/markerHelpers';

export function hasPassive(player: PlayerEntity, key: PassiveKey): boolean {
  return (player.usesSkills.passives[key] ?? 0) > 0;
}

export function energyPercent(energy: UsesEnergy): number {
  if (energy.energyMax <= 0) return 0;
  return energy.energy / energy.energyMax;
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
