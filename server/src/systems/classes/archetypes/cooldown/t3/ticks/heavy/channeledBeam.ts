import type { World } from '../../../../../../../world/World';
import type { PlayerEntity } from '../../../../../../../ecs/components/player';
import type { MonsterEntity } from '../../../../../../../ecs/components/monster';
import { setAttackTarget } from '../../../../../../combat/ai/targeting';
import { grantMonsterRewards } from '../../../../../../player/progression/rewards';
import { endChannel } from '../../core/helpers';
import { BEAM_DURATION_MS, BEAM_TICK_MS, BEAM_DMG_PER_TICK_MULT } from '../../core/constants';

/**
 * Channeled Beam tick. Drains `isChanneling.remainingMs`, ticks damage
 * every BEAM_TICK_MS, and auto-reacquires nearby targets within range when
 * the current one dies or leaves the node. Channel ends when:
 *   - remainingMs reaches 0
 *   - target is killed and no reacquisition target exists
 *   - target leaves the node and no reacquisition target exists
 */
export function updateChanneledBeam(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const entity of world.channelingPlayers) {
    const player  = entity;
    const channel = entity.isChanneling;

    const remaining = channel.remainingMs - dt;
    if (remaining <= 0) {
      endChannel(world, player);
      console.log(`[BeamChannel] ${player.isPlayer.id}: channel complete`);
      continue;
    }

    channel.remainingMs = remaining;
    channel.pct = Math.round((1 - remaining / BEAM_DURATION_MS) * 100);

    if (!channel.targetId) { endChannel(world, player); continue; }

    let monster = world.getMonsterEntity(channel.targetId);
    if (!monster || monster.hasPosition.nodeId !== player.hasPosition.nodeId) {
      const newTarget = findBeamTarget(world, player);
      if (newTarget) {
        channel.targetId = newTarget.isMonster.id;
        setAttackTarget(world, player, newTarget.isMonster.id);
        monster = newTarget;
        console.log(`[BeamChannel] ${player.isPlayer.id}: target lost - reacquired ${newTarget.isMonster.id}`);
      } else {
        endChannel(world, player);
        console.log(`[BeamChannel] ${player.isPlayer.id}: target gone, no reacquisition - channel ended`);
        continue;
      }
    }

    const nextTick = channel.nextTickMs - dt;
    if (nextTick <= 0) {
      channel.nextTickMs = nextTick + BEAM_TICK_MS;

      const dmgPerTick = Math.max(1, Math.round(player.dealsDamage.attack * BEAM_DMG_PER_TICK_MULT));
      monster.hasHealth.hp -= dmgPerTick;
      console.log(
        `[BeamChannel] ${player.isPlayer.id}: ${dmgPerTick} tick dmg on ${monster.isMonster.id}, hp=${Math.max(0, monster.hasHealth.hp)}`,
      );

      if (monster.hasHealth.hp <= 0) {
        toKill.push({ monsterId: monster.isMonster.id, sourceId: player.isPlayer.id });
        const newTarget = findBeamTarget(world, player, monster.isMonster.id);
        if (newTarget) {
          channel.targetId = newTarget.isMonster.id;
          setAttackTarget(world, player, newTarget.isMonster.id);
          console.log(`[BeamChannel] ${player.isPlayer.id}: kill-reacquire -> ${newTarget.isMonster.id}`);
        } else {
          endChannel(world, player);
          console.log(`[BeamChannel] ${player.isPlayer.id}: target killed, no reacquisition - channel ended`);
        }
      }
    } else {
      channel.nextTickMs = nextTick;
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.removeMonsterEntity(monsterId);
  }
}

/** Nearest monster within attack range on the player's node, excluding one ID. */
function findBeamTarget(world: World, player: PlayerEntity, excludeId?: string): MonsterEntity | undefined {
  let best: MonsterEntity | undefined;
  let bestDist = Infinity;

  for (const entity of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (excludeId && entity.isMonster.id === excludeId) continue;
    const dx   = entity.hasPosition.current.x - player.hasPosition.current.x;
    const dy   = entity.hasPosition.current.y - player.hasPosition.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= player.performsAttack.attackRange && dist < bestDist) {
      bestDist = dist;
      best     = entity;
    }
  }
  return best;
}
