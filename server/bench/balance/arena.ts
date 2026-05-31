import { GAME_CONFIG, type Vec2 } from '@mmo-idle/shared';
import type { World } from '../../src/world/World';
import { thawNode } from '../../src/world/nodeLifecycle';
import type { ContentTarget } from './types';
import { BENCH_BOT_PREFIX } from './botFactory';

export const BOT_SPAWN: Vec2 = {
  x: GAME_CONFIG.NODE_WIDTH / 2,
  y: GAME_CONFIG.NODE_HEIGHT / 2 + 400,
};

/** Clustered spawn near `BOT_SPAWN` for party member `index` (spread to avoid stacking). */
export function partySpawn(index: number): Vec2 {
  const cols = 2;
  const spacing = 64;
  return {
    x: BOT_SPAWN.x + ((index % cols) - 0.5) * spacing,
    y: BOT_SPAWN.y + (Math.floor(index / cols) - 0.5) * spacing,
  };
}

export function setupArena(world: World, target: ContentTarget): number {
  if (world.isNodeFrozen(target.nodeId)) {
    thawNode(world, target.nodeId);
  }
  let count = 0;
  for (const _ of world.monsterEntitiesInNode(target.nodeId)) {
    count++;
  }
  return count;
}

/** Detach every bench bot (solo or full party) so the world is reusable. */
export function teardownArena(world: World): void {
  const ids: string[] = [];
  for (const player of world.playerEntities) {
    if (player.isPlayer.id.startsWith(BENCH_BOT_PREFIX)) {
      ids.push(player.isPlayer.id);
    }
  }
  for (const id of ids) world.detachPlayerEntity(id);
}
