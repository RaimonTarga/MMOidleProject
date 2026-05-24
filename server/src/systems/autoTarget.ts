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

    // If the monster is chasing this player, decide whether to hold or advance
    // based on whether it will stop within the player's own attack range.
    // Monsters stop at ~80% of their attackRange (matching the ai.ts stopDist).
    //
    // Example — melee (60px) vs ranged archer (130px):
    //   archer stops at 130 * 0.80 = 104px. 104 > 60 → player MUST advance.
    //   Holding still means getting sniped without being able to hit back.
    //
    // Example — ranged (190px) vs any monster:
    //   worst case 130 * 0.80 = 104px ≤ 190 → player holds, monster walks in.
    //   Advancing would just push the ranged player into unnecessary melee range.
    const targetAI = world.monsterAI.get(target.id);
    const monsterApproaching =
      targetAI?.aggroTargetId === player.id &&
      (target.state === 'chasing' || target.state === 'attacking');

    if (monsterApproaching && target.attackRange * 0.80 <= player.attackRange) {
      // Monster will walk into our range — stand still and let it come.
      player.targetX = player.x;
      player.targetY = player.y;
      continue;
    }

    // Need to close distance: monster is not approaching, or it's ranged and
    // will stop outside our reach. Move to 75% of our attack range for buffer.
    const dist     = Math.sqrt(distSq);
    const stopDist = player.attackRange * 0.75;
    player.targetX = target.x - (dx / dist) * stopDist;
    player.targetY = target.y - (dy / dist) * stopDist;
  }
}
