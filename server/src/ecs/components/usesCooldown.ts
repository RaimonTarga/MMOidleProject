/** Merged cooldown archetype slice — wire fields + runtime bookkeeping. */
export interface UsesCooldown {
  executionReady: boolean;
  executionCooldownPct: number;
  isChanneling: boolean;
  channelingPct: number;
  initialized: boolean;
  executionCooldownMs: number;
  odActive: boolean;
  odRemainingMs: number;
  odBaseCd: number;
  alActive: boolean;
  alRemainingMs: number;
  alBaseCd: number;
  batteryTimerAcc: number;
  singularNoTargetMs: number;
  beamRemainingMs: number;
  beamNextTickMs: number;
  beamTargetId: string;
}

export function makeUsesCooldownFromSnapshot(snapshot: {
  executionReady: boolean;
  executionCooldownPct: number;
  isChanneling: boolean;
  channelingPct: number;
}): UsesCooldown {
  return {
    executionReady:       snapshot.executionReady,
    executionCooldownPct: snapshot.executionCooldownPct,
    isChanneling:         snapshot.isChanneling,
    channelingPct:        snapshot.channelingPct,
    initialized:          false,
    executionCooldownMs:  0,
    odActive:             false,
    odRemainingMs:        0,
    odBaseCd:             0,
    alActive:             false,
    alRemainingMs:        0,
    alBaseCd:             0,
    batteryTimerAcc:      0,
    singularNoTargetMs:   0,
    beamRemainingMs:      0,
    beamNextTickMs:       0,
    beamTargetId:         '',
  };
}

export function refreshUsesCooldownFromSnapshot(
  slice: UsesCooldown,
  snapshot: {
    executionReady: boolean;
    executionCooldownPct: number;
    isChanneling: boolean;
    channelingPct: number;
  },
): void {
  slice.executionReady       = snapshot.executionReady;
  slice.executionCooldownPct = snapshot.executionCooldownPct;
  slice.isChanneling         = snapshot.isChanneling;
  slice.channelingPct        = snapshot.channelingPct;
  slice.initialized          = false;
  slice.executionCooldownMs  = 0;
  slice.odActive             = false;
  slice.odRemainingMs        = 0;
  slice.odBaseCd             = 0;
  slice.alActive             = false;
  slice.alRemainingMs        = 0;
  slice.alBaseCd             = 0;
  slice.batteryTimerAcc      = 0;
  slice.singularNoTargetMs   = 0;
  slice.beamRemainingMs      = 0;
  slice.beamNextTickMs       = 0;
  slice.beamTargetId         = '';
}
