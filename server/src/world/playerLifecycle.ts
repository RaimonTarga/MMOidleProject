import {
  DEFAULT_RUNE_LOADOUT,
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  makeTracksCombat,
  normalizeRuneLoadout,
  runeIdsFromCraftedRecipes,
  runePointBonusFromCraftedRecipes,
  runeBudgetForTier,
  sanitizeRuneLoadout,
} from "@mmo-idle/shared";
import type { World } from "./World";
import type { PlayerEntity } from "../ecs/entity";
import type { PersistedPlayerSlices } from "../db/playerRepo";
import { resolvePlayerHitbox } from "../hitbox/resolve";
import { freezeNode } from "./nodeLifecycle";
import { despawnMinionsForOwner } from "../systems/classes/archetypes/summoner";

/**
 * Attach hydrated player slices to the ECS world with fresh combat tracking.
 * The socket id is runtime identity; persisted row ids stay in the DB only.
 */
export function attachPlayerEntity(
  world: World,
  player: PersistedPlayerSlices,
  socketId: string,
): PlayerEntity {
  const craftedRuneRecipes = player.tracksProgression.runeRecipesCrafted ?? [];
  player.tracksProgression.runeRecipesCrafted = craftedRuneRecipes;
  player.tracksProgression.runesOwned = runeIdsFromCraftedRecipes(craftedRuneRecipes);
  player.tracksProgression.runePointBonus = runePointBonusFromCraftedRecipes(craftedRuneRecipes);
  const owned = new Set(player.tracksProgression.runesOwned);
  const budget = runeBudgetForTier(
    player.tracksProgression.playerTier,
    player.tracksProgression.runePointBonus,
  );
  const persistedRules = Array.isArray(player.tracksProgression.runesEquipped)
    ? normalizeRuneLoadout(player.tracksProgression.runesEquipped)
    : [];
  const sanitizedRules = sanitizeRuneLoadout(
    persistedRules,
    owned,
    budget,
    player.usesSkills.combatArchetype,
  );
  player.tracksProgression.runesEquipped =
    sanitizedRules.length > 0 ? sanitizedRules : [...DEFAULT_RUNE_LOADOUT];

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
      attack: GAME_CONFIG.PLAYER_ATTACK,
      onHitDamage: 0,
      attackStyle: "slash",
    },
    performsAttack: {
      attackRange: GAME_CONFIG.PLAYER_ATTACK_RANGE,
      attackCooldown: GAME_CONFIG.PLAYER_ATTACK_COOLDOWN,
      lastAttackAt: 0,
    },
    mitigatesDamage: {
      plating: GAME_CONFIG.PLAYER_PLATING,
      damageReduction: 0,
    },
    hasStatus: {
      activeBuffs: [],
    },
    usesAutocombat: {
      auto: false,
      autoTraverse: false,
      ...DEFAULT_AUTOCOMBAT_CONFIG,
    },
    tracksProgression: player.tracksProgression,
    holdsInventory: player.holdsInventory,
    usesSkills: {
      ...player.usesSkills,
      passives: {},
    },
    showsSacred: {
      sacredBuffActive: false,
      sacredBuffPct: 0,
    },
  };
  entity.hasHitbox = resolvePlayerHitbox(entity);
  world.ecs.add(entity);
  world.incrementPlayersInNode(entity.hasPosition.nodeId);
  return entity;
}

export function detachPlayerEntity(world: World, playerId: string): void {
  const e = getPlayerEntity(world, playerId);
  if (e) {
    despawnMinionsForOwner(world, e);
    world.worldLogByPlayer.delete(playerId);
    world.nextMinionIdByOwner.delete(playerId);
    const nodeId = e.hasPosition.nodeId;
    const before = world.countPlayersInNode(nodeId);
    world.decrementPlayersInNode(nodeId);
    world.ecs.remove(e);
    if (before === 1) freezeNode(world, nodeId);
  }
}

/** O(1) typed lookup. Backed by world.playerById, populated via onEntityAdded. */
export function getPlayerEntity(
  world: World,
  playerId: string,
): PlayerEntity | undefined {
  return world.playerById.get(playerId);
}

/** Iterate every player entity in `nodeId`. Uses the `hasPosition` slice. */
export function* playerEntitiesInNode(
  world: World,
  nodeId: string,
): IterableIterator<PlayerEntity> {
  for (const e of world.playerEntities) {
    if (e.hasPosition.nodeId === nodeId) yield e;
  }
}

/** Live players in a node — excludes corpses (aggro, AoE, spatial queries). */
export function* livePlayersInNode(
  world: World,
  nodeId: string,
): IterableIterator<PlayerEntity> {
  for (const e of world.livePlayers) {
    if (e.hasPosition.nodeId === nodeId) yield e;
  }
}

export function hasPlayer(world: World, playerId: string): boolean {
  return getPlayerEntity(world, playerId) !== undefined;
}

export function playerCount(world: World): number {
  return world.playerEntities.size;
}
