import type { ServerEntity } from './entity';
import type { World } from '../world/World';
import type { CombatState } from '../systems/combatState';
import { getStatusEffect, getStatusEffects } from '@mmo-idle/shared';

const MARKER = {};

type MarkerKey =
  | 'hasDetonation'
  | 'hasHemorrhage'
  | 'hasDot'
  | 'hasConflagration'
  | 'hasChill'
  | 'hasFrozen'
  | 'hasEntropy'
  | 'hasAshbrandBurn';

export function attachMarker(world: World, entity: ServerEntity, key: MarkerKey): void {
  if (entity[key]) return;
  world.ecs.addComponent(entity, key, MARKER);
}

export function detachMarker(world: World, entity: ServerEntity, key: MarkerKey): void {
  if (!entity[key]) return;
  world.ecs.removeComponent(entity, key);
}

/** Detach marker when no matching status effect remains on combat state. */
export function detachMarkerIfNoEffect(
  world: World,
  entity: ServerEntity,
  key: MarkerKey,
  state: CombatState,
  effectId: string,
): void {
  if (!entity[key]) return;
  if (!getStatusEffect(state, effectId)) {
    world.ecs.removeComponent(entity, key);
  }
}

/** Detach marker when no status effects with the given id remain. */
export function detachMarkerIfNoEffects(
  world: World,
  entity: ServerEntity,
  key: MarkerKey,
  state: CombatState,
  effectId: string,
): void {
  if (!entity[key]) return;
  if (getStatusEffects(state, effectId).length === 0) {
    world.ecs.removeComponent(entity, key);
  }
}
