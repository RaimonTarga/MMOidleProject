import {
  buildNodeGateEntities, NODE_BIOMES, nodeFamily,
  type NodeGateEntity, type Vec2,
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
 * The arrival banner's territory line (design §24.3): the node's dominant family —
 * "Pack territory". Null for a node with no blend (dungeon, sanctuary, the
 * Clearing). Replaces the modifier line (review P13).
 */
export function arrivalTerritoryLine(nodeId: string): { territory: string } | null {
  const family = nodeFamily(nodeId);
  if (!family) return null;
  return { territory: `${family.name} territory` };
}

/**
 * The territory line that STAYS on screen (design §26.4, thesis D's permanent
 * "Here" line): the node's name and its dominant family — "Mire territory". Null
 * where the node has no blend (dungeon, sanctuary, the Clearing), like the
 * arrival line.
 */
export function territoryHereLine(nodeId: string): { name: string; territory: string } | null {
  const info = NODE_BIOMES[nodeId];
  const family = nodeFamily(nodeId);
  if (!info || !family) return null;
  return {
    name: info.displayName,
    territory: `${family.name} territory`,
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
