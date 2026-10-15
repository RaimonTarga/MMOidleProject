/**
 * The class config on the server (class-first build plan §3.3): the `configuresClass` slice
 * is present once a class is picked, holds the class system setup and the relic slot, and in
 * `auto` mode follows the class default as lessons, trophies and budget steps arrive.
 *
 * What a character has learned is derived from its biome levels, boss clears and discipline
 * (`@mmo-idle/shared` classKits), so the only state kept here is the config itself.
 */
import {
  classConfigContext,
  classKitFor,
  globalMastery,
  ITEM_DATABASE,
  resolveClassConfig,
  sameClassConfig,
  validateClassConfig,
  type ClassArchetype,
  type ClassConfigContext,
  type ClassKitProgress,
  type TracksProgression,
  type UsesSkills,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import type { World } from '../../../world/World';

type ProgressSlices = {
  holdsInventory?: { equipment: { weapon?: string | null } };
  tracksProgression: Pick<TracksProgression, 'biomeLevel' | 'bossesCleared'>;
  usesSkills: Pick<UsesSkills, 'combatArchetype' | 'disciplineId' | 'specializationId'>;
};

/** The discipline pick, once it is one of the class's own disciplines. */
function disciplineOf(archetype: ClassArchetype, usesSkills: ProgressSlices['usesSkills']): string | null {
  const picked = usesSkills.disciplineId ?? null;
  if (!picked) return null;
  return classKitFor(archetype).disciplines.some((discipline) => discipline.id === picked) ? picked : null;
}

/** The specialization pick, once it is one of the class's own and its discipline is picked. */
function specializationOf(archetype: ClassArchetype, usesSkills: ProgressSlices['usesSkills']): string | null {
  const picked = usesSkills.specializationId ?? null;
  if (!picked || !disciplineOf(archetype, usesSkills)) return null;
  return classKitFor(archetype).specializations.some((spec) => spec.id === picked) ? picked : null;
}

export function classKitProgressOf(archetype: ClassArchetype, slices: ProgressSlices): ClassKitProgress {
  return {
    biomeLevel: slices.tracksProgression.biomeLevel,
    bossesCleared: slices.tracksProgression.bossesCleared ?? [],
    disciplineId: disciplineOf(archetype, slices.usesSkills),
    specializationId: specializationOf(archetype, slices.usesSkills),
  };
}

/** The context a config is checked against, or null before a class is picked. */
export function classConfigContextOf(slices: ProgressSlices): ClassConfigContext | null {
  const archetype = slices.usesSkills.combatArchetype;
  if (!archetype) return null;
  // The Conduit's weapon adds or removes Command (bible §7.2).
  const weapon = slices.holdsInventory?.equipment.weapon;
  const budgetBonus = archetype === 'summoner' && weapon ? (ITEM_DATABASE.get(weapon)?.mechanicEffects?.['conduit.command'] ?? 0) : 0;
  return classConfigContext(
    archetype,
    classKitProgressOf(archetype, slices),
    globalMastery(slices.tracksProgression.biomeLevel),
    1,
    budgetBonus,
  );
}

/**
 * Bring the slice in line with the character: attach it when a class is picked, detach it
 * without one, and in `auto` mode (or when a saved config no longer fits) rebuild the
 * default. Call after anything that can change the class, the lessons, the trophies or the
 * budget: a class pick or reset, a biome level-up, a boss clear.
 */
export function refreshClassConfig(world: World, entity: PlayerEntity): void {
  const ctx = classConfigContextOf(entity);
  if (!ctx) {
    detachComponent(world, entity, 'configuresClass');
    return;
  }
  const current = entity.configuresClass?.config;
  const next = resolveClassConfig(current, ctx);
  if (!entity.configuresClass) {
    attachComponent(world, entity, 'configuresClass', { config: next });
    return;
  }
  if (current && sameClassConfig(current, next)) return;
  entity.configuresClass.config = next;
  markSliceDirty(world, entity, 'configuresClass');
}

/** The config a save holds, fitted to the character as it loads (null without a class). */
export function hydrateClassConfig(slices: ProgressSlices, saved: unknown): { config: ReturnType<typeof resolveClassConfig> } | null {
  const ctx = classConfigContextOf(slices);
  return ctx ? { config: resolveClassConfig(saved, ctx) } : null;
}

/** `class:setConfig`: store a player's config, or say why not. */
export function setClassConfig(
  world: World,
  entity: PlayerEntity,
  raw: unknown,
): { ok: true } | { ok: false; reasons: string[] } {
  const ctx = classConfigContextOf(entity);
  if (!ctx) return { ok: false, reasons: ['Pick a class first.'] };
  const result = validateClassConfig(raw, ctx);
  if (!result.ok) return result;
  const config = resolveClassConfig(result.config, ctx);
  if (!entity.configuresClass) {
    attachComponent(world, entity, 'configuresClass', { config });
  } else {
    entity.configuresClass.config = config;
    markSliceDirty(world, entity, 'configuresClass');
  }
  return { ok: true };
}
