import type { WorldRegionDefinition } from './types';

export const WORLD_REGIONS: ReadonlyMap<string, WorldRegionDefinition> = new Map([
  ['t1', {
    id: 't1',
    tier: 1,
    displayName: 'Region 1',
    respawnNodeId: 'node-clearing',
  }],
  ['t2', {
    id: 't2',
    tier: 2,
    displayName: 'Region 2',
    respawnNodeId: 'node-t2-sanctuary',
  }],
  ['t3', {
    id: 't3',
    tier: 3,
    displayName: 'Region 3',
    respawnNodeId: 'node-t3-sanctuary',
  }],
  ['t4', {
    id: 't4',
    tier: 4,
    displayName: 'Region 4',
    respawnNodeId: 'node-t4-sanctuary',
  }],
]);
