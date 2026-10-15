/** The Spirit's storm pool: both spending resource and shield. */
export interface UsesEnergy {
  energy: number;
  energyMax: number;
}

export function initUsesEnergy(): UsesEnergy {
  return {
    energy:    0,
    energyMax: 100,
  };
}
