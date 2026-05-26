import type { ShieldState } from '../../types/combat';

/** Present iff the player has at least one active shield. */
export interface HoldsShields {
  shields: ShieldState[];
}
