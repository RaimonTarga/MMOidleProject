/** Discriminates the kind of entity a monster is pursuing. */
export type AggroTargetKind = 'player' | 'minion';

/** Present iff a monster has a target (player or minion) it is actively pursuing. */
export interface HasAggroTarget {
  targetId: string;
  targetKind: AggroTargetKind;
  lastAggroAt: number;
  sinceMs: number;
}
