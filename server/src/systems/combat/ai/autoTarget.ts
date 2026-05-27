import type { World } from '../../../world/World';
import type { MonsterEntity } from '../../../ecs/entity';
import {
  distanceSq,
  hitboxGap,
  inAttackRange,
  posHitboxFromEntity,
  type Vec2,
} from '@mmo-idle/shared';
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
    const dx = targetPos.x - playerPos.x;
    const dy = targetPos.y - playerPos.y;
    const dist = Math.hypot(dx, dy);
    const attackRange = player.performsAttack.attackRange;
    const playerPH = posHitboxFromEntity(player);
    const targetPH = posHitboxFromEntity(target);
    const gap = hitboxGap(playerPH, targetPH);

    if (isRangedAutoPlayer(player) && dist > 0) {
      const minSafeGap = Math.min(attackRange * 0.82, target.performsAttack.attackRange + 45);
      const idealGap   = Math.max(minSafeGap + 20, attackRange * 0.72);
      const maxFireGap = attackRange * 0.92;

      if (gap < minSafeGap) {
        const candidate: Vec2 = {
          x: targetPos.x - (dx / dist) * (idealGap + 32),
          y: targetPos.y - (dy / dist) * (idealGap + 32),
        };
        setEntityMotion(world, player, clampToNode(world, player.hasPosition.nodeId, candidate));
        continue;
      }

      if (inAttackRange(playerPH, targetPH, attackRange) && gap <= maxFireGap) {
        stopEntity(world, player);
        continue;
      }

      const candidate: Vec2 = {
        x: targetPos.x - (dx / dist) * (idealGap + 32),
        y: targetPos.y - (dy / dist) * (idealGap + 32),
      };
      setEntityMotion(world, player, clampToNode(world, player.hasPosition.nodeId, candidate));
      continue;
    }

    if (inAttackRange(playerPH, targetPH, attackRange)) {
      stopEntity(world, player);
      continue;
    }

    if (dist > 0) {
      const targetPoint: Vec2 = {
        x: targetPos.x - (dx / dist) * Math.max(8, dist - 8),
        y: targetPos.y - (dy / dist) * Math.max(8, dist - 8),
      };
      setEntityMotion(world, player, targetPoint);
    }
  }
}
