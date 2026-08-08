/** Server-authoritative tick driver for the persistent summon formation. */
import { GAME_CONFIG } from '@mmo-idle/shared';
import type { World } from '../../../../world/World';
import type { MinionEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import {
  computeMinionMaxHp,
  computeMinionSizeMult,
  computeMinionSpeed,
  despawnMinion,
  resolveMinionType,
  spawnMinionForOwner,
  syncMinionHitbox,
  syncMinionMaxHp,
} from './spawn';
import { driveMinion } from './ai';
import { validateSummonerCommand } from './command';
import { applyHealToMinion } from '../../../defense/regen/healing';
import { summonerProfileFor } from './profile';
import {
  enqueueSummonReconstruction,
  tickSummonReconstruction,
} from './reconstruction';
import { onSummonDeath, tickSummonerSpecializations } from './specs';
import { syncSummonerFormationTarget } from './formationTarget';

type SummonerPlayerEntity = PlayerEntity & {
  summonsMinions: NonNullable<PlayerEntity['summonsMinions']>;
};

/** Preserve matching logical slots and cleanly replace only changed layouts. */
function reconcileMinionSlots(world: World, owner: SummonerPlayerEntity): void {
  const summons = owner.summonsMinions;
  const desired = summonerProfileFor(owner).slots;
  const sameLayout = desired.length === summons.slotIds.length
    && desired.every((slot, index) => (
      summons.slotIds[index] === slot.slotId && summons.slotRoles[index] === slot.role
    ));
  if (sameLayout) return;

  const oldIndexBySlot = new Map(summons.slotIds.map((slotId, index) => [slotId, index]));
  const desiredIds = new Set(desired.map((slot) => slot.slotId));
  for (let oldIndex = 0; oldIndex < summons.slotIds.length; oldIndex++) {
    if (desiredIds.has(summons.slotIds[oldIndex]!)) continue;
    const entityId = summons.minionIds[oldIndex];
    const minion = entityId ? world.getMinionEntity(entityId) : undefined;
    if (minion) despawnMinion(world, minion);
  }

  const nextMinionIds = desired.map((slot, index) => {
    const oldIndex = oldIndexBySlot.get(slot.slotId);
    const id = oldIndex === undefined ? '' : (summons.minionIds[oldIndex] ?? '');
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (minion) {
      minion.isMinion.slot = index;
      minion.isMinion.slotId = slot.slotId;
      minion.isMinion.role = slot.role;
      markSliceDirty(world, minion, 'isMinion');
    }
    return minion ? id : '';
  });

  summons.minionIds = nextMinionIds;
  summons.respawnTimers = new Array(desired.length).fill(0);
  summons.slotIds = desired.map((slot) => slot.slotId);
  summons.slotRoles = desired.map((slot) => slot.role);
  summons.targetCount = desired.length;
  summons.reconstructionQueue = summons.reconstructionQueue.filter((slotId) => desiredIds.has(slotId));
  if (summons.activeReconstruction && !desiredIds.has(summons.activeReconstruction.slotId)) {
    summons.activeReconstruction = undefined;
  }
  summons.ritualCharges = undefined;
  if (owner.controlsSummons) owner.controlsSummons.pendingDeadSlotIds = [];
  markSliceDirty(world, owner, 'summonsMinions');
}

function syncLiveMinionFrameStats(world: World, owner: SummonerPlayerEntity): void {
  const profile = summonerProfileFor(owner);
  const desiredSpeed = computeMinionSpeed(owner);
  const desiredHpRegen = owner.hasHealth.hpRegen;
  for (let index = 0; index < owner.summonsMinions.minionIds.length; index++) {
    const id = owner.summonsMinions.minionIds[index];
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (!minion) continue;
    const slot = profile.slots[index] ?? profile.slots[0]!;
    const desiredType = resolveMinionType(owner, index);
    const desiredSizeMult = computeMinionSizeMult(owner, index);
    const typeChanged = minion.isMinion.monsterTypeId !== desiredType;
    const sizeChanged = minion.isMinion.sizeMult !== desiredSizeMult;
    if (typeChanged) {
      minion.isMinion.monsterTypeId = desiredType;
      markSliceDirty(world, minion, 'isMinion');
    }
    if (minion.hasPosition.speed !== desiredSpeed) {
      minion.hasPosition.speed = desiredSpeed;
      markSliceDirty(world, minion, 'hasPosition');
    }
    if (sizeChanged) {
      minion.isMinion.sizeMult = desiredSizeMult;
      markSliceDirty(world, minion, 'isMinion');
    }
    if (typeChanged || sizeChanged) {
      syncMinionHitbox(world, minion, desiredSizeMult);
    }
    if (minion.isMinion.slotId !== slot.slotId || minion.isMinion.role !== slot.role) {
      minion.isMinion.slotId = slot.slotId;
      minion.isMinion.role = slot.role;
      markSliceDirty(world, minion, 'isMinion');
    }
    syncMinionMaxHp(world, minion, computeMinionMaxHp(owner, index));
    if (minion.hasHealth.hpRegen !== desiredHpRegen) {
      minion.hasHealth.hpRegen = desiredHpRegen;
      markSliceDirty(world, minion, 'hasHealth');
    }
    const desiredAttack = Math.max(
      1,
      Math.round(owner.dealsDamage.attack * profile.formationOffenseMult * slot.offenseWeight),
    );
    if (minion.dealsDamage.attack !== desiredAttack) {
      minion.dealsDamage.attack = desiredAttack;
      markSliceDirty(world, minion, 'dealsDamage');
    }
    const desiredCooldown = Math.max(
      100,
      Math.round(owner.performsAttack.attackCooldown * profile.summonAttackCooldownMult),
    );
    if (minion.performsAttack.attackCooldown !== desiredCooldown
      || minion.performsAttack.attackRange !== profile.attackRange) {
      minion.performsAttack.attackCooldown = desiredCooldown;
      minion.performsAttack.attackRange = profile.attackRange;
      markSliceDirty(world, minion, 'performsAttack');
    }
  }
}

function isMinionInCombat(
  world: World,
  owner: SummonerPlayerEntity,
  minion: MinionEntity,
  now: number,
): boolean {
  if (minion.hasAttackTarget !== undefined) return true;
  if (owner.tracksEngagement !== undefined
    && now - owner.tracksEngagement < GAME_CONFIG.COMBAT_REGEN_DELAY) return true;
  return [...world.aggroedMonsters].some((monster) => (
    monster.hasAggroTarget.targetKind === 'minion'
    && monster.hasAggroTarget.targetId === minion.isMinion.id
  ));
}

function runMinionRegen(
  world: World,
  owner: SummonerPlayerEntity,
  minion: MinionEntity,
  dt: number,
  now: number,
): void {
  if (minion.hasHealth.hp >= minion.hasHealth.maxHp) return;
  const hpRegen = minion.hasHealth.hpRegen ?? 0;
  if (hpRegen <= 0 || isMinionInCombat(world, owner, minion, now)) return;
  applyHealToMinion(
    minion,
    owner.isPlayer.id,
    minion.hasHealth.maxHp * (hpRegen / 100) * (dt / 1_000),
    world,
  );
}

function collectDeaths(world: World, owner: SummonerPlayerEntity): void {
  const summons = owner.summonsMinions;
  for (let index = 0; index < summons.targetCount; index++) {
    const id = summons.minionIds[index];
    if (!id) continue;
    const minion = world.getMinionEntity(id);
    if (minion && minion.hasHealth.hp > 0) continue;
    enqueueSummonReconstruction(world, owner, summons.slotIds[index]!);
    if (minion) {
      if (owner.controlsSummons) {
        onSummonDeath(
          world,
          owner as SummonerPlayerEntity & { controlsSummons: NonNullable<PlayerEntity['controlsSummons']> },
          minion,
        );
      }
      despawnMinion(world, minion);
    }
    else summons.minionIds[index] = '';
  }
}

function spawnFreshSlots(world: World, owner: SummonerPlayerEntity): void {
  const summons = owner.summonsMinions;
  for (let index = 0; index < summons.targetCount; index++) {
    if (summons.minionIds[index]) continue;
    const slotId = summons.slotIds[index]!;
    const owesReconstruction = summons.activeReconstruction?.slotId === slotId
      || summons.reconstructionQueue.includes(slotId)
      || owner.controlsSummons?.pendingDeadSlotIds.includes(slotId);
    if (!owesReconstruction) spawnMinionForOwner(world, owner, index);
  }
}

export function initSummonerArchetype(): void {}

export function updateSummonerArchetype(world: World, dt: number, now: number): void {
  for (const owner of world.summonerPlayers) {
    const summoner = owner as SummonerPlayerEntity;
    reconcileMinionSlots(world, summoner);
    if (summoner.controlsSummons) {
      tickSummonerSpecializations(
        world,
        summoner as SummonerPlayerEntity & { controlsSummons: NonNullable<PlayerEntity['controlsSummons']> },
        now,
      );
    }
    collectDeaths(world, summoner);
    spawnFreshSlots(world, summoner);
    tickSummonReconstruction(world, summoner, dt, now);
    syncLiveMinionFrameStats(world, summoner);
    validateSummonerCommand(world, summoner);

    for (const id of summoner.summonsMinions.minionIds) {
      const minion = id ? world.getMinionEntity(id) : undefined;
      if (!minion || minion.hasHealth.hp <= 0) continue;
      if (minion.hasPosition.nodeId !== summoner.hasPosition.nodeId) {
        minion.hasPosition.nodeId = summoner.hasPosition.nodeId;
        markSliceDirty(world, minion, 'hasPosition');
      }
      runMinionRegen(world, summoner, minion, dt, now);
      driveMinion(world, minion, summoner, now);
    }
    syncSummonerFormationTarget(world, summoner);
  }
}
