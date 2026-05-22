import type { World } from '../world/World';
import type { MonsterState, PlayerState } from '@mmo-idle/shared';
import { getNodePlayers } from '../world/nodeQueries';
import { NODE_REGISTRY } from '../world/nodeRegistry';

const KITE_GRACE_MS  = 3_000;  // ms chasing before speed ramp begins
const KITE_RAMP_RATE = 0.25;   // speed multiplier gain per second past grace
const KITE_MAX_MULT  = 2.5;    // cap on kite speed multiplier

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

export function updateMonsters(world: World, dt: number, now: number) {
  for (const [id, monster] of world.monsters) {
    const ai = world.monsterAI.get(id);
    if (!ai) continue;

    // Only scan for pull-range aggro when we have no current target.
    // This preserves retaliation aggro set by the combat system when a
    // player attacks from outside pull range.
    if (ai.aggroTargetId === null) {
      const pulled = findAggro(monster, world);
      if (pulled) {
        ai.aggroTargetId = pulled.id;
        ai.lastAggroAt   = now;
      }
    }

    // Resolve and validate the current aggro target.
    // Drop it only if the player left the node or disconnected.
    let target: PlayerState | null = null;
    if (ai.aggroTargetId !== null) {
      const candidate = world.players.get(ai.aggroTargetId);
      if (candidate && candidate.nodeId === monster.nodeId) {
        target = candidate;
      } else {
        ai.aggroTargetId = null;
      }
    }

    if (target) {
      ai.lastAggroAt = now;

      // Leash check: if too far from spawn, give up and return.
      const spawnDx = monster.x - ai.spawnX;
      const spawnDy = monster.y - ai.spawnY;
      if (spawnDx * spawnDx + spawnDy * spawnDy > ai.leashRange * ai.leashRange) {
        ai.aggroTargetId = null;
        ai.kiteTimer     = 0;
        monster.speed    = ai.baseSpeed;
        monster.state    = 'returning';
        monster.targetX  = ai.spawnX;
        monster.targetY  = ai.spawnY;
        continue;
      }

      const dx     = target.x - monster.x;
      const dy     = target.y - monster.y;
      const distSq = dx * dx + dy * dy;
      const stopDist = monster.attackRange * 0.80;

      if (distSq <= monster.attackRange * monster.attackRange) {
        // Entered attack range — reset kite ramp and start attacking.
        if (monster.state !== 'attacking') {
          monster.lastAttackAt = now - monster.attackCooldown;
        }
        ai.kiteTimer    = 0;
        monster.speed   = ai.baseSpeed;
        monster.targetX = monster.x;
        monster.targetY = monster.y;
        monster.state   = 'attacking';
      } else {
        // Still chasing — accumulate kite timer and ramp speed after grace period.
        ai.kiteTimer += dt;
        const excess = Math.max(0, ai.kiteTimer - KITE_GRACE_MS);
        const mult   = Math.min(KITE_MAX_MULT, 1 + (excess / 1000) * KITE_RAMP_RATE);
        monster.speed = Math.round(ai.baseSpeed * mult);

        const dist = Math.sqrt(distSq);
        monster.targetX = target.x - (dx / dist) * stopDist;
        monster.targetY = target.y - (dy / dist) * stopDist;
        monster.state   = 'chasing';
      }

    } else {
      // No valid aggro target — reset kite state and return/wander.
      ai.kiteTimer  = 0;
      monster.speed = ai.baseSpeed;

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
