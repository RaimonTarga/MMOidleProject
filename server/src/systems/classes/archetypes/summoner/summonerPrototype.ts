/**
 * Summoner archetype tick driver.
 *
 * Each summoner player tick does, per slot:
 *   - If alive   → run minion AI (see `ai.ts`).
 *   - If empty   → run respawn timer; spawn when it expires.
 *   - If just died (slot id present but entity gone) → start respawn timer.
 *
 * Damage to slimes happens elsewhere:
 *   - From monster melee/ranged: minions are not currently valid aggro
 *     targets for monsters; in v1 they take damage only via the
 *     damage-sponge listener (`damageSponge.ts`).
 *   - From AoE: `applyMonsterAoe` damages minions in radius (monster `aoeAttack`
 *     splash and boss-script `slam`). Dead minions are detached here on the next
 *     tick — AoE only drops their HP.
 */
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
import { applyOwnerStatShare } from './statShare';
import { driveMinion } from './ai';
import { validateSummonerCommand } from './command';
import { tickAcidLurkerLifetime, tryAcidBroodMinionExplosion } from './t3/paths/cave';
import { tryVitalBurst } from './t3/paths/plains';
import { applyHealToMinion } from '../../../defense/regen/healing';

const DEFAULT_RESPAWN_MS = 5000;

type SummonerPlayerEntity = PlayerEntity & {
  summonsMinions: NonNullable<PlayerEntity['summonsMinions']>;
};

function desiredMinionCount(owner: SummonerPlayerEntity): number {
  const passives = owner.usesSkills.passives;
  const baseCount = passives['summoner.minion-count'] ?? 3;
  const countMult = passives['summoner.minion-count-mult'] ?? 1.0;
  let count = Math.max(1, Math.floor(baseCount * countMult));
  if (passives['summoner.stone-sentinel']) {
    count = Math.max(count, Math.floor(passives['summoner.stone-sentinel-count'] ?? 2));
  }
  const cap = passives['summoner.minion-count-cap'];
  if (cap !== undefined && cap > 0) {
    count = Math.min(count, Math.floor(cap));
  }
  return Math.max(1, count);
}

function isStoneSentinelOwner(owner: SummonerPlayerEntity): boolean {
  return !!owner.usesSkills.passives['summoner.stone-sentinel'];
}

/**
 * Stone Sentinel: only one empty slot may run a respawn timer at a time so
 * sentries spawn sequentially at different follow offsets instead of stacking.
 */
function stoneSentinelActiveRespawnSlot(
  world: World,
  summons: SummonerPlayerEntity['summonsMinions'],
): number | null {
  for (let i = 0; i < summons.targetCount; i++) {
    if (summons.respawnTimers[i] > 0) return i;
  }
  for (let i = 0; i < summons.targetCount; i++) {
    const id = summons.minionIds[i];
    if (!id) return i;
    const minion = world.getMinionEntity(id);
    if (!minion || minion.hasHealth.hp <= 0) return i;
  }
  return null;
}

function reconcileMinionSlots(world: World, owner: SummonerPlayerEntity): void {
  const summons = owner.summonsMinions;
  const targetCount = desiredMinionCount(owner);
  if (summons.targetCount === targetCount) return;

  if (summons.targetCount > targetCount) {
    for (let slot = targetCount; slot < summons.targetCount; slot++) {
      const id = summons.minionIds[slot];
      const minion = id ? world.getMinionEntity(id) : undefined;
      if (minion) despawnMinion(world, minion);
    }
    summons.minionIds.length = targetCount;
    summons.respawnTimers.length = targetCount;
  } else {
    while (summons.minionIds.length < targetCount) summons.minionIds.push('');
    while (summons.respawnTimers.length < targetCount) summons.respawnTimers.push(0);
  }

  summons.targetCount = targetCount;
  markSliceDirty(world, owner, 'summonsMinions');
}

function syncLiveMinionFrameStats(world: World, owner: SummonerPlayerEntity): void {
  const desiredSpeed = computeMinionSpeed(owner);
  const desiredSizeMult = computeMinionSizeMult(owner);
  const desiredMaxHp = computeMinionMaxHp(owner);
  const desiredHpRegen = owner.hasHealth.hpRegen;
  const desiredType = resolveMinionType(owner);
  for (const id of owner.summonsMinions.minionIds) {
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (!minion) continue;
    if (minion.isMinion.monsterTypeId !== desiredType) {
      despawnMinion(world, minion);
      continue;
    }
    if (!minion.controlsMinion.isCharging && minion.hasPosition.speed !== desiredSpeed) {
      minion.hasPosition.speed = desiredSpeed;
      markSliceDirty(world, minion, 'hasPosition');
    }
    if (minion.isMinion.sizeMult !== desiredSizeMult) {
      minion.isMinion.sizeMult = desiredSizeMult;
      markSliceDirty(world, minion, 'isMinion');
      syncMinionHitbox(world, minion, desiredSizeMult);
    }
    syncMinionMaxHp(world, minion, desiredMaxHp);
    if (minion.hasHealth.hpRegen !== desiredHpRegen) {
      minion.hasHealth.hpRegen = desiredHpRegen;
      markSliceDirty(world, minion, 'hasHealth');
    }
    applyOwnerStatShare(world, owner, minion);
  }
}

function isMinionInCombat(
  world: World,
  owner: SummonerPlayerEntity,
  minion: MinionEntity,
  now: number,
): boolean {
  if (minion.hasAttackTarget !== undefined) return true;
  const lastCombatAt = owner.tracksEngagement;
  if (
    lastCombatAt !== undefined &&
    now - lastCombatAt < GAME_CONFIG.COMBAT_REGEN_DELAY
  ) {
    return true;
  }
  for (const monster of world.aggroedMonsters) {
    if (
      monster.hasAggroTarget.targetKind === 'minion' &&
      monster.hasAggroTarget.targetId === minion.isMinion.id
    ) {
      return true;
    }
  }
  return false;
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
  if (hpRegen <= 0) return;
  if (isMinionInCombat(world, owner, minion, now)) return;

  const healAmount = minion.hasHealth.maxHp * (hpRegen / 100) * (dt / 1000);
  applyHealToMinion(minion, owner.isPlayer.id, healAmount, world);
}

export function initSummonerArchetype(): void {
  // No combat-pipeline listeners are needed here — minion attacks route through
  // `runPlayerAttack`, which already runs the full pipeline as the owner. The
  // damage sponge is registered separately so init order vs other defense
  // listeners can be controlled from `server/src/index.ts`.
}

export function updateSummonerArchetype(world: World, dt: number, now: number): void {
  for (const owner of world.summonerPlayers) {
    const summoner = owner as SummonerPlayerEntity;
    reconcileMinionSlots(world, summoner);
    syncLiveMinionFrameStats(world, summoner);
    validateSummonerCommand(world, summoner);

    const summons = summoner.summonsMinions;
    const targetCount = summons.targetCount;
    let respawnMs = Math.max(0, Math.round(
      summoner.usesSkills.passives['summoner.minion-respawn-ms'] ?? DEFAULT_RESPAWN_MS,
    ));
    const stoneSentinel = isStoneSentinelOwner(summoner);
    if (stoneSentinel) {
      respawnMs = Math.max(0, Math.round(
        respawnMs * (summoner.usesSkills.passives['summoner.sentinel-respawn-mult'] ?? 0.5),
      ));
    }
    const staggeredRespawnSlot = stoneSentinel
      ? stoneSentinelActiveRespawnSlot(world, summons)
      : null;

    for (let slot = 0; slot < targetCount; slot++) {
      const id = summons.minionIds[slot];
      const minion = id ? world.getMinionEntity(id) : undefined;

      if (minion && minion.hasHealth.hp > 0) {
        // Keep minions in the owner's node (gate transitions relocate via
        // `relocateMinionsForOwner`; this covers any other teleport edge cases).
        if (minion.hasPosition.nodeId !== summoner.hasPosition.nodeId) {
          minion.hasPosition.nodeId = summoner.hasPosition.nodeId;
          markSliceDirty(world, minion, 'hasPosition');
        }
        if (tickAcidLurkerLifetime(world, summoner, minion, dt)) {
          tryVitalBurst(world, summoner, minion, now);
          despawnMinion(world, minion);
        } else {
          runMinionRegen(world, summoner, minion, dt, now);
          driveMinion(world, minion, summoner, now);
        }
        continue;
      }

      // Dead or vanished — make sure the entity is gone and start a timer.
      if (minion) {
        if (minion.hasHealth.hp <= 0) {
          tryAcidBroodMinionExplosion(world, summoner, minion);
          tryVitalBurst(world, summoner, minion, now);
        }
        despawnMinion(world, minion);
      } else if (id) {
        summons.minionIds[slot] = '';
      }

      if (stoneSentinel && staggeredRespawnSlot !== slot) {
        summons.respawnTimers[slot] = 0;
        continue;
      }

      if (summons.respawnTimers[slot] <= 0) {
        summons.respawnTimers[slot] = respawnMs;
        continue;
      }
      summons.respawnTimers[slot] = Math.max(0, summons.respawnTimers[slot] - dt);
      if (summons.respawnTimers[slot] === 0) {
        spawnMinionForOwner(world, summoner, slot);
      }
    }
  }
}
