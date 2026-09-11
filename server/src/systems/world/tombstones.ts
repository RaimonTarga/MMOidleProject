import {
  TOMBSTONE_TTL_MS,
  deathKillerName,
  type DeathCause,
  type TombstoneView,
  type Vec2,
} from "@mmo-idle/shared";
import type { PlayerEntity } from "../../ecs/entity";
import type { World } from "../../world/World";

/** One player death, remembered in place long after the player got back up. */
export interface RuntimeTombstone {
  /** Stable identity so the client can diff tombs across deltas. */
  id: string;
  /** Account-scoped player id of whoever fell here. Drives the withhold rule below. */
  ownerId: string;
  playerName: string;
  killerName?: string;
  pos: Vec2;
  /** Same index the dead player's grave sprite uses, so respawn is a clean handoff. */
  graveFrame: number;
  diedAtMs: number;
}

/**
 * Ring-buffer bound per node. A node being farmed by a party that keeps wiping
 * would otherwise accumulate one record per death for a quarter of an hour; the
 * oldest tomb is dropped once a node is this full.
 */
export const MAX_TOMBSTONES_PER_NODE = 12;

function tombstonesFor(world: World, nodeId: string): RuntimeTombstone[] {
  let list = world.tombstones.get(nodeId);
  if (!list) {
    list = [];
    world.tombstones.set(nodeId, list);
  }
  return list;
}

/**
 * Plant a tombstone where a player just died.
 *
 * Called from `killPlayer`, not from the respawn, so the death cause is read while
 * it is still in hand. The tomb is INVISIBLE until its owner leaves — see
 * `buildTombstoneViews` — which is what makes death → respawn look like one grave
 * that simply stays put rather than two that swap.
 */
export function recordTombstone(
  world: World,
  player: PlayerEntity,
  cause: DeathCause,
  graveFrame: number,
): void {
  const nodeId = player.hasPosition.nodeId;
  const list = tombstonesFor(world, nodeId);
  list.push({
    id: `tomb-${nodeId}-${world.tombstoneSeq++}`,
    ownerId: player.isPlayer.id,
    playerName: player.isPlayer.name,
    killerName: deathKillerName(cause),
    pos: { ...player.hasPosition.current },
    graveFrame,
    diedAtMs: Date.now(),
  });
  if (list.length > MAX_TOMBSTONES_PER_NODE) {
    list.splice(0, list.length - MAX_TOMBSTONES_PER_NODE);
  }
}

/**
 * Build the client view for a node, or undefined when it has no visible tombs.
 *
 * Withholds any tomb whose owner is STILL lying dead on this node: that player's
 * own entity is drawing the grave, and shipping the tomb as well would stack two
 * markers on one spot until they acknowledged the death. The moment they respawn
 * (or disconnect, which removes the entity) the tomb takes over the same position
 * with the same `graveFrame`.
 */
export function buildTombstoneViews(
  world: World,
  nodeId: string,
  now: number,
): TombstoneView[] | undefined {
  const list = world.tombstones.get(nodeId);
  if (!list || list.length === 0) return undefined;

  const views: TombstoneView[] = [];
  for (const tomb of list) {
    const owner = world.getPlayerEntity(tomb.ownerId);
    if (owner?.isDead && owner.hasPosition.nodeId === nodeId) continue;
    views.push({
      id: tomb.id,
      x: tomb.pos.x,
      y: tomb.pos.y,
      graveFrame: tomb.graveFrame,
      playerName: tomb.playerName,
      ...(tomb.killerName ? { killerName: tomb.killerName } : {}),
      remainingMs: Math.max(0, tomb.diedAtMs + TOMBSTONE_TTL_MS - now),
    });
  }
  return views.length > 0 ? views : undefined;
}

/**
 * Drop tombstones past their TTL.
 *
 * Iterates the REGISTRY, not the occupied nodes, on purpose: a node with a tomb in
 * it is usually frozen (the player who died there emptied it by respawning), and a
 * sweep driven by occupancy would leave those tombs standing forever until someone
 * happened to walk back in.
 */
export function updateTombstones(world: World, now: number): void {
  for (const [nodeId, list] of [...world.tombstones]) {
    const kept = list.filter((tomb) => now < tomb.diedAtMs + TOMBSTONE_TTL_MS);
    if (kept.length === 0) world.tombstones.delete(nodeId);
    else if (kept.length !== list.length) world.tombstones.set(nodeId, kept);
  }
}
