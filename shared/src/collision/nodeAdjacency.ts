import type { NodeDirection } from '../world/nodeBiomes';
import {
  directionBetweenWorldNodes,
  worldNodeExits,
} from '../world/map/registry';

/** Pixels from the node boundary that fire a transition. Matches server/client gate thickness. */
export const EXIT_TRIGGER = 20;

/** Cardinal exits derived from occupied cells in the canonical sparse world. */
export function nodeExitsForNodeId(
  nodeId: string,
): Partial<Record<NodeDirection, string>> {
  return worldNodeExits(nodeId);
}

/** Cardinal direction from `fromId` to an adjacent `toId`, or null if not neighbors. */
export function directionBetweenNodes(
  fromId: string,
  toId: string,
): NodeDirection | null {
  return directionBetweenWorldNodes(fromId, toId);
}
