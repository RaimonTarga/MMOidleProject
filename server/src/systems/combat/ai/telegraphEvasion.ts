import {
  RUNE_TELEGRAPH_ESCAPE_CLEARANCE,
  distanceSq,
  moverOverlapsBlockShapes,
  type Vec2,
} from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import type { World } from "../../../world/World";
import { actorFromPlayer } from "../../../world/worldLogActors";
import { recordWorldLogEvent } from "../../../world/worldLog";
import { NODE_REGISTRY } from "../../../world/nodeRegistry";
import type {
  RuntimeFaultLineBurst,
  RuntimeSlamTelegraph,
} from "../../world/groundZones";
import {
  navigationPadForEntity,
  setEntityMotion,
  stopEntity,
} from "../../world/movement";
import { resolveObstaclesForNode } from "../../world/nodeFeatures";
import { suppressedFeatureIdsForEntity } from "../../world/pathMotion";

export type RuntimeAttackTelegraph = RuntimeSlamTelegraph | RuntimeFaultLineBurst;

export interface TelegraphCircleGeometry {
  pos: Vec2;
  radius: number;
}

export interface TelegraphDodgeThreat {
  telegraphId: string;
  telegraphKind: RuntimeAttackTelegraph["kind"];
  ownerId: string;
  acquiredAtMs: number;
  startingPosition: Vec2;
  geometry: TelegraphCircleGeometry[];
  firstSafeAtMs?: number;
  reenteredAfterSafe: boolean;
  reentryRecorded: boolean;
}

/**
 * Server-only Step Back movement owner. Presence means ordinary Chase/Orbit and
 * persistent-hazard steering must yield. The tracked set contains only casts
 * that actually threatened this player, never every telegraph in the node.
 */
export interface EvadesTelegraphs {
  nodeId: string;
  acquiredAtMs: number;
  escapePoint: Vec2 | null;
  threats: Record<string, TelegraphDodgeThreat>;
}

export type TelegraphOwnershipReleaseReason =
  | "resolved"
  | "telegraph-discarded"
  | "caster-gone"
  | "node-changed"
  | "manual-override"
  | "flee-priority"
  | "autocombat-disabled"
  | "step-back-unequipped"
  | "player-respawned";

const ESCAPE_SAMPLE_STEP = 8;
const ESCAPE_SAMPLE_ANGLES = 48;
const NODE_MARGIN = 40;

function telegraphCircles(zone: RuntimeAttackTelegraph): TelegraphCircleGeometry[] {
  if (zone.kind === "fault-line-telegraph") {
    return zone.points.map((pos) => ({ pos: { ...pos }, radius: zone.radius }));
  }
  return [{ pos: { ...zone.pos }, radius: zone.radius }];
}

export function positionInsideTelegraph(zone: RuntimeAttackTelegraph, pos: Vec2): boolean {
  return telegraphCircles(zone).some(
    (circle) => distanceSq(pos, circle.pos) <= circle.radius * circle.radius,
  );
}

/** Pending hostile AoEs exposed by the same runtime state that resolves damage. */
export function activeAttackTelegraphs(
  world: World,
  nodeId: string,
  now: number,
): RuntimeAttackTelegraph[] {
  return (world.groundZones.get(nodeId) ?? [])
    .filter(
      (zone): zone is RuntimeAttackTelegraph =>
        zone.kind !== "toxic-pool" &&
        now < zone.resolvesAtMs &&
        world.hasMonster(zone.ownerId),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function telegraphsContainingPlayer(
  world: World,
  player: PlayerEntity,
  now: number,
): RuntimeAttackTelegraph[] {
  return activeAttackTelegraphs(world, player.hasPosition.nodeId, now).filter((zone) =>
    positionInsideTelegraph(zone, player.hasPosition.current),
  );
}

function recordLifecycle(
  world: World,
  player: PlayerEntity,
  phase: "activation" | "attempt" | "safe" | "reenter" | "resolution" | "release" | "result",
  details: {
    zone?: RuntimeAttackTelegraph;
    threat?: TelegraphDodgeThreat;
    response?: EvadesTelegraphs;
    outcome?: "success" | "failure" | "discarded";
    damageReceived?: number;
    resolvedAtMs?: number;
    releasedAtMs?: number;
    releaseReason?: TelegraphOwnershipReleaseReason;
    reason?: string;
  } = {},
): void {
  const zone = details.zone;
  const threat = details.threat;
  const response = details.response;
  const telegraphId = zone?.id ?? threat?.telegraphId;
  const telegraphKind = zone?.kind ?? threat?.telegraphKind;
  const ownerId = zone?.ownerId ?? threat?.ownerId;

  if (phase === "activation" || phase === "attempt" || phase === "result") {
    const analyticsKind = phase === "activation"
      ? "rune-activation"
      : phase === "attempt"
        ? "telegraph-dodge-attempt"
        : details.outcome === "success"
          ? "telegraph-dodge-success"
          : details.outcome === "failure"
            ? "telegraph-dodge-failure"
            : null;
    if (analyticsKind) {
      world.analyticsRuneTelegraph?.(
        player.isPlayer.id,
        player.hasPosition.nodeId,
        analyticsKind,
        details.damageReceived,
        {
          conditionId: "inside-telegraph",
          actionId: "step-back",
          telegraphId,
          telegraphKind,
          ownerId,
        },
      );
    }
  }

  recordWorldLogEvent(world, {
    kind: "telegraph-dodge",
    nodeId: player.hasPosition.nodeId,
    player: actorFromPlayer(player),
    phase,
    telegraphId,
    telegraphKind,
    ownerId,
    trackedTelegraphIds: response ? Object.keys(response.threats).sort() : undefined,
    acquiredAtMs: threat?.acquiredAtMs ?? response?.acquiredAtMs,
    startingPosition: threat?.startingPosition,
    telegraphGeometry: threat?.geometry,
    escapePoint: response?.escapePoint ?? undefined,
    firstSafeAtMs: threat?.firstSafeAtMs,
    resolvedAtMs: details.resolvedAtMs,
    releasedAtMs: details.releasedAtMs,
    releaseReason: details.releaseReason,
    reenteredAfterSafe: threat?.reenteredAfterSafe,
    outcome: details.outcome,
    damageReceived: details.damageReceived,
    reason: details.reason,
  }, {
    visibility: "combat",
    relatedPlayerIds: [player.isPlayer.id],
    nodeId: player.hasPosition.nodeId,
  });
}

function safeFromAllTelegraphs(
  pos: Vec2,
  zones: readonly RuntimeAttackTelegraph[],
): boolean {
  return zones.every((zone) =>
    telegraphCircles(zone).every((circle) => {
      const safeRadius = circle.radius + RUNE_TELEGRAPH_ESCAPE_CLEARANCE;
      return distanceSq(pos, circle.pos) > safeRadius * safeRadius;
    }),
  );
}

function clampToNode(world: World, nodeId: string, pos: Vec2): Vec2 {
  const node = NODE_REGISTRY.get(nodeId);
  if (!node) return pos;
  return {
    x: Math.max(NODE_MARGIN, Math.min(node.width - NODE_MARGIN, pos.x)),
    y: Math.max(NODE_MARGIN, Math.min(node.height - NODE_MARGIN, pos.y)),
  };
}

function standable(world: World, player: PlayerEntity, pos: Vec2): boolean {
  return !moverOverlapsBlockShapes(
    pos,
    world.collision.blockShapes(player.hasPosition.nodeId, "player"),
    navigationPadForEntity(player),
  );
}

function findEscapeForThreats(
  world: World,
  player: PlayerEntity,
  zones: readonly RuntimeAttackTelegraph[],
): Vec2 | null {
  if (zones.length === 0) return null;
  const from = player.hasPosition.current;
  const angles: number[] = [];
  for (const zone of zones) {
    for (const circle of telegraphCircles(zone)) {
      if (distanceSq(from, circle.pos) <= circle.radius * circle.radius) {
        angles.push(Math.atan2(from.y - circle.pos.y, from.x - circle.pos.x));
      }
    }
  }
  for (let i = 0; i < ESCAPE_SAMPLE_ANGLES; i++) {
    angles.push((i / ESCAPE_SAMPLE_ANGLES) * Math.PI * 2);
  }

  const maxDistance = Math.ceil(
    Math.max(
      ...zones.flatMap((zone) =>
        telegraphCircles(zone).map(
          (circle) => Math.hypot(from.x - circle.pos.x, from.y - circle.pos.y) + circle.radius,
        ),
      ),
    ) + RUNE_TELEGRAPH_ESCAPE_CLEARANCE + ESCAPE_SAMPLE_STEP,
  );

  for (let distance = ESCAPE_SAMPLE_STEP; distance <= maxDistance; distance += ESCAPE_SAMPLE_STEP) {
    let best: Vec2 | null = null;
    let bestDistanceSq = Infinity;
    for (const angle of angles) {
      const candidate = clampToNode(world, player.hasPosition.nodeId, {
        x: from.x + Math.cos(angle) * distance,
        y: from.y + Math.sin(angle) * distance,
      });
      const candidateDistanceSq = distanceSq(from, candidate);
      if (candidateDistanceSq >= bestDistanceSq) continue;
      if (!safeFromAllTelegraphs(candidate, zones) || !standable(world, player, candidate)) continue;
      best = candidate;
      bestDistanceSq = candidateDistanceSq;
    }
    if (best) return best;
  }
  return null;
}

/** Find the shortest standable point outside the telegraphs threatening the player now. */
export function findTelegraphEscapeDestination(
  world: World,
  player: PlayerEntity,
  now: number,
): Vec2 | null {
  return findEscapeForThreats(world, player, telegraphsContainingPlayer(world, player, now));
}

function liveTrackedZones(world: World, response: EvadesTelegraphs): RuntimeAttackTelegraph[] {
  const ids = new Set(Object.keys(response.threats));
  return (world.groundZones.get(response.nodeId) ?? [])
    .filter((zone): zone is RuntimeAttackTelegraph => zone.kind !== "toxic-pool" && ids.has(zone.id))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function addThreats(
  world: World,
  player: PlayerEntity,
  response: EvadesTelegraphs,
  zones: readonly RuntimeAttackTelegraph[],
  now: number,
): boolean {
  let added = false;
  for (const zone of [...zones].sort((a, b) => a.id.localeCompare(b.id))) {
    if (response.threats[zone.id]) continue;
    const threat: TelegraphDodgeThreat = {
      telegraphId: zone.id,
      telegraphKind: zone.kind,
      ownerId: zone.ownerId,
      acquiredAtMs: now,
      startingPosition: { ...player.hasPosition.current },
      geometry: telegraphCircles(zone),
      reenteredAfterSafe: false,
      reentryRecorded: false,
    };
    response.threats[zone.id] = threat;
    recordLifecycle(world, player, "attempt", { zone, threat, response });
    added = true;
  }
  return added;
}

function observeSafety(
  world: World,
  player: PlayerEntity,
  response: EvadesTelegraphs,
  zones: readonly RuntimeAttackTelegraph[],
  now: number,
): void {
  for (const zone of zones) {
    const threat = response.threats[zone.id];
    if (!threat) continue;
    const inside = positionInsideTelegraph(zone, player.hasPosition.current);
    if (!inside && threat.firstSafeAtMs === undefined) {
      threat.firstSafeAtMs = now;
      recordLifecycle(world, player, "safe", { zone, threat, response });
    } else if (inside && threat.firstSafeAtMs !== undefined) {
      threat.reenteredAfterSafe = true;
      if (!threat.reentryRecorded) {
        threat.reentryRecorded = true;
        recordLifecycle(world, player, "reenter", { zone, threat, response });
      }
    }
  }
}

function releaseOwnership(
  world: World,
  player: PlayerEntity,
  reason: TelegraphOwnershipReleaseReason,
  now: number,
): void {
  const response = player.evadesTelegraphs;
  if (!response) return;
  recordLifecycle(world, player, "release", {
    response,
    releasedAtMs: now,
    releaseReason: reason,
    reason,
  });
  detachComponent(world, player, "evadesTelegraphs");
}

/** Explicitly end the movement owner when a higher authority invalidates it. */
export function cancelActiveTelegraphResponse(
  world: World,
  player: PlayerEntity,
  reason: TelegraphOwnershipReleaseReason,
  now = Date.now(),
): void {
  releaseOwnership(world, player, reason, now);
}

/**
 * Advance the Step Back lifecycle and return whether it owns movement. Crossing
 * the geometry only records a safe transition; ownership remains until every
 * tracked telegraph resolves or disappears.
 */
export function updateTelegraphEvasionLifecycle(
  world: World,
  player: PlayerEntity,
  now: number,
  eligibleThreats: readonly RuntimeAttackTelegraph[],
  options: {
    autoEnabled: boolean;
    manualOverride: boolean;
    fleePriority: boolean;
    stepBackEquipped: boolean;
  },
): boolean {
  let response = player.evadesTelegraphs;
  if (response) {
    if (response.nodeId !== player.hasPosition.nodeId) {
      releaseOwnership(world, player, "node-changed", now);
      return false;
    }
    if (!options.autoEnabled) {
      releaseOwnership(world, player, "autocombat-disabled", now);
      return false;
    }
    if (options.manualOverride) {
      releaseOwnership(world, player, "manual-override", now);
      return false;
    }
    if (options.fleePriority) {
      releaseOwnership(world, player, "flee-priority", now);
      return false;
    }
    if (!options.stepBackEquipped) {
      releaseOwnership(world, player, "step-back-unequipped", now);
      return false;
    }

    const presentIds = new Set(
      (world.groundZones.get(response.nodeId) ?? [])
        .filter((zone) => zone.kind !== "toxic-pool" && world.hasMonster(zone.ownerId))
        .map((zone) => zone.id),
    );
    let discardedByCaster = false;
    for (const id of Object.keys(response.threats).sort()) {
      if (presentIds.has(id)) continue;
      const threat = response.threats[id]!;
      const casterGone = !world.hasMonster(threat.ownerId);
      discardedByCaster ||= casterGone;
      recordLifecycle(world, player, "result", {
        threat,
        response,
        outcome: "discarded",
        damageReceived: 0,
        resolvedAtMs: now,
        reason: casterGone ? "caster disappeared before resolution" : "telegraph discarded or cancelled",
      });
      delete response.threats[id];
    }
    if (Object.keys(response.threats).length === 0) {
      releaseOwnership(world, player, discardedByCaster ? "caster-gone" : "telegraph-discarded", now);
      return false;
    }
  }

  if (
    !response &&
    eligibleThreats.length > 0 &&
    options.autoEnabled &&
    !options.manualOverride &&
    !options.fleePriority &&
    options.stepBackEquipped
  ) {
    response = {
      nodeId: player.hasPosition.nodeId,
      acquiredAtMs: now,
      escapePoint: findEscapeForThreats(world, player, eligibleThreats),
      threats: {},
    };
    attachComponent(world, player, "evadesTelegraphs", response);
    recordLifecycle(world, player, "activation", { response });
    addThreats(world, player, response, eligibleThreats, now);
  } else if (response && eligibleThreats.length > 0) {
    if (addThreats(world, player, response, eligibleThreats, now)) {
      response.escapePoint = findEscapeForThreats(world, player, liveTrackedZones(world, response));
    }
  }

  if (!response) return false;
  observeSafety(world, player, response, liveTrackedZones(world, response), now);
  return true;
}

/** Issue movement only while unsafe; once safe, keep ownership and stand still. */
export function steerOutOfTelegraphs(world: World, player: PlayerEntity): void {
  const response = player.evadesTelegraphs;
  if (!response) return;
  const live = liveTrackedZones(world, response);
  if (live.length === 0 || live.every((zone) => !positionInsideTelegraph(zone, player.hasPosition.current))) {
    stopEntity(world, player);
    return;
  }

  let destination = response.escapePoint;
  if (!destination || !safeFromAllTelegraphs(destination, live) || !standable(world, player, destination)) {
    destination = findEscapeForThreats(world, player, live);
    response.escapePoint = destination;
  }
  if (!destination) {
    stopEntity(world, player);
    return;
  }
  const resolved = resolveObstaclesForNode(
    world,
    player.hasPosition.nodeId,
    player.hasPosition.current,
    destination,
    "player",
    navigationPadForEntity(player),
    suppressedFeatureIdsForEntity(world, player),
  );
  setEntityMotion(world, player, destination, {
    mode: resolved === destination ? "direct" : "path",
    avoidHazards: false,
  });
}

export interface TelegraphResolutionCapture {
  zone: RuntimeAttackTelegraph;
  resolvedAtMs: number;
  participants: Map<string, { player: PlayerEntity; threat: TelegraphDodgeThreat }>;
  pendingFailures: Map<string, { player: PlayerEntity; hpBefore: number; threat: TelegraphDodgeThreat }>;
  successful: Array<{ player: PlayerEntity; threat: TelegraphDodgeThreat }>;
}

/** Capture authoritative geometry immediately before the real attack applies. */
export function beginTelegraphResolutionTelemetry(
  world: World,
  nodeId: string,
  zone: RuntimeAttackTelegraph,
  now = Date.now(),
): TelegraphResolutionCapture {
  const participants = new Map<string, { player: PlayerEntity; threat: TelegraphDodgeThreat }>();
  const pendingFailures = new Map<string, { player: PlayerEntity; hpBefore: number; threat: TelegraphDodgeThreat }>();
  const successful: Array<{ player: PlayerEntity; threat: TelegraphDodgeThreat }> = [];
  for (const player of world.livePlayersInNode(nodeId)) {
    const response = player.evadesTelegraphs;
    const threat = response?.threats[zone.id];
    if (!response || !threat) continue;
    participants.set(player.isPlayer.id, { player, threat });
    observeSafety(world, player, response, [zone], now);
    recordLifecycle(world, player, "resolution", { zone, threat, response, resolvedAtMs: now });
    if (positionInsideTelegraph(zone, player.hasPosition.current)) {
      pendingFailures.set(player.isPlayer.id, { player, hpBefore: player.hasHealth.hp, threat });
    } else {
      successful.push({ player, threat });
    }
  }
  return { zone, resolvedAtMs: now, participants, pendingFailures, successful };
}

/** Complete one positional failure after the real combat pipeline applies damage. */
export function recordTelegraphResolutionVictim(
  world: World,
  capture: TelegraphResolutionCapture,
  playerId: string,
): void {
  const pending = capture.pendingFailures.get(playerId);
  if (!pending) return;
  capture.pendingFailures.delete(playerId);
  const damage = Math.max(0, pending.hpBefore - pending.player.hasHealth.hp);
  const response = pending.player.evadesTelegraphs;
  if (!response) return;
  recordLifecycle(world, pending.player, "result", {
    zone: capture.zone,
    threat: pending.threat,
    response,
    outcome: "failure",
    damageReceived: damage,
    resolvedAtMs: capture.resolvedAtMs,
  });
  delete response.threats[capture.zone.id];
}

/** Finish all results, then release only when the tracked threat set is empty. */
export function finishTelegraphResolutionTelemetry(
  world: World,
  capture: TelegraphResolutionCapture,
): void {
  for (const [playerId] of [...capture.pendingFailures]) {
    recordTelegraphResolutionVictim(world, capture, playerId);
  }
  for (const { player, threat } of capture.successful) {
    const response = player.evadesTelegraphs;
    if (!response?.threats[capture.zone.id]) continue;
    recordLifecycle(world, player, "result", {
      zone: capture.zone,
      threat,
      response,
      outcome: "success",
      damageReceived: 0,
      resolvedAtMs: capture.resolvedAtMs,
    });
    delete response.threats[capture.zone.id];
  }

  for (const { player } of capture.participants.values()) {
    const response = player.evadesTelegraphs;
    if (response && Object.keys(response.threats).length === 0) {
      releaseOwnership(world, player, "resolved", capture.resolvedAtMs);
    }
  }
}
