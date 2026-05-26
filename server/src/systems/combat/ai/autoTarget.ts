import type { World } from '../../../world/World';
import type { MonsterEntity } from '../../../ecs/entity';
import { distanceSq, type Vec2 } from '@mmo-idle/shared';
import { NODE_REGISTRY } from '../../../world/nodeRegistry';
import { setEntityMotion, stopEntity } from '../../world/movement';

const NODE_MARGIN = 40;

function isRangedAutoPlayer(player: {
  performsAttack: { attackRange: number };
  usesSkills: {
    selectedRange: string | null;
    passives: { 'energy.flash'?: number };
  };
  usesReload?: unknown;
  usesEnergy?: unknown;
}): boolean {
  if ((player.usesSkills.passives['energy.flash'] ?? 0) > 0) return false;
  return player.performsAttack.attackRange > 100 ||
    player.usesSkills.selectedRange === 'range-mid' ||
    player.usesSkills.selectedRange === 'range-far' ||
    player.usesReload !== undefined ||
    player.usesEnergy !== undefined;
}

function clampToNode(world: World, nodeId: string, pos: Vec2): Vec2 {
  const node = NODE_REGISTRY.get(nodeId);
  if (!node) return pos;

  return {
    x: Math.max(NODE_MARGIN, Math.min(node.width  - NODE_MARGIN, pos.x)),
    y: Math.max(NODE_MARGIN, Math.min(node.height - NODE_MARGIN, pos.y)),
  };
}

export function updateAutoTargets(world: World) {
  for (const player of world.playerEntities) {
    if (!player.usesAutocombat.auto) continue;
    if (player.hasManualMoveIntent) continue;

    const playerPos = player.hasPosition.current;
    const monsters = world.monsterEntitiesInNode(player.hasPosition.nodeId);

    // ── Target selection ──────────────────────────────────────────────────
    // Priority 1: nearest monster with active aggro on this player.
    //   These are actively threatening us and the ones we're already trading
    //   hits with — always engage the thing hunting you first.
    // Priority 2: nearest monster in the node.
    let target: MonsterEntity | null = null;
    let targetIsAggroed = false;
    let bestDist = Infinity;

    for (const monster of monsters) {
      const aggroedOnPlayer = monster.hasAggroTarget?.playerId === player.isPlayer.id;
      const d = distanceSq(monster.hasPosition.current, playerPos);

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

    const targetPos = target.hasPosition.current;
    const dx     = targetPos.x - playerPos.x;
    const dy     = targetPos.y - playerPos.y;
    const distSqV = distanceSq(targetPos, playerPos);
    const dist   = Math.sqrt(distSqV);
    const attackRange = player.performsAttack.attackRange;

    // ── Movement decision ─────────────────────────────────────────────────

    if (isRangedAutoPlayer(player) && dist > 0) {
      const minSafeDist = Math.min(attackRange * 0.82, target.performsAttack.attackRange + 45);
      const idealDist   = Math.max(minSafeDist + 20, attackRange * 0.72);
      const maxFireDist = attackRange * 0.92;

      if (dist < minSafeDist) {
        const candidate: Vec2 = {
          x: targetPos.x - (dx / dist) * idealDist,
          y: targetPos.y - (dy / dist) * idealDist,
        };
        setEntityMotion(world, player, clampToNode(world, player.hasPosition.nodeId, candidate));
        continue;
      }

      if (dist <= maxFireDist) {
        stopEntity(world, player);
        continue;
      }

      const candidate: Vec2 = {
        x: targetPos.x - (dx / dist) * idealDist,
        y: targetPos.y - (dy / dist) * idealDist,
      };
      setEntityMotion(world, player, clampToNode(world, player.hasPosition.nodeId, candidate));
      continue;
    }

    // Within attack range — hold position, no need to step closer.
    if (distSqV <= attackRange * attackRange) {
      stopEntity(world, player);
      continue;
    }

    // Outside attack range — always advance toward the target.
    // Stop at 75% of attack range so minor monster movement doesn't
    // immediately push the player back out of range.
    const stopDist = attackRange * 0.75;
    const targetPoint: Vec2 = {
      x: targetPos.x - (dx / dist) * stopDist,
      y: targetPos.y - (dy / dist) * stopDist,
    };
    setEntityMotion(world, player, targetPoint);
  }
}
