/** Present iff a monster has a player it is actively pursuing. */
export interface HasAggroTarget {
  playerId: string;
  lastAggroAt: number;
  sinceMs: number;
}
