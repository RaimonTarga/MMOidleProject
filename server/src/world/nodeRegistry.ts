import type { NodeDefinition } from '@mmo-idle/shared';
import { GAME_CONFIG } from '@mmo-idle/shared';

/**
 * Hardcoded node registry. All nodes currently share the same dimensions;
 * override width/height per entry when zones with different sizes are added.
 *
 * Geographic layout:
 *
 *   [node-1: Forest] ── east ──► [node-2: Mountain]
 *         │
 *       south
 *         │
 *         ▼
 *   [node-3: Plains]
 */
export const NODE_REGISTRY = new Map<string, NodeDefinition>([
  [
    'node-1',
    {
      id: 'node-1',
      name: 'Forest',
      width: GAME_CONFIG.NODE_WIDTH,
      height: GAME_CONFIG.NODE_HEIGHT,
      exits: {
        east:  'node-2',
        south: 'node-3',
      },
    },
  ],
  [
    'node-2',
    {
      id: 'node-2',
      name: 'Mountain',
      width: GAME_CONFIG.NODE_WIDTH,
      height: GAME_CONFIG.NODE_HEIGHT,
      exits: {
        west: 'node-1',
      },
    },
  ],
  [
    'node-3',
    {
      id: 'node-3',
      name: 'Plains',
      width: GAME_CONFIG.NODE_WIDTH,
      height: GAME_CONFIG.NODE_HEIGHT,
      exits: {
        north: 'node-1',
      },
    },
  ],
]);
