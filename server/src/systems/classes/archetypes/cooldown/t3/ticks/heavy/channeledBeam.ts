import type { World } from '../../../../../../../world/World';
import type { MonsterEntity, PlayerEntity } from '../../../../../../../ecs/entity';
import { hitboxGap, inAttackRange, posHitboxFromEntity } from '@mmo-idle/shared';
import { emitCombatEvent, makeCombatContext } from '../../../../../../combat/engine/combatPipeline';
import { setAttackTarget, setAggroTarget } from '../../../../../../combat/ai/targeting';
import { markEngaged } from '../../../../../../combat/ai/engagement';
import { grantMonsterRewards } from '../../../../../../player/progression/rewards';
import { endChannel } from '../../core/helpers';
import { BEAM_DURATION_MS, BEAM_TICK_MS, BEAM_DMG_PER_TICK_MULT } from '../../core/constants';
import {
  buildPlatingDrBreakdown,
  recordMonsterDamagedByPlayer,
  recordPlayerKillMonster,
} from '../../../../../../../world/worldLogCombat';
import { actorFromPlayer } from '../../../../../../../world/worldLogActors';
import { isInvulnerableMonster } from '../../../../../../combat/invulnerability';
import { effectivePlatingAfterShred } from '../../../../../../combat/damage/effectivePlating';

/** Client FX id: drives the holy channel beam render (client/src/fx/holyBeam.ts). */
const CHANNEL_BEAM_EFFECT = 'channel-beam';

/**
 * Channeled Beam tick (Devout Priest). Drains `isChanneling.remainingMs`, ticks
 * damage every BEAM_TICK_MS through the FULL combat pipeline, and auto-reacquires
 * nearby in-range targets when the current one dies or leaves the node.
 *
 * Running each tick through the pipeline (onAttack → onHit → onDamageTaken →
 * afterHit → onKill) is what makes EVERY beam tick apply on-hit: gear/charm procs
 * and DoT/debuff appliers fire, and the flat on-hit damage stat is added per tick.
 * This is the spec's identity — it rewards stacking on-hit over attack speed.
 *
 * Channel ends when: remainingMs reaches 0, the target dies with no reacquisition,
 * or the target leaves the node with no reacquisition.
 */
export function updateChanneledBeam(world: World, dt: number, now: number): void {
  for (const entity of world.channelingPlayers) {
    const player  = entity;
    const channel = entity.isChanneling;

    const remaining = channel.remainingMs - dt;
    if (remaining <= 0) {
      endChannel(world, player);
      continue;
    }

    channel.remainingMs = remaining;
    channel.pct = Math.round((1 - remaining / BEAM_DURATION_MS) * 100);

    if (!channel.targetId) { endChannel(world, player); continue; }

    let monster = world.getMonsterEntity(channel.targetId);
    if (!monster || monster.hasPosition.nodeId !== player.hasPosition.nodeId || isInvulnerableMonster(monster)) {
      const reacquired = reacquire(world, player, channel.targetId);
      if (!reacquired) { endChannel(world, player); continue; }
      monster = reacquired;
    }

    const nextTick = channel.nextTickMs - dt;
    if (nextTick > 0) { channel.nextTickMs = nextTick; continue; }
    channel.nextTickMs = nextTick + BEAM_TICK_MS;

    const killed = applyBeamTick(world, player, monster, now);
    if (killed) {
      const reacquired = reacquire(world, player, monster.isMonster.id);
      if (!reacquired) { endChannel(world, player); continue; }
    }
  }
}

/** Point the channel at a fresh in-range target, or return undefined if none. */
function reacquire(world: World, player: PlayerEntity, excludeId: string): MonsterEntity | undefined {
  const next = findBeamTarget(world, player, excludeId);
  if (!next) return undefined;
  player.isChanneling!.targetId = next.isMonster.id;
  setAttackTarget(world, player, next.isMonster.id);
  return next;
}

/**
 * One beam tick against `target`. Mirrors the laser tick: runs the combat
 * pipeline so on-hit listeners fire, then adds the flat on-hit damage stat.
 * Returns true if the tick killed the target (rewards + removal handled here).
 */
function applyBeamTick(world: World, player: PlayerEntity, target: MonsterEntity, now: number): boolean {
  if (isInvulnerableMonster(target)) return false;

  const ctx = makeCombatContext(player, 'player', target, 'monster');
  ctx.metadata['channelBeam'] = true;

  emitCombatEvent('onAttack', ctx, world);

  const effectivePlating = effectivePlatingAfterShred(target.mitigatesDamage.plating, target.tracksCombat);
  const tickMult = player.usesSkills.passives['cooldown.channeled-beam-mult'] ?? BEAM_DMG_PER_TICK_MULT;
  const gross = Math.max(1, player.dealsDamage.attack * tickMult);
  ctx.damage = Math.max(1, Math.round(
    Math.max(0, gross - effectivePlating) * (1 - target.mitigatesDamage.damageReduction),
  ));

  emitCombatEvent('onHit', ctx, world);

  // Flat on-hit damage applies on EVERY beam tick (post-mitigation) — the build payoff.
  if (player.dealsDamage.onHitDamage > 0) ctx.damage += player.dealsDamage.onHitDamage;

  emitCombatEvent('onDamageTaken', ctx, world);

  const mitigation = buildPlatingDrBreakdown({
    grossDamage: Math.round(gross),
    effectivePlating,
    platingMult: ctx.platingMult,
    damageReduction: target.mitigatesDamage.damageReduction,
    onHitBonus: player.dealsDamage.onHitDamage,
  });
  mitigation.hpDamage = ctx.damage;

  recordMonsterDamagedByPlayer(
    world, player.isPlayer.id, actorFromPlayer(player), target, ctx.damage, 'proc', mitigation, ['beam'],
  );

  target.hasHealth.hp -= ctx.damage;
  player.performsAttack.lastAttackAt = now;

  const procEffects = Array.isArray(ctx.metadata['clientEffects'])
    ? (ctx.metadata['clientEffects'] as unknown[]).filter((e): e is string => typeof e === 'string')
    : [];
  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'player-hit',
    playerId: player.isPlayer.id,
    targetId: target.isMonster.id,
    targetName: target.isMonster.name,
    damage: ctx.damage,
    // Cosmetic only: flag each tick empowered so every beam number gets the yellow
    // "!" crit styling. The empowered RING/FX is skipped — beam ticks route through
    // the channel-beam branch in combatFx, not the empowered-ring path.
    empowered: true,
    execution: false,
    effects: [CHANNEL_BEAM_EFFECT, ...procEffects],
  });

  emitCombatEvent('afterHit', ctx, world);

  if (target.hasHealth.hp <= 0) {
    emitCombatEvent('onKill', ctx, world);
    const rewardInfo = grantMonsterRewards(world, player.isPlayer.id, target);
    recordPlayerKillMonster(world, player.isPlayer.id, target, ctx.damage, rewardInfo);
    world.pushEvent(player.hasPosition.nodeId, {
      kind: 'player-kill',
      playerId: player.isPlayer.id,
      targetId: target.isMonster.id,
      targetName: target.isMonster.name,
      damage: ctx.damage,
      biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
      essenceGained: rewardInfo?.essenceGained ?? 0,
      essenceType: rewardInfo?.essenceType ?? 'green',
    });
    world.removeMonsterEntity(target.isMonster.id);
    return true;
  }

  const ai = target.controlsMonster;
  if (ai && !target.hasAggroTarget) {
    setAggroTarget(world, target, { id: player.isPlayer.id, kind: 'player' }, now);
    markEngaged(world, player, now);
  }
  return false;
}

/** Nearest monster within attack range on the player's node, excluding one ID. */
function findBeamTarget(world: World, player: PlayerEntity, excludeId?: string): MonsterEntity | undefined {
  let best: MonsterEntity | undefined;
  let bestGap = Infinity;
  const playerPH = posHitboxFromEntity(player);
  const attackRange = player.performsAttack.attackRange;

  for (const entity of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (excludeId && entity.isMonster.id === excludeId) continue;
    if (isInvulnerableMonster(entity)) continue;
    const monsterPH = posHitboxFromEntity(entity);
    if (!inAttackRange(playerPH, monsterPH, attackRange)) continue;
    const gap = hitboxGap(playerPH, monsterPH);
    if (gap < bestGap) {
      bestGap = gap;
      best = entity;
    }
  }
  return best;
}
