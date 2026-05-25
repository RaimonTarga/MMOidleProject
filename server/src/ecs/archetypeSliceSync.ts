/**
 * Attach / detach optional archetype slices when combatArchetype or passives change.
 * Call after any path that mutates `usesSkills.combatArchetype` or archetype-relevant passives.
 */
import type { World } from '../world/World';
import type { ServerEntity } from './entity';
import type { PlayerEntity } from './components/player';
import { assemblePlayerSnapshot } from './projection';
import {
  makeAppliesDotsFromSnapshot,
  refreshAppliesDotsFromSnapshot,
  makeChillsTargetFromSnapshot,
  refreshChillsTargetFromSnapshot,
  makeUsesCadenceFromSnapshot,
  refreshUsesCadenceFromSnapshot,
  makeUsesCooldownFromSnapshot,
  refreshUsesCooldownFromSnapshot,
  makeUsesEnergyFromSnapshot,
  refreshUsesEnergyFromSnapshot,
  makeUsesReloadFromSnapshot,
  refreshUsesReloadFromSnapshot,
} from '@mmo-idle/shared';

function syncArchetypeSlice<K extends keyof ServerEntity>(
  world: World,
  entity: ServerEntity,
  shouldHave: boolean,
  key: K,
  factory: () => NonNullable<ServerEntity[K]>,
  refresh?: (slice: NonNullable<ServerEntity[K]>) => void,
): void {
  if (shouldHave) {
    if (entity[key]) {
      refresh?.(entity[key] as NonNullable<ServerEntity[K]>);
    } else {
      world.ecs.addComponent(entity, key, factory());
    }
  } else if (entity[key]) {
    world.ecs.removeComponent(entity, key);
  }
}

export function syncArchetypeSlices(world: World, entity: PlayerEntity): void {
  const snap = assemblePlayerSnapshot(entity);

  syncArchetypeSlice(
    world,
    entity,
    snap.combatArchetype === 'cadence',
    'usesCadence',
    () => makeUsesCadenceFromSnapshot(snap),
    slice => refreshUsesCadenceFromSnapshot(slice, snap),
  );

  syncArchetypeSlice(
    world,
    entity,
    snap.combatArchetype === 'energy',
    'usesEnergy',
    () => makeUsesEnergyFromSnapshot(snap),
    slice => refreshUsesEnergyFromSnapshot(slice, snap),
  );

  syncArchetypeSlice(
    world,
    entity,
    snap.combatArchetype === 'dot',
    'appliesDots',
    () => makeAppliesDotsFromSnapshot(snap),
    slice => refreshAppliesDotsFromSnapshot(slice, snap),
  );

  syncArchetypeSlice(
    world,
    entity,
    snap.combatArchetype === 'dot' && (snap.passives['dot.freezing-cold'] ?? 0) > 0,
    'chillsTarget',
    () => makeChillsTargetFromSnapshot(snap),
    slice => refreshChillsTargetFromSnapshot(slice, snap),
  );

  syncArchetypeSlice(
    world,
    entity,
    snap.combatArchetype === 'cooldown',
    'usesCooldown',
    () => makeUsesCooldownFromSnapshot(snap),
    slice => refreshUsesCooldownFromSnapshot(slice, snap),
  );

  syncArchetypeSlice(
    world,
    entity,
    snap.combatArchetype === 'reload',
    'usesReload',
    () => makeUsesReloadFromSnapshot(snap),
    slice => refreshUsesReloadFromSnapshot(slice, snap),
  );
}
