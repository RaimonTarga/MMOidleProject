import { getStatusEffect } from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import { markSliceDirty } from '../../../../../../ecs/dirtyHelpers';
import { pushDotTickEvent } from '../../../../../combat/damage/dotTickEvent';
import { emitPlayerMonsterOnKill } from '../../../../../combat/damage/killHooks';
import { isInvulnerableMonster } from '../../../../../combat/invulnerability';
import { grantMonsterRewards } from '../../../../../player/progression/rewards';
import {
  buildSimpleBreakdown,
  recordMonsterDamagedByPlayer,
  recordPlayerKillMonster,
} from '../../../../../../world/worldLogCombat';
import { actorFromSourceId } from '../../../../../../world/worldLogActors';
import {
  OVERDRIVE_DECAY_PER_SEC,
  UPKEEP_DECAY_BASE, UPKEEP_DECAY_RAMP_PER_SEC,
  BINARY_CHARGE_SPEED_FACTOR, BINARY_DISCHARGE_SPEED_FACTOR,
  CRITICAL_MASS_RESET_MS,
  STORM_FX, ENDLESS_STORM_DPS, ENDLESS_STORM_TICK_MS,
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
      // Decay ramps with sustain time — caps the infinite stacking.
      const upkeepSec = energy.upkeepTimerMs / 1000;
      const decayPerSec = UPKEEP_DECAY_BASE + UPKEEP_DECAY_RAMP_PER_SEC * upkeepSec;
      energy.energy = Math.max(0, energy.energy - decayPerSec * dt / 1000);
      // Flow persists as long as you have ANY energy; it only resets the instant
      // energy hits 0 (the ramping decay is what eventually forces that).
      if (energy.energy > 0) energy.upkeepTimerMs += dt;
      else energy.upkeepTimerMs = 0;
    }

    // Binary Cycle: per-state attack-speed swing (Charge slower / Discharge faster).
    // Reassert each tick from a cached clean base; if attackCooldown no longer matches
    // what we last wrote, a recalc reset it — recapture the fresh base and reapply.
    if ((passives['energy.binary-cycle'] ?? 0) > 0) {
      const factor = energy.binaryDischargeState ? BINARY_DISCHARGE_SPEED_FACTOR : BINARY_CHARGE_SPEED_FACTOR;
      if (player.performsAttack.attackCooldown !== energy.binaryAppliedCd) {
        energy.binaryBaseCd = player.performsAttack.attackCooldown;
      }
      const desired = Math.max(100, Math.round(energy.binaryBaseCd * factor));
      if (player.performsAttack.attackCooldown !== desired) {
        player.performsAttack.attackCooldown = desired;
        markSliceDirty(world, player, 'performsAttack');
      }
      energy.binaryAppliedCd = desired;
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
  const toKill: Array<{ monsterId: string; sourceId: string; damage: number }> = [];
  for (const monster of world.monsterEntities) {
    const storm = getStatusEffect(monster.tracksCombat, STORM_FX);
    if (!storm) continue;
    if (isInvulnerableMonster(monster)) continue;
    storm.data.nextTickIn = (storm.data.nextTickIn ?? 0) - dt;
    if (storm.data.nextTickIn > 0) continue;
    const tickMs = storm.data.tickIntervalMs ?? ENDLESS_STORM_TICK_MS;
    storm.data.nextTickIn = tickMs;

    const dmg = Math.max(1, Math.round(storm.data.damagePerTick ?? ((storm.data.dps ?? ENDLESS_STORM_DPS) * tickMs / 1000)));
    // Apply as a DoT so the number renders stormy (purple ⚡), not a white direct hit.
    recordMonsterDamagedByPlayer(
      world, storm.sourceId, actorFromSourceId(world, storm.sourceId), monster, dmg,
      'dot', buildSimpleBreakdown(dmg, dmg),
    );
    monster.hasHealth.hp -= dmg;
    pushDotTickEvent(world, monster, 'lightning', dmg, { sourceType: 'special' });
    if (monster.hasHealth.hp <= 0) {
      toKill.push({ monsterId: monster.isMonster.id, sourceId: storm.sourceId, damage: dmg });
    }
  }

  for (const { monsterId, sourceId, damage } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      emitPlayerMonsterOnKill(world, sourceId, monster, damage, 'dot');
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      recordPlayerKillMonster(world, sourceId, monster, damage, rewardInfo);
    }
    if (monster) world.removeMonsterEntity(monsterId);
  }
}
