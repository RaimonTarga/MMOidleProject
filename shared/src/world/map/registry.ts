import type { NodeDirection } from '../nodeBiomes';
import { REGION_T1_NODES } from './regionT1';
import { REGION_T2_NODES } from './regionT2';
import { REGION_T3_NODES } from './regionT3';
import { REGION_T4_NODES } from './regionT4';
import type {
  WorldMapBounds,
  WorldMapCoord,
  WorldNodeAuthoring,
  WorldRegionDefinition,
} from './types';
import { WORLD_REGIONS } from './regions';

export const WORLD_NODE_LIST: readonly WorldNodeAuthoring[] = [
  ...REGION_T1_NODES,
  ...REGION_T2_NODES,
  ...REGION_T3_NODES,
  ...REGION_T4_NODES,
];

export const WORLD_NODES: ReadonlyMap<string, WorldNodeAuthoring> = new Map(
  WORLD_NODE_LIST.map((node) => [node.id, node]),
);

function mapCellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export const NODE_ID_BY_MAP_CELL: ReadonlyMap<string, string> = new Map(
  WORLD_NODE_LIST.map((node) => [
    mapCellKey(node.map.row, node.map.col),
    node.id,
  ]),
);

function deriveBounds(): WorldMapBounds {
  const rows = WORLD_NODE_LIST.map((node) => node.map.row);
  const cols = WORLD_NODE_LIST.map((node) => node.map.col);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  return {
    minRow,
    maxRow,
    minCol,
    maxCol,
    rows: maxRow - minRow + 1,
    cols: maxCol - minCol + 1,
  };
}

export const WORLD_MAP_BOUNDS = deriveBounds();

export function worldNodeById(
  nodeId: string,
): WorldNodeAuthoring | undefined {
  return WORLD_NODES.get(nodeId);
}

export function mapCoordForNodeId(nodeId: string): WorldMapCoord | null {
  return WORLD_NODES.get(nodeId)?.map ?? null;
}

export function nodeIdAtMapCoord(row: number, col: number): string | null {
  return NODE_ID_BY_MAP_CELL.get(mapCellKey(row, col)) ?? null;
}

export function worldRegionForNodeId(
  nodeId: string,
): WorldRegionDefinition | undefined {
  const regionId = WORLD_NODES.get(nodeId)?.regionId;
  return regionId ? WORLD_REGIONS.get(regionId) : undefined;
}

export function respawnNodeIdForNodeId(nodeId: string): string {
  return worldRegionForNodeId(nodeId)?.respawnNodeId ?? 'node-clearing';
}

const DIRECTION_OFFSETS: ReadonlyArray<
  readonly [NodeDirection, number, number]
> = [
  ['north', -1, 0],
  ['south', 1, 0],
  ['east', 0, 1],
  ['west', 0, -1],
];

export function worldNodeExits(
  nodeId: string,
): Partial<Record<NodeDirection, string>> {
  const node = WORLD_NODES.get(nodeId);
  if (!node) return {};
  const exits: Partial<Record<NodeDirection, string>> = {};
  for (const [direction, rowOffset, colOffset] of DIRECTION_OFFSETS) {
    const neighborId = nodeIdAtMapCoord(
      node.map.row + rowOffset,
      node.map.col + colOffset,
    );
    if (neighborId) exits[direction] = neighborId;
  }
  return exits;
}

export function adjacentWorldNodeIds(nodeId: string): string[] {
  return Object.values(worldNodeExits(nodeId)).filter(
    (value): value is string => typeof value === 'string',
  );
}

export function directionBetweenWorldNodes(
  fromId: string,
  toId: string,
): NodeDirection | null {
  const exits = worldNodeExits(fromId);
  for (const [direction, nodeId] of Object.entries(exits)) {
    if (nodeId === toId) return direction as NodeDirection;
  }
  return null;
}

/** Shared cardinal BFS used by server travel and both map surfaces. */
export function shortestWorldPath(
  fromId: string,
  toId: string,
): string[] | null {
  if (!WORLD_NODES.has(fromId) || !WORLD_NODES.has(toId)) return null;
  if (fromId === toId) return [fromId];

  const queue = [fromId];
  const previous = new Map<string, string | null>([[fromId, null]]);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const neighbor of adjacentWorldNodeIds(current)) {
      if (previous.has(neighbor)) continue;
      previous.set(neighbor, current);
      if (neighbor === toId) {
        const path: string[] = [];
        let cursor: string | null = toId;
        while (cursor) {
          path.push(cursor);
          cursor = previous.get(cursor) ?? null;
        }
        return path.reverse();
      }
      queue.push(neighbor);
    }
  }
  return null;
}
