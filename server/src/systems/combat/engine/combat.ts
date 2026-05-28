import type { World } from '../../../world/World';
import { applyStatusEffect, GAME_CONFIG, MONSTER_DATABASE, TEST_ROOM_NODE_ID, distanceSq, hitboxGap, inAttackRange, posHitboxFromEntity } from '@mmo-idle/shared';
import { grantMonsterRewards } from '../../player/progression/rewards';
import {
  makeCombatContext,
  emitCombatEvent,
} from './combatPipeline';
import { getCounter, getStatusEffect, setCounter } from '@mmo-idle/shared';
import { getAntiHealMult } from '../../defense';
import { applyPlayerAoe } from '../damage/aoeDamage';
import { isMonsterFrozen } from '../../classes/archetypes/dot/t3';
import { setAggroTarget, setAttackTarget } from '../ai/targeting';
import { markEngaged } from '../ai/engagement';

export function updateCombat(world: World, dt: number, now: number) {
  // PLAYER → MONSTER
  for (const player of world.playerEntities) {
    // Channeled Beam locks all auto-attacks; the beam system handles targeting + damage.
    if (player.isChanneling) {
      player.performsAttack.lastAttackAt = now; // keep the cooldown hot so attacks resume promptly
      continue;
    }

    let target = null;
    let bestGap = Infinity;
    const playerPH = posHitboxFromEntity(player);
    const attackRange = player.performsAttack.attackRange;

    for (const m of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
      const monsterPH = posHitboxFromEntity(m);
      if (!inAttackRange(playerPH, monsterPH, attackRange)) continue;
      const gap = hitboxGap(playerPH, monsterPH);
      if (gap < bestGap) {
        bestGap = gap;
        target = m;
      }
    }

    setAttackTarget(world, player, target?.isMonster.id ?? null);

    if (target) {
      if (now - player.performsAttack.lastAttackAt >= player.performsAttack.attackCooldown) {
        const ctx = makeCombatContext(player, 'player', target, 'monster');

        emitCombatEvent('beforeAttack', ctx, world);
        if (ctx.cancelled) continue;

        emitCombatEvent('onAttack', ctx, world);

        const evadeEvery = MONSTER_DATABASE.get(target.isMonster.monsterTypeId)?.evadeEvery;
        if (evadeEvery !== undefined && evadeEvery >= 5) {
          const hitsTaken = getCounter(target.tracksCombat, 'hitsTaken') + 1;
          setCounter(target.tracksCombat, 'hitsTaken', hitsTaken);
          if (hitsTaken % evadeEvery === 0) {
            player.performsAttack.lastAttackAt = now;
            world.pushEvent(player.hasPosition.nodeId, {
              kind: 'monster-dodge',
              monsterId: target.isMonster.id,
              targetPos: { ...target.hasPosition.current },
            });
            continue;
          }
        }

        const monsterCombatState = target.tracksCombat;
        const shredEffect = monsterCombatState
          ? getStatusEffect(monsterCombatState, 'plating-shred')
          : undefined;
        const effectivePlating = Math.max(0,
          target.mitigatesDamage.plating - (shredEffect ? shredEffect.stacks * shredEffect.data['platingReduction'] : 0),
        );

        ctx.damage = Math.max(1, Math.round(
          Math.max(0, player.dealsDamage.attack - effectivePlating * ctx.platingMult) * (1 - target.mitigatesDamage.damageReduction),
        ));

        emitCombatEvent('onHit', ctx, world);

        // Flat on-hit bonus: added after the empowered multiplier so it never scales
        // with finisher damage, but still applies to every direct attack including finishers.
        if (player.dealsDamage.onHitDamage > 0) {
          ctx.damage += player.dealsDamage.onHitDamage;
        }

        // ctx.metadata['empoweredAttack'] is set by registerEmpoweredMultiplier during onHit.
        const isEmpowered = !!ctx.metadata['empoweredAttack'];
        const isExecution = isEmpowered && player.usesCooldown !== undefined;

        if (isEmpowered) {
          // AoE splash on all empowered hits — centered on the primary target,
          // using the player's raw attack stat so the radius doesn't scale with
          // the archetype's empowered multiplier.
          applyPlayerAoe(
            world, player,
            target.hasPosition.current,
            GAME_CONFIG.EMPOWERED_AOE_RADIUS,
            Math.round(player.dealsDamage.attack * GAME_CONFIG.EMPOWERED_AOE_MULT),
            target.isMonster.id,
          );
        }

        emitCombatEvent('onDamageTaken', ctx, world);

        target.hasHealth.hp -= ctx.damage;
        target.controlsMonster.spawn = { ...target.hasPosition.current };
        player.performsAttack.lastAttackAt = now;

        // Lock the test-room boss rotation once a player has actually engaged
        // the dummy — it should stick around as a stable target instead of
        // cycling on the next tier change.
        if (target.isMonster.isBoss && target.hasPosition.nodeId === TEST_ROOM_NODE_ID) {
          world.testRoomEngagedBossId = target.isMonster.id;
        }

        // Queue combat event so the client can animate and log this hit reliably,
        // even when logic ticks outrun broadcast ticks.
        const clientEffectsRaw = ctx.metadata['clientEffects'];
        const clientEffects = Array.isArray(clientEffectsRaw)
          ? clientEffectsRaw.filter((effect): effect is string => typeof effect === 'string')
          : undefined;
        world.pushEvent(player.hasPosition.nodeId, {
          kind: 'player-hit',
          playerId:   player.isPlayer.id,
          targetId:   target.isMonster.id,
          targetName: target.isMonster.name,
          damage:     ctx.damage,
          empowered:  isEmpowered,
          execution:  isExecution,
          effects:    clientEffects && clientEffects.length > 0 ? clientEffects : undefined,
          playerPos:  { ...player.hasPosition.current },
          targetPos:  { ...target.hasPosition.current },
        });

        emitCombatEvent('afterHit', ctx, world);

        if (target.hasHealth.hp <= 0) {
          emitCombatEvent('onKill', ctx, world);
          const rewardInfo = grantMonsterRewards(world, player.isPlayer.id, target);
          world.pushEvent(player.hasPosition.nodeId, {
            kind:       'player-kill',
            playerId:   player.isPlayer.id,
            targetId:   target.isMonster.id,
            targetName: target.isMonster.name,
            damage:     ctx.damage,
            biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
            essenceGained: rewardInfo?.essenceGained ?? 0,
            essenceType: rewardInfo?.essenceType ?? 'green',
          });
          world.removeMonsterEntity(target.isMonster.id);
        } else {
          // Retaliation aggro: if the monster had no target (e.g. player attacked from
          // outside pull range), it now fixates on the player who hit it.
          // Guard: only aggro if the player is within leash range of the monster's
          // spawn. Beyond that the monster can't reach them — it would immediately
          // leash and return, enabling safe static-range cheese.
          const ai = target.controlsMonster;
          if (!target.hasAggroTarget) {
            if (distanceSq(player.hasPosition.current, ai.spawn) <= ai.leashRange * ai.leashRange) {
              setAggroTarget(world, target, player.isPlayer.id, now);
              // Keep the attacker's combat timer fresh so OOC regen doesn't tick
              // while the monster is chasing them toward attack range.
              const attacker = world.getPlayerEntity(player.isPlayer.id);
              if (attacker) markEngaged(world, attacker, now);
            }
            // Outside leash range: hit dealt, monster ignores the attacker.
            // Monster regen continues uninterrupted so whittling is not viable.
          }
        }
      }
    } else {
      // Refresh combat timer while any monster still has this player in aggro,
      // so regen doesn't tick while being actively chased.
      for (const e of [...world.aggroedMonsters]) {
        if (!e?.hasAggroTarget) continue;
        if (e.hasAggroTarget.playerId === player.isPlayer.id) {
          const p = world.getPlayerEntity(player.isPlayer.id);
          if (p) markEngaged(world, p, now);
          break;
        }
      }

      const lastCombat = player.tracksEngagement;
      if (lastCombat === undefined || now - lastCombat > GAME_CONFIG.COMBAT_REGEN_DELAY) {
        const cs = player.tracksCombat;
        const rawRegen = player.hasHealth.maxHp * ((player.hasHealth.hpRegen ?? 0) / 100) * (dt / 1000);
        const healAmount = cs ? rawRegen * getAntiHealMult(cs) : rawRegen;
        player.hasHealth.hp = Math.min(player.hasHealth.maxHp, player.hasHealth.hp + healAmount);
      }
    }
  }

  // MONSTER → PLAYER
  for (const e of [...world.aggroedMonsters]) {
    if (!e?.hasAwareness || !e.hasAggroTarget || !e.hasPosition || !e.performsAttack || !e.dealsDamage) {
      continue;
    }
    if (e.hasAwareness.state !== 'attacking') continue;

    const target = world.getPlayerEntity(e.hasAggroTarget.playerId) ?? null;

    // Player may have transitioned to a different node — drop aggro if so.
    if (!target || target.hasPosition.nodeId !== e.hasPosition.nodeId) {
      setAggroTarget(world, e, null, now);
      setAttackTarget(world, e, null);
      continue;
    }

    const monsterPH = posHitboxFromEntity(e);
    const targetPH = posHitboxFromEntity(target);
    if (!inAttackRange(monsterPH, targetPH, e.performsAttack.attackRange)) {
      setAttackTarget(world, e, null);
      continue;
    }

    // Monster is in contact — mark as targeting so the client shows the cooldown bar.
    setAttackTarget(world, e, target.isPlayer.id);

    if (now - e.performsAttack.lastAttackAt >= e.performsAttack.attackCooldown && !isMonsterFrozen(world, e.isMonster.id)) {
      const ctx = makeCombatContext(e, 'monster', target, 'player');

      emitCombatEvent('beforeAttack', ctx, world);
      if (ctx.cancelled) continue;

      emitCombatEvent('onAttack', ctx, world);

      ctx.damage = Math.max(1, Math.round(
        Math.max(0, e.dealsDamage.attack - target.mitigatesDamage.plating) * (1 - target.mitigatesDamage.damageReduction),
      ));

      emitCombatEvent('onHit', ctx, world);
      emitCombatEvent('onDamageTaken', ctx, world);

      target.hasHealth.hp -= ctx.damage;
      e.performsAttack.lastAttackAt = now;

      const slow = MONSTER_DATABASE.get(e.isMonster.monsterTypeId)?.slowEffect;
      if (slow) {
        applyStatusEffect(target.tracksCombat, {
          id: 'slow',
          maxStacks: 1,
          remainingMs: slow.durationMs,
          refreshable: true,
          sourceId: e.isMonster.id,
          data: {
            speedMult: slow.speedMult,
            totalMs: slow.durationMs,
          },
        });
      }

      emitCombatEvent('afterHit', ctx, world);

      if (target.hasHealth.hp <= 0) {
        emitCombatEvent('onKill', ctx, world);
        world.respawnPlayer(target.isPlayer.id);
      } else {
        const t = world.getPlayerEntity(target.isPlayer.id);
        if (t) markEngaged(world, t, now);
      }
    }
  }

  // MONSTER OOC REGEN
  // Monsters with no current aggro target regenerate rapidly after a short delay,
  // preventing players from attriting bosses across multiple engagements.
  for (const e of world.monsterEntities) {
    if (e.hasHealth.hp >= e.hasHealth.maxHp) continue;
    const ai = e.controlsMonster;
    if (e.hasAggroTarget) continue;
    if (now - ai.lastAggroAt < GAME_CONFIG.MONSTER_REGEN_DELAY) continue;
    e.hasHealth.hp = Math.min(
      e.hasHealth.maxHp,
      e.hasHealth.hp + e.hasHealth.maxHp * (GAME_CONFIG.MONSTER_REGEN_RATE / 100) * (dt / 1000),
    );
  }
}
