/**
 * Attach / detach optional archetype slices when combatArchetype or passives change.
 * Call after any path that mutates `usesSkills.combatArchetype` or archetype-relevant passives.
 */
import type { World } from '../world/World';
import type { PlayerEntity, ServerEntity } from './entity';
import {
  initAppliesDots,
  initChillsTarget,
  initSummonsMinions,
  initUsesCadence,
  initUsesCooldown,
  initUsesEnergy,
  initUsesReload,
} from '@mmo-idle/shared';
import { attachComponent, detachComponent } from './markerHelpers';

function syncArchetypeSlice<K extends keyof ServerEntity>(
  world: World,
  entity: ServerEntity,
  shouldHave: boolean,
  key: K,
  factory: () => NonNullable<ServerEntity[K]>,
): void {
  if (shouldHave) {
    if (entity[key] === undefined) {
      attachComponent(world, entity, key, factory());
    }
  } else {
    detachComponent(world, entity, key);
  }
}

export function syncArchetypeSlices(world: World, entity: PlayerEntity): void {
  const archetype = entity.usesSkills.combatArchetype;
  const passives = entity.usesSkills.passives;

  syncArchetypeSlice(
    world,
    entity,
    archetype === 'cadence',
    'usesCadence',
    () => initUsesCadence({ threshold: entity.usesCadence?.threshold ?? 0 }),
  );

  syncArchetypeSlice(
    world,
    entity,
    archetype === 'energy',
    'usesEnergy',
    () => initUsesEnergy(),
  );

  syncArchetypeSlice(
    world,
    entity,
    archetype === 'dot',
    'appliesDots',
    () => initAppliesDots(),
  );

  syncArchetypeSlice(
    world,
    entity,
    archetype === 'dot' && (passives['dot.freezing-cold'] ?? 0) > 0,
    'chillsTarget',
    () => initChillsTarget(),
  );

  syncArchetypeSlice(
    world,
    entity,
    archetype === 'cooldown',
    'usesCooldown',
    () => initUsesCooldown(),
  );

  syncArchetypeSlice(
    world,
    entity,
    archetype === 'reload',
    'usesReload',
    () => initUsesReload({ ammoMax: entity.usesReload?.ammoMax ?? 0 }),
  );

  // The summoner archetype attaches `summonsMinions`. Initial slot count uses the
  // passive value if available (post-recalc) and defaults to 3 otherwise.
  const minionBaseCount = passives['summoner.minion-count'] ?? 3;
  const minionCountMult = passives['summoner.minion-count-mult'] ?? 1.0;
  const minionCount = Math.max(1, Math.floor(minionBaseCount * minionCountMult));
  syncArchetypeSlice(
    world,
    entity,
    archetype === 'summoner',
    'summonsMinions',
    () => entity.summonsMinions ?? initSummonsMinions({ targetCount: minionCount }),
  );
}
