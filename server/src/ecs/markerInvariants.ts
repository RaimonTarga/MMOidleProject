import { getStatusEffect, getStatusEffects } from "@mmo-idle/shared";
import type { World } from "../world/World";
import type { ServerEntity } from "./entity";

const ENT_DOT_FX = "entropy-collapse-dot";

interface MarkerCheck {
  marker: keyof ServerEntity;
  effectId: string;
  /** Use getStatusEffects when multiple non-instanced entries are possible. */
  multi?: boolean;
}

interface ArchetypeSliceCheck {
  slice: keyof ServerEntity;
  shouldBePresent: (entity: ServerEntity) => boolean;
  label: string;
}

const MONSTER_MARKER_CHECKS: MarkerCheck[] = [
  { marker: "hasDot", effectId: "dot" },
  { marker: "hasDetonation", effectId: "cadence-detonation", multi: true },
  { marker: "hasHemorrhage", effectId: "cadence-hemorrhage", multi: true },
  { marker: "hasConflagration", effectId: "dot-conf" },
  { marker: "hasChill", effectId: "dot-chill" },
  { marker: "hasFrozen", effectId: "dot-frozen" },
  { marker: "hasEntropy", effectId: ENT_DOT_FX },
  { marker: "hasAshbrandBurn", effectId: "ashbrand-burn" },
];

const ARCHETYPE_SLICE_CHECKS: ArchetypeSliceCheck[] = [
  {
    slice: "usesCadence",
    shouldBePresent: (entity) => entity.usesSkills?.combatArchetype === "cadence",
    label: "cadence archetype",
  },
  {
    slice: "usesEnergy",
    shouldBePresent: (entity) => entity.usesSkills?.combatArchetype === "energy",
    label: "energy archetype",
  },
  {
    slice: "appliesDots",
    shouldBePresent: (entity) => entity.usesSkills?.combatArchetype === "dot",
    label: "dot archetype",
  },
  {
    slice: "chillsTarget",
    shouldBePresent: (entity) =>
      entity.usesSkills?.combatArchetype === "dot" &&
      ((entity.usesSkills.passives["dot.freezing-cold"] ?? 0) > 0),
    label: "freezing-cold passive",
  },
  {
    slice: "usesCooldown",
    shouldBePresent: (entity) => entity.usesSkills?.combatArchetype === "cooldown",
    label: "cooldown archetype",
  },
  {
    slice: "usesReload",
    shouldBePresent: (entity) => entity.usesSkills?.combatArchetype === "reload",
    label: "reload archetype",
  },
];

function hasEffect(
  state: ServerEntity["tracksCombat"],
  effectId: string,
  multi?: boolean,
): boolean {
  if (!state) return false;
  if (multi) return getStatusEffects(state, effectId).length > 0;
  return !!getStatusEffect(state, effectId);
}

function checkEntity(
  entity: ServerEntity,
  checks: MarkerCheck[],
  violations: string[],
): void {
  const state = entity.tracksCombat;
  for (const { marker, effectId, multi } of checks) {
    const hasMarker = entity[marker] !== undefined;
    const hasFx = hasEffect(state, effectId, multi);
    if (hasMarker !== hasFx) {
      violations.push(
        `${entity.entityId}: ${String(marker)}=${hasMarker} but ${effectId}=${hasFx}`,
      );
    }
  }
}

function checkAbsentState(entity: ServerEntity, violations: string[]): void {
  if (entity.isMoving && entity.isMoving.motion.magnitude <= 0) {
    violations.push(`${entity.entityId}: isMoving present with zero motion`);
  }
  if (entity.holdsShields && entity.holdsShields.shields.length === 0) {
    violations.push(`${entity.entityId}: holdsShields present with no shields`);
  }
  if (entity.evadesHits && entity.evadesHits.threshold <= 0) {
    violations.push(`${entity.entityId}: evadesHits present with disabled threshold`);
  }
  if (entity.hasAttackTarget && entity.hasAttackTarget.targetId.length === 0) {
    violations.push(`${entity.entityId}: hasAttackTarget present with empty target`);
  }
  if (entity.hasAggroTarget && entity.hasAggroTarget.playerId.length === 0) {
    violations.push(`${entity.entityId}: hasAggroTarget present with empty player target`);
  }
  if (entity.isBossEngaged && !entity.scriptsBoss) {
    violations.push(`${entity.entityId}: isBossEngaged present without scriptsBoss`);
  }
  if (entity.isChanneling && entity.isChanneling.remainingMs <= 0) {
    violations.push(`${entity.entityId}: isChanneling present with expired timer`);
  }
  if (entity.hasOverdrive && entity.hasOverdrive.remainingMs <= 0) {
    violations.push(`${entity.entityId}: hasOverdrive present with expired timer`);
  }
  if (entity.hasAlignment && entity.hasAlignment.remainingMs <= 0) {
    violations.push(`${entity.entityId}: hasAlignment present with expired timer`);
  }
  if (entity.inAcDischarge && entity.inAcDischarge.remainingMs <= 0) {
    violations.push(`${entity.entityId}: inAcDischarge present with expired timer`);
  }
}

function checkArchetypeSlices(entity: ServerEntity, violations: string[]): void {
  for (const { slice, shouldBePresent, label } of ARCHETYPE_SLICE_CHECKS) {
    const hasSlice = entity[slice] !== undefined;
    const expected = shouldBePresent(entity);
    if (hasSlice !== expected) {
      violations.push(
        `${entity.entityId}: ${String(slice)}=${hasSlice} but ${label}=${expected}`,
      );
    }
  }
}

/**
 * Dev-only consistency check: marker component presence must match status effect
 * lookup for every registered marker/effect pair.
 */
export function assertMarkerInvariants(world: World): string[] {
  const violations: string[] = [];

  for (const entity of world.monsterEntities) {
    checkEntity(entity, MONSTER_MARKER_CHECKS, violations);
    checkAbsentState(entity, violations);
  }

  for (const entity of world.playerEntities) {
    checkEntity(entity, [{ marker: "hasDot", effectId: "dot" }], violations);
    checkAbsentState(entity, violations);
    checkArchetypeSlices(entity, violations);
  }

  return violations;
}
