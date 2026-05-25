import type { World } from '../world/World';
import type { PlayerEntity } from '../ecs/components/player';
import type { MonsterEntity } from '../ecs/components/monster';
import { distanceSq, pointFromMotion, vectorTo, zeroMotion } from '@mmo-idle/shared';
import { NODE_REGISTRY } from '../world/nodeRegistry';
import { isMonsterFrozen } from './classes/dot/dotT3';
import { isMonsterKnockedBack } from './knockback';

const KITE_GRACE_MS   = 500;   // ms chasing before speed ramp begins
const KITE_RAMP_RATE  = 1.5;   // speed multiplier gain per second past grace
const KITE_MAX_MULT   = 6.0;   // cap on kite speed multiplier
const KITE_MIN_SPEED  = 150;   // absolute floor once ramp is active (beats base player speed of 120)
const KITE_DECAY_RATE = 2.0;   // drains 2× faster than it builds while monster is in attack range
const RETURN_SPEED_MULT = 1.6; // how fast monsters snap back to spawn

function findAggro(monster: MonsterEntity, world: World): PlayerEntity | null {
  const pullSq = monster.hasAwareness.pullRange ** 2;
  let best: PlayerEntity | null = null;
  let bestDist = Infinity;

  for (const p of world.playerEntitiesInNode(monster.hasPosition.nodeId)) {
    const d = distanceSq(p.hasPosition.current, monster.hasPosition.current);

    if (d < pullSq && d < bestDist) {
      bestDist = d;
      best = p;
    }
  }

  return best;
}

function setMonsterTarget(entity: MonsterEntity, target: { x: number; y: number }): void {
  entity.isMoving.motion = vectorTo(entity.hasPosition.current, target);
}

function stopMonster(entity: MonsterEntity): void {
  entity.isMoving.motion = zeroMotion();
}

export function updateMonsters(world: World, dt: number, now: number) {
  for (const e of world.monsterEntities) {
    const ai      = e.monsterAi;
    const id      = e.isMonster.id;

    if (isMonsterFrozen(world, id)) {
      e.isMoving.motion = zeroMotion();
      e.performsAttack.lastAttackAt = now;
      ai.kiteTimer = 0;
      continue;
    }

    // Knockback owns position, target, speed, and state for the duration of the
    // slide. AI resumes naturally once the component clears.
    if (isMonsterKnockedBack(world, id)) {
      e.performsAttack.lastAttackAt = now;
      ai.kiteTimer = 0;
      continue;
    }

    // Only scan for pull-range aggro when we have no current target.
    // This preserves retaliation aggro set by the combat system when a
    // player attacks from outside pull range.
    if (ai.aggroTargetId === null) {
      const pulled = findAggro(e, world);
      if (pulled) {
        ai.aggroTargetId = pulled.isPlayer.id;
        ai.lastAggroAt   = now;
      }
    }

    // Resolve and validate the current aggro target.
    // Drop it only if the player left the node or disconnected.
    let target: PlayerEntity | null = null;
    if (ai.aggroTargetId !== null) {
      const candidate = world.getPlayerEntity(ai.aggroTargetId);
      if (candidate && candidate.hasPosition.nodeId === e.hasPosition.nodeId) {
        target = candidate;
      } else {
        ai.aggroTargetId = null;
      }
    }

    if (target) {
      ai.lastAggroAt = now;

      // Leash check: if too far from spawn, give up and return.
      if (distanceSq(e.hasPosition.current, { x: ai.spawnX, y: ai.spawnY }) > ai.leashRange * ai.leashRange) {
        ai.aggroTargetId = null;
        ai.kiteTimer     = 0;
        e.hasPosition.speed  = ai.baseSpeed;
        e.hasAwareness.state = 'returning';
        e.performsAttack.attackTargetId = null;
        setMonsterTarget(e, { x: ai.spawnX, y: ai.spawnY });
        continue;
      }

      const dx     = target.hasPosition.current.x - e.hasPosition.current.x;
      const dy     = target.hasPosition.current.y - e.hasPosition.current.y;
      const distSq = dx * dx + dy * dy;
      const stopDist = e.performsAttack.attackRange * 0.80;

      if (distSq <= e.performsAttack.attackRange * e.performsAttack.attackRange) {
        // In attack range — drain kite ramp slowly rather than resetting it.
        // Hard-resetting to 0 lets players exploit touch-and-run to wipe the penalty.
        if (e.hasAwareness.state !== 'attacking') {
          e.performsAttack.lastAttackAt = now - e.performsAttack.attackCooldown;
        }
        ai.kiteTimer          = Math.max(0, ai.kiteTimer - dt * KITE_DECAY_RATE);
        e.hasPosition.speed   = ai.baseSpeed;
        e.hasAwareness.state  = 'attacking';
        e.performsAttack.attackTargetId = target.isPlayer.id;
        stopMonster(e);
      } else {
        // Still chasing — accumulate kite timer and ramp speed after grace period.
        ai.kiteTimer += dt;
        const excess = Math.max(0, ai.kiteTimer - KITE_GRACE_MS);
        const mult   = Math.min(KITE_MAX_MULT, 1 + (excess / 1000) * KITE_RAMP_RATE);
        const rawSpeed = ai.baseSpeed * mult;
        // Once ramp is active enforce a minimum so even slow bosses become threatening.
        e.hasPosition.speed = Math.round(excess > 0 ? Math.max(rawSpeed, KITE_MIN_SPEED) : rawSpeed);

        const dist = Math.sqrt(distSq);
        e.hasAwareness.state = 'chasing';
        e.performsAttack.attackTargetId = target.isPlayer.id;
        setMonsterTarget(e, {
          x: target.hasPosition.current.x - (dx / dist) * stopDist,
          y: target.hasPosition.current.y - (dy / dist) * stopDist,
        });
      }

    } else {
      // No valid aggro target — reset kite state and return/wander.
      ai.kiteTimer  = 0;
      // Run at boosted speed while returning so the re-engage window is small.
      e.hasPosition.speed = e.hasAwareness.state === 'returning'
        ? Math.round(ai.baseSpeed * RETURN_SPEED_MULT)
        : ai.baseSpeed;
      e.performsAttack.attackTargetId = null;

      switch (e.hasAwareness.state) {
        case 'chasing':
        case 'attacking':
          e.hasAwareness.state = 'returning';
          setMonsterTarget(e, { x: ai.spawnX, y: ai.spawnY });
          break;

        case 'returning': {
          if (distanceSq(e.hasPosition.current, { x: ai.spawnX, y: ai.spawnY }) < 16) {
            e.hasPosition.current = { x: ai.spawnX, y: ai.spawnY };
            e.hasPosition.speed   = ai.baseSpeed;
            e.hasAwareness.state  = 'idle';
            ai.idleUntil          = now + randBetween(ai.idleMinMs, ai.idleMaxMs);
            stopMonster(e);
          } else {
            setMonsterTarget(e, { x: ai.spawnX, y: ai.spawnY });
          }
          break;
        }

        case 'wandering': {
          const targetPoint = pointFromMotion(e.hasPosition.current, e.isMoving.motion);
          if (distanceSq(e.hasPosition.current, targetPoint) < 16) {
            e.hasAwareness.state = 'idle';
            ai.idleUntil         = now + randBetween(ai.idleMinMs, ai.idleMaxMs);
            stopMonster(e);
          }
          break;
        }

        case 'idle':
        default:
          if (now >= ai.idleUntil) {
            const angle  = Math.random() * 2 * Math.PI;
            const radius = Math.random() * ai.wanderRadius;
            const node   = NODE_REGISTRY.get(e.hasPosition.nodeId);
            const margin = 40;
            const minX = node ? margin : 0;
            const maxX = node ? node.width  - margin : Infinity;
            const minY = node ? margin : 0;
            const maxY = node ? node.height - margin : Infinity;
            e.hasAwareness.state = 'wandering';
            setMonsterTarget(e, {
              x: Math.max(minX, Math.min(maxX, ai.spawnX + Math.cos(angle) * radius)),
              y: Math.max(minY, Math.min(maxY, ai.spawnY + Math.sin(angle) * radius)),
            });
          } else {
            stopMonster(e);
          }
          break;
      }
    }
  }
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
