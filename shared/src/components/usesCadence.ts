/** Merged cadence archetype slice — wire fields + runtime bookkeeping. */
export interface UsesCadence {
  count: number;
  threshold: number;
  empoweredArmed: boolean;
  speedStacks: number;
  seqDmg: number;
  charge: number;
  echo: number;
}

export function makeUsesCadenceFromSnapshot(snapshot: {
  cadenceCount: number;
  cadenceThreshold: number;
  cadenceEmpoweredArmed: boolean;
  cadenceSpeedStacks: number;
}): UsesCadence {
  return {
    count:          snapshot.cadenceCount,
    threshold:      snapshot.cadenceThreshold,
    empoweredArmed: snapshot.cadenceEmpoweredArmed,
    speedStacks:    snapshot.cadenceSpeedStacks,
    seqDmg:         0,
    charge:         0,
    echo:           0,
  };
}

export function refreshUsesCadenceFromSnapshot(
  slice: UsesCadence,
  snapshot: {
    cadenceCount: number;
    cadenceThreshold: number;
    cadenceEmpoweredArmed: boolean;
    cadenceSpeedStacks: number;
  },
): void {
  slice.count          = snapshot.cadenceCount;
  slice.threshold      = snapshot.cadenceThreshold;
  slice.empoweredArmed = snapshot.cadenceEmpoweredArmed;
  slice.speedStacks    = snapshot.cadenceSpeedStacks;
  slice.seqDmg         = 0;
  slice.charge         = 0;
  slice.echo           = 0;
}
