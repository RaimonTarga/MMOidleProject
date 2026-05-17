import type { World } from '../world/World';
import type { MonsterState, PlayerState } from '@mmo-idle/shared';
import { getNodePlayers } from '../world/nodeQueries';
import { NODE_REGISTRY } from '../world/nodeRegistry';

function findAggro(monster: MonsterState, world: World): PlayerState | null {
  const pullSq = monster.pullRange ** 2;
  let best: PlayerState | null = null;
  let bestDist = Infinity;

  for (const p of getNodePlayers(world, monster.nodeId)) {
    const dx = p.x - monster.x;
    const dy = p.y - monster.y;
    const d = dx * dx + dy * dy;

    if (d < pullSq && d < bestDist) {
      bestDist = d;
      best = p;
    }
  }

  return best;
}

export function updateMonsters(world: World, _dt: number, now: number) {
  for (const [id, monster] of world.monsters) {
    const ai = world.monsterAI.get(id);
    if (!ai) continue;

    const target = findAggro(monster, world);

    if (target) {
      ai.aggroTargetId = target.id;

      // Leash check: if the monster has chased too far from its spawn, give up.
      const spawnDx = monster.x - ai.spawnX;
      const spawnDy = monster.y - ai.spawnY;
      if (spawnDx * spawnDx + spawnDy * spawnDy > ai.leashRange * ai.leashRange) {
        ai.aggroTargetId = null;
        monster.state    = 'returning';
        monster.targetX  = ai.spawnX;
        monster.targetY  = ai.spawnY;
        continue;
      }

      const dx     = target.x - monster.x;
      const dy     = target.y - monster.y;
      const distSq = dx * dx + dy * dy;
      const stopDist = monster.attackRange - 1;

      if (distSq <= stopDist * stopDist) {
        monster.targetX = monster.x;
        monster.targetY = monster.y;
        monster.state   = 'attacking';
      } else {
        // Stop at stopDist px from the player rather than walking into the player's center.
        const dist = Math.sqrt(distSq);
        monster.targetX = target.x - (dx / dist) * stopDist;
        monster.targetY = target.y - (dy / dist) * stopDist;
        monster.state   = 'chasing';
      }

    } else {
      ai.aggroTargetId = null;

      switch (monster.state) {
        case 'chasing':
        case 'attacking':
          monster.state   = 'returning';
          monster.targetX = ai.spawnX;
          monster.targetY = ai.spawnY;
          break;

        case 'returning': {
          const dx = monster.x - ai.spawnX;
          const dy = monster.y - ai.spawnY;
          if (dx * dx + dy * dy < 16) {
            monster.x       = ai.spawnX;
            monster.y       = ai.spawnY;
            monster.targetX = ai.spawnX;
            monster.targetY = ai.spawnY;
            monster.state   = 'idle';
            ai.idleUntil    = now + randBetween(ai.idleMinMs, ai.idleMaxMs);
          }
          break;
        }

        case 'wandering': {
          const dx = monster.x - monster.targetX;
          const dy = monster.y - monster.targetY;
          if (dx * dx + dy * dy < 16) {
            monster.targetX = monster.x;
            monster.targetY = monster.y;
            monster.state   = 'idle';
            ai.idleUntil    = now + randBetween(ai.idleMinMs, ai.idleMaxMs);
          }
          break;
        }

        case 'idle':
        default:
          if (now >= ai.idleUntil) {
            const angle  = Math.random() * 2 * Math.PI;
            const radius = Math.random() * ai.wanderRadius;
            const node   = NODE_REGISTRY.get(monster.nodeId);
            const margin = 40;
            const minX = node ? margin : 0;
            const maxX = node ? node.width  - margin : Infinity;
            const minY = node ? margin : 0;
            const maxY = node ? node.height - margin : Infinity;
            monster.targetX = Math.max(minX, Math.min(maxX, ai.spawnX + Math.cos(angle) * radius));
            monster.targetY = Math.max(minY, Math.min(maxY, ai.spawnY + Math.sin(angle) * radius));
            monster.state   = 'wandering';
          } else {
            monster.targetX = monster.x;
            monster.targetY = monster.y;
          }
          break;
      }
    }
  }
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
