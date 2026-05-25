import { GAME_CONFIG, TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import { defineBuff, type BuffDescriptor } from '../../registry/buffs';
import type { World } from '../../../world/World';
import { grantMonsterRewards } from '../../rewards';
import { applyKnockback } from '../../knockback';
import {
  emitCombatEvent,
  makeCombatContext,
  registerCombatListener,
} from '../../combatPipeline';
import { getStatusEffect } from '@mmo-idle/shared';
import { applyPlayerAoe } from '../../aoeDamage';
import type { UsesReload } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/components/player';
import type { MonsterEntity } from '../../../ecs/components/monster';
import { setAggroTarget, setAttackTarget } from '../../targeting';
import { markEngaged } from '../../engagement';

const DEFAULT_LASER_DAMAGE_PER_TICK_PCT = 0.15;
const DEFAULT_LASER_HEAT_PER_TICK = 2;
const DEFAULT_LASER_COOL_PER_TICK = 2.5;
const DEFAULT_SNIPE_COOLDOWN_MS = 2500;
const DEFAULT_SNIPE_BASELINE_CD_MS = 1000;
const DEFAULT_SNIPE_FULL_HP_MULT = 2;
const FULL_HP_THRESHOLD = 0.95;
const GATLING_KNOCKBACK_DISTANCE = 20;
const GATLING_KNOCKBACK_MS = 150;
const SERVER_TICK_MS = 100;

export function initReloadT3(): void {
  registerLaserGateAndSnipeCooldown();
  registerSnipeDamage();
  registerGatlingKnockback();
}

export function updateReloadT3(world: World, dt: number, now: number = Date.now()): void {
  for (const entity of world.reloadPlayers) {
    const reload = entity.usesReload;

    // Tick down the snipe cooldown on every reload-archetype player.
    if (reload.snipeCooldownMs > 0) {
      reload.snipeCooldownMs = Math.max(0, reload.snipeCooldownMs - dt);
    }

    if ((entity.usesSkills.passives['reload.laser'] ?? 0) <= 0) {
      reload.laserHeat       = 0;
      reload.laserOverheated = false;
      continue;
    }

    updateLaserPlayer(world, entity, reload, dt, now);
  }
}

export function getSnipeReady(entity: PlayerEntity, world: World): boolean {
  if ((entity.usesSkills.passives['reload.snipe'] ?? 0) <= 0) return false;
  const targetId = entity.hasAttackTarget?.targetId;
  const target = targetId ? world.getMonsterEntity(targetId) : undefined;
  return !!target && target.hasHealth.hp >= target.hasHealth.maxHp * FULL_HP_THRESHOLD;
}

function registerLaserGateAndSnipeCooldown(): void {
  registerCombatListener('beforeAttack', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity?.usesReload) return;

    const reload = entity.usesReload;
    const passives = entity.usesSkills.passives;

    // Laser path: standard auto-attack is cancelled — the laser fires its own
    // damage ticks in updateLaserPlayer.
    if ((passives['reload.laser'] ?? 0) > 0) {
      ctx.cancelled = true;
      return;
    }

    if ((passives['reload.snipe'] ?? 0) <= 0) return;

    if (reload.snipeCooldownMs > 0) {
      ctx.cancelled = true;
      return;
    }

    if (reload.ammo <= 0) return;

    reload.snipeCooldownMs = Math.round(passives['reload.snipe-cooldown-ms'] ?? DEFAULT_SNIPE_COOLDOWN_MS);
  });
}

function registerSnipeDamage(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;

    const player = ctx.attacker;
    const monster = ctx.defender;
    if ((player.usesSkills.passives['reload.snipe'] ?? 0) <= 0) return;

    const baselineCdMs = player.usesSkills.passives['reload.snipe-baseline-cd-ms'] ?? DEFAULT_SNIPE_BASELINE_CD_MS;
    const attackSpeedDamageMult = baselineCdMs / Math.max(1, player.performsAttack.attackCooldown);
    ctx.damage = Math.max(1, Math.round(ctx.damage * attackSpeedDamageMult));

    if (monster.hasHealth.hp >= monster.hasHealth.maxHp * FULL_HP_THRESHOLD) {
      const fullHpMult = player.usesSkills.passives['reload.snipe-fullhp-mult'] ?? DEFAULT_SNIPE_FULL_HP_MULT;
      ctx.damage = Math.max(1, Math.round(ctx.damage * fullHpMult));
      ctx.metadata['reloadSnipeFullHp'] = true;
    }
  });
}

function registerGatlingKnockback(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;

    const player = ctx.attacker;
    const monster = ctx.defender;
    if ((player.usesSkills.passives['reload.gatling'] ?? 0) <= 0) return;

    applyKnockback(
      world,
      monster.isMonster.id,
      player.hasPosition.current.x,
      player.hasPosition.current.y,
      GATLING_KNOCKBACK_DISTANCE,
      GATLING_KNOCKBACK_MS,
    );
  });
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
  let best = Infinity;

  for (const entity of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    const dx = entity.hasPosition.current.x - player.hasPosition.current.x;
    const dy = entity.hasPosition.current.y - player.hasPosition.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= player.performsAttack.attackRange && distance < best) {
      best = distance;
      target = entity;
    }
  }

  return target;
}

function applyLaserTick(world: World, player: PlayerEntity, target: MonsterEntity, now: number): void {
  const ctx = makeCombatContext(player, 'player', target, 'monster');
  ctx.metadata['reloadLaser'] = true;

  emitCombatEvent('onAttack', ctx, world);

  const monsterCombatState = target.tracksCombat;
  const shredEffect = getStatusEffect(monsterCombatState, 'plating-shred');
  const effectivePlating = Math.max(0,
    target.mitigatesDamage.plating - (shredEffect ? shredEffect.stacks * shredEffect.data['platingReduction'] : 0),
  );
  const damagePct = player.usesSkills.passives['reload.laser-damage-per-tick-pct'] ?? DEFAULT_LASER_DAMAGE_PER_TICK_PCT;
  const rawLaserDamage = Math.max(1, player.dealsDamage.attack * damagePct);

  ctx.damage = Math.max(1, Math.round(
    Math.max(0, rawLaserDamage - effectivePlating) * (1 - target.mitigatesDamage.damageReduction),
  ));

  emitCombatEvent('onHit', ctx, world);

  const isEmpowered = !!ctx.metadata['empoweredAttack'];
  const isExecution = isEmpowered && player.usesSkills.combatArchetype === 'cooldown';
  if (isEmpowered) {
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
    world.pushEvent(player.hasPosition.nodeId, {
      kind: 'player-kill',
      playerId: player.isPlayer.id,
      targetId: target.isMonster.id,
      targetName: target.isMonster.name,
    });
    grantMonsterRewards(world, player.isPlayer.id, target);
    world.removeMonsterEntity(target.isMonster.id);
    return;
  }

  const monster = world.getMonsterEntity(target.isMonster.id);
  const ai = monster?.controlsMonster;
  if (monster && ai && !monster.hasAggroTarget) {
    setAggroTarget(world, monster, player.isPlayer.id, now);
    markEngaged(world, player, now);
  }
}

// ── Buff descriptors ──────────────────────────────────────────────────────────

export const RELOAD_T3_BUFFS = [
  defineBuff('reload-snipe-ready', ({ player, world }) => {
    if (player.usesSkills.combatArchetype !== 'reload') return null;
    return getSnipeReady(player, world)
      ? { id: 'reload-snipe-ready', label: 'Snipe', stacks: 1, durationPct: -1, color: '#ffcc88' }
      : null;
  }),
] as const satisfies readonly BuffDescriptor[];
