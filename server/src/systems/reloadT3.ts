import type { MonsterState, PlayerState } from '@mmo-idle/shared';
import { GAME_CONFIG, TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import type { World } from '../world/World';
import { getNodeMonsters } from '../world/nodeQueries';
import { grantMonsterRewards } from './rewards';
import { applyKnockback } from './knockback';
import {
  emitCombatEvent,
  makeCombatContext,
  registerCombatListener,
} from './combatPipeline';
import {
  getFlag,
  getResource,
  isCooldownActive,
  setCooldown,
  setFlag,
  setResource,
} from './combatState';
import { getStatusEffect } from './statusEffects';
import { applyPlayerAoe } from './aoeDamage';

const AMMO_KEY = 'ammo';

const LASER_HEAT_KEY = 'reloadLaserHeat';
const LASER_OVERHEATED_KEY = 'reloadLaserOverheated';
const SNIPE_COOLDOWN_KEY = 'reloadSnipeCooldown';

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
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'reload') continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    if ((player.passives['reload.laser'] ?? 0) <= 0) {
      player.heatPct = 0;
      player.laserOverheated = false;
      setResource(state, LASER_HEAT_KEY, 0);
      setFlag(state, LASER_OVERHEATED_KEY, false);
      continue;
    }

    updateLaserPlayer(world, player, dt, now);
  }
}

export function getSnipeReady(player: PlayerState, world: World): boolean {
  if ((player.passives['reload.snipe'] ?? 0) <= 0) return false;
  const target = player.attackTargetId ? world.monsters.get(player.attackTargetId) : undefined;
  return !!target && target.hp >= target.maxHp * FULL_HP_THRESHOLD;
}

function registerLaserGateAndSnipeCooldown(): void {
  registerCombatListener('beforeAttack', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    const player = ctx.attacker as PlayerState;
    if (player.combatArchetype !== 'reload') return;

    if ((player.passives['reload.laser'] ?? 0) > 0) {
      ctx.cancelled = true;
      return;
    }

    if ((player.passives['reload.snipe'] ?? 0) <= 0) return;

    const state = world.playerCombatState.get(player.id);
    if (!state) return;

    if (isCooldownActive(state, SNIPE_COOLDOWN_KEY)) {
      ctx.cancelled = true;
      return;
    }

    if (getResource(state, AMMO_KEY) <= 0) return;

    const cooldownMs = Math.round(player.passives['reload.snipe-cooldown-ms'] ?? DEFAULT_SNIPE_COOLDOWN_MS);
    setCooldown(state, SNIPE_COOLDOWN_KEY, cooldownMs);
  });
}

function registerSnipeDamage(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;

    const player = ctx.attacker as PlayerState;
    const monster = ctx.defender as MonsterState;
    if ((player.passives['reload.snipe'] ?? 0) <= 0) return;

    const baselineCdMs = player.passives['reload.snipe-baseline-cd-ms'] ?? DEFAULT_SNIPE_BASELINE_CD_MS;
    const attackSpeedDamageMult = baselineCdMs / Math.max(1, player.attackCooldown);
    ctx.damage = Math.max(1, Math.round(ctx.damage * attackSpeedDamageMult));

    if (monster.hp >= monster.maxHp * FULL_HP_THRESHOLD) {
      const fullHpMult = player.passives['reload.snipe-fullhp-mult'] ?? DEFAULT_SNIPE_FULL_HP_MULT;
      ctx.damage = Math.max(1, Math.round(ctx.damage * fullHpMult));
      ctx.metadata['reloadSnipeFullHp'] = true;
    }
  });
}

function registerGatlingKnockback(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;

    const player = ctx.attacker as PlayerState;
    const monster = ctx.defender as MonsterState;
    if ((player.passives['reload.gatling'] ?? 0) <= 0) return;

    applyKnockback(
      world,
      monster.id,
      player.x,
      player.y,
      GATLING_KNOCKBACK_DISTANCE,
      GATLING_KNOCKBACK_MS,
    );
  });
}

function updateLaserPlayer(world: World, player: PlayerState, dt: number, now: number): void {
  const state = world.playerCombatState.get(player.id);
  if (!state) return;

  const tickScale = Math.max(0, dt / SERVER_TICK_MS);
  const heatPerTick = player.passives['reload.laser-heat-per-tick'] ?? DEFAULT_LASER_HEAT_PER_TICK;
  const coolPerTick = player.passives['reload.laser-cool-per-tick'] ?? DEFAULT_LASER_COOL_PER_TICK;
  let heat = getResource(state, LASER_HEAT_KEY);
  let overheated = getFlag(state, LASER_OVERHEATED_KEY);

  const target = findNearestTarget(world, player);
  player.attackTargetId = target?.id ?? null;

  if (target && !overheated) {
    applyLaserTick(world, player, target, now);
    heat = Math.min(100, heat + heatPerTick * tickScale);
    if (heat >= 100) {
      heat = 100;
      overheated = true;
    }
  } else if (heat > 0) {
    heat = Math.max(0, heat - coolPerTick * tickScale);
    if (overheated && heat <= 0) {
      overheated = false;
    }
  }

  setResource(state, LASER_HEAT_KEY, heat);
  setFlag(state, LASER_OVERHEATED_KEY, overheated);
  player.heatPct = Math.round(heat);
  player.laserOverheated = overheated;
}

function findNearestTarget(world: World, player: PlayerState): MonsterState | null {
  let target: MonsterState | null = null;
  let best = Infinity;

  for (const monster of getNodeMonsters(world, player.nodeId)) {
    const dx = monster.x - player.x;
    const dy = monster.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= player.attackRange && distance < best) {
      best = distance;
      target = monster;
    }
  }

  return target;
}

function applyLaserTick(world: World, player: PlayerState, target: MonsterState, now: number): void {
  const ctx = makeCombatContext(player, 'player', target, 'monster');
  ctx.metadata['reloadLaser'] = true;

  emitCombatEvent('onAttack', ctx, world);

  const monsterCombatState = world.monsterCombatState.get(target.id);
  const shredEffect = monsterCombatState
    ? getStatusEffect(monsterCombatState, 'plating-shred')
    : undefined;
  const effectivePlating = Math.max(0,
    target.plating - (shredEffect ? shredEffect.stacks * shredEffect.data['platingReduction'] : 0),
  );
  const damagePct = player.passives['reload.laser-damage-per-tick-pct'] ?? DEFAULT_LASER_DAMAGE_PER_TICK_PCT;
  const rawLaserDamage = Math.max(1, player.attack * damagePct);

  ctx.damage = Math.max(1, Math.round(
    Math.max(0, rawLaserDamage - effectivePlating) * (1 - target.damageReduction),
  ));

  emitCombatEvent('onHit', ctx, world);

  const isEmpowered = !!ctx.metadata['empoweredAttack'];
  const isExecution = isEmpowered && player.combatArchetype === 'cooldown';
  if (isEmpowered) {
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

  if (target.isBoss && target.nodeId === TEST_ROOM_NODE_ID) {
    world.testRoomEngagedBossId = target.id;
  }

  const clientEffectsRaw = ctx.metadata['clientEffects'];
  const clientEffects = Array.isArray(clientEffectsRaw)
    ? clientEffectsRaw.filter((effect): effect is string => typeof effect === 'string')
    : undefined;
  world.pushEvent(player.nodeId, {
    kind: 'player-hit',
    playerId: player.id,
    targetId: target.id,
    targetName: target.name,
    damage: ctx.damage,
    empowered: isEmpowered,
    execution: isExecution,
    effects: clientEffects && clientEffects.length > 0 ? clientEffects : undefined,
  });

  emitCombatEvent('afterHit', ctx, world);

  if (target.hp <= 0) {
    emitCombatEvent('onKill', ctx, world);
    world.pushEvent(player.nodeId, {
      kind: 'player-kill',
      playerId: player.id,
      targetId: target.id,
      targetName: target.name,
    });
    grantMonsterRewards(world, player.id, target);
    world.monsters.delete(target.id);
    world.monsterAI.delete(target.id);
    world.monsterCombatState.delete(target.id);
    return;
  }

  const ai = world.monsterAI.get(target.id);
  if (ai && ai.aggroTargetId === null) {
    ai.aggroTargetId = player.id;
    ai.lastAggroAt = now;
    world.playerCombatAt.set(player.id, now);
  }
}
