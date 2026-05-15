import type { World } from '../world/World';
import type { MonsterState } from '@mmo-idle/shared';
import { getNodeMonsters } from '../world/nodeQueries';

export function updateAutoTargets(world: World) {
  for (const player of world.players.values()) {
    if (!player.auto) continue;

    const monsters = getNodeMonsters(world, player.nodeId);
    let nearest: MonsterState | null = null;
    let best = Infinity;

    for (const monster of monsters) {
      const dx = monster.x - player.x;
      const dy = monster.y - player.y;
      const d = dx * dx + dy * dy;

      if (d < best) {
        best = d;
        nearest = monster;
      }
    }

    if (!nearest) continue;

    const stopDistSq = (player.attackRange - 5) ** 2;
    const distSq = (nearest.x - player.x) ** 2 + (nearest.y - player.y) ** 2;

    if (distSq <= stopDistSq) {
      player.targetX = player.x;
      player.targetY = player.y;
    } else {
      player.targetX = nearest.x;
      player.targetY = nearest.y;
    }
  }
}
