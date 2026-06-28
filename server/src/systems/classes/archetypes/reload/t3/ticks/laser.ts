import { TEST_ROOM_NODE_ID, hitboxGap, inAttackRange, posHitboxFromEntity, type UsesReload } from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import type { MonsterEntity, PlayerEntity } from '../../../../../../ecs/entity';
import {
  emitCombatEvent,
  makeCombatContext,
} from '../../../../../combat/engine/combatPipeline';
import { setAggroTarget, setAttackTarget } from '../../../../../combat/ai/targeting';
import { markEngaged } from '../../../../../combat/ai/engagement';
import { grantMonsterRewards } from '../../../../../player/progression/rewards';
import {
  DEFAULT_LASER_COOL_PER_TICK,
  DEFAULT_LASER_DAMAGE_PER_TICK_PCT,
  DEFAULT_LASER_HEAT_PER_TICK,
  SERVER_TICK_MS,
} from '../core/constants';
import {
  buildPlatingDrBreakdown,
  recordMonsterDamagedByPlayer,
  recordPlayerKillMonster,
} from '../../../../../../world/worldLogCombat';
import { actorFromPlayer } from '../../../../../../world/worldLogActors';
import { isInvulnerableMonster } from '../../../../../combat/invulnerability';
import { effectivePlatingAfterShred } from '../../../../../combat/damage/effectivePlating';

export function updateReloadT3Ticks(world: World, dt: number, now: number): void {
  for (const entity of world.reloadPlayers) {
    const reload = entity.usesReload;

    if ((entity.usesSkills.passives['reload.laser'] ?? 0) <= 0) {
      reload.laserHeat       = 0;
      reload.laserOverheated = false;
      continue;
    }

    updateLaserPlayer(world, entity, reload, dt, now);
  }
}

function updateLaserPlayer(
  world: World,
  player: PlayerEntity,
  reload: UsesReload,
  dt: number,
  now: number,
): void {
  const tickScale = Math.max(0, dt / SERVER_TICK_MS);
  const heatPerTick = player.usesSkills.passives['reload.laser-heat-per-tick'] ?? DEFAULT_LASER_HEAT_PER_TICK;
  const coolPerTick = player.usesSkills.passives['reload.laser-cool-per-tick'] ?? DEFAULT_LASER_COOL_PER_TICK;

  const target = findNearestTarget(world, player);
  setAttackTarget(world, player, target?.isMonster.id ?? null);

  if (target && !reload.laserOverheated) {
    applyLaserTick(world, player, target, now);
    reload.laserHeat = Math.min(100, reload.laserHeat + heatPerTick * tickScale);
    if (reload.laserHeat >= 100) {
      reload.laserHeat       = 100;
      reload.laserOverheated = true;
    }
  } else if (reload.laserHeat > 0) {
    reload.laserHeat = Math.max(0, reload.laserHeat - coolPerTick * tickScale);
    if (reload.laserOverheated && reload.laserHeat <= 0) {
      reload.laserOverheated = false;
    }
  }
}

function findNearestTarget(world: World, player: PlayerEntity): MonsterEntity | null {
  let target: MonsterEntity | null = null;
  let bestGap = Infinity;
  const playerPH = posHitboxFromEntity(player);
  const attackRange = player.performsAttack.attackRange;

  for (const entity of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    const monsterPH = posHitboxFromEntity(entity);
    if (!inAttackRange(playerPH, monsterPH, attackRange)) continue;
    const gap = hitboxGap(playerPH, monsterPH);
    if (gap < bestGap) {
      bestGap = gap;
      target = entity;
    }
  }

  return target;
}

function applyLaserTick(world: World, player: PlayerEntity, target: MonsterEntity, now: number): void {
  if (isInvulnerableMonster(target)) return;

  const ctx = makeCombatContext(player, 'player', target, 'monster');
  ctx.metadata['reloadLaser'] = true;

  emitCombatEvent('onAttack', ctx, world);

  const monsterCombatState = target.tracksCombat;
  const effectivePlating = effectivePlatingAfterShred(
    target.mitigatesDamage.plating,
    monsterCombatState,
  );
  const damagePct = player.usesSkills.passives['reload.laser-damage-per-tick-pct'] ?? DEFAULT_LASER_DAMAGE_PER_TICK_PCT;
  const rawLaserDamage = Math.max(1, player.dealsDamage.attack * damagePct);

  ctx.damage = Math.max(1, Math.round(
    Math.max(0, rawLaserDamage - effectivePlating) * (1 - target.mitigatesDamage.damageReduction),
  ));

  emitCombatEvent('onHit', ctx, world);

  // Apply flat on-hit damage on EVERY tick (post-mitigation), mirroring the channeled
  // beam — the laser's on-hit triggers already fire via the pipeline above, and this
  // adds the on-hit DAMAGE stat too, rewarding on-hit builds on a continuous weapon.
  if (player.dealsDamage.onHitDamage > 0) ctx.damage += player.dealsDamage.onHitDamage;

  // Empowered attacks no longer carry an inherent AoE splash (AoE is opt-in, e.g.
  // the Sweep ability). `isEmpowered`/`isExecution` only drive FX tagging below.
  const isEmpowered = !!ctx.metadata['empoweredAttack'];
  const isExecution = isEmpowered && player.usesCooldown !== undefined;

  emitCombatEvent('onDamageTaken', ctx, world);

  const mitigation = buildPlatingDrBreakdown({
    grossDamage: Math.round(rawLaserDamage),
    effectivePlating,
    platingMult: ctx.platingMult,
    damageReduction: target.mitigatesDamage.damageReduction,
    onHitBonus: player.dealsDamage.onHitDamage,
  });
  mitigation.hpDamage = ctx.damage;

  recordMonsterDamagedByPlayer(
    world,
    player.isPlayer.id,
    actorFromPlayer(player),
    target,
    ctx.damage,
    'proc',
    mitigation,
    ['laser'],
  );

  target.hasHealth.hp -= ctx.damage;
  player.performsAttack.lastAttackAt = now;

  if (target.isMonster.isBoss && target.hasPosition.nodeId === TEST_ROOM_NODE_ID) {
    world.testRoomEngagedBossId = target.isMonster.id;
  }

  const clientEffectsRaw = ctx.metadata['clientEffects'];
  const clientEffects = Array.isArray(clientEffectsRaw)
    ? clientEffectsRaw.filter((effect): effect is string => typeof effect === 'string')
    : undefined;
  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'player-hit',
    playerId: player.isPlayer.id,
    targetId: target.isMonster.id,
    targetName: target.isMonster.name,
    damage: ctx.damage,
    empowered: isEmpowered,
    execution: isExecution,
    effects: clientEffects && clientEffects.length > 0 ? clientEffects : undefined,
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
    return;
  }

  const monster = world.getMonsterEntity(target.isMonster.id);
  const ai = monster?.controlsMonster;
  if (monster && ai && !monster.hasAggroTarget) {
    setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, now);
    markEngaged(world, player, now);
  }
}
