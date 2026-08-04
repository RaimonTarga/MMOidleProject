import type { SummonerSpecialization } from '@mmo-idle/shared';

/** Server-only formation bookkeeping. Never serialized or persisted. */
export interface ControlsSummons {
  /** Last reconciled specialization, used to reset incompatible runtime state. */
  activeSpecialization?: SummonerSpecialization | null;
  /** Weighted generic proc progress, keyed by effect or effect+target. */
  procProgress: Record<string, number>;
  /** Per-target logical cycle: slot ids that have contributed to the cycle. */
  cycleContributorsByTarget: Record<string, string[]>;
  /** Monotonic completed formation-cycle serial by target. */
  cycleSerialByTarget: Record<string, number>;
  /** Deterministic death ordering within the current logic tick. */
  pendingDeadSlotIds: string[];
  harrierMarksByTarget: Record<string, { slotIds: string[]; expiresAt: number }>;
  coordinatedOpenersByTarget: Record<string, string[]>;
  chorusByTarget: Record<string, { slotIds: string[]; expiresAt: number; nextTickAt: number }>;
  volatileNextDetonationAt: number;
  volatileCursor: number;
  explodedMinionIds: string[];
  ritualNextAt: number;
  bondProgress: number;
  bondLastSide?: 'conduit' | 'summon';
  bondHydrated: boolean;
}

export function initControlsSummons(): ControlsSummons {
  return {
    procProgress: {},
    cycleContributorsByTarget: {},
    cycleSerialByTarget: {},
    pendingDeadSlotIds: [],
    harrierMarksByTarget: {},
    coordinatedOpenersByTarget: {},
    chorusByTarget: {},
    volatileNextDetonationAt: 0,
    volatileCursor: 0,
    explodedMinionIds: [],
    ritualNextAt: 0,
    bondProgress: 0,
    bondHydrated: false,
  };
}
