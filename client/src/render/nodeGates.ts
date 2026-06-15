import {
  buildNodeGateEntities,
  gateEntityToCollisionRegion,
  type CollisionRegion,
} from '@mmo-idle/shared';
import type { RenderState } from './state';

/** Rebuild gate entities when the player enters a node. */
export function spawnNodeGates(state: RenderState): void {
  state.nodeGateEntities = state.ownNodeId
    ? buildNodeGateEntities(state.ownNodeId)
    : [];
  state.lastSpawnedGateNodeId = state.ownNodeId;
}

/** Idempotent spawn used before collision/minimap paint. */
export function ensureNodeGates(state: RenderState): void {
  if (state.ownNodeId === state.lastSpawnedGateNodeId) return;
  spawnNodeGates(state);
}

export function gateCollisionRegionsFromState(state: RenderState): CollisionRegion[] {
  return state.nodeGateEntities.map(gateEntityToCollisionRegion);
}

export function openGateCollisionRegions(state: RenderState): CollisionRegion[] {
  return gateCollisionRegionsFromState(state).filter(
    region => region.data?.sealed !== 1,
  );
}
