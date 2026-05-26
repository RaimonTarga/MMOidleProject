import type { World } from '../world/World';
import { GAME_CONFIG, TEST_ROOM_NODE_ID, distanceSq } from '@mmo-idle/shared';
import { grantMonsterRewards } from './rewards';
import {
  makeCombatContext,
  emitCombatEvent,
} from './combatPipeline';
import { getStatusEffect } from '@mmo-idle/shared';
import { getAntiHealMult } from './defenseSystems';
import { applyPlayerAoe } from './aoeDamage';
import { isMonsterFrozen } from './classes/dot/dotT3';
import { setAggroTarget, setAttackTarget } from './targeting';
import { markEngaged } from './engagement';

export function updateCombat(world: World, dt: number, now: number) {
  // PLAYER → MONSTER
  for (const player of world.playerEntities) {
    // Channeled Beam locks all auto-attacks; the beam system handles targeting + damage.
    if (player.isChanneling) {
      player.performsAttack.lastAttackAt = now; // keep the cooldown hot so attacks resume promptly
      continue;
    }

    let target = null;
    let best = Infinity;
    const attackRangeSq = player.performsAttack.attackRange * player.performsAttack.attackRange;

    for (const m of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
      const dSq = distanceSq(m.hasPosition.current, player.hasPosition.current);

      if (dSq <= attackRangeSq && dSq < best) {
        best = dSq;
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

        const monsterCombatState = target.tracksCombat;
        const shredEffect = monsterCombatState
          ? getStatusEffect(monsterCombatState, 'plating-shred')
          : undefined;
        const effectivePlating = Math.max(0,
          target.mitigatesDamage.plating - (shredEffect ? shredEffect.stacks * shredEffect.data['platingReduction'] : 0),
        );

        ctx.damage = Math.max(1, Math.round(
          Math.max(0, player.dealsDamage.attack - effectivePlating) * (1 - target.mitigatesDamage.damageReduction),
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
            target.hasPosition.current.x, target.hasPosition.current.y,
            GAME_CONFIG.EMPOWERED_AOE_RADIUS,
            Math.round(player.dealsDamage.attack * GAME_CONFIG.EMPOWERED_AOE_MULT),
            target.isMonster.id,
          );
        }

        emitCombatEvent('onDamageTaken', ctx, world);

        target.hasHealth.hp -= ctx.damage;
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
        });

        emitCombatEvent('afterHit', ctx, world);

        if (target.hasHealth.hp <= 0) {
          emitCombatEvent('onKill', ctx, world);
          world.pushEvent(player.hasPosition.nodeId, {
            kind:       'player-kill',
            playerId:   player.isPlayer.id,
            targetId:   target.isMonster.id,
            targetName: target.isMonster.name,
          });
          grantMonsterRewards(world, player.isPlayer.id, target);
          world.removeMonsterEntity(target.isMonster.id);
        } else {
          // Retaliation aggro: if the monster had no target (e.g. player attacked from
          // outside pull range), it now fixates on the player who hit it.
          // Guard: only aggro if the player is within leash range of the monster's
          // spawn. Beyond that the monster can't reach them — it would immediately
          // leash and return, enabling safe static-range cheese.
          const ai = target.controlsMonster;
          if (!target.hasAggroTarget) {
            if (distanceSq(player.hasPosition.current, { x: ai.spawnX, y: ai.spawnY }) <= ai.leashRange * ai.leashRange) {
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
      for (const e of world.aggroedMonsters) {
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
  for (const e of world.aggroedMonsters) {
    if (e.hasAwareness.state !== 'attacking') continue;

    const target = world.getPlayerEntity(e.hasAggroTarget.playerId) ?? null;

    // Player may have transitioned to a different node — drop aggro if so.
    if (!target || target.hasPosition.nodeId !== e.hasPosition.nodeId) {
      setAggroTarget(world, e, null, now);
      setAttackTarget(world, e, null);
      continue;
    }

    if (distanceSq(target.hasPosition.current, e.hasPosition.current) > e.performsAttack.attackRange * e.performsAttack.attackRange) {
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
