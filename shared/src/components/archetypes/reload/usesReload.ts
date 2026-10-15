/** Merged reload archetype slice — clip, ammo, and reload bookkeeping. */
export interface UsesReload {
  ammo: number;
  ammoMax: number;
  reloadingMs: number;
  /** The loaded clip type (a Slinger kit piece id; the plain clip's id until a rule picks another). */
  clipId: string;
  /** The clip the Loadout's rules would load at the next reload, for the ring. */
  nextClipId: string;
  /** Full duration captured when the current reload began; 0 while idle. */
  reloadDurationMs: number;
  /** Gunslinger only: the second gun's clip (the even rounds). Absent for every other Slinger. */
  twinClipId?: string;
  /** Siege only: the damage banked in the shell, rounded. Absent for every other Slinger. */
  shellBank?: number;
  /** Rime Round's frozen ground, while it lasts: centre and radius in node pixels. Absent otherwise. */
  rimeX?: number;
  rimeY?: number;
  rimeRadius?: number;
}

export function initUsesReload(args: { ammoMax: number }): UsesReload {
  return {
    ammo: args.ammoMax,
    ammoMax: args.ammoMax,
    reloadingMs: 0,
    clipId: 'slinger-plain-clip',
    nextClipId: 'slinger-plain-clip',
    reloadDurationMs: 0,
  };
}
