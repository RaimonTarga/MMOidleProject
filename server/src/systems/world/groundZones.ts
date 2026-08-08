import type { GroundZoneKind, GroundZoneView, Vec2 } from "@mmo-idle/shared";
import type { World } from "../../world/World";

/**
 * Server-side ground zone. Runtime-only: never persisted, never rebuilt on thaw.
 * Generalised from `RuntimeDungeonHazard` (dungeons/gauntlet.ts), which stays as
 * the gauntlet's own thing — it carries rot-pool damage bookkeeping this doesn't.
 */
export interface RuntimeGroundZone {
  id: string;
  kind: GroundZoneKind;
  pos: Vec2;
  radius: number;
  /** When the zone was published — the fill animates from here. */
  startedAtMs: number;
  /** When the owning cast resolves; the zone is dropped at/after this. */
  resolvesAtMs: number;
  /**
   * Monster whose cast owns this zone. Every abort path (interrupt, target lost,
   * out of range, death) clears by owner, so a telegraph can never outlive the
   * cast that drew it.
   */
  ownerId: string;
}

function zonesFor(world: World, nodeId: string): RuntimeGroundZone[] {
  let list = world.groundZones.get(nodeId);
  if (!list) {
    list = [];
    world.groundZones.set(nodeId, list);
  }
  return list;
}

/**
 * Publish a telegraph circle. The caller owns resolution — this only draws.
 * Replaces any zone the same owner already had, so a re-cast can't stack rings.
 */
export function publishGroundZone(
  world: World,
  nodeId: string,
  zone: Omit<RuntimeGroundZone, "id">,
): RuntimeGroundZone {
  clearGroundZonesByOwner(world, nodeId, zone.ownerId);
  const published: RuntimeGroundZone = {
    ...zone,
    id: `gz-${nodeId}-${world.groundZoneSeq++}`,
  };
  zonesFor(world, nodeId).push(published);
  return published;
}

/** Drop every zone owned by a monster. Safe to call when it owns none. */
export function clearGroundZonesByOwner(
  world: World,
  nodeId: string,
  ownerId: string,
): void {
  const list = world.groundZones.get(nodeId);
  if (!list) return;
  const kept = list.filter((zone) => zone.ownerId !== ownerId);
  if (kept.length === list.length) return;
  if (kept.length === 0) world.groundZones.delete(nodeId);
  else world.groundZones.set(nodeId, kept);
}

/** Drop every zone in a node. Called on freeze — zones are never persisted. */
export function clearGroundZonesForNode(world: World, nodeId: string): void {
  world.groundZones.delete(nodeId);
}

/**
 * Sweep zones whose owner is gone or whose deadline passed without the owner
 * resolving them. Normal completion clears its own zone; this is the safety net
 * for the paths that don't run (owner despawned mid-cast, node emptied).
 *
 * The grace window keeps a zone alive for one broadcast past its deadline so the
 * client sees the ring reach full before it vanishes — at 5 Hz a same-tick delete
 * makes the impact pop out of existence early.
 */
const RESOLVE_GRACE_MS = 250;

export function updateGroundZones(world: World, now: number): void {
  for (const [nodeId, list] of [...world.groundZones]) {
    const kept = list.filter(
      (zone) =>
        world.hasMonster(zone.ownerId) &&
        now < zone.resolvesAtMs + RESOLVE_GRACE_MS,
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
  return list.map((zone) => ({
    id: zone.id,
    kind: zone.kind,
    x: zone.pos.x,
    y: zone.pos.y,
    radius: zone.radius,
    durationMs: Math.max(1, zone.resolvesAtMs - zone.startedAtMs),
    remainingMs: Math.max(0, zone.resolvesAtMs - now),
  }));
}
