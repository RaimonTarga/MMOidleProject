import { GAME_CONFIG, makeTracksCombat } from "@mmo-idle/shared";
import type { World } from "./World";
import type { PlayerEntity } from "../ecs/entity";
import type { PersistedPlayerSlices } from "../db/playerRepo";

/**
 * Attach hydrated player slices to the ECS world with fresh combat tracking.
 * The socket id is runtime identity; persisted row ids stay in the DB only.
 */
export function attachPlayerEntity(
  world: World,
  player: PersistedPlayerSlices,
  socketId: string,
): PlayerEntity {
  const entity: PlayerEntity = {
    entityId: socketId,
    tracksCombat: makeTracksCombat(),
    isPlayer: {
      ...player.isPlayer,
      id: socketId,
    },
    hasPosition: player.hasPosition,
    hasHealth: player.hasHealth,
    dealsDamage: {
      attack:      GAME_CONFIG.PLAYER_ATTACK,
      onHitDamage: 0,
      attackStyle: 'slash',
    },
    performsAttack: {
      attackRange:    GAME_CONFIG.PLAYER_ATTACK_RANGE,
      attackCooldown: GAME_CONFIG.PLAYER_ATTACK_COOLDOWN,
      lastAttackAt:   0,
    },
    mitigatesDamage: {
      plating:         GAME_CONFIG.PLAYER_PLATING,
      damageReduction: 0,
    },
    hasStatus: {
      activeBuffs: [],
    },
    usesAutocombat: {
      auto: false,
    },
    tracksProgression: player.tracksProgression,
    holdsInventory: player.holdsInventory,
    usesSkills: {
      ...player.usesSkills,
      passives: {},
    },
    showsSacred: {
      sacredBuffActive: false,
      sacredBuffPct:    0,
    },
  };
  world.ecs.add(entity);
  return entity;
}

export function detachPlayerEntity(world: World, playerId: string): void {
  const e = getPlayerEntity(world, playerId);
  if (e) world.ecs.remove(e);
}

/** O(1) typed lookup. Backed by world.playerById, populated via onEntityAdded. */
export function getPlayerEntity(world: World, playerId: string): PlayerEntity | undefined {
  return world.playerById.get(playerId);
}

/** Iterate every player entity in `nodeId`. Uses the `hasPosition` slice. */
export function* playerEntitiesInNode(world: World, nodeId: string): IterableIterator<PlayerEntity> {
  for (const e of world.playerEntities) {
    if (e.hasPosition.nodeId === nodeId) yield e;
  }
}

export function hasPlayer(world: World, playerId: string): boolean {
  return getPlayerEntity(world, playerId) !== undefined;
}

export function playerCount(world: World): number {
  return world.playerEntities.size;
}
