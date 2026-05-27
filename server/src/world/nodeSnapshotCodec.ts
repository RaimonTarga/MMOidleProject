import type {
  FrozenMonsterSnapshot,
  FrozenMonsterMarkers,
  FrozenNodeSnapshot,
} from '@mmo-idle/shared';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import type { World } from './World';
import type { MonsterEntity } from '../ecs/entity';
import { resolveMonsterHitbox } from '../hitbox/resolve';

const MARKER_KEYS = [
  'hasAggroTarget',
  'hasAttackTarget',
  'isMoving',
  'hasKnockback',
  'hasDot',
  'hasDetonation',
  'hasHemorrhage',
  'hasConflagration',
  'hasChill',
  'hasFrozen',
  'hasSmolder',
  'hasEntropy',
  'hasAshbrandBurn',
  'scriptsBoss',
  'isBossEngaged',
] as const satisfies readonly (keyof FrozenMonsterMarkers)[];

function collectMarkers(entity: MonsterEntity): FrozenMonsterMarkers {
  const markers: FrozenMonsterMarkers = {};
  for (const key of MARKER_KEYS) {
    const value = entity[key];
    if (value !== undefined) {
      (markers as Record<string, unknown>)[key] = value;
    }
  }
  return markers;
}

function parseMonsterIdSuffix(entityId: string): number {
  const match = /^monster-(\d+)$/.exec(entityId);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export function serializeMonster(entity: MonsterEntity): FrozenMonsterSnapshot {
  return {
    entityId: entity.entityId,
    isMonster: { ...entity.isMonster },
    hasPosition: { ...entity.hasPosition, current: { ...entity.hasPosition.current } },
    hasHealth: { ...entity.hasHealth },
    dealsDamage: { ...entity.dealsDamage },
    performsAttack: { ...entity.performsAttack },
    mitigatesDamage: { ...entity.mitigatesDamage },
    hasAwareness: { ...entity.hasAwareness },
    hasStatus: { ...entity.hasStatus },
    controlsMonster: {
      ...entity.controlsMonster,
      spawn: { ...entity.controlsMonster.spawn },
    },
    tracksCombat: structuredClone(entity.tracksCombat),
    markers: collectMarkers(entity),
  };
}

export function serializeNode(
  world: World,
  nodeId: string,
  bossRespawnAt: number | null,
): FrozenNodeSnapshot {
  const monsters: FrozenMonsterSnapshot[] = [];
  let nextMonsterIdFloor = world.nextMonsterId;

  for (const entity of world.monsterEntitiesInNode(nodeId)) {
    monsters.push(serializeMonster(entity));
    nextMonsterIdFloor = Math.max(nextMonsterIdFloor, parseMonsterIdSuffix(entity.entityId) + 1);
  }

  return {
    nodeId,
    frozenAt: Date.now(),
    bossRespawnAt,
    nextMonsterIdFloor,
    monsters,
  };
}

export function hydrateMonster(
  world: World,
  snapshot: FrozenMonsterSnapshot,
): MonsterEntity | null {
  const def = MONSTER_DATABASE.get(snapshot.isMonster.monsterTypeId);
  if (!def) {
    console.warn(`[nodeSnapshotCodec] Unknown monster type: "${snapshot.isMonster.monsterTypeId}"`);
    return null;
  }

  world.nextMonsterId = Math.max(world.nextMonsterId, parseMonsterIdSuffix(snapshot.entityId) + 1);

  const entity: MonsterEntity = {
    entityId: snapshot.entityId,
    isMonster: { ...snapshot.isMonster },
    hasPosition: {
      ...snapshot.hasPosition,
      current: { ...snapshot.hasPosition.current },
    },
    hasHealth: { ...snapshot.hasHealth },
    dealsDamage: { ...snapshot.dealsDamage },
    performsAttack: { ...snapshot.performsAttack },
    mitigatesDamage: { ...snapshot.mitigatesDamage },
    hasAwareness: { ...snapshot.hasAwareness },
    hasStatus: { ...snapshot.hasStatus },
    controlsMonster: {
      ...snapshot.controlsMonster,
      spawn: { ...snapshot.controlsMonster.spawn },
    },
    tracksCombat: structuredClone(snapshot.tracksCombat),
    hasHitbox: resolveMonsterHitbox(snapshot.isMonster.monsterTypeId, snapshot.isMonster.isBoss),
  };

  world.ecs.add(entity);

  for (const key of MARKER_KEYS) {
    const value = snapshot.markers[key];
    if (value !== undefined) {
      world.ecs.addComponent(entity, key, value as never);
    }
  }

  world.adjustMonsterCount(snapshot.hasPosition.nodeId, 1, snapshot.isMonster.isBoss);
  return entity;
}

export function hydrateNodeSnapshot(
  world: World,
  snapshot: FrozenNodeSnapshot,
): { hydrated: number; skipped: number } {
  world.nextMonsterId = Math.max(world.nextMonsterId, snapshot.nextMonsterIdFloor);
  if (snapshot.bossRespawnAt != null) {
    world.bossRespawnAt.set(snapshot.nodeId, snapshot.bossRespawnAt);
  }

  let hydrated = 0;
  let skipped = 0;
  for (const monster of snapshot.monsters) {
    if (hydrateMonster(world, monster)) hydrated++;
    else skipped++;
  }
  return { hydrated, skipped };
}
