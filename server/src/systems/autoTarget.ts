import type { World } from '../world/World';
import type { MonsterState } from '@mmo-idle/shared';
import { getNodeMonsters } from '../world/nodeQueries';
import { NODE_REGISTRY } from '../world/nodeRegistry';

const NODE_MARGIN = 40;

function isRangedAutoPlayer(player: { attackRange: number; selectedRange: string | null; combatArchetype: string | null }): boolean {
  return player.attackRange > 100 || player.selectedRange === 'range-mid' || player.selectedRange === 'range-far' ||
    player.combatArchetype === 'reload' || player.combatArchetype === 'energy';
}

function clampToNode(world: World, nodeId: string, x: number, y: number): { x: number; y: number } {
  const node = NODE_REGISTRY.get(nodeId);
  if (!node) return { x, y };

  return {
    x: Math.max(NODE_MARGIN, Math.min(node.width  - NODE_MARGIN, x)),
    y: Math.max(NODE_MARGIN, Math.min(node.height - NODE_MARGIN, y)),
  };
}

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
    const dist   = Math.sqrt(distSq);

    // ── Movement decision ─────────────────────────────────────────────────

    if (isRangedAutoPlayer(player) && dist > 0) {
      const minSafeDist = Math.min(player.attackRange * 0.82, target.attackRange + 45);
      const idealDist   = Math.max(minSafeDist + 20, player.attackRange * 0.72);
      const maxFireDist = player.attackRange * 0.92;

      if (dist < minSafeDist) {
        const pos = clampToNode(
          world,
          player.nodeId,
          target.x - (dx / dist) * idealDist,
          target.y - (dy / dist) * idealDist,
        );
        player.targetX = pos.x;
        player.targetY = pos.y;
        continue;
      }

      if (dist <= maxFireDist) {
        player.targetX = player.x;
        player.targetY = player.y;
        continue;
      }

      const pos = clampToNode(
        world,
        player.nodeId,
        target.x - (dx / dist) * idealDist,
        target.y - (dy / dist) * idealDist,
      );
      player.targetX = pos.x;
      player.targetY = pos.y;
      continue;
    }

    // Within attack range — hold position, no need to step closer.
    if (distSq <= player.attackRange * player.attackRange) {
      player.targetX = player.x;
      player.targetY = player.y;
      continue;
    }

    // Outside attack range — always advance toward the target.
    // Stop at 75% of attack range so minor monster movement doesn't
    // immediately push the player back out of range.
    const stopDist = player.attackRange * 0.75;
    player.targetX = target.x - (dx / dist) * stopDist;
    player.targetY = target.y - (dy / dist) * stopDist;
  }
}
