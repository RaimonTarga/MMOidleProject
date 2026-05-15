import type { World } from '../world/World';
import type { NodeDirection } from '@mmo-idle/shared';
import { NODE_REGISTRY } from '../world/nodeRegistry';

// Pixels from the boundary that fire a transition. Must match GATE_THICK in GameScene.
const EXIT_TRIGGER  = 20;
// Logs a proximity message when player is within this many pixels of an exit edge.
const PROXIMITY_LOG = 150;

/**
 * Returns the destination node id for an exit, or null if the boundary is sealed.
 * Exported for future use by portal / door systems.
 */
export function resolveExit(nodeId: string, direction: NodeDirection): string | null {
  return NODE_REGISTRY.get(nodeId)?.exits[direction] ?? null;
}

/**
 * After movement is applied, check each player against the boundary of their
 * current node. Transitions update nodeId and reposition to the opposite edge.
 * Sealed boundaries clamp the player in-place.
 *
 * The trigger fires EXIT_TRIGGER pixels inside the boundary (not at the pixel-
 * perfect edge) because the camera clamps pointer.worldX to node.width-1, making
 * it impossible for a click to ever reach exactly node.width.
 *
 * Called after updateMovement, before updateCombat, so the rest of the tick
 * resolves in the player's correct new position.
 */
export function updateTransitions(world: World): void {
  for (const player of world.players.values()) {
    const node = NODE_REGISTRY.get(player.nodeId);
    if (!node) continue;

    // Debug proximity: log every tick the player is close enough to see the gate.
    if (node.exits.east  && player.x >= node.width  - PROXIMITY_LOG)
      console.log(`[trans] ${player.name} near east  x=${Math.round(player.x)}/${node.width}  fires@x>=${node.width - EXIT_TRIGGER}`);
    if (node.exits.west  && player.x <= PROXIMITY_LOG)
      console.log(`[trans] ${player.name} near west  x=${Math.round(player.x)}  fires@x<=${EXIT_TRIGGER}`);
    if (node.exits.south && player.y >= node.height - PROXIMITY_LOG)
      console.log(`[trans] ${player.name} near south y=${Math.round(player.y)}/${node.height}  fires@y>=${node.height - EXIT_TRIGGER}`);
    if (node.exits.north && player.y <= PROXIMITY_LOG)
      console.log(`[trans] ${player.name} near north y=${Math.round(player.y)}  fires@y<=${EXIT_TRIGGER}`);

    let direction: NodeDirection | null = null;
    if      (player.x <= EXIT_TRIGGER)               direction = 'west';
    else if (player.x >= node.width  - EXIT_TRIGGER) direction = 'east';
    else if (player.y <= EXIT_TRIGGER)               direction = 'north';
    else if (player.y >= node.height - EXIT_TRIGGER) direction = 'south';

    if (!direction) continue;

    const targetNodeId = resolveExit(player.nodeId, direction);

    if (!targetNodeId) {
      // Sealed boundary — clamp 1px outside the trigger zone so this check
      // does not re-fire on the next tick and trap the player in a clamp loop.
      console.log(`[trans] ${player.name} sealed ${direction} — clamping`);
      if (direction === 'west')  { player.x = EXIT_TRIGGER + 1;               player.targetX = Math.max(EXIT_TRIGGER + 1, player.targetX); }
      if (direction === 'east')  { player.x = node.width  - EXIT_TRIGGER - 1; player.targetX = Math.min(node.width  - EXIT_TRIGGER - 1, player.targetX); }
      if (direction === 'north') { player.y = EXIT_TRIGGER + 1;               player.targetY = Math.max(EXIT_TRIGGER + 1, player.targetY); }
      if (direction === 'south') { player.y = node.height - EXIT_TRIGGER - 1; player.targetY = Math.min(node.height - EXIT_TRIGGER - 1, player.targetY); }
      continue;
    }

    const targetNode = NODE_REGISTRY.get(targetNodeId)!;
    const fromNodeId = player.nodeId;

    player.nodeId = targetNodeId;

    // Place the player just inside the opposite edge of the new node and clamp the
    // perpendicular axis to [0, dimension] in case the nodes have different sizes.
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

    // Stop any in-progress movement so the player doesn't immediately drift
    // back across the new boundary toward the original world-space target.
    player.targetX = player.x;
    player.targetY = player.y;

    console.log(`[trans] ✓ ${player.name} ${fromNodeId} → ${targetNodeId} via ${direction}  pos=(${Math.round(player.x)}, ${Math.round(player.y)})`);
  }
}
