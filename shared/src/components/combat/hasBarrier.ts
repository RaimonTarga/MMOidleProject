import type { BarrierState } from '../../types/combat';

/**
 * Present iff the player has a barrier pool (`defense.barrier-pct` > 0).
 *
 * Attached, resized and detached in `recalculatePlayerEntityStats` — presence
 * gates the whole mechanic, so nothing else needs to test the passive.
 */
export interface HasBarrier extends BarrierState {}
