import type { AggroTargetKind } from './hasAggroTarget';

/**
 * Present while a taunt holds a monster (class-first build plan S3, bible §8.12). The
 * monster's aggro stays on the taunter until `untilMs`, and nobody can take it meanwhile,
 * except that a player's taunt takes a monster from a summon's: a Squire can take an enemy
 * from a Conduit's tank summon, never the reverse. Server-only, never persisted.
 */
export interface HeldByTaunt {
  taunterId: string;
  taunterKind: AggroTargetKind;
  untilMs: number;
}
