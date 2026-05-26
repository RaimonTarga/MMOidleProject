/** Merged reload archetype slice — wire fields + runtime bookkeeping. */
export interface UsesReload {
  ammo: number;
  ammoMax: number;
  laserHeat: number;
  laserOverheated: boolean;
  reloadingMs: number;
  snipeCooldownMs: number;
}

export function initUsesReload(args: { ammoMax: number }): UsesReload {
  return {
    ammo:            args.ammoMax,
    ammoMax:         args.ammoMax,
    laserHeat:       0,
    laserOverheated: false,
    reloadingMs:     0,
    snipeCooldownMs: 0,
  };
}
