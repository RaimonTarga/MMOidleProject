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
  resolveSummonerProfile,
} from '@mmo-idle/shared';
import { attachComponent, detachComponent } from './markerHelpers';
import { initControlsSummons } from '../systems/classes/archetypes/summoner/controlsSummons';

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

  const summonerProfile = resolveSummonerProfile({
    selectedSubVariant: entity.usesSkills.selectedSubVariant,
    selectedRange: entity.usesSkills.selectedRange,
    unlockedSkills: entity.usesSkills.unlockedSkills,
    passives,
  });
  syncArchetypeSlice(
    world,
    entity,
    archetype === 'summoner',
    'summonsMinions',
    () => entity.summonsMinions ?? initSummonsMinions({ slots: summonerProfile.slots }),
  );
  syncArchetypeSlice(
    world,
    entity,
    archetype === 'summoner',
    'controlsSummons',
    () => entity.controlsSummons ?? initControlsSummons(),
  );
  if (archetype === 'summoner' && entity.summonsMinions) {
    const summons = entity.summonsMinions;
    summons.slotIds ??= Array.from({ length: summons.targetCount }, (_, index) => `normal:${index}`);
    summons.slotRoles ??= new Array(summons.targetCount).fill('normal');
    summons.reconstructionQueue ??= [];
    summons.redirectCursor ??= 0;
  }
}
