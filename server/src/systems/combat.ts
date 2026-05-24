import type { World } from '../world/World';
import { GAME_CONFIG, TEST_ROOM_NODE_ID, MONSTER_DATABASE } from '@mmo-idle/shared';
import { grantMonsterRewards } from './rewards';
import { getNodeMonsters } from '../world/nodeQueries';
import {
  makeCombatContext,
  emitCombatEvent,
} from './combatPipeline';
import { getStatusEffect, applyStatusEffect } from './statusEffects';
import { getAntiHealMult } from './defenseSystems';
import { applyPlayerAoe } from './aoeDamage';
import { isMonsterFrozen } from './dotT3';

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
        // Deterministic monster evasion — every evadeEvery-th incoming hit is dodged.
        const targetDef = MONSTER_DATABASE.get(target.monsterTypeId);
        if (targetDef?.evadeEvery) {
          const mcs = world.monsterCombatState.get(target.id);
          if (mcs) {
            mcs.counters['hitsTaken'] = (mcs.counters['hitsTaken'] ?? 0) + 1;
            if (mcs.counters['hitsTaken'] % targetDef.evadeEvery === 0) {
              player.lastAttackAt = now;
              world.pushEvent(player.nodeId, { kind: 'monster-dodge', monsterId: target.id });
              continue;
            }
          }
        }

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

        // Flat on-hit bonus: added after the empowered multiplier so it never scales
        // with finisher damage, but still applies to every direct attack including finishers.
        if (player.onHitDamage > 0) {
          ctx.damage += player.onHitDamage;
        }

        // ctx.metadata['empoweredAttack'] is set by registerEmpoweredMultiplier during onHit.
        const isEmpowered = !!ctx.metadata['empoweredAttack'];
        const isExecution = isEmpowered && player.combatArchetype === 'cooldown';

        if (isEmpowered) {
          // AoE splash on all empowered hits — centered on the primary target,
          // using the player's raw attack stat so the radius doesn't scale with
          // the archetype's empowered multiplier.
          applyPlayerAoe(
            world, player,
            target.x, target.y,
            GAME_CONFIG.EMPOWERED_AOE_RADIUS,
            Math.round(player.attack * GAME_CONFIG.EMPOWERED_AOE_MULT),
            target.id,
          );
        }

        emitCombatEvent('onDamageTaken', ctx, world);

        target.hp -= ctx.damage;
        player.lastAttackAt = now;

        // Lock the test-room boss rotation once a player has actually engaged
        // the dummy — it should stick around as a stable target instead of
        // cycling on the next tier change.
        if (target.isBoss && target.nodeId === TEST_ROOM_NODE_ID) {
          world.testRoomEngagedBossId = target.id;
        }

        // Queue combat event so the client can animate and log this hit reliably,
        // even when logic ticks outrun broadcast ticks.
        const clientEffectsRaw = ctx.metadata['clientEffects'];
        const clientEffects = Array.isArray(clientEffectsRaw)
          ? clientEffectsRaw.filter((effect): effect is string => typeof effect === 'string')
          : undefined;
        world.pushEvent(player.nodeId, {
          kind: 'player-hit',
          playerId:   player.id,
          targetId:   target.id,
          targetName: target.name,
          damage:     ctx.damage,
          empowered:  isEmpowered,
          execution:  isExecution,
          effects:    clientEffects && clientEffects.length > 0 ? clientEffects : undefined,
        });

        emitCombatEvent('afterHit', ctx, world);

        if (target.hp <= 0) {
          emitCombatEvent('onKill', ctx, world);
          world.pushEvent(player.nodeId, {
            kind:       'player-kill',
            playerId:   player.id,
            targetId:   target.id,
            targetName: target.name,
          });
          grantMonsterRewards(world, player.id, target);
          world.monsters.delete(target.id);
          world.monsterAI.delete(target.id);
          world.monsterCombatState.delete(target.id);
        } else {
          // Retaliation aggro: if the monster had no target (e.g. player attacked from
          // outside pull range), it now fixates on the player who hit it.
          // Guard: only aggro if the player is within leash range of the monster's
          // spawn. Beyond that the monster can't reach them — it would immediately
          // leash and return, enabling safe static-range cheese.
          const ai = world.monsterAI.get(target.id);
          if (ai && ai.aggroTargetId === null) {
            const pdx = player.x - ai.spawnX;
            const pdy = player.y - ai.spawnY;
            if (pdx * pdx + pdy * pdy <= ai.leashRange * ai.leashRange) {
              ai.aggroTargetId = player.id;
              ai.lastAggroAt   = now;
              const def = MONSTER_DATABASE.get(target.monsterTypeId);
              if (def?.chargeOnAggro) ai.chargeRemainingMs = def.chargeOnAggro.durationMs;
              // Keep the attacker's combat timer fresh so OOC regen doesn't tick
              // while the monster is chasing them toward attack range.
              world.playerCombatAt.set(player.id, now);
            }
            // Outside leash range: hit dealt, monster ignores the attacker.
            // Monster regen continues uninterrupted so whittling is not viable.
          }
        }
      }
    } else {
      // Refresh combat timer while any monster still has this player in aggro,
      // so regen doesn't tick while being actively chased.
      for (const ai of world.monsterAI.values()) {
        if (ai.aggroTargetId === player.id) {
          world.playerCombatAt.set(player.id, now);
          break;
        }
      }

      const lastCombat = world.playerCombatAt.get(player.id) ?? 0;
      if (now - lastCombat > GAME_CONFIG.COMBAT_REGEN_DELAY) {
        const cs = world.playerCombatState.get(player.id);
        const rawRegen = player.maxHp * (player.hpRegen / 100) * (dt / 1000);
        const healAmount = cs ? rawRegen * getAntiHealMult(cs) : rawRegen;
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
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

    if (d > monster.attackRange) {
      monster.attackTargetId = null;
      continue;
    }

    // Monster is in contact — mark as targeting so the client shows the cooldown bar.
    monster.attackTargetId = target.id;

    if (now - monster.lastAttackAt >= monster.attackCooldown && !isMonsterFrozen(world, monster.id)) {
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

      // Apply slow / root if this monster type has one.
      const monsterDef = MONSTER_DATABASE.get(monster.monsterTypeId);
      if (monsterDef?.slowEffect) {
        const pcs = world.playerCombatState.get(target.id);
        if (pcs) {
          applyStatusEffect(pcs, {
            id:          'slow',
            maxStacks:   1,
            remainingMs: monsterDef.slowEffect.durationMs,
            refreshable: true,
            sourceId:    monster.id,
            data: {
              speedMult: monsterDef.slowEffect.speedMult,
              totalMs:   monsterDef.slowEffect.durationMs,
            },
          });
        }
      }

      emitCombatEvent('afterHit', ctx, world);

      if (target.hp <= 0) {
        emitCombatEvent('onKill', ctx, world);
        world.respawnPlayer(target.id);
      } else {
        world.playerCombatAt.set(target.id, now);
      }
    }
  }

  // MONSTER OOC REGEN
  // Monsters with no current aggro target regenerate rapidly after a short delay,
  // preventing players from attriting bosses across multiple engagements.
  for (const monster of world.monsters.values()) {
    if (monster.hp >= monster.maxHp) continue;
    const ai = world.monsterAI.get(monster.id);
    if (!ai || ai.aggroTargetId !== null) continue;
    if (now - ai.lastAggroAt < GAME_CONFIG.MONSTER_REGEN_DELAY) continue;
    monster.hp = Math.min(
      monster.maxHp,
      monster.hp + monster.maxHp * (GAME_CONFIG.MONSTER_REGEN_RATE / 100) * (dt / 1000),
    );
  }
}
