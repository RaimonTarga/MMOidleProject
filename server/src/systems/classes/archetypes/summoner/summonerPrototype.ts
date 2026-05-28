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
 *   - From AoE: monsters do not currently AoE; if introduced, route
 *     through a future `applyMonsterAoe(... includeMinions: true)`.
 */
import type { World } from '../../../../world/World';
import type { PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { computeMinionSizeMult, computeMinionSpeed, despawnMinion, resolveMinionType, spawnMinionForOwner } from './spawn';
import { applyOwnerStatShare } from './statShare';
import { driveMinion } from './ai';
import { tickAcidLurkerLifetime, tryAcidBroodMinionExplosion } from './t3/paths/cave';
import { tryVitalBurst } from './t3/paths/plains';

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
    }
    applyOwnerStatShare(world, owner, minion);
  }
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

    const summons = summoner.summonsMinions;
    const targetCount = summons.targetCount;
    const respawnMs = Math.max(0, Math.round(
      summoner.usesSkills.passives['summoner.minion-respawn-ms'] ?? DEFAULT_RESPAWN_MS,
    ));

    for (let slot = 0; slot < targetCount; slot++) {
      const id = summons.minionIds[slot];
      const minion = id ? world.getMinionEntity(id) : undefined;

      if (minion && minion.hasHealth.hp > 0) {
        // Live slime — possible cross-node drift (player teleport) is handled
        // by leaving the minion at its current position; node transitions despawn
        // and respawn slimes via `despawnMinionsForOwner`.
        if (minion.hasPosition.nodeId !== summoner.hasPosition.nodeId) {
          minion.hasPosition.nodeId = summoner.hasPosition.nodeId;
        }
        if (tickAcidLurkerLifetime(world, summoner, minion, dt)) {
          tryVitalBurst(world, summoner, minion, now);
          despawnMinion(world, minion);
        } else {
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
