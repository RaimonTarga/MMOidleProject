import {
  getCounter,
  getFlag,
  getString,
  hazardAvoidanceShapesForMover,
  moverOverlapsBlockShapes,
  setCounter,
  setFlag,
  setString,
  type NodeFeatureShape,
  type Vec2,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { NODE_REGISTRY } from '../../../world/nodeRegistry';
import { actorFromPlayer } from '../../../world/worldLogActors';
import { recordWorldLogEvent } from '../../../world/worldLog';
import {
  activeAvoidablePersistentGroundZones,
  type RuntimeToxicPool,
} from '../../world/groundZones';
import { navigationPadForEntity, setEntityMotion, stopEntity } from '../../world/movement';
import { activePlayerAvoidedFeatures, playerInFeatureContact, resolveObstaclesForNode } from '../../world/nodeFeatures';
import { suppressedFeatureIdsForEntity } from '../../world/pathMotion';

export const DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG = 'rune.dynamicHazardEscapeActive';
const ESCAPE_ZONE_IDS_KEY = 'rune.dynamicHazardEscapeZoneIds';
const ESCAPE_X_KEY = 'rune.dynamicHazardEscapeX';
const ESCAPE_Y_KEY = 'rune.dynamicHazardEscapeY';
const ESCAPE_SAMPLE_STEP = 8;
const ESCAPE_SAMPLE_ANGLES = 64;
// Extra margin BEYOND the mover's own navigation footprint, so the first
// ordinary hazard-aware path after an escape starts on a cell the planner still
// considers walkable rather than one pixel inside the blocker it just left.
const ESCAPE_CLEARANCE = 28;
const NODE_MARGIN = 40;
/** Envelope around a hazard inside which a target counts as sheltered by it. */
export const HAZARD_TARGET_CLEARANCE = 64;

/** The hazard shape (static feature or persistent pool) the player-side nav avoids at `pos`. */
export function playerHazardContainingPoint(
  world: World,
  nodeId: string,
  pos: Vec2,
  now: number,
  clearance = 0,
): NodeFeatureShape | null {
  for (const shape of hazardAvoidanceShapesForMover(nodeId, 'player')) {
    if (moverOverlapsBlockShapes(pos, [shape], { x: clearance, y: clearance })) return shape;
  }
  for (const zone of activeAvoidablePersistentGroundZones(world, nodeId, now)) {
    const shape: NodeFeatureShape = {
      kind: 'circle',
      x: zone.pos.x,
      y: zone.pos.y,
      radius: zone.radius,
    };
    if (moverOverlapsBlockShapes(pos, [shape], { x: clearance, y: clearance })) return shape;
  }
  return null;
}

interface EscapeHazard {
  id: string;
  sourceId: string;
  pos: Vec2;
  radius: number;
  /** Deals damage right now (and so suppresses Recovery), not just slows. */
  damaging: boolean;
  contains: (pos: Vec2, clearance: number) => boolean;
}

export interface PersistentHazardEscapeOptions {
  /** Only escape hazards that deal damage; status-only slows are tolerated. */
  damagingOnly?: boolean;
}

/**
 * Whether the mover's navigation footprint overlaps this avoidance shape, using
 * the SAME primitive the nav grid blocks cells with. Durability32 measured why
 * this has to be the admission test rather than a centre-point check: across 48
 * Jungle observations, 19 ended stationary with the player centre 1.6-21.9 px
 * OUTSIDE a slow bush and its footprint still overlapping. None ended with the
 * centre inside. A walking player stops exactly where the padded footprint first
 * blocks, so a centre-in-shape predicate is a false negative precisely in the
 * band where hazard-aware pathing has already started failing.
 */
function footprintObstructed(pos: Vec2, shape: NodeFeatureShape, pad: Vec2, clearance = 0): boolean {
  return moverOverlapsBlockShapes(pos, [shape], {
    x: pad.x + clearance,
    y: pad.y + clearance,
  });
}

function persistentHazards(
  world: World,
  player: PlayerEntity,
  now: number,
  options: PersistentHazardEscapeOptions = {},
): EscapeHazard[] {
  const all = allPersistentHazards(world, player, now);
  return options.damagingOnly ? all.filter(hazard => hazard.damaging) : all;
}

function allPersistentHazards(world: World, player: PlayerEntity, now: number): EscapeHazard[] {
  const nodeId = player.hasPosition.nodeId;
  // The planner pads every hazard shape by this before blocking cells, so escape
  // admission, continuation and safe-exit all measure against the same envelope.
  const pad = navigationPadForEntity(player);
  return [
    ...activeAvoidablePersistentGroundZones(world, nodeId, now).map(zone => {
      // dynamicHazardShapes feeds the planner this exact circle.
      const shape: NodeFeatureShape = {
        kind: 'circle', x: zone.pos.x, y: zone.pos.y, radius: zone.radius,
      };
      return {
        ...zone,
        radius: zone.radius + Math.max(pad.x, pad.y),
        damaging: zone.damagePerTick > 0,
        contains: (pos: Vec2, clearance: number) => footprintObstructed(pos, shape, pad, clearance),
      };
    }),
    ...activePlayerAvoidedFeatures(world, nodeId).map(({ feature, damageActive }) => {
      const shape = feature.shape;
      // A status-only feature has no contact band: its status lands on shape
      // entry, and the nav grid avoids the bare shape too.
      const band = damageActive ? feature.damage?.contactBandPx ?? 0 : 0;
      const extent = Math.max(pad.x, pad.y);
      return {
        id: `node-feature:${feature.id}`,
        sourceId: feature.damage?.effectId ?? feature.statusWhileInside?.effectId ?? feature.id,
        pos: { x: shape.x, y: shape.y },
        radius: (shape.kind === 'circle' ? shape.radius : Math.hypot(shape.halfW, shape.halfH)) + band + extent,
        damaging: damageActive,
        contains: (pos: Vec2, clearance: number) =>
          // Either the damage actually reaches the player, or the planner already
          // refuses to route out of here. Both are escape-worthy; only the second
          // is what traps a player standing on a bush edge.
          (damageActive && clearance === 0 && playerInFeatureContact(pos, feature)) ||
          footprintObstructed(pos, shape, pad, band + clearance),
      };
    }),
  ];
}

function zoneIds(player: PlayerEntity): Set<string> {
  const stored = getString(player.tracksCombat, ESCAPE_ZONE_IDS_KEY);
  return new Set(stored ? stored.split('|').filter(Boolean) : []);
}

function writeZoneIds(player: PlayerEntity, ids: ReadonlySet<string>): void {
  setString(player.tracksCombat, ESCAPE_ZONE_IDS_KEY, [...ids].sort().join('|'));
}

function clearEscapeState(player: PlayerEntity): void {
  setFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG, false);
  setString(player.tracksCombat, ESCAPE_ZONE_IDS_KEY, '');
  setCounter(player.tracksCombat, ESCAPE_X_KEY, 0);
  setCounter(player.tracksCombat, ESCAPE_Y_KEY, 0);
}

function recordEscape(
  world: World,
  player: PlayerEntity,
  hazards: readonly Pick<EscapeHazard, 'id' | 'sourceId'>[],
  phase: 'attempt' | 'result',
  outcome?: 'success' | 'failed' | 'expired' | 'interrupted',
  reason?: string,
): void {
  recordWorldLogEvent(world, {
    kind: 'hazard-escape',
    nodeId: player.hasPosition.nodeId,
    player: actorFromPlayer(player),
    hazardIds: hazards.map((hazard) => hazard.id),
    hazardKinds: hazards.map((hazard) => hazard.sourceId),
    phase,
    outcome,
    reason,
  }, {
    visibility: 'combat',
    relatedPlayerIds: [player.isPlayer.id],
    nodeId: player.hasPosition.nodeId,
  });
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
    world.collision.blockShapes(player.hasPosition.nodeId, 'player'),
    navigationPadForEntity(player),
  );
}

function safeFromAllPersistentHazards(
  pos: Vec2,
  hazards: readonly EscapeHazard[],
): boolean {
  return hazards.every((hazard) => !hazard.contains(pos, ESCAPE_CLEARANCE));
}

function insideAvoidanceEnvelope(pos: Vec2, hazard: EscapeHazard): boolean {
  return hazard.contains(pos, ESCAPE_CLEARANCE);
}

function storedDestination(player: PlayerEntity): Vec2 | null {
  const x = getCounter(player.tracksCombat, ESCAPE_X_KEY);
  const y = getCounter(player.tracksCombat, ESCAPE_Y_KEY);
  return x !== 0 || y !== 0 ? { x, y } : null;
}

/** Find the shortest nearby standable point outside the complete active hazard union. */
export function findPersistentHazardEscapeDestination(
  world: World,
  player: PlayerEntity,
  now: number,
  options: PersistentHazardEscapeOptions = {},
): Vec2 | null {
  const hazards = persistentHazards(world, player, now, options);
  const threats = hazards.filter((hazard) => hazard.contains(player.hasPosition.current, 0));
  if (threats.length === 0) return null;

  const from = player.hasPosition.current;
  const angles: number[] = [];
  for (const threat of threats) {
    angles.push(Math.atan2(from.y - threat.pos.y, from.x - threat.pos.x));
  }
  for (let i = 0; i < ESCAPE_SAMPLE_ANGLES; i++) {
    angles.push((i / ESCAPE_SAMPLE_ANGLES) * Math.PI * 2);
  }

  const maxDistance = Math.ceil(Math.max(
    ...threats.map((hazard) =>
      Math.hypot(from.x - hazard.pos.x, from.y - hazard.pos.y) +
      hazard.radius + ESCAPE_CLEARANCE + ESCAPE_SAMPLE_STEP),
  ));
  let pathFallback: Vec2 | null = null;

  for (let distance = ESCAPE_SAMPLE_STEP; distance <= maxDistance; distance += ESCAPE_SAMPLE_STEP) {
    for (const angle of angles) {
      const candidate = clampToNode(world, player.hasPosition.nodeId, {
        x: from.x + Math.cos(angle) * distance,
        y: from.y + Math.sin(angle) * distance,
      });
      if (!safeFromAllPersistentHazards(candidate, hazards) || !standable(world, player, candidate)) {
        continue;
      }
      const resolved = resolveObstaclesForNode(
        world,
        player.hasPosition.nodeId,
        from,
        candidate,
        'player',
        navigationPadForEntity(player),
        suppressedFeatureIdsForEntity(world, player),
      );
      if (resolved === candidate) return candidate;
      pathFallback ??= candidate;
    }
    if (pathFallback) return pathFallback;
  }
  return null;
}

/**
 * Claim movement while inside a persistent hazard the player-side nav grid
 * avoids — a damaging zone/feature, or a status-only feature such as a Jungle
 * slow bush. Returns true exactly while this temporary response owns the
 * ordinary auto-movement channel.
 */
export function steerOutOfPersistentHazards(
  world: World,
  player: PlayerEntity,
  now: number,
  options: PersistentHazardEscapeOptions = {},
): boolean {
  const hazards = persistentHazards(world, player, now, options);
  const active = getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG);
  const threats = hazards.filter((hazard) =>
    active
      ? insideAvoidanceEnvelope(player.hasPosition.current, hazard)
      : hazard.contains(player.hasPosition.current, 0),
  );
  const trackedIds = zoneIds(player);

  if (threats.length === 0) {
    if (active) {
      const trackedHazards = [
        ...hazards.filter(hazard => trackedIds.has(hazard.id)),
        ...(world.groundZones.get(player.hasPosition.nodeId) ?? []).filter((zone): zone is RuntimeToxicPool =>
          zone.kind === 'toxic-pool' && trackedIds.has(zone.id) && !hazards.some(hazard => hazard.id === zone.id),
        ),
      ];
      const stillLive = hazards.some(hazard => trackedIds.has(hazard.id));
      recordEscape(
        world,
        player,
        trackedHazards,
        'result',
        stillLive ? 'success' : 'expired',
        stillLive ? undefined : 'hazard ended before an authoritative safe exit was observed',
      );
      clearEscapeState(player);
    }
    return false;
  }

  if (!active) {
    setFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG, true);
    for (const threat of threats) trackedIds.add(threat.id);
    writeZoneIds(player, trackedIds);
    recordEscape(world, player, threats, 'attempt');
  } else {
    for (const threat of threats) trackedIds.add(threat.id);
    writeZoneIds(player, trackedIds);
  }

  let destination = storedDestination(player);
  if (
    !destination ||
    !safeFromAllPersistentHazards(destination, hazards) ||
    !standable(world, player, destination)
  ) {
    destination = findPersistentHazardEscapeDestination(world, player, now, options);
    if (destination) {
      setCounter(player.tracksCombat, ESCAPE_X_KEY, destination.x);
      setCounter(player.tracksCombat, ESCAPE_Y_KEY, destination.y);
    }
  }

  if (!destination) {
    stopEntity(world, player);
    return true;
  }

  const resolved = resolveObstaclesForNode(
    world,
    player.hasPosition.nodeId,
    player.hasPosition.current,
    destination,
    'player',
    navigationPadForEntity(player),
    suppressedFeatureIdsForEntity(world, player),
  );
  // The starting point is deliberately inside the hazard, so this one escape
  // request plans only against real collision. Once safe, ordinary paths include
  // persistent hazards again and cannot immediately route back through the pool.
  setEntityMotion(world, player, destination, {
    mode: resolved === destination ? 'direct' : 'path',
    avoidHazards: false,
  });
  return true;
}
