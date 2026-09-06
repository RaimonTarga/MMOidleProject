import { pushDamageEvent } from '../../../combat/damage/damageEvent';
import type { World } from '../../../../world/World';
import type { PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import { computeMinionMaxHp, spawnMinionForOwner } from './spawn';
import { summonerProfileFor } from './profile';
import { isPlayerInCombat } from '../../../combat/ai/engagement';

type SummonerOwner = PlayerEntity & {
  summonsMinions: NonNullable<PlayerEntity['summonsMinions']>;
};

function slotIndex(owner: SummonerOwner, slotId: string): number {
  return owner.summonsMinions.slotIds.indexOf(slotId);
}

export function hasReconstructionDebt(owner: SummonerOwner): boolean {
  const summons = owner.summonsMinions;
  return summons.activeReconstruction !== undefined || summons.reconstructionQueue.length > 0;
}

/** Add a logical slot once to the deterministic FIFO queue. */
export function enqueueSummonReconstruction(
  world: World,
  owner: SummonerOwner,
  slotId: string,
): void {
  const summons = owner.summonsMinions;
  if (slotIndex(owner, slotId) < 0) return;
  if (summons.activeReconstruction?.slotId === slotId) return;
  if (summons.reconstructionQueue.includes(slotId)) return;
  summons.reconstructionQueue.push(slotId);
  if (owner.controlsSummons && !owner.controlsSummons.pendingDeadSlotIds.includes(slotId)) {
    owner.controlsSummons.pendingDeadSlotIds.push(slotId);
  }
  markSliceDirty(world, owner, 'summonsMinions');
}

function startQueueHead(world: World, owner: SummonerOwner): void {
  const summons = owner.summonsMinions;
  while (!summons.activeReconstruction && summons.reconstructionQueue.length > 0) {
    const slotId = summons.reconstructionQueue.shift()!;
    if (slotIndex(owner, slotId) < 0) continue;
    summons.activeReconstruction = {
      slotId,
      elapsedMs: 0,
      durationMs: summonerProfileFor(owner).reconstructionIntervalMs,
    };
    markSliceDirty(world, owner, 'summonsMinions');
  }
}

function applyQueueScopedCombatRecovery(
  world: World,
  owner: SummonerOwner,
  dt: number,
  now: number,
): void {
  if (!hasReconstructionDebt(owner)) return;
  if (!isPlayerInCombat(owner, now)) return;
  const regenPctPerSecond = owner.hasHealth.recovery ?? 0;
  if (regenPctPerSecond <= 0) return;
  const recoveryRatio = summonerProfileFor(owner).reconstructionCombatRegenPct;
  const amount = owner.hasHealth.maxHp * (regenPctPerSecond / 100) * (dt / 1_000) * recoveryRatio;
  applyHealToPlayer(owner, owner.tracksCombat, amount, world);
}

/** Advance exactly one reconstruction and pay only when the safety floor remains. */
export function tickSummonReconstruction(
  world: World,
  owner: SummonerOwner,
  dt: number,
  now: number,
): void {
  startQueueHead(world, owner);
  applyQueueScopedCombatRecovery(world, owner, dt, now);

  const active = owner.summonsMinions.activeReconstruction;
  if (!active) return;
  const previousElapsed = active.elapsedMs;
  active.elapsedMs = Math.min(active.durationMs, active.elapsedMs + dt);
  if (active.elapsedMs !== previousElapsed) {
    markSliceDirty(world, owner, 'summonsMinions');
  }
  if (active.elapsedMs < active.durationMs) return;

  const index = slotIndex(owner, active.slotId);
  if (index < 0) {
    owner.summonsMinions.activeReconstruction = undefined;
    startQueueHead(world, owner);
    return;
  }
  const profile = summonerProfileFor(owner);
  const cost = Math.max(0, Math.round(
    computeMinionMaxHp(owner, index) * profile.reconstructionHpCostRatio,
  ));
  const floor = owner.hasHealth.maxHp * profile.reconstructionSafetyFloorPct;
  if (owner.hasHealth.hp - cost < floor) return;

  const minion = spawnMinionForOwner(world, owner, index);
  if (!minion) return;
  owner.hasHealth.hp = Math.max(floor, owner.hasHealth.hp - cost);
  pushDamageEvent(world, owner, cost);
  if (owner.controlsSummons) {
    owner.controlsSummons.pendingDeadSlotIds = owner.controlsSummons.pendingDeadSlotIds
      .filter((slotId) => slotId !== active.slotId);
  }
  owner.summonsMinions.activeReconstruction = undefined;
  markSliceDirty(world, owner, 'hasHealth');
  markSliceDirty(world, owner, 'summonsMinions');
  startQueueHead(world, owner);
}
