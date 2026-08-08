import {
  applyStatusEffect,
  distanceSq,
  type DeathKiller,
  type GroundZoneView,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../world/World';
import { markSliceDirty } from '../../ecs/dirtyHelpers';
import { isInvulnerablePlayer } from '../combat/invulnerability';

interface RuntimeGroundZoneBase {
  id: string;
  pos: Vec2;
  radius: number;
  startedAtMs: number;
}

export interface RuntimeSlamTelegraph extends RuntimeGroundZoneBase {
  kind: 'slam-telegraph';
  resolvesAtMs: number;
  /** Owning monster; every cast-abort path clears its telegraph by this id. */
  ownerId: string;
}

export interface RuntimeToxicPool extends RuntimeGroundZoneBase {
  kind: 'toxic-pool';
  expiresAtMs: number;
  damagePerTick: number;
  tickIntervalMs: number;
  slowSpeedMult?: number;
  tickTimersByPlayerId: Map<string, number>;
  killer: DeathKiller;
}

/** Node-scoped, runtime-only circles. Never persisted or rebuilt on thaw. */
export type RuntimeGroundZone = RuntimeSlamTelegraph | RuntimeToxicPool;

function zonesFor(world: World, nodeId: string): RuntimeGroundZone[] {
  let list = world.groundZones.get(nodeId);
  if (!list) {
    list = [];
    world.groundZones.set(nodeId, list);
  }
  return list;
}

/** Publish a cosmetic cast telegraph. The owning combat state resolves damage. */
export function publishGroundZone(
  world: World,
  nodeId: string,
  zone: Omit<RuntimeSlamTelegraph, 'id'>,
): RuntimeSlamTelegraph {
  clearGroundZonesByOwner(world, nodeId, zone.ownerId);
  const published: RuntimeSlamTelegraph = {
    ...zone,
    id: `gz-${nodeId}-${world.groundZoneSeq++}`,
  };
  zonesFor(world, nodeId).push(published);
  return published;
}

/** Publish an expiry-owned hazard. It deliberately outlives the monster that made it. */
export function publishToxicPool(
  world: World,
  nodeId: string,
  zone: Omit<RuntimeToxicPool, 'id' | 'tickTimersByPlayerId'>,
): RuntimeToxicPool {
  const published: RuntimeToxicPool = {
    ...zone,
    id: `gz-${nodeId}-${world.groundZoneSeq++}`,
    tickTimersByPlayerId: new Map(),
  };
  zonesFor(world, nodeId).push(published);
  return published;
}

/** Drop telegraphs owned by a monster; expiry-owned hazards are unaffected. */
export function clearGroundZonesByOwner(
  world: World,
  nodeId: string,
  ownerId: string,
): void {
  const list = world.groundZones.get(nodeId);
  if (!list) return;
  const kept = list.filter(
    (zone) => zone.kind !== 'slam-telegraph' || zone.ownerId !== ownerId,
  );
  if (kept.length === list.length) return;
  if (kept.length === 0) world.groundZones.delete(nodeId);
  else world.groundZones.set(nodeId, kept);
}

/** Drop every runtime circle in a node on freeze. */
export function clearGroundZonesForNode(world: World, nodeId: string): void {
  world.groundZones.delete(nodeId);
}

const RESOLVE_GRACE_MS = 250;
const HAZARD_SLOW_REFRESH_MS = 1_200;

function tickToxicPool(
  world: World,
  nodeId: string,
  pool: RuntimeToxicPool,
  now: number,
): void {
  const radiusSq = pool.radius * pool.radius;
  for (const player of world.livePlayersInNode(nodeId)) {
    if (distanceSq(player.hasPosition.current, pool.pos) > radiusSq) continue;

    if (pool.slowSpeedMult !== undefined) {
      applyStatusEffect(player.tracksCombat, {
        id: 'slow',
        maxStacks: 1,
        remainingMs: HAZARD_SLOW_REFRESH_MS,
        refreshable: true,
        sourceId: `ground-zone:${pool.id}`,
        data: {
          speedMult: pool.slowSpeedMult,
          totalMs: HAZARD_SLOW_REFRESH_MS,
        },
      });
    }

    const nextAt = pool.tickTimersByPlayerId.get(player.isPlayer.id) ?? now;
    if (now < nextAt || isInvulnerablePlayer(player)) continue;
    pool.tickTimersByPlayerId.set(player.isPlayer.id, now + pool.tickIntervalMs);

    const dotResist = Math.min(
      0.9,
      Math.max(0, player.usesSkills.passives['defense.dot-resistance'] ?? 0),
    );
    const damage = Math.max(
      1,
      Math.round(
        pool.damagePerTick *
          (1 - player.mitigatesDamage.damageReduction) *
          (1 - dotResist),
      ),
    );
    player.hasHealth.hp -= damage;
    markSliceDirty(world, player, 'hasHealth');
    world.pushEvent(nodeId, {
      kind: 'dot-tick',
      targetId: player.isPlayer.id,
      targetPos: { ...player.hasPosition.current },
      amount: damage,
      element: 'poison',
      sourceType: 'special',
    });

    if (player.hasHealth.hp <= 0) {
      world.killPlayer(player.isPlayer.id, {
        kind: 'dot',
        killer: pool.killer,
        damage,
        stacks: 1,
      });
    }
  }
}

/** Tick hazards, then sweep expired/abandoned circles. */
export function updateGroundZones(world: World, now: number): void {
  for (const [nodeId, list] of [...world.groundZones]) {
    for (const zone of list) {
      if (zone.kind === 'toxic-pool' && now < zone.expiresAtMs) {
        tickToxicPool(world, nodeId, zone, now);
      }
    }

    const kept = list.filter((zone) =>
      zone.kind === 'slam-telegraph'
        ? world.hasMonster(zone.ownerId) && now < zone.resolvesAtMs + RESOLVE_GRACE_MS
        : now < zone.expiresAtMs,
    );
    if (kept.length === 0) world.groundZones.delete(nodeId);
    else if (kept.length !== list.length) world.groundZones.set(nodeId, kept);
  }
}

/** Build the client view for a node, or undefined when it has no zones. */
export function buildGroundZoneViews(
  world: World,
  nodeId: string,
  now: number,
): GroundZoneView[] | undefined {
  const list = world.groundZones.get(nodeId);
  if (!list || list.length === 0) return undefined;
  return list.map((zone) => {
    const endsAtMs = zone.kind === 'slam-telegraph' ? zone.resolvesAtMs : zone.expiresAtMs;
    return {
      id: zone.id,
      kind: zone.kind,
      x: zone.pos.x,
      y: zone.pos.y,
      radius: zone.radius,
      durationMs: Math.max(1, endsAtMs - zone.startedAtMs),
      remainingMs: Math.max(0, endsAtMs - now),
    };
  });
}
