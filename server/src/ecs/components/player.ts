import type { With } from 'miniplex';
import type { ServerEntity } from '../entity';

/**
 * A miniplex entity carrying per-player combat state and the core typed
 * snapshot slices. Optional archetype slices (`usesCadence`, `usesEnergy`, …)
 * are attached only when the player has that archetype.
 */
export type PlayerEntity = With<
  ServerEntity,
  | 'tracksCombat'
  | 'tracksEngagement'
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
>;

export function isPlayerEntity(e: ServerEntity): e is PlayerEntity {
  return 'isPlayer' in e;
}
