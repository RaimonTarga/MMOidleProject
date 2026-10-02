import { migrateAttunement, attunedAbilityIds, validRiteIds } from "@mmo-idle/shared";
import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  makeTracksCombat,
  normalizeRuneLoadout,
  runeIdsFromCraftedRecipes,
  sanitizeRuneLoadout,
} from "@mmo-idle/shared";
import type { World } from "./World";
import type { PlayerEntity } from "../ecs/entity";
import type { PersistedPlayerSlices } from "../db/playerRepo";
import { syncLineagesFromInventory } from '../systems/player/economy/lineageSync';
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
  Object.assign(player.tracksProgression, migrateAttunement(player.tracksProgression));
  delete (player.tracksProgression as unknown as { equippedAbilities?: unknown }).equippedAbilities;
  // Lineage wallets, normalized here rather than at each construction site: a
  // save written before the progression rework has neither, and the reward seam
  // and the four economy handlers both write into them unconditionally.
  player.tracksProgression.shards ??= {};
  player.tracksProgression.capstones ??= {};
  const craftedRuneRecipes = player.tracksProgression.runeRecipesCrafted ?? [];
  player.tracksProgression.runeRecipesCrafted = craftedRuneRecipes;
  player.tracksProgression.runesOwned = runeIdsFromCraftedRecipes(craftedRuneRecipes);
  const owned = new Set(player.tracksProgression.runesOwned);
  const persistedRules = Array.isArray(player.tracksProgression.runesEquipped)
    ? normalizeRuneLoadout(player.tracksProgression.runesEquipped)
    : [];
  const sanitizedRules = sanitizeRuneLoadout(
    persistedRules,
    owned,
    Number.POSITIVE_INFINITY,
    player.usesSkills.combatArchetype,
    new Set(player.tracksProgression.attunedStances ?? []),
    new Set(attunedAbilityIds(player.tracksProgression.attunedAbilities)),
  );
  player.tracksProgression.runesEquipped = sanitizedRules;
  player.tracksProgression.equippedRites = validRiteIds(player.tracksProgression.equippedRites ?? []).filter(id => (player.tracksProgression.knownRites ?? []).includes(id));
  player.tracksProgression.activeStance = player.tracksProgression.equippedStances?.default ?? null;

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
    ...(player.summonerState ? { summonsMinions: player.summonerState } : {}),
  };
  entity.hasHitbox = resolvePlayerHitbox(entity);
  world.ecs.add(entity);
  world.incrementPlayersInNode(entity.hasPosition.nodeId);
  // Give every lineage the character already holds a base form of its tree. This
  // is what a save written before Phase 1 gets: crafting the Flash Rapier was
  // always how you took the weapon slot, so the tree opens live rather than
  // demanding a second purchase for something already owned.
  syncLineagesFromInventory(world, entity);
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
