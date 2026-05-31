import { GAME_CONFIG } from '@mmo-idle/shared';
import { detachComponent } from '../../../../../../ecs/markerHelpers';
import { markSliceDirty } from '../../../../../../ecs/dirtyHelpers';
import type { PlayerEntity } from '../../../../../../ecs/entity';
import type { World } from '../../../../../../world/World';
import { hasPassive } from '../core/helpers';
import {
  FLASH_ENERGY_PER_HIT,
  FLASH_MAX_EVASION_BONUS_PCT,
  FLASH_MAX_SPEED_BONUS_PCT,
  FLASH_MIN_ATTACK_COOLDOWN,
  FLASH_SHIFT_DECAY_MS,
} from '../core/constants';

function hasFlashRamp(player: PlayerEntity): boolean {
  const energy = player.usesEnergy;
  if (!energy) return false;
  return energy.flashBaseAttackCooldown > 0 ||
    energy.flashBaseDodgeRate > 0 ||
    energy.flashBaseMoveSpeed > 0 ||
    energy.flashSpeedBonusPct > 0 ||
    energy.flashEvasionBonusPct > 0 ||
    energy.energy > 0;
}

export function resetFlashSpeed(world: World, player: PlayerEntity): void {
  const energy = player.usesEnergy;
  if (!energy || !hasFlashRamp(player)) return;

  if (energy.flashBaseAttackCooldown > 0) {
    player.performsAttack.attackCooldown = energy.flashBaseAttackCooldown;
    markSliceDirty(world, player, 'performsAttack');
  }
  if (energy.flashBaseDodgeRate > 0 && player.evadesHits) {
    player.evadesHits.dodgeRate = energy.flashBaseDodgeRate;
    markSliceDirty(world, player, 'evadesHits');
  }
  if (energy.flashBaseMoveSpeed > 0) {
    player.hasPosition.speed = energy.flashBaseMoveSpeed;
    markSliceDirty(world, player, 'hasPosition');
  }

  energy.energy = 0;
  energy.flashBaseAttackCooldown = 0;
  energy.flashBaseDodgeRate = 0;
  energy.flashBaseMoveSpeed = 0;
  energy.flashSpeedBonusPct = 0;
  energy.flashEvasionBonusPct = 0;
  markSliceDirty(world, player, 'usesEnergy');
  detachComponent(world, player, 'hasEmpoweredAttack');
}

function applyFlashShiftStats(world: World, player: PlayerEntity): void {
  const energy = player.usesEnergy;
  if (!energy || energy.energyMax <= 0) return;

  const fillPct = energy.energy / energy.energyMax;
  energy.flashSpeedBonusPct = Math.min(
    FLASH_MAX_SPEED_BONUS_PCT,
    fillPct * FLASH_MAX_SPEED_BONUS_PCT,
  );
  energy.flashEvasionBonusPct = Math.min(
    FLASH_MAX_EVASION_BONUS_PCT,
    fillPct * FLASH_MAX_EVASION_BONUS_PCT,
  );

  if (energy.flashBaseAttackCooldown > 0) {
    player.performsAttack.attackCooldown = Math.max(
      FLASH_MIN_ATTACK_COOLDOWN,
      Math.round(energy.flashBaseAttackCooldown * (1 - energy.flashSpeedBonusPct)),
    );
    markSliceDirty(world, player, 'performsAttack');
  }
  if (energy.flashBaseDodgeRate > 0 && player.evadesHits) {
    // Red Shift adds dodge rate additively (deterministic), capped at the global ceiling.
    player.evadesHits.dodgeRate = Math.min(
      GAME_CONFIG.EVASION_MAX_DODGE,
      energy.flashBaseDodgeRate + energy.flashEvasionBonusPct,
    );
    markSliceDirty(world, player, 'evadesHits');
  }
  if (energy.flashBaseMoveSpeed > 0) {
    player.hasPosition.speed = Math.round(
      energy.flashBaseMoveSpeed * (1 + energy.flashSpeedBonusPct),
    );
    markSliceDirty(world, player, 'hasPosition');
  }

  markSliceDirty(world, player, 'usesEnergy');
}

function decayFlashShift(world: World, player: PlayerEntity, dt: number): void {
  const energy = player.usesEnergy;
  if (!energy || !hasFlashRamp(player)) return;
  if (energy.energyMax === 0) energy.energyMax = 100;

  energy.energy = Math.max(0, energy.energy - energy.energyMax * (dt / FLASH_SHIFT_DECAY_MS));
  applyFlashShiftStats(world, player);

  if (energy.energy <= 0) {
    resetFlashSpeed(world, player);
  }
}

export function applyFlashSpeedGain(world: World, player: PlayerEntity): void {
  const energy = player.usesEnergy;
  if (!energy) return;

  if (energy.energyMax === 0) energy.energyMax = 100;
  if (energy.flashBaseAttackCooldown <= 0) {
    energy.flashBaseAttackCooldown = player.performsAttack.attackCooldown;
  }
  if (energy.flashBaseDodgeRate <= 0 && player.evadesHits) {
    energy.flashBaseDodgeRate = player.evadesHits.dodgeRate;
  }
  if (energy.flashBaseMoveSpeed <= 0) {
    energy.flashBaseMoveSpeed = player.hasPosition.speed;
  }

  energy.energy = Math.min(energy.energy + FLASH_ENERGY_PER_HIT, energy.energyMax);
  applyFlashShiftStats(world, player);
}

export function updateFlashSpeed(world: World, dt: number): void {
  for (const player of world.energyPlayers) {
    if (!hasPassive(player, 'energy.flash')) continue;
    if (player.hasManualMoveIntent || !player.hasAttackTarget) {
      decayFlashShift(world, player, dt);
    }
  }
}
