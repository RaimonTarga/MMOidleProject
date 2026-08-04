import {
  SPECTATOR_PLAYER_KEYS,
  type CombatEvent,
  type DeltaSnapshot,
  type EntityDelta,
  type NetworkedEntity,
} from "@mmo-idle/shared";
import { entityNetworkId } from "../ecs/entity";
import { componentsForEntity, pickComponents } from "../ecs/deltaEncoder";
import type { World } from "./World";

/**
 * Build a full, privacy-filtered node projection for anonymous viewers.
 * Player persistence/build slices are never added to this object, making the
 * wire boundary auditable independently of the authenticated delta encoder.
 */
export function buildSpectatorNodeSnapshot(
  world: World,
  nodeId: string,
  events: CombatEvent[] = [],
): DeltaSnapshot {
  const deltas: EntityDelta[] = [];

  for (const monster of world.monsterEntitiesInNode(nodeId)) {
    const netId = entityNetworkId(monster);
    const built = componentsForEntity(monster);
    if (netId && built) {
      deltas.push({ kind: "add", netId, entityKind: "monster", components: built.components });
    }
  }

  for (const player of world.playerEntitiesInNode(nodeId)) {
    const components = pickComponents(player, SPECTATOR_PLAYER_KEYS);
    components.spectatorPlayer = {
      playerTier: player.tracksProgression.playerTier,
      selectedClass: player.usesSkills.selectedClass,
      selectedSubVariant: player.usesSkills.selectedSubVariant,
      selectedRange: player.usesSkills.selectedRange,
      combatArchetype: player.usesSkills.combatArchetype,
    };
    deltas.push({
      kind: "add",
      netId: player.isPlayer.id,
      entityKind: "player",
      components,
    });
  }

  for (const minion of world.minionEntities) {
    if (minion.hasPosition.nodeId !== nodeId) continue;
    const netId = entityNetworkId(minion);
    const built = componentsForEntity(minion);
    if (netId && built) {
      deltas.push({ kind: "add", netId, entityKind: "minion", components: built.components });
    }
  }

  const snapshot: DeltaSnapshot = {
    tick: world.tickCounter,
    nodeId,
    full: true,
    deltas,
    events,
  };

  const marker = world.bossRespawnMarkers.get(nodeId);
  if (marker?.monsterTypeId === "void-overlord") {
    snapshot.voidOverlordRespawn = {
      nodeId,
      pos: marker.pos,
      durationMs: marker.durationMs,
      remainingMs: Math.max(0, marker.respawnAt - Date.now()),
    };
  }

  return snapshot;
}
