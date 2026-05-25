import { getStatusEffect, getStatusEffects } from '@mmo-idle/shared';
import type { World } from '../world/World';
import type { ServerEntity } from './entity';

const ENT_DOT_FX = 'entropy-collapse-dot';

interface MarkerCheck {
  marker: keyof ServerEntity;
  effectId: string;
  /** Use getStatusEffects when multiple non-instanced entries are possible. */
  multi?: boolean;
}

const MONSTER_MARKER_CHECKS: MarkerCheck[] = [
  { marker: 'hasDot',          effectId: 'dot' },
  { marker: 'hasDetonation',   effectId: 'cadence-detonation', multi: true },
  { marker: 'hasHemorrhage',   effectId: 'cadence-hemorrhage', multi: true },
  { marker: 'hasConflagration', effectId: 'dot-conf' },
  { marker: 'hasChill',        effectId: 'dot-chill' },
  { marker: 'hasFrozen',       effectId: 'dot-frozen' },
  { marker: 'hasEntropy',      effectId: ENT_DOT_FX },
  { marker: 'hasAshbrandBurn', effectId: 'ashbrand-burn' },
];

function hasEffect(state: ServerEntity['tracksCombat'], effectId: string, multi?: boolean): boolean {
  if (!state) return false;
  if (multi) return getStatusEffects(state, effectId).length > 0;
  return !!getStatusEffect(state, effectId);
}

function checkEntity(entity: ServerEntity, checks: MarkerCheck[], violations: string[]): void {
  const state = entity.tracksCombat;
  for (const { marker, effectId, multi } of checks) {
    const hasMarker = entity[marker] !== undefined;
    const hasFx = hasEffect(state, effectId, multi);
    if (hasMarker !== hasFx) {
      violations.push(`${entity.entityId}: ${String(marker)}=${hasMarker} but ${effectId}=${hasFx}`);
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
  }

  for (const entity of world.playerEntities) {
    checkEntity(entity, [{ marker: 'hasDot', effectId: 'dot' }], violations);
  }

  return violations;
}
