import {
  buildNodeGateEntities, NODE_BIOMES, nodeFamily, nodeShard, shardName,
  type NodeGateEntity, type PacketId, type Vec2,
} from '@mmo-idle/shared';

export type ArrivalKind = 'discovery' | 'new-node' | 'return';
export const ARRIVAL_DURATION_MS: Record<ArrivalKind, number> = {
  discovery: 5000, 'new-node': 2800, return: 1600,
};

export function arrivalKind(nodeId: string, previouslyVisited: readonly string[]): ArrivalKind {
  if (previouslyVisited.includes(nodeId)) return 'return';
  const info = NODE_BIOMES[nodeId];
  const familiar = previouslyVisited.some(id => {
    const prior = NODE_BIOMES[id];
    return prior && prior.biomeTier === info?.biomeTier && prior.biomeGroup === info?.biomeGroup;
  });
  return familiar ? 'new-node' : 'discovery';
}

/**
 * The arrival banner's territory line (design §24.3): the node's dominant family
 * and the one shard every kill in it pays — "Pack territory · every kill here
 * drops Gale Shards", shortened on a return visit. Null for a node with no blend
 * (dungeon, sanctuary, the Clearing): it says nothing about shards rather than
 * something untrue. Replaces the modifier line (review P13).
 */
export function arrivalTerritoryLine(
  nodeId: string,
  kind: ArrivalKind,
): { territory: string; shard: PacketId; detail: string } | null {
  const family = nodeFamily(nodeId);
  const shard = nodeShard(nodeId);
  if (!family || !shard) return null;
  return {
    territory: `${family.name} territory`,
    shard,
    detail: kind === 'return' ? `${shardName(shard)}s` : `every kill here drops ${shardName(shard)}s`,
  };
}

/**
 * The territory line that STAYS on screen (design §26.4, thesis D's permanent
 * "Here" line): the node's name, its dominant family and the one shard every
 * kill pays — "Mire territory · every kill pays Venom". Null where the node has
 * no blend (dungeon, sanctuary, the Clearing), like the arrival line.
 */
export function territoryHereLine(nodeId: string): {
  name: string;
  territory: string;
  shard: PacketId;
  /** "Venom": the shard's word, the mockup's short form. */
  shardWord: string;
} | null {
  const info = NODE_BIOMES[nodeId];
  const family = nodeFamily(nodeId);
  const shard = nodeShard(nodeId);
  if (!info || !family || !shard) return null;
  return {
    name: info.displayName,
    territory: `${family.name} territory`,
    shard,
    shardWord: shardName(shard).replace(/ Shard$/, ''),
  };
}

// At baseline movement speed this gives several seconds of notice before crossing.
export const EXIT_PREVIEW_SHOW_DISTANCE = 460;
export const EXIT_PREVIEW_HIDE_DISTANCE = 560;

function distanceToGate(pos: Vec2, gate: NodeGateEntity): number {
  const b = gate.bounds;
  return Math.hypot(Math.max(b.x - pos.x, 0, pos.x - b.x - b.width),
    Math.max(b.y - pos.y, 0, pos.y - b.y - b.height));
}

/** Each open edge has independent hysteresis, so corners can show both destinations. */
export function nearbyExits(nodeId: string, pos: Vec2, previousIds: readonly string[] = []): NodeGateEntity[] {
  const gates = buildNodeGateEntities(nodeId).filter(gate => !gate.sealed && gate.exitNodeId);
  return gates.filter(gate => distanceToGate(pos, gate) <=
    (previousIds.includes(gate.id) ? EXIT_PREVIEW_HIDE_DISTANCE : EXIT_PREVIEW_SHOW_DISTANCE));
}
