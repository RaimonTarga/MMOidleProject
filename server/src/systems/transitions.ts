import type { World } from '../world/World';
import type { NodeDirection } from '@mmo-idle/shared';
import { GAME_CONFIG, pointFromMotion } from '@mmo-idle/shared';
import { NODE_REGISTRY } from '../world/nodeRegistry';
import { setEntityMotion, stopEntity } from './movement';

// Pixels from the boundary that fire a transition. Must match GATE_THICK in GameScene.
const EXIT_TRIGGER = 20;

/**
 * Returns the destination node id for an exit, or null if the boundary is sealed.
 */
export function resolveExit(nodeId: string, direction: NodeDirection): string | null {
  return NODE_REGISTRY.get(nodeId)?.exits[direction] ?? null;
}

/**
 * After movement is applied, check each player against the boundary of their
 * current node. A transition fires only when the player reaches the border within
 * the cardinal gate strip (GATE_HALF pixels either side of center). Every other
 * border segment is a solid wall that clamps the player in-place.
 */
export function updateTransitions(world: World): void {
  const G = GAME_CONFIG.GATE_HALF;

  for (const entity of world.playerEntities) {
    const position = entity.hasPosition;
    const node = NODE_REGISTRY.get(position.nodeId);
    if (!node) continue;

    const W = node.width;
    const H = node.height;
    const current = position.current;

    let direction: NodeDirection | null = null;
    let inGate = false;

    if (current.x <= EXIT_TRIGGER) {
      direction = 'west';
      inGate = current.y >= H / 2 - G && current.y <= H / 2 + G;
    } else if (current.x >= W - EXIT_TRIGGER) {
      direction = 'east';
      inGate = current.y >= H / 2 - G && current.y <= H / 2 + G;
    } else if (current.y <= EXIT_TRIGGER) {
      direction = 'north';
      inGate = current.x >= W / 2 - G && current.x <= W / 2 + G;
    } else if (current.y >= H - EXIT_TRIGGER) {
      direction = 'south';
      inGate = current.x >= W / 2 - G && current.x <= W / 2 + G;
    }

    if (!direction) continue;

    const targetNodeId = inGate ? resolveExit(position.nodeId, direction) : null;

    if (!targetNodeId) {
      // Solid wall (or not in gate zone) — clamp player back inside.
      const target = entity.isMoving
        ? pointFromMotion(position.current, entity.isMoving.motion)
        : position.current;
      if (direction === 'west') {
        position.current.x = EXIT_TRIGGER + 1;
        target.x = Math.max(EXIT_TRIGGER + 1, target.x);
      }
      if (direction === 'east') {
        position.current.x = W - EXIT_TRIGGER - 1;
        target.x = Math.min(W - EXIT_TRIGGER - 1, target.x);
      }
      if (direction === 'north') {
        position.current.y = EXIT_TRIGGER + 1;
        target.y = Math.max(EXIT_TRIGGER + 1, target.y);
      }
      if (direction === 'south') {
        position.current.y = H - EXIT_TRIGGER - 1;
        target.y = Math.min(H - EXIT_TRIGGER - 1, target.y);
      }
      setEntityMotion(world, entity, target);
      continue;
    }

    const targetNode = NODE_REGISTRY.get(targetNodeId)!;
    const fromNodeId = position.nodeId;

    position.nodeId = targetNodeId;
    world.resetNodeDeltaState(targetNodeId);

    // Place the player just inside the opposite edge of the new node.
    switch (direction) {
      case 'west':
        position.current.x = targetNode.width - EXIT_TRIGGER - 1;
        position.current.y = Math.max(0, Math.min(position.current.y, targetNode.height));
        break;
      case 'east':
        position.current.x = EXIT_TRIGGER + 1;
        position.current.y = Math.max(0, Math.min(position.current.y, targetNode.height));
        break;
      case 'north':
        position.current.y = targetNode.height - EXIT_TRIGGER - 1;
        position.current.x = Math.max(0, Math.min(position.current.x, targetNode.width));
        break;
      case 'south':
        position.current.y = EXIT_TRIGGER + 1;
        position.current.x = Math.max(0, Math.min(position.current.x, targetNode.width));
        break;
    }

    stopEntity(world, entity);

    console.log(`[trans] ✓ ${entity.isPlayer.name} ${fromNodeId} → ${targetNodeId} via ${direction}  pos=(${Math.round(position.current.x)}, ${Math.round(position.current.y)})`);
  }
}
