import { GAME_CONFIG } from '../config/gameConfig';
import type { NodeFeatureShape } from '../world/nodeFeatures';
import type { NodeDirection } from '../world/nodeBiomes';
import { EXIT_TRIGGER, nodeExitsForNodeId } from './nodeAdjacency';
import type { CollisionRegion } from './types';

/** Solid gate bar thickness — matches transition trigger depth. */
export const GATE_THICK = EXIT_TRIGGER;

/** World-space glow padding around open gate bars (render only). */
export const GATE_GLOW_PX = 8;

export interface NodeGateBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Authoritative gate placement for a node edge; drives collision and client paint. */
export interface NodeGateEntity {
  id: string;
  nodeId: string;
  direction: NodeDirection;
  /** Solid bar rect (top-left origin) — collision + inner world render. */
  bounds: NodeGateBounds;
  /** Halo rect extending beyond bounds (top-left origin) — world render only. */
  glowBounds: NodeGateBounds;
  exitNodeId?: string;
  sealed: boolean;
}

const gateEntityCache = new Map<string, NodeGateEntity[]>();

function solidBounds(
  direction: NodeDirection,
  width: number,
  height: number,
  thick: number,
): NodeGateBounds {
  switch (direction) {
    case 'north':
      return { x: 0, y: 0, width, height: thick };
    case 'south':
      return { x: 0, y: height - thick, width, height: thick };
    case 'west':
      return { x: 0, y: 0, width: thick, height };
    case 'east':
      return { x: width - thick, y: 0, width: thick, height };
  }
}

function glowBounds(
  direction: NodeDirection,
  width: number,
  height: number,
  thick: number,
): NodeGateBounds {
  const g = GATE_GLOW_PX;
  switch (direction) {
    case 'north':
      return { x: -g, y: -6, width: width + g * 2, height: thick + 10 };
    case 'south':
      return { x: -g, y: height - thick - 4, width: width + g * 2, height: thick + 10 };
    case 'west':
      return { x: -6, y: -g, width: thick + 10, height: height + g * 2 };
    case 'east':
      return { x: width - thick - 4, y: -g, width: thick + 10, height: height + g * 2 };
  }
}

/** Spawn gate entities for all four node edges (open exits and sealed borders). */
export function buildNodeGateEntities(nodeId: string): NodeGateEntity[] {
  const cached = gateEntityCache.get(nodeId);
  if (cached) return cached;

  const exits = nodeExitsForNodeId(nodeId);
  const width = GAME_CONFIG.NODE_WIDTH;
  const height = GAME_CONFIG.NODE_HEIGHT;
  const directions: NodeDirection[] = ['north', 'south', 'east', 'west'];

  const entities = directions.map(direction => {
    const exitNodeId = exits[direction];
    return {
      id: `${nodeId}:gate:${direction}`,
      nodeId,
      direction,
      bounds: solidBounds(direction, width, height, GATE_THICK),
      glowBounds: glowBounds(direction, width, height, GATE_THICK),
      exitNodeId,
      sealed: !exitNodeId,
    };
  });

  gateEntityCache.set(nodeId, entities);
  return entities;
}

export function gateCollisionShapeFromBounds(bounds: NodeGateBounds): NodeFeatureShape {
  return {
    kind: 'rect',
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
    halfW: bounds.width / 2,
    halfH: bounds.height / 2,
  };
}

export function gateEntityToCollisionRegion(entity: NodeGateEntity): CollisionRegion {
  return {
    id: entity.id,
    kind: 'gate',
    shape: gateCollisionShapeFromBounds(entity.bounds),
    ownerKind: 'gate',
    ownerId: entity.direction,
    data: entity.exitNodeId
      ? { direction: entity.direction, exitNodeId: entity.exitNodeId }
      : { direction: entity.direction, sealed: 1 },
  };
}

export function gateCollisionRegionsForNode(nodeId: string): CollisionRegion[] {
  return buildNodeGateEntities(nodeId).map(gateEntityToCollisionRegion);
}
