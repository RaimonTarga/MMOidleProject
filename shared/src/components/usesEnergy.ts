/** Merged energy archetype slice — wire fields + runtime bookkeeping. */
export interface UsesEnergy {
  energy: number;
  energyMax: number;
  empoweredReady: boolean;
  acChargePhase: boolean;
  acDischargeMs: number;
  acTickNext: number;
  acSpeedBase: number;
  acSpeedActive: boolean;
  csReservoir: number;
  smChargePool: number;
  seInitialized: boolean;
}

export function makeUsesEnergyFromSnapshot(snapshot: {
  energyCount: number;
  empoweredReady: boolean;
}): UsesEnergy {
  return {
    energy:         snapshot.energyCount,
    energyMax:      100,
    empoweredReady: snapshot.empoweredReady,
    acChargePhase:  false,
    acDischargeMs:  0,
    acTickNext:     0,
    acSpeedBase:    0,
    acSpeedActive:  false,
    csReservoir:    0,
    smChargePool:   0,
    seInitialized:  false,
  };
}

export function refreshUsesEnergyFromSnapshot(
  slice: UsesEnergy,
  snapshot: { energyCount: number; empoweredReady: boolean },
): void {
  slice.energy         = snapshot.energyCount;
  slice.energyMax      = 100;
  slice.empoweredReady = snapshot.empoweredReady;
  slice.acChargePhase  = false;
  slice.acDischargeMs  = 0;
  slice.acTickNext     = 0;
  slice.acSpeedBase    = 0;
  slice.acSpeedActive  = false;
  slice.csReservoir    = 0;
  slice.smChargePool   = 0;
  slice.seInitialized  = false;
}
