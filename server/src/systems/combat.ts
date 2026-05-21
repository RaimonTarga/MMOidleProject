import type { World } from '../world/World';
import { GAME_CONFIG } from '@mmo-idle/shared';
import { grantMonsterRewards } from './rewards';
import { getNodeMonsters } from '../world/nodeQueries';
import {
  makeCombatContext,
  emitCombatEvent,
} from './combatPipeline';
import { getStatusEffect } from './statusEffects';

export function updateCombat(world: World, dt: number, now: number) {
  // PLAYER → MONSTER
  for (const player of world.players.values()) {
    // Channeled Beam locks all auto-attacks; the beam system handles targeting + damage.
    if (player.isChanneling) {
      player.lastAttackAt = now; // keep the cooldown hot so attacks resume promptly
      continue;
    }

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
        const ctx = makeCombatContext(player, 'player', target, 'monster');

        emitCombatEvent('beforeAttack', ctx, world);
        if (ctx.cancelled) continue;

        emitCombatEvent('onAttack', ctx, world);

        const monsterCombatState = world.monsterCombatState.get(target.id);
        const shredEffect = monsterCombatState
          ? getStatusEffect(monsterCombatState, 'plating-shred')
          : undefined;
        const effectivePlating = Math.max(0,
          target.plating - (shredEffect ? shredEffect.stacks * shredEffect.data['platingReduction'] : 0),
        );

        ctx.damage = Math.max(1, Math.round(
          Math.max(0, player.attack - effectivePlating) * (1 - target.damageReduction),
        ));

        emitCombatEvent('onHit', ctx, world);
        emitCombatEvent('onDamageTaken', ctx, world);

        target.hp -= ctx.damage;
        player.lastAttackAt = now;

        emitCombatEvent('afterHit', ctx, world);

        if (target.hp <= 0) {
          emitCombatEvent('onKill', ctx, world);
          grantMonsterRewards(world, player.id, target);
          world.monsters.delete(target.id);
          world.monsterAI.delete(target.id);
          world.monsterCombatState.delete(target.id);
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
    const ai = world.monsterAI.get(monster.id);
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
      const ctx = makeCombatContext(monster, 'monster', target, 'player');

      emitCombatEvent('beforeAttack', ctx, world);
      if (ctx.cancelled) continue;

      emitCombatEvent('onAttack', ctx, world);

      ctx.damage = Math.max(1, Math.round(
        Math.max(0, monster.attack - target.plating) * (1 - target.damageReduction),
      ));

      emitCombatEvent('onHit', ctx, world);
      emitCombatEvent('onDamageTaken', ctx, world);

      target.hp -= ctx.damage;
      monster.lastAttackAt = now;

      emitCombatEvent('afterHit', ctx, world);

      if (target.hp <= 0) {
        emitCombatEvent('onKill', ctx, world);
        world.respawnPlayer(target.id);
      } else {
        world.playerCombatAt.set(target.id, now);
      }
    }
  }
}
