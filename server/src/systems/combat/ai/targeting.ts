import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import type { AggroTargetKind } from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import type { ServerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markEngaged } from './engagement';

export function setAggroTarget(
  world: World,
  monster: MonsterEntity,
  target: { id: string; kind: AggroTargetKind } | null,
  now: number,
): void {
  if (target === null) {
    detachComponent(world, monster, 'hasAggroTarget');
    monster.controlsMonster.chargeRemainingMs = 0;
    return;
  }

  // Ordinary alerts must not split a returning group. Hits renew it as a whole
  // through renewPackPursuit before assigning any individual target.
  if (monster.inPack?.coordination?.returning) return;

  const hadAggro = monster.hasAggroTarget !== undefined;
  const sinceMs = monster.hasAggroTarget?.sinceMs ?? now;
  monster.controlsMonster.lastAggroAt = now;
  if (!hadAggro) {
    const charge = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.chargeOnAggro;
    if (charge) {
      monster.controlsMonster.chargeRemainingMs = charge.durationMs;
    }
  }
  attachComponent(world, monster, 'hasAggroTarget', {
    targetId: target.id,
    targetKind: target.kind,
    lastAggroAt: now,
    sinceMs,
  });
}

export function setAttackTarget(
  world: World,
  entity: ServerEntity,
  targetId: string | null,
): void {
  if (targetId === null) {
    detachComponent(world, entity, 'hasAttackTarget');
  } else {
    attachComponent(world, entity, 'hasAttackTarget', { targetId });
  }
}

/** Any player/summon hit renews the group's pursuit, including during a return. */
export function renewPackPursuit(
  world: World,
  monster: MonsterEntity,
  source: { id: string; kind: AggroTargetKind },
  now?: number,
): void {
  const state = monster.inPack?.coordination;
  if (!state) return;
  const player = source.kind === 'player' ? world.getPlayerEntity(source.id) : undefined;
  const attacker = source.kind === 'player' ? player : world.getMinionEntity(source.id);
  if (!attacker || attacker.isDead || attacker.hasHealth.hp <= 0 ||
      attacker.hasPosition.nodeId !== monster.hasPosition.nodeId) return;
  state.pursuitAnchor = { ...monster.hasPosition.current };
  if (now === undefined) state.pendingAttack = {};
  else {
    state.lastAttackedAt = now;
    delete state.pendingAttack;
  }
  delete state.returning;
  const held = state.target?.kind === 'player' ? world.getPlayerEntity(state.target.id)
    : state.target ? world.getMinionEntity(state.target.id) : undefined;
  if (!held || held.isDead || held.hasHealth.hp <= 0 || held.hasPosition.nodeId !== monster.hasPosition.nodeId) state.target = source;
  const target = state.target ?? source;
  // Untimed damage helpers enqueue the shared intent; the coordinator assigns
  // targets with its simulation clock, never a wall-clock or stale timestamp.
  if (now === undefined) return;
  if (player) markEngaged(world, player, now);
  for (const member of world.monsterEntitiesInNode(monster.hasPosition.nodeId)) {
    if (member.inPack?.packId !== monster.inPack!.packId || member.hasHealth.hp <= 0) continue;
    if (member.hasAggroTarget?.targetId === target.id && member.hasAggroTarget.targetKind === target.kind) continue;
    const newlyAlerted = !member.hasAggroTarget;
    setAggroTarget(world, member, target, now);
    if (newlyAlerted) world.pushEvent(member.hasPosition.nodeId, {
      kind: 'ecology-pulse', monsterId: member.isMonster.id,
      pos: { ...member.hasPosition.current }, pulse: 'pack-call',
    });
  }
}
