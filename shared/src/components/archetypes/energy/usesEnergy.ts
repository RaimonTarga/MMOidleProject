/** Merged energy archetype slice — wire fields + runtime bookkeeping. */
export interface UsesEnergy {
  energy: number;
  energyMax: number;
  csReservoir: number;
  smChargePool: number;
  seInitialized: boolean;
}

export function initUsesEnergy(): UsesEnergy {
  return {
    energy:        0,
    energyMax:     100,
    csReservoir:   0,
    smChargePool:  0,
    seInitialized: false,
  };
}
