import type { With } from 'miniplex';
import type { ServerEntity } from '../entity';

/**
 * A miniplex entity carrying monster AI, combat state, and the full set of
 * typed monster snapshot slices.
 *
 * Slices stamped during monster creation (Server Phase 4) become the
 * entity-side source of truth: `isMonster`, `hasPosition`, `isMoving`,
 * `hasHealth`, `dealsDamage`, `performsAttack`, `mitigatesDamage`,
 * `hasAwareness`, and `hasStatus`. `knockback` and `bossState` are added
 * on demand.
 *
 * Built via `With<ServerEntity, ...>` so it satisfies miniplex's query return
 * type.
 */
export type MonsterEntity = With<
  ServerEntity,
  | 'controlsMonster'
  | 'tracksCombat'
  | 'isMonster'
  | 'hasPosition'
  | 'isMoving'
  | 'hasHealth'
  | 'dealsDamage'
  | 'performsAttack'
  | 'mitigatesDamage'
  | 'hasAwareness'
  | 'hasStatus'
>;

/** Type guard used at query boundaries where the entity is loosely typed. */
export function isMonsterEntity(e: ServerEntity): e is MonsterEntity {
  return 'isMonster' in e;
}
