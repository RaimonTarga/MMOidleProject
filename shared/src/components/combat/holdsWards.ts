import type { WardState } from '../../types/combat';

/** Present iff the player holds at least one live ward (temporary absorb pool). */
export interface HoldsWards {
  wards: WardState[];
}
