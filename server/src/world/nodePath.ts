import {
  GAME_CONFIG,
  NODE_BIOMES,
  TEST_ROOM_NODE_ID,
  type NodeDirection,
  type Vec2,
} from '@mmo-idle/shared';
import { NODE_REGISTRY } from './nodeRegistry';

function parseNodeId(id: string): [number, number] | null {
  const p = id.split('-');
  if (p.length !== 3) return null;
  const r = parseInt(p[1], 10);
  const c = parseInt(p[2], 10);
  return Number.isNaN(r) || Number.isNaN(c) ? null : [r, c];
}

function isTraversableMapNode(nodeId: string): boolean {
  return nodeId !== TEST_ROOM_NODE_ID && NODE_BIOMES[nodeId]?.biomeGroup !== 'testroom';
}

export function findShortestNodePath(fromId: string, toId: string): string[] | null {
  if (fromId === toId) return [fromId];
  const parent = new Map<string, string>([[fromId, '']]);
  const queue: string[] = [fromId];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const node = NODE_REGISTRY.get(cur);
    if (!node) continue;
    for (const nextId of Object.values(node.exits)) {
      if (!nextId || parent.has(nextId) || !isTraversableMapNode(nextId)) continue;
      parent.set(nextId, cur);
      if (nextId === toId) {
        const path: string[] = [];
        let n: string = toId;
        while (n !== '') {
          path.unshift(n);
          n = parent.get(n)!;
        }
        return path;
      }
      queue.push(nextId);
    }
  }
  return null;
}

export function findRegularNodeFor(biomeGroup: string, tier: number): string | null {
  for (const [nodeId, node] of Object.entries(NODE_BIOMES)) {
    if (
      isTraversableMapNode(nodeId) &&
      node.biomeGroup === biomeGroup &&
      node.biomeTier === tier &&
      !node.isDungeon
    ) {
      return nodeId;
    }
  }
  return null;
}

export function findDungeonNodeFor(biomeGroup: string, tier: number): string | null {
  for (const [nodeId, node] of Object.entries(NODE_BIOMES)) {
    if (
      isTraversableMapNode(nodeId) &&
      node.biomeGroup === biomeGroup &&
      node.biomeTier === tier &&
      node.isDungeon
    ) {
      return nodeId;
    }
  }
  return null;
}

export function directionFromTo(fromId: string, toId: string): NodeDirection | null {
  const from = parseNodeId(fromId);
  const to = parseNodeId(toId);
  if (!from || !to) return null;
  const [fr, fc] = from;
  const [tr, tc] = to;
  if (fr === tr && tc === fc + 1) return 'east';
  if (fr === tr && tc === fc - 1) return 'west';
  if (tr === fr - 1 && fc === tc) return 'north';
  if (tr === fr + 1 && fc === tc) return 'south';
  return null;
}

export function gateTargetForDirection(nodeId: string, direction: NodeDirection): Vec2 {
  const node = NODE_REGISTRY.get(nodeId)!;
  const cx = node.width / 2;
  const cy = node.height / 2;
  switch (direction) {
    case 'north': return { x: cx, y: 5 };
    case 'south': return { x: cx, y: node.height - 5 };
    case 'west':  return { x: 5, y: cy };
    case 'east':  return { x: node.width - 5, y: cy };
  }
}

/**
 * How far past the node border the steering goal is placed. The whole border is a
 * gate now, so travelers head for the *closest* point on the destination edge
 * (their own lateral position) rather than the edge center. The goal is pushed
 * beyond the edge because the path arrival threshold (24px) is wider than the
 * EXIT_TRIGGER band (20px): aiming at the edge itself stops the mover ~24px short
 * and it never enters the trigger. Pushing past guarantees the mover walks into
 * the band, where {@link transitions.ts} fires the crossing before it leaves bounds.
 */
const BORDER_PUSH = 30;
/** Keep the lateral approach off the corners so a perpendicular edge's gate band
 *  isn't entered by accident (its trigger is checked before north/south). */
const CORNER_MARGIN = 50;

/**
 * Steering goal that walks a mover across the {@link direction} border at the
 * point closest to {@link from}. Used by map navigation, auto-traverse, and party
 * following so crossings fire reliably instead of stalling on the border.
 */
export function gateApproachTarget(
  nodeId: string,
  direction: NodeDirection,
  from: Vec2,
): Vec2 {
  const node = NODE_REGISTRY.get(nodeId)!;
  const lx = Math.max(CORNER_MARGIN, Math.min(node.width - CORNER_MARGIN, from.x));
  const ly = Math.max(CORNER_MARGIN, Math.min(node.height - CORNER_MARGIN, from.y));
  switch (direction) {
    case 'north': return { x: lx, y: -BORDER_PUSH };
    case 'south': return { x: lx, y: node.height + BORDER_PUSH };
    case 'west':  return { x: -BORDER_PUSH, y: ly };
    case 'east':  return { x: node.width + BORDER_PUSH, y: ly };
  }
}

/** Must stay outside {@link transitions.ts} EXIT_TRIGGER (20px) so dev teleports don't fire a gate crossing. */
const ENTRANCE_SPAWN_INSET = 25;

function entranceSpawnTarget(nodeId: string, direction: NodeDirection): Vec2 {
  const gate = gateTargetForDirection(nodeId, direction);
  switch (direction) {
    case 'east':  return { x: gate.x - ENTRANCE_SPAWN_INSET, y: gate.y };
    case 'west':  return { x: gate.x + ENTRANCE_SPAWN_INSET, y: gate.y };
    case 'north': return { x: gate.x, y: gate.y + ENTRANCE_SPAWN_INSET };
    case 'south': return { x: gate.x, y: gate.y - ENTRANCE_SPAWN_INSET };
  }
}

/** Easternmost gate that has an exit; falls back through south/north/west. */
export function rightmostEntranceTarget(nodeId: string): Vec2 {
  const node = NODE_REGISTRY.get(nodeId);
  if (!node) {
    return { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };
  }
  const dirs: NodeDirection[] = ['east', 'south', 'north', 'west'];
  for (const dir of dirs) {
    if (node.exits[dir]) {
      return entranceSpawnTarget(nodeId, dir);
    }
  }
  return { x: node.width / 2, y: node.height / 2 };
}
