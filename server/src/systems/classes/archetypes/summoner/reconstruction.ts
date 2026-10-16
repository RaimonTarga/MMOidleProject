import { pushDamageEvent } from '../../../combat/damage/damageEvent';
import type { World } from '../../../../world/World';
import type { PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import { computeMinionMaxHp, spawnMinionForOwner } from './spawn';
import { summonerProfileFor } from './profile';
import { isPlayerInCombat } from '../../../combat/ai/engagement';
import { emitSummonObservation } from './observation';
import { rebuildRank } from './formationOrders';
import { rebuildCostMult } from './disciplines';
import { onSummonRebuilt } from './leavesT4';
import { countConduitMechanic } from './mechanicLog';

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
  // The Formation's rebuild order: ahead of anything of a lower priority already waiting.
  const rank = rebuildRank(owner, slotId);
  const at = summons.reconstructionQueue.findIndex((queued) => rebuildRank(owner, queued) > rank);
  if (at < 0) summons.reconstructionQueue.push(slotId);
  else summons.reconstructionQueue.splice(at, 0, slotId);
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
  // Flat HP/s (Phase 0b): a share of the owner's Recovery rate, not of the pool.
  const recoveryPerSecond = owner.hasHealth.recovery ?? 0;
  if (recoveryPerSecond <= 0) return;
  const recoveryRatio = summonerProfileFor(owner).reconstructionCombatRegenPct;
  const amount = recoveryPerSecond * (dt / 1_000) * recoveryRatio;
  const before = owner.hasHealth.hp;
  applyHealToPlayer(owner, owner.tracksCombat, amount, world);
  emitSummonObservation(owner, { kind: 'queue-heal', hp: owner.hasHealth.hp - before });
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
  const passives = owner.usesSkills.passives;
  const speed = (isPlayerInCombat(owner, now)
    ? 1
    : summonerProfileFor(owner).outOfCombatReconstructionSpeedMult * (1 + (passives['conduit.herd-pct'] ?? 0)))
    * (1 + (passives['conduit.rebuild-speed-pct'] ?? 0));
  active.elapsedMs = Math.min(active.durationMs, active.elapsedMs + dt * speed);
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
  // Swarm (§7.5): the cheapest summons rebuild for free.
  const cost = Math.max(0, Math.round(
    computeMinionMaxHp(owner, index) * profile.reconstructionHpCostRatio * rebuildCostMult(owner, active.slotId),
  ));
  const floor = owner.hasHealth.maxHp * profile.reconstructionSafetyFloorPct;
  emitSummonObservation(owner, { kind: 'replacement-attempt', slotId: active.slotId,
    blocked: owner.hasHealth.hp - cost < floor, costHp: cost, floorHp: floor, dtMs: dt });
  if (owner.hasHealth.hp - cost < floor) return;

  const minion = spawnMinionForOwner(world, owner, index);
  if (!minion) return;
  onSummonRebuilt(world, owner, minion);
  owner.hasHealth.hp = Math.max(floor, owner.hasHealth.hp - cost);
  emitSummonObservation(owner, { kind: 'replacement-paid', id: minion.entityId, hp: cost });
  pushDamageEvent(world, owner, cost);
  countConduitMechanic(owner, cost > 0 ? 'rebuild' : 'rebuild-free', now);
  if (owner.controlsSummons) {
    owner.controlsSummons.pendingDeadSlotIds = owner.controlsSummons.pendingDeadSlotIds
      .filter((slotId) => slotId !== active.slotId);
  }
  owner.summonsMinions.activeReconstruction = undefined;
  markSliceDirty(world, owner, 'hasHealth');
  markSliceDirty(world, owner, 'summonsMinions');
  startQueueHead(world, owner);
}
