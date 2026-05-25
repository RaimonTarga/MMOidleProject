import type { With } from 'miniplex';
import type { ServerEntity } from '../entity';

/**
 * A miniplex entity carrying per-player combat state and the full set of typed
 * snapshot slices.
 *
 * Slices stamped during `attachPlayerEntity` (Server Phase 4) become the
 * entity-side source of truth: `isPlayer`, `hasPosition`, `isMoving`,
 * `hasHealth`, `dealsDamage`, `performsAttack`, `mitigatesDamage`,
 * `evadesHits`, `hasStatus`, `usesAutocombat`, `tracksProgression`,
 * `holdsInventory`, `usesSkills`, `showsSacred`, and the per-archetype
 * mirror slices.
 *
 * `combatAt` (last-combat timestamp) is attached on the same entity to avoid
 * a sibling Map. It defaults to 0 in `attachPlayerEntity`.
 *
 * `entityId` mirrors `isPlayer.id` (which equals the socket id) so the
 * miniplex world can be looked up by either.
 */
export type PlayerEntity = With<
  ServerEntity,
  | 'combatState'
  | 'combatAt'
  | 'isPlayer'
  | 'hasPosition'
  | 'isMoving'
  | 'hasHealth'
  | 'dealsDamage'
  | 'performsAttack'
  | 'mitigatesDamage'
  | 'evadesHits'
  | 'hasStatus'
  | 'usesAutocombat'
  | 'tracksProgression'
  | 'holdsInventory'
  | 'usesSkills'
  | 'showsSacred'
  | 'usesCadence'
  | 'usesEnergy'
  | 'appliesDots'
  | 'chillsTarget'
  | 'usesCooldown'
  | 'usesReload'
>;

export function isPlayerEntity(e: ServerEntity): e is PlayerEntity {
  return 'isPlayer' in e;
}
