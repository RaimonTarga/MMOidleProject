import type { SummonerSlotRole } from '../../../data/summoner';

export interface ActiveSummonReconstruction {
  slotId: string;
  elapsedMs: number;
  durationMs: number;
}

/**
 * Networked owner state for the Summoner formation. Presence gates Summoner
 * behavior. Slot identity is logical and survives replacement of the ephemeral
 * ECS minion entity occupying it.
 *
 * `respawnTimers` remains during the overhaul migration so old snapshots can be
 * normalized safely. New runtime code uses the shared FIFO reconstruction queue.
 */
export interface SummonsMinions {
  minionIds: string[];
  respawnTimers: number[];
  slotIds: string[];
  slotRoles: SummonerSlotRole[];
  targetCount: number;
  reconstructionQueue: string[];
  activeReconstruction?: ActiveSummonReconstruction;
  redirectCursor: number;
  volatileMarkedSlotId?: string;
  ritualCharges?: number[];
  bondCharge?: number;
}

export function initSummonsMinions(args: {
  targetCount?: number;
  slots?: ReadonlyArray<{ slotId: string; role: SummonerSlotRole }>;
}): SummonsMinions {
  const targetCount = Math.max(1, Math.round(args.slots?.length ?? args.targetCount ?? 1));
  const slotIds = args.slots?.map((slot) => slot.slotId)
    ?? Array.from({ length: targetCount }, (_, index) => `normal:${index}`);
  const slotRoles = args.slots?.map((slot) => slot.role)
    ?? new Array<SummonerSlotRole>(targetCount).fill('normal');
  return {
    minionIds:     new Array(targetCount).fill(''),
    respawnTimers: new Array(targetCount).fill(0),
    slotIds,
    slotRoles,
    targetCount,
    reconstructionQueue: [],
    redirectCursor: 0,
  };
}
