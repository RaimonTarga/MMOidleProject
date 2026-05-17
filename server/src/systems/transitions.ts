import type { World } from '../world/World';
import type { NodeDirection } from '@mmo-idle/shared';
import { GAME_CONFIG } from '@mmo-idle/shared';
import { NODE_REGISTRY } from '../world/nodeRegistry';

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

  for (const player of world.players.values()) {
    const node = NODE_REGISTRY.get(player.nodeId);
    if (!node) continue;

    const W = node.width;
    const H = node.height;

    let direction: NodeDirection | null = null;
    let inGate = false;

    if (player.x <= EXIT_TRIGGER) {
      direction = 'west';
      inGate = player.y >= H / 2 - G && player.y <= H / 2 + G;
    } else if (player.x >= W - EXIT_TRIGGER) {
      direction = 'east';
      inGate = player.y >= H / 2 - G && player.y <= H / 2 + G;
    } else if (player.y <= EXIT_TRIGGER) {
      direction = 'north';
      inGate = player.x >= W / 2 - G && player.x <= W / 2 + G;
    } else if (player.y >= H - EXIT_TRIGGER) {
      direction = 'south';
      inGate = player.x >= W / 2 - G && player.x <= W / 2 + G;
    }

    if (!direction) continue;

    const targetNodeId = inGate ? resolveExit(player.nodeId, direction) : null;

    if (!targetNodeId) {
      // Solid wall (or not in gate zone) — clamp player back inside.
      if (direction === 'west')  { player.x = EXIT_TRIGGER + 1;   player.targetX = Math.max(EXIT_TRIGGER + 1,   player.targetX); }
      if (direction === 'east')  { player.x = W - EXIT_TRIGGER - 1; player.targetX = Math.min(W - EXIT_TRIGGER - 1, player.targetX); }
      if (direction === 'north') { player.y = EXIT_TRIGGER + 1;   player.targetY = Math.max(EXIT_TRIGGER + 1,   player.targetY); }
      if (direction === 'south') { player.y = H - EXIT_TRIGGER - 1; player.targetY = Math.min(H - EXIT_TRIGGER - 1, player.targetY); }
      continue;
    }

    const targetNode = NODE_REGISTRY.get(targetNodeId)!;
    const fromNodeId = player.nodeId;

    player.nodeId = targetNodeId;

    // Place the player just inside the opposite edge of the new node.
    switch (direction) {
      case 'west':
        player.x = targetNode.width - EXIT_TRIGGER - 1;
        player.y = Math.max(0, Math.min(player.y, targetNode.height));
        break;
      case 'east':
        player.x = EXIT_TRIGGER + 1;
        player.y = Math.max(0, Math.min(player.y, targetNode.height));
        break;
      case 'north':
        player.y = targetNode.height - EXIT_TRIGGER - 1;
        player.x = Math.max(0, Math.min(player.x, targetNode.width));
        break;
      case 'south':
        player.y = EXIT_TRIGGER + 1;
        player.x = Math.max(0, Math.min(player.x, targetNode.width));
        break;
    }

    player.targetX = player.x;
    player.targetY = player.y;

    console.log(`[trans] ✓ ${player.name} ${fromNodeId} → ${targetNodeId} via ${direction}  pos=(${Math.round(player.x)}, ${Math.round(player.y)})`);
  }
}
