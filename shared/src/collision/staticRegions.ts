import { pointInNodeFeatureShape } from '../systems/spatial';
import type { FeatureTarget, NodeFeatureShape } from '../world/nodeFeatures';
import { RESOLVED_NODE_FEATURES } from '../world/nodeFeatures';
import { getNodeTrees } from '../world/trees';
import type { NodeDirection } from '../world/nodeBiomes';
import { gateCollisionRegionsForNode } from './gates';
import type { CollisionRegion } from './types';

const staticRegionCache = new Map<string, CollisionRegion[]>();

const TREE_BLOCK_TARGETS: FeatureTarget[] = ['player', 'monster'];

/** Scattered forest trees block both players and monsters at each trunk rect. */
function treeRegions(nodeId: string): CollisionRegion[] {
  const regions: CollisionRegion[] = [];
  for (const tree of getNodeTrees(nodeId)) {
    tree.shapes.forEach((shape, i) => {
      for (const target of TREE_BLOCK_TARGETS) {
        regions.push({
          id: `${tree.id}:block:${target}:${i}`,
          kind: 'block',
          shape,
          ownerKind: 'feature',
          ownerId: tree.id,
          data: { featureId: tree.id, blockTarget: target },
        });
      }
    });
  }
  return regions;
}

function featureRegions(nodeId: string): CollisionRegion[] {
  const regions: CollisionRegion[] = [];
  const features = RESOLVED_NODE_FEATURES[nodeId];
  if (!features) return [...regions, ...treeRegions(nodeId)];

  for (const feature of features) {
    const base = {
      ownerKind: 'feature' as const,
      ownerId: feature.id,
      data: { featureId: feature.id },
    };

    if (feature.blocksMovement?.length) {
      for (const target of feature.blocksMovement) {
        regions.push({
          id: `${nodeId}:${feature.id}:block:${target}`,
          kind: 'block',
          shape: feature.shape,
          ...base,
          data: { ...base.data, blockTarget: target },
        });
      }
    }

    if (feature.damage) {
      regions.push({
        id: `${nodeId}:${feature.id}:damage`,
        kind: 'damage',
        shape: feature.shape,
        ...base,
        data: {
          ...base.data,
          effectId: feature.damage.effectId,
          contactBandPx: feature.damage.contactBandPx ?? 0,
          requiresActiveBlock: feature.damage.requiresActiveBlock ? 1 : 0,
          preFinalStageOnly: feature.damage.preFinalStageOnly ? 1 : 0,
          damageTarget: feature.damage.targets.join(','),
        },
      });
    }

    if (feature.statusWhileInside) {
      regions.push({
        id: `${nodeId}:${feature.id}:status`,
        kind: 'status',
        shape: feature.shape,
        ...base,
        data: {
          ...base.data,
          effectId: feature.statusWhileInside.effectId,
          statusTarget: feature.statusWhileInside.targets.join(','),
        },
      });
    }

    if (feature.healWhileInside) {
      regions.push({
        id: `${nodeId}:${feature.id}:heal`,
        kind: 'heal',
        shape: feature.shape,
        ...base,
        data: {
          ...base.data,
          hpPctPerSec: feature.healWhileInside.hpPctPerSec,
          encounterAddsOnly: feature.healWhileInside.encounterAddsOnly ? 1 : 0,
          healTarget: feature.healWhileInside.targets.join(','),
        },
      });
    }

    if (feature.spawns) {
      regions.push({
        id: `${nodeId}:${feature.id}:spawn`,
        kind: 'spawn',
        shape: feature.shape,
        ...base,
        data: {
          ...base.data,
          monsterTypeId: feature.spawns.monsterTypeId,
          intervalMs: feature.spawns.intervalMs,
          maxAlive: feature.spawns.maxAlive,
        },
      });
    }
  }

  regions.push(...treeRegions(nodeId));
  return regions;
}

/** Node features only (no gate edge bands). */
export function buildFeatureCollisionRegions(nodeId: string): CollisionRegion[] {
  return featureRegions(nodeId);
}

/** Static collision paint steps for a node: features + gate edge bands. */
export function buildStaticCollisionRegions(nodeId: string): CollisionRegion[] {
  const cached = staticRegionCache.get(nodeId);
  if (cached) return cached;

  const regions = [...featureRegions(nodeId), ...gateCollisionRegionsForNode(nodeId)];
  staticRegionCache.set(nodeId, regions);
  return regions;
}

export function blockShapesForMover(
  nodeId: string,
  mover: FeatureTarget,
  suppressedFeatureIds: ReadonlySet<string> = new Set(),
): NodeFeatureShape[] {
  return buildStaticCollisionRegions(nodeId)
    .filter(region => {
      if (region.kind !== 'block') return false;
      if (region.data?.blockTarget !== mover) return false;
      const featureId = region.data?.featureId;
      if (typeof featureId === 'string' && suppressedFeatureIds.has(featureId)) {
        return false;
      }
      return true;
    })
    .map(region => region.shape);
}

export function hazardAvoidanceShapesForMover(
  nodeId: string,
  mover: FeatureTarget,
): NodeFeatureShape[] {
  const features = RESOLVED_NODE_FEATURES[nodeId];
  if (!features) return [];

  const shapes: NodeFeatureShape[] = [];
  for (const feature of features) {
    const hurtsMover = feature.damage?.targets.includes(mover) ?? false;
    const affectsMover =
      feature.statusWhileInside?.targets.includes(mover) ?? false;
    if (hurtsMover || affectsMover) shapes.push(feature.shape);
  }
  return shapes;
}

export function gateDirectionAtPoint(
  nodeId: string,
  pos: { x: number; y: number },
): NodeDirection | null {
  const gates = buildStaticCollisionRegions(nodeId).filter(r => r.kind === 'gate');
  const priority: NodeDirection[] = ['west', 'east', 'north', 'south'];
  for (const direction of priority) {
    const gate = gates.find(g => g.data?.direction === direction);
    if (!gate) continue;
    if (pointInNodeFeatureShape(pos, gate.shape)) return direction;
  }
  return null;
}

export function exitNodeIdForGate(
  nodeId: string,
  direction: NodeDirection,
): string | null {
  const gate = buildStaticCollisionRegions(nodeId).find(
    r => r.kind === 'gate' && r.data?.direction === direction,
  );
  const exitNodeId = gate?.data?.exitNodeId;
  return typeof exitNodeId === 'string' ? exitNodeId : null;
}
