import {
  GAME_CONFIG,
  relicRatingsFromPassives,
  resolveEnergyRelicProfile,
} from '@mmo-idle/shared';
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

  const passives = player.usesSkills.passives;
  const maxSpeedBonus = Math.max(0, passives['energy.flash-max-speed-bonus-pct'] ?? FLASH_MAX_SPEED_BONUS_PCT);
  const maxEvasionBonus = Math.max(0, passives['energy.flash-max-evasion-bonus-pct'] ?? FLASH_MAX_EVASION_BONUS_PCT);
  const fillPct = energy.energy / energy.energyMax;
  energy.flashSpeedBonusPct = Math.min(
    maxSpeedBonus,
    fillPct * maxSpeedBonus,
  );
  energy.flashEvasionBonusPct = Math.min(
    maxEvasionBonus,
    fillPct * maxEvasionBonus,
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

  const decayMs = Math.max(1, player.usesSkills.passives['energy.flash-shift-decay-ms'] ?? FLASH_SHIFT_DECAY_MS);
  energy.energy = Math.max(0, energy.energy - energy.energyMax * (dt / decayMs));
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

  const passives = player.usesSkills.passives;
  const baseGain = Math.max(0, passives['energy.flash-energy-per-hit'] ?? FLASH_ENERGY_PER_HIT);
  const energyPerHit = resolveEnergyRelicProfile(
    baseGain,
    Math.max(1, energy.energyMax),
    passives['energy.empowered-mult'] ?? 2,
    relicRatingsFromPassives(passives),
  ).gainPerHit.after;
  energy.energy = Math.min(energy.energy + energyPerHit, energy.energyMax);
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
