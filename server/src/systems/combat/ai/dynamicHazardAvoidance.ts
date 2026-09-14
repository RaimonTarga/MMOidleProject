import {
  geometryContains,
  getCounter,
  getFlag,
  getString,
  moverOverlapsBlockShapes,
  pointInNodeFeatureShape,
  pointNearNodeFeatureShapeEdge,
  setCounter,
  setFlag,
  setString,
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
import { activePlayerDamageFeatures, playerInFeatureContact, resolveObstaclesForNode } from '../../world/nodeFeatures';
import { suppressedFeatureIdsForEntity } from '../../world/pathMotion';

export const DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG = 'rune.dynamicHazardEscapeActive';
const ESCAPE_ZONE_IDS_KEY = 'rune.dynamicHazardEscapeZoneIds';
const ESCAPE_X_KEY = 'rune.dynamicHazardEscapeX';
const ESCAPE_Y_KEY = 'rune.dynamicHazardEscapeY';
const ESCAPE_SAMPLE_STEP = 8;
const ESCAPE_SAMPLE_ANGLES = 64;
// Clear the pool by more than the player's 22px navigation half-width so the
// first ordinary hazard-aware path starts on a walkable cell instead of inside
// the runtime blocker it just escaped.
const ESCAPE_CLEARANCE = 28;
const NODE_MARGIN = 40;

interface EscapeHazard {
  id: string;
  sourceId: string;
  pos: Vec2;
  radius: number;
  contains: (pos: Vec2, clearance: number) => boolean;
}

function persistentHazards(world: World, nodeId: string, now: number): EscapeHazard[] {
  return [
    ...activeAvoidablePersistentGroundZones(world, nodeId, now).map(zone => ({
      ...zone,
      contains: (pos: Vec2, clearance: number) => geometryContains(zone.geometry, pos, clearance),
    })),
    ...activePlayerDamageFeatures(world, nodeId).map(feature => {
      const shape = feature.shape;
      const band = feature.damage?.contactBandPx ?? 0;
      return {
        id: `node-feature:${feature.id}`,
        sourceId: feature.damage!.effectId,
        pos: { x: shape.x, y: shape.y },
        radius: (shape.kind === 'circle' ? shape.radius : Math.hypot(shape.halfW, shape.halfH)) + band,
        contains: (pos: Vec2, clearance: number) => clearance === 0
          ? playerInFeatureContact(pos, feature)
          : pointInNodeFeatureShape(pos, shape) || pointNearNodeFeatureShapeEdge(pos, shape, band + clearance),
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
): Vec2 | null {
  const hazards = persistentHazards(world, player.hasPosition.nodeId, now);
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
 * Claim movement while inside a persistent damage hazard. Returns true
 * exactly while this temporary response owns the ordinary auto-movement channel.
 */
export function steerOutOfPersistentHazards(
  world: World,
  player: PlayerEntity,
  now: number,
): boolean {
  const hazards = persistentHazards(world, player.hasPosition.nodeId, now);
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
    destination = findPersistentHazardEscapeDestination(world, player, now);
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
