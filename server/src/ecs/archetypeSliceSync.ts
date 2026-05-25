/**
 * Attach / detach optional archetype slices when combatArchetype or passives change.
 * Called only from `applyPlayerSnapshotDraft` at the equip / hydrate / respawn seam.
 */
import type { PlayerSnapshot } from '@mmo-idle/shared';
import type { World } from '../world/World';
import type { ServerEntity } from './entity';
import type { PlayerEntity } from './components/player';
import {
  makeAppliesDotsFromSnapshot,
  refreshAppliesDotsFromSnapshot,
} from './components/appliesDots';
import {
  makeChillsTargetFromSnapshot,
  refreshChillsTargetFromSnapshot,
} from './components/chillsTarget';
import {
  makeUsesCadenceFromSnapshot,
  refreshUsesCadenceFromSnapshot,
} from './components/usesCadence';
import {
  makeUsesCooldownFromSnapshot,
  refreshUsesCooldownFromSnapshot,
} from './components/usesCooldown';
import {
  makeUsesEnergyFromSnapshot,
  refreshUsesEnergyFromSnapshot,
} from './components/usesEnergy';
import {
  makeUsesReloadFromSnapshot,
  refreshUsesReloadFromSnapshot,
} from './components/usesReload';

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

export function syncArchetypeSlices(world: World, entity: PlayerEntity, draft: PlayerSnapshot): void {
  syncArchetypeSlice(
    world,
    entity,
    draft.combatArchetype === 'cadence',
    'usesCadence',
    () => makeUsesCadenceFromSnapshot(draft),
    slice => refreshUsesCadenceFromSnapshot(slice, draft),
  );

  syncArchetypeSlice(
    world,
    entity,
    draft.combatArchetype === 'energy',
    'usesEnergy',
    () => makeUsesEnergyFromSnapshot(draft),
    slice => refreshUsesEnergyFromSnapshot(slice, draft),
  );

  syncArchetypeSlice(
    world,
    entity,
    draft.combatArchetype === 'dot',
    'appliesDots',
    () => makeAppliesDotsFromSnapshot(draft),
    slice => refreshAppliesDotsFromSnapshot(slice, draft),
  );

  syncArchetypeSlice(
    world,
    entity,
    draft.combatArchetype === 'dot' && (draft.passives['dot.freezing-cold'] ?? 0) > 0,
    'chillsTarget',
    () => makeChillsTargetFromSnapshot(draft),
    slice => refreshChillsTargetFromSnapshot(slice, draft),
  );

  syncArchetypeSlice(
    world,
    entity,
    draft.combatArchetype === 'cooldown',
    'usesCooldown',
    () => makeUsesCooldownFromSnapshot(draft),
    slice => refreshUsesCooldownFromSnapshot(slice, draft),
  );

  syncArchetypeSlice(
    world,
    entity,
    draft.combatArchetype === 'reload',
    'usesReload',
    () => makeUsesReloadFromSnapshot(draft),
    slice => refreshUsesReloadFromSnapshot(slice, draft),
  );
}
