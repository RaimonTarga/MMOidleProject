/** Present iff the player is actively channeling a beam. */
export interface IsChanneling {
  remainingMs: number;
  nextTickMs: number;
  targetId: string;
  pct: number;
}
