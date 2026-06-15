import type { NodeFeatureShape } from '../world/nodeFeatures';

export type CollisionRegionKind =
  | 'body'
  | 'aggro'
  | 'leash'
  | 'reach'
  | 'block'
  | 'damage'
  | 'status'
  | 'heal'
  | 'gate'
  | 'spawn';

export type CollisionOwnerKind =
  | 'player'
  | 'monster'
  | 'minion'
  | 'feature'
  | 'gate';

export interface CollisionRegion {
  id: string;
  kind: CollisionRegionKind;
  shape: NodeFeatureShape;
  ownerId?: string;
  ownerKind?: CollisionOwnerKind;
  /** Feature metadata, gate direction, contact bands, etc. */
  data?: Record<string, number | string>;
}

export function regionsOfKind(
  regions: CollisionRegion[],
  kind: CollisionRegionKind,
): CollisionRegion[] {
  return regions.filter(region => region.kind === kind);
}
