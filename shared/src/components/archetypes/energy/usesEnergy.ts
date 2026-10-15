/** The Spirit's storm pool: both spending resource and shield. */
export interface UsesEnergy {
  energy: number;
  energyMax: number;
  /** Tide's phase (T2): present only for a Tide Spirit; absent otherwise. */
  tide?: 'ebb' | 'surge';
}

export function initUsesEnergy(): UsesEnergy {
  return {
    energy:    0,
    energyMax: 100,
  };
}
