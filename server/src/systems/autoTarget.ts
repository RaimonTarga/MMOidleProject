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

    // Already within attack range — hold position.
    // The old code held only inside stopDist (70% of range), meaning a player
    // sitting at 75% range was in range and firing but still taking steps.
    // Holding at the full attack radius eliminates that micro-jitter.
    if (distSq <= player.attackRange * player.attackRange) {
      player.targetX = player.x;
      player.targetY = player.y;
      continue;
    }

    // Monster is actively chasing this player — stand still and let it walk
    // into attack range. Counter-moving toward an approaching monster:
    //   • causes positional oscillation (both close, both move, overshoot)
    //   • eliminates the ranged advantage for Energy/Reload builds
    //   • wastes movement budget that the player can't cancel
    const targetAI = world.monsterAI.get(target.id);
    if (
      targetAI?.aggroTargetId === player.id &&
      (target.state === 'chasing' || target.state === 'attacking')
    ) {
      player.targetX = player.x;
      player.targetY = player.y;
      continue;
    }

    // Monster is not approaching — close to a comfortable attack position.
    // 75% of attack range gives enough buffer for monster movement between
    // ticks without requiring the player to constantly re-close the gap.
    const dist     = Math.sqrt(distSq);
    const stopDist = player.attackRange * 0.75;
    player.targetX = target.x - (dx / dist) * stopDist;
    player.targetY = target.y - (dy / dist) * stopDist;
  }
}
