import type { World } from '../world/World';
import { GAME_CONFIG } from '@mmo-idle/shared';
import { grantMonsterRewards } from './rewards';
import { getNodeMonsters } from '../world/nodeQueries';

export function updateCombat(world: World, dt: number, now: number) {
  // PLAYER → MONSTER
  for (const player of world.players.values()) {
    let target = null;
    let best = Infinity;

    for (const m of getNodeMonsters(world, player.nodeId)) {
      const dx = m.x - player.x;
      const dy = m.y - player.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d <= player.attackRange && d < best) {
        best = d;
        target = m;
      }
    }

    player.attackTargetId = target?.id ?? null;

    if (target) {
      if (now - player.lastAttackAt >= player.attackCooldown) {
        const dmg = Math.max(1, player.attack - target.defense);
        target.hp -= dmg;
        player.lastAttackAt = now;

        if (target.hp <= 0) {
          grantMonsterRewards(world, player.id, target);
          world.monsters.delete(target.id);
          world.slimeAI.delete(target.id);
        }
      }
    } else {
      const lastHit = world.playerCombatAt.get(player.id) ?? 0;

      if (now - lastHit > GAME_CONFIG.COMBAT_REGEN_DELAY) {
        player.hp = Math.min(
          player.maxHp,
          player.hp + player.hpRegen * (dt / 1000)
        );
      }
    }
  }

  // MONSTER → PLAYER
  for (const monster of world.monsters.values()) {
    const ai = world.slimeAI.get(monster.id);
    if (!ai) continue;

    if (monster.state !== 'attacking') continue;

    const target = ai.aggroTargetId
      ? world.players.get(ai.aggroTargetId)
      : null;

    // Player may have transitioned to a different node — drop aggro if so.
    if (!target || target.nodeId !== monster.nodeId) {
      ai.aggroTargetId = null;
      monster.attackTargetId = null;
      continue;
    }

    const dx = target.x - monster.x;
    const dy = target.y - monster.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > monster.attackRange) continue;

    if (now - monster.lastAttackAt >= monster.attackCooldown) {
      const dmg = Math.max(1, monster.attack - target.defense);
      target.hp -= dmg;
      monster.lastAttackAt = now;

      world.playerCombatAt.set(target.id, now);
    }
  }
}
