import type { World } from '../world/World';
import type { MonsterState } from '@mmo-idle/shared';
import { getNodeMonsters } from '../world/nodeQueries';

export function updateAutoTargets(world: World) {
  for (const player of world.players.values()) {
    if (!player.auto) continue;

    const monsters = getNodeMonsters(world, player.nodeId);

    // ── Target selection ──────────────────────────────────────────────────
    // Priority 1: nearest monster with active aggro on this player.
    //   These are actively threatening us and the ones we're already trading
    //   hits with — always engage the thing hunting you first.
    // Priority 2: nearest monster in the node.
    let target: MonsterState | null = null;
    let targetIsAggroed = false;
    let bestDist = Infinity;

    for (const monster of monsters) {
      const ai = world.monsterAI.get(monster.id);
      const aggroedOnPlayer = ai?.aggroTargetId === player.id;

      const dx = monster.x - player.x;
      const dy = monster.y - player.y;
      const d  = dx * dx + dy * dy;

      if (aggroedOnPlayer) {
        if (!targetIsAggroed || d < bestDist) {
          target = monster;
          targetIsAggroed = true;
          bestDist = d;
        }
      } else if (!targetIsAggroed && d < bestDist) {
        target = monster;
        bestDist = d;
      }
    }

    if (!target) continue;

    const dx     = target.x - player.x;
    const dy     = target.y - player.y;
    const distSq = dx * dx + dy * dy;

    // ── Movement decision ─────────────────────────────────────────────────

    // Within attack range — hold position, no need to step closer.
    if (distSq <= player.attackRange * player.attackRange) {
      player.targetX = player.x;
      player.targetY = player.y;
      continue;
    }

    // Outside attack range — always advance toward the target.
    // Stop at 75% of attack range so minor monster movement doesn't
    // immediately push the player back out of range.
    const dist     = Math.sqrt(distSq);
    const stopDist = player.attackRange * 0.75;
    player.targetX = target.x - (dx / dist) * stopDist;
    player.targetY = target.y - (dy / dist) * stopDist;
  }
}
