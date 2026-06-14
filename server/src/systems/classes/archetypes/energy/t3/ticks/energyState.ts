import { getStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import { applyPlayerProcDamage } from '../../../../../combat/damage/procDamage';
import { energyPercent } from '../core/helpers';
import {
  OVERDRIVE_DECAY_PER_SEC,
  UPKEEP_DECAY_PER_SEC, UPKEEP_THRESHOLD_PCT,
  CRITICAL_MASS_RESET_MS,
  STORM_FX, ENDLESS_STORM_DPS,
} from '../core/constants';

/**
 * Per-tick energy T4 state:
 *   - Overdrive   : decay energy 100→0 while active; end the mode at empty.
 *   - Energy Upkeep: continuous energy decay + upkeep-timer accumulation.
 *   - Critical Mass: reset stacks after a gap with no damage dealt.
 *   - Endless Storm: tick the storm DoT on affected monsters.
 */
export function updateEnergyState(world: World, dt: number): void {
  let anyStorm = false;

  for (const player of world.energyPlayers) {
    const energy = player.usesEnergy;
    const passives = player.usesSkills.passives;

    if ((passives['energy.overdrive'] ?? 0) > 0 && energy.overdriveActive) {
      energy.energy = Math.max(0, energy.energy - OVERDRIVE_DECAY_PER_SEC * dt / 1000);
      if (energy.energy <= 0) {
        energy.energy = 0;
        energy.overdriveActive = false;
      }
    }

    if ((passives['energy.upkeep'] ?? 0) > 0) {
      energy.energy = Math.max(0, energy.energy - UPKEEP_DECAY_PER_SEC * dt / 1000);
      if (energyPercent(energy) >= UPKEEP_THRESHOLD_PCT) energy.upkeepTimerMs += dt;
      else energy.upkeepTimerMs = 0;
    }

    if ((passives['energy.critical-mass'] ?? 0) > 0 && energy.criticalMassStacks > 0) {
      energy.criticalMassGapMs += dt;
      if (energy.criticalMassGapMs >= CRITICAL_MASS_RESET_MS) energy.criticalMassStacks = 0;
    }

    if ((passives['energy.endless-storm'] ?? 0) > 0) anyStorm = true;
  }

  // Endless Storm DoT — only scan monsters when a storm caster is present.
  // TODO(perf/engine): no marker query for storm yet; scans all monsters. Storm
  // transfer to the next target on death is also not yet implemented.
  if (!anyStorm) return;
  for (const monster of world.monsterEntities) {
    const storm = getStatusEffect(monster.tracksCombat, STORM_FX);
    if (!storm) continue;
    storm.data.nextTickIn = (storm.data.nextTickIn ?? 0) - dt;
    if (storm.data.nextTickIn > 0) continue;
    const tickMs = storm.data.tickIntervalMs ?? 1000;
    storm.data.nextTickIn = tickMs;

    const dmg = Math.max(1, Math.round((storm.data.dps ?? ENDLESS_STORM_DPS) * tickMs / 1000));
    const caster = world.getPlayerEntity(storm.sourceId);
    if (caster) {
      applyPlayerProcDamage(world, caster, monster, dmg, { tags: ['energy-storm'] });
    } else {
      monster.hasHealth.hp -= dmg;
      if (monster.hasHealth.hp <= 0) removeStatusEffect(monster.tracksCombat, STORM_FX);
    }
  }
}
