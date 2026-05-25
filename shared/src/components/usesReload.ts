/** Merged reload archetype slice — wire fields + runtime bookkeeping. */
export interface UsesReload {
  ammo: number;
  ammoMax: number;
  laserHeat: number;
  laserOverheated: boolean;
  reloadingMs: number;
  snipeCooldownMs: number;
}

export function makeUsesReloadFromSnapshot(snapshot: {
  ammoCount: number;
  ammoMax: number;
  heatPct: number;
  laserOverheated: boolean;
}): UsesReload {
  return {
    ammo:            snapshot.ammoCount,
    ammoMax:         snapshot.ammoMax,
    laserHeat:       snapshot.heatPct,
    laserOverheated: snapshot.laserOverheated,
    reloadingMs:     0,
    snipeCooldownMs: 0,
  };
}

export function refreshUsesReloadFromSnapshot(
  slice: UsesReload,
  snapshot: {
    ammoCount: number;
    ammoMax: number;
    heatPct: number;
    laserOverheated: boolean;
  },
): void {
  slice.ammo            = snapshot.ammoCount;
  slice.ammoMax         = snapshot.ammoMax;
  slice.laserHeat       = 0;
  slice.laserOverheated = false;
  slice.reloadingMs     = 0;
  slice.snipeCooldownMs = 0;
}
