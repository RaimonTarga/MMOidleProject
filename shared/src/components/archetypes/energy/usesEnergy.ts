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
  };
}
