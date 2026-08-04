import type { World } from '../../../../world/World';
import type { PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { resolveCommandedFocusTarget } from './command';

type SummonerTargetOwner = PlayerEntity & {
  summonsMinions: NonNullable<PlayerEntity['summonsMinions']>;
};

function validTargetId(
  world: World,
  owner: SummonerTargetOwner,
  targetId: string | undefined,
): string | null {
  if (!targetId) return null;
  const target = world.getMonsterEntity(targetId);
  if (!target || target.hasHealth.hp <= 0) return null;
  if (target.hasPosition.nodeId !== owner.hasPosition.nodeId) return null;
  return targetId;
}

/**
 * Select the one monster represented by the owner's existing target-frame UI.
 * A commanded focus wins. For split-target formations, retain the previous
 * valid choice to avoid frame flicker, then fall back to logical slot order.
 */
export function syncSummonerFormationTarget(
  world: World,
  owner: SummonerTargetOwner,
): void {
  const summons = owner.summonsMinions;
  let nextTargetId: string | null = null;

  const commandedFocus = resolveCommandedFocusTarget(world, owner);
  if (commandedFocus) {
    nextTargetId = commandedFocus.isMonster.id;
  } else if (owner.hasSummonerCommand?.kind !== 'move') {
    const activeTargetIds: string[] = [];
    for (const minionId of summons.minionIds) {
      const minion = minionId ? world.getMinionEntity(minionId) : undefined;
      if (!minion || minion.hasHealth.hp <= 0) continue;
      const targetId = validTargetId(world, owner, minion.hasAttackTarget?.targetId);
      if (targetId && !activeTargetIds.includes(targetId)) activeTargetIds.push(targetId);
    }

    const previousTargetId = validTargetId(world, owner, summons.formationTargetId ?? undefined);
    nextTargetId = previousTargetId && activeTargetIds.includes(previousTargetId)
      ? previousTargetId
      : (activeTargetIds[0] ?? null);
  }

  if (summons.formationTargetId === nextTargetId) return;
  summons.formationTargetId = nextTargetId;
  markSliceDirty(world, owner, 'summonsMinions');
}
