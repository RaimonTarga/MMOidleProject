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

    const dx = nearest.x - player.x;
    const dy = nearest.y - player.y;
    const distSq = dx * dx + dy * dy;
    // Stop at 70% of attack range so the player stays well within the attack
    // threshold even when the target is moving. Avoids stutter-stepping at the
    // range edge (the old `attackRange - 1` left no margin at all).
    const stopDist = player.attackRange * 0.70;

    if (distSq <= stopDist * stopDist) {
      // Already close enough — hold position.
      player.targetX = player.x;
      player.targetY = player.y;
    } else {
      // Move toward a point stopDist px from the monster so the player
      // stays comfortably within attack range even if the target shifts.
      const dist = Math.sqrt(distSq);
      player.targetX = nearest.x - (dx / dist) * stopDist;
      player.targetY = nearest.y - (dy / dist) * stopDist;
    }
  }
}
