import type { World } from '../../../../../../world/World';
import { grantMonsterRewards } from '../../../../../player/progression/rewards';
import { hasPassive, endACDischarge } from '../core/helpers';
import {
  AC_DISCHARGE_TOTAL_MS, AC_TICK_INTERVAL_MS, AC_TICK_DAMAGE_MULT,
} from '../core/constants';
import {
  buildSimpleBreakdown,
  recordMonsterDamagedByPlayer,
  recordPlayerKillMonster,
} from '../../../../../../world/worldLogCombat';
import { actorFromPlayer } from '../../../../../../world/worldLogActors';
import { isInvulnerableMonster } from '../../../../../combat/invulnerability';

interface PendingKill {
  monsterId: string;
  sourceId: string;
}

/**
 * Alternating Currents (energy-balanced-t3-a) discharge tick.
 *
 * While the player is in `inAcDischarge`:
 *   - Energy bar drains linearly over `AC_DISCHARGE_TOTAL_MS`.
 *   - Every `AC_TICK_INTERVAL_MS` deal `AC_TICK_DAMAGE_MULT × attack` damage
 *     to the current attack target (if same node).
 *   - When `remainingMs` hits 0, restore base attack cooldown and flip back
 *     to charge phase via `endACDischarge`.
 *
 * Kills are deferred until after the iteration so we don't mutate
 * `world.energyPlayers` mid-loop via reward triggers.
 */
export function updateAlternatingCurrents(world: World, dt: number): void {
  const toKill: PendingKill[] = [];

  for (const entity of world.energyPlayers) {
    const player = entity;
    if (!hasPassive(player, 'energy.alternating-currents')) continue;

    const energy    = entity.usesEnergy;
    const discharge = entity.inAcDischarge;
    if (!discharge) continue;

    const newMs = Math.max(0, discharge.remainingMs - dt);
    discharge.remainingMs = newMs;

    energy.energy = Math.max(0, energy.energy - energy.energyMax * (dt / AC_DISCHARGE_TOTAL_MS));

    const tickNext = discharge.tickNext - dt;
    if (tickNext <= 0) {
      discharge.tickNext = tickNext + AC_TICK_INTERVAL_MS;
      const targetId = player.hasAttackTarget?.targetId;
      if (targetId) {
        const monster = world.getMonsterEntity(targetId);
        if (
          monster &&
          monster.hasPosition.nodeId === player.hasPosition.nodeId &&
          !isInvulnerableMonster(monster)
        ) {
          const tickDmg = Math.max(1, Math.round(player.dealsDamage.attack * AC_TICK_DAMAGE_MULT));
          recordMonsterDamagedByPlayer(
            world,
            player.isPlayer.id,
            actorFromPlayer(player),
            monster,
            tickDmg,
            'proc',
            buildSimpleBreakdown(tickDmg, tickDmg),
          );
          monster.hasHealth.hp -= tickDmg;
          console.log(`[AltCurrents] ${player.isPlayer.id}: ${tickDmg} discharge tick on ${targetId}, hp=${Math.max(0, monster.hasHealth.hp)}`);
          if (monster.hasHealth.hp <= 0) toKill.push({ monsterId: targetId, sourceId: player.isPlayer.id });
        }
      }
    } else {
      discharge.tickNext = tickNext;
    }

    if (newMs <= 0) endACDischarge(world, player);
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      recordPlayerKillMonster(world, sourceId, monster, 0, rewardInfo);
    }
    world.removeMonsterEntity(monsterId);
  }
}
