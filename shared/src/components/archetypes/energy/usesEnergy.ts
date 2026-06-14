/** Merged energy archetype slice — wire fields + runtime bookkeeping. */
export interface UsesEnergy {
  energy: number;
  energyMax: number;
  csReservoir: number;
  smChargePool: number;
  seInitialized: boolean;
  flashBaseAttackCooldown: number;
  flashBaseDodgeRate: number;
  flashBaseMoveSpeed: number;
  flashSpeedBonusPct: number;
  flashEvasionBonusPct: number;
  // ── T4 spec runtime state ──────────────────────────────────────────────────
  /** Overdrive: true while the +ATK% mode is active (decaying energy 100→0). */
  overdriveActive: boolean;
  /** Energy Upkeep: ms the energy pool has been held above the threshold. */
  upkeepTimerMs: number;
  /** Binary Cycle: true = Discharge State, false = Charge State. */
  binaryDischargeState: boolean;
  /** Critical Mass: consecutive-discharge stacks. */
  criticalMassStacks: number;
  /** Critical Mass: ms since damage was last dealt (resets stacks past the cap). */
  criticalMassGapMs: number;
  /** Awakened Lightning: remaining empowered regular attacks after a discharge. */
  awakenedCharges: number;
  /** Energy stored at the moment a discharge was armed (Singularity Execute scaling). */
  dischargeEnergy: number;
}

export function initUsesEnergy(): UsesEnergy {
  return {
    energy:        0,
    energyMax:     100,
    csReservoir:   0,
    smChargePool:  0,
    seInitialized: false,
    flashBaseAttackCooldown: 0,
    flashBaseDodgeRate: 0,
    flashBaseMoveSpeed: 0,
    flashSpeedBonusPct:     0,
    flashEvasionBonusPct:   0,
    overdriveActive:      false,
    upkeepTimerMs:        0,
    binaryDischargeState: false,
    criticalMassStacks:   0,
    criticalMassGapMs:    0,
    awakenedCharges:      0,
    dischargeEnergy:      0,
  };
}
