import type { TracksCombat, WorldLogActor } from '@mmo-idle/shared';
import type { MinionEntity, PlayerEntity } from '../../../ecs/entity';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import type { World } from '../../../world/World';
import { recordWorldLogEvent } from '../../../world/worldLog';
import { actorFromMinion, actorFromPlayer } from '../../../world/worldLogActors';

/**
 * Returns the healing multiplier for this entity (1 = full, 0.1 = hard floor).
 */
export function getAntiHealMult(cs: TracksCombat): number {
  const effect = cs.statusEffects.find(e => e.id === 'antiheal');
  if (!effect) return 1;
  const reductionPerStack = effect.data['reductionPerStack'] ?? 0.20;
  return Math.max(0.1, 1 - effect.stacks * reductionPerStack);
}

export function getDebuffResistanceMult(player: PlayerEntity): number {
  const resist = Math.min(0.9, player.usesSkills.passives['defense.debuff-resistance'] ?? 0);
  return 1 - resist;
}

/**
 * Apply healing to a player with antiheal and maxHp cap applied.
 * When `world` is provided, emits a heal log event for applied HP.
 */
export function applyHealToPlayer(
  player: PlayerEntity,
  cs: TracksCombat,
  amount: number,
  world?: World,
  source?: WorldLogActor,
): void {
  if (amount <= 0) return;
  const before = player.hasHealth.hp;
  player.hasHealth.hp = Math.min(
    player.hasHealth.maxHp,
    player.hasHealth.hp + amount * getAntiHealMult(cs),
  );
  const applied = Math.round(player.hasHealth.hp - before);
  if (world && player.hasHealth.hp > before) {
    markSliceDirty(world, player, 'hasHealth');
  }
  if (world && applied >= 1) {
    recordWorldLogEvent(
      world,
      {
        kind: 'heal',
        nodeId: player.hasPosition.nodeId,
        target: actorFromPlayer(player),
        source,
        amount: applied,
      },
      {
        visibility: 'combat',
        relatedPlayerIds: [player.isPlayer.id],
        nodeId: player.hasPosition.nodeId,
      },
    );
  }
}

export function applyHealToMinion(
  minion: MinionEntity,
  ownerPlayerId: string,
  amount: number,
  world: World,
  source?: WorldLogActor,
): void {
  if (amount <= 0) return;
  const before = minion.hasHealth.hp;
  minion.hasHealth.hp = Math.min(
    minion.hasHealth.maxHp,
    minion.hasHealth.hp + amount * getAntiHealMult(minion.tracksCombat),
  );
  const applied = Math.round(minion.hasHealth.hp - before);
  if (minion.hasHealth.hp > before) {
    markSliceDirty(world, minion, 'hasHealth');
  }
  if (applied >= 1) {
    recordWorldLogEvent(
      world,
      {
        kind: 'heal',
        nodeId: minion.hasPosition.nodeId,
        target: actorFromMinion(minion, ownerPlayerId),
        source,
        amount: applied,
      },
      {
        visibility: 'combat',
        relatedPlayerIds: [ownerPlayerId],
        nodeId: minion.hasPosition.nodeId,
      },
    );
  }
}
