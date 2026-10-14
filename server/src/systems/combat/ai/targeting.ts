import { emitMonsterSession } from '../engine/sessionObservation';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import type { AggroTargetKind, HeldByTaunt } from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import type { ServerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markEngaged } from './engagement';
import { monsterIgnoresTaunts } from './monsterTargeting';

/**
 * The taunt holding this monster, while it still holds: released once its time runs out
 * or its taunter is gone (dead, despawned or in another node).
 */
export function activeTaunt(world: World, monster: MonsterEntity, now: number): HeldByTaunt | undefined {
  const held = monster.heldByTaunt;
  if (!held) return undefined;
  const nodeId = monster.hasPosition.nodeId;
  const taunter = held.taunterKind === 'player'
    ? world.getPlayerEntity(held.taunterId)
    : world.getMinionEntity(held.taunterId);
  const present = !!taunter && !taunter.isDead && (taunter.hasHealth?.hp ?? 0) > 0
    && taunter.hasPosition?.nodeId === nodeId;
  if (now >= held.untilMs || !present) {
    detachComponent(world, monster, 'heldByTaunt');
    return undefined;
  }
  return held;
}

/**
 * Taunt a monster onto `taunter` for `durationMs` (class-first build plan S3, bible §8.12).
 * A taunt holds for its whole duration: nobody can take the monster until it ends, except
 * that a player's taunt takes it from a summon's. The same taunter refreshes its own hold.
 * Monsters that ignore taunts refuse. Returns whether the taunt took.
 */
export function applyTaunt(
  world: World,
  monster: MonsterEntity,
  taunter: { id: string; kind: AggroTargetKind },
  durationMs: number,
  now: number,
): boolean {
  if (monsterIgnoresTaunts(monster)) return false;
  const held = activeTaunt(world, monster, now);
  if (held && held.taunterId !== taunter.id && !(held.taunterKind === 'minion' && taunter.kind === 'player')) {
    return false;
  }
  if (held) detachComponent(world, monster, 'heldByTaunt');
  setAggroTarget(world, monster, taunter, now);
  if (monster.hasAggroTarget?.targetId !== taunter.id) return false;
  const untilMs = Math.max(held?.taunterId === taunter.id ? held.untilMs : 0, now + durationMs);
  attachComponent(world, monster, 'heldByTaunt', { taunterId: taunter.id, taunterKind: taunter.kind, untilMs });
  return true;
}

export function setAggroTarget(
  world: World,
  monster: MonsterEntity,
  target: { id: string; kind: AggroTargetKind } | null,
  now: number,
): void {
  if (target === null) {
    emitMonsterSession(monster, 'aggro-clear-before', now);
    detachComponent(world, monster, 'hasAggroTarget');
    detachComponent(world, monster, 'heldByTaunt');
    monster.controlsMonster.chargeRemainingMs = 0;
    return;
  }

  // A taunt holds the monster on its taunter: nothing else moves its aggro meanwhile
  // (`applyTaunt` releases the hold itself before a stronger taunt takes it).
  const held = activeTaunt(world, monster, now);
  if (held && held.taunterId !== target.id) return;

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
  emitMonsterSession(monster, hadAggro ? 'aggro-handover' : 'aggro-start', now);
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
